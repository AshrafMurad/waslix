import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma, type Severity } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { calculateAttention } from "@/modules/attention/engine/calculate-attention";
import { refreshRecommendationsForCustomer } from "@/modules/recommendations/services/manage-recommendations";

import { evaluateSignals, signalRuleVersion } from "../engine/evaluate-signals";

const priorityRank: Record<Severity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function refreshCustomerIntelligence(
  workspaceId: string,
  customerId: string,
  now = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${workspaceId}:${customerId}:intelligence`}, 0))`;
    const customer = await transaction.customer.findFirst({
      where: { id: customerId, workspaceId },
      select: {
        id: true,
        status: true,
        customerSince: true,
        workspace: { select: { timezone: true } },
        currentHealth: true,
        activities: {
          where: { isMeaningful: true, occurredAt: { lte: now } },
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { occurredAt: true },
        },
        risks: {
          select: {
            id: true,
            severity: true,
            status: true,
            targetResolutionDate: true,
            tasks: {
              where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
              take: 1,
              select: { id: true },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            priority: true,
            status: true,
            dueDate: true,
            dueAt: true,
          },
        },
        successGoals: {
          select: {
            id: true,
            status: true,
            progressObservedAt: true,
            targetDate: true,
          },
        },
        onboarding: {
          select: {
            id: true,
            status: true,
            targetCompletionDate: true,
            milestones: {
              select: {
                id: true,
                status: true,
                isCritical: true,
                dueDate: true,
              },
            },
          },
        },
        renewals: {
          select: {
            id: true,
            stage: true,
            renewalAt: true,
            readinessStatus: true,
          },
        },
      },
    });
    if (!customer) return null;

    if (customer.status === "ARCHIVED") {
      await transaction.signal.updateMany({
        where: { workspaceId, customerId, status: "ACTIVE" },
        data: { status: "EXPIRED", resolvedAt: now, lastEvaluatedAt: now },
      });
      await transaction.attentionItem.updateMany({
        where: {
          workspaceId,
          customerId,
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
        },
        data: {
          status: "DISMISSED",
          dismissedReason: "CUSTOMER_ARCHIVED",
          resolvedAt: now,
        },
      });
      await transaction.recommendation.updateMany({
        where: {
          workspaceId,
          customerId,
          status: "SUGGESTED",
        },
        data: {
          status: "DISMISSED",
          dismissedReason: "CUSTOMER_ARCHIVED",
        },
      });
      return { signalCount: 0, attention: null };
    }

    const baselineTarget = new Date(now.getTime() - 30 * 86_400_000);
    const baseline = await transaction.healthSnapshot.findFirst({
      where: {
        workspaceId,
        customerId,
        snapshotAt: {
          lte: baselineTarget,
          gte: new Date(baselineTarget.getTime() - 7 * 86_400_000),
        },
      },
      orderBy: { snapshotAt: "desc" },
      select: { overallScore: true, usageScore: true },
    });
    const candidates = evaluateSignals({
      now,
      localToday: localDate(now, customer.workspace.timezone),
      customerSince: dateOnly(customer.customerSince),
      health: customer.currentHealth
        ? {
            id: customer.currentHealth.id,
            overallScore: customer.currentHealth.overallScore,
            supportScore: customer.currentHealth.supportScore,
            usageScore: customer.currentHealth.usageScore,
            isSimulated: false,
          }
        : null,
      baseline30: baseline,
      lastMeaningfulInteractionAt: customer.activities[0]?.occurredAt ?? null,
      risks: customer.risks.map((risk) => ({
        ...risk,
        targetResolutionDate: dateOnly(risk.targetResolutionDate),
        hasMitigation: risk.tasks.length > 0,
      })),
      tasks: customer.tasks.map((task) => ({
        ...task,
        dueDate: dateOnly(task.dueDate),
      })),
      goals: customer.successGoals.map((goal) => ({
        ...goal,
        targetDate: dateOnly(goal.targetDate),
      })),
      onboarding: customer.onboarding
        ? {
            ...customer.onboarding,
            targetCompletionDate: dateOnly(
              customer.onboarding.targetCompletionDate,
            ),
            milestones: customer.onboarding.milestones.map((milestone) => ({
              ...milestone,
              dueDate: dateOnly(milestone.dueDate),
            })),
          }
        : null,
      renewals: customer.renewals.map((renewal) => ({
        ...renewal,
        renewalAt: dateOnly(renewal.renewalAt)!,
      })),
    });
    const existing = await transaction.signal.findMany({
      where: { workspaceId, customerId, status: "ACTIVE" },
    });
    const candidateKeys = new Set(
      candidates.map(
        (candidate) => `${candidate.ruleKey}:${candidate.subjectKey}`,
      ),
    );
    for (const signal of existing.filter(
      (item) => !candidateKeys.has(`${item.ruleKey}:${item.subjectKey}`),
    )) {
      const unavailable =
        (["HEALTH_LOW", "SUPPORT_ESCALATION"].includes(signal.ruleKey) &&
          !customer.currentHealth) ||
        (["HEALTH_DECLINE", "USAGE_DECLINE"].includes(signal.ruleKey) &&
          (!customer.currentHealth || !baseline)) ||
        (signal.ruleKey === "LOW_ENGAGEMENT" &&
          !customer.activities[0] &&
          !customer.customerSince);
      await transaction.signal.update({
        where: { id: signal.id },
        data: {
          status: unavailable ? "EXPIRED" : "RESOLVED",
          resolvedAt: now,
          lastEvaluatedAt: now,
        },
      });
    }

    const activeSignals = [];
    for (const candidate of candidates) {
      const current = existing.find(
        (signal) =>
          signal.ruleKey === candidate.ruleKey &&
          signal.subjectKey === candidate.subjectKey,
      );
      const evidence = {
        version: 1,
        ...candidate.evidence,
        deadline: candidate.deadline,
      } as Prisma.InputJsonValue;
      const data = {
        severity: candidate.severity,
        currentValue: candidate.currentValue,
        previousValue: candidate.previousValue,
        sourceType: candidate.sourceType,
        sourceRef: candidate.sourceRef,
        evidence,
        lastEvaluatedAt: now,
      };
      const signal = current
        ? await transaction.signal.update({
            where: { id: current.id },
            data,
          })
        : await transaction.signal.create({
            data: {
              workspaceId,
              customerId,
              type: candidate.ruleKey,
              ruleKey: candidate.ruleKey,
              ruleVersion: signalRuleVersion,
              subjectKey: candidate.subjectKey,
              episodeKey: randomUUID(),
              title: candidate.ruleKey,
              detectedAt: now,
              status: "ACTIVE",
              isSimulated: customer.currentHealth
                ? candidate.sourceType === "HEALTH" &&
                  candidate.ruleKey === "USAGE_DECLINE"
                : false,
              ...data,
            },
          });
      if (candidate.sourceType === "RISK") {
        await transaction.riskSignal.upsert({
          where: {
            workspaceId_riskId_signalId: {
              workspaceId,
              riskId: candidate.sourceRef,
              signalId: signal.id,
            },
          },
          update: {},
          create: {
            workspaceId,
            customerId,
            riskId: candidate.sourceRef,
            signalId: signal.id,
          },
        });
      }
      activeSignals.push({
        ...signal,
        deadline: candidate.deadline,
        priorityFact: `${candidate.severity}:${candidate.deadline ?? ""}`,
      });
    }
    const attention = calculateAttention(
      activeSignals.map((signal) => ({
        id: signal.id,
        ruleKey: signal.ruleKey,
        subjectKey: signal.subjectKey,
        episodeKey: signal.episodeKey,
        severity: signal.severity,
        deadline: signal.deadline,
        priorityFact: signal.priorityFact,
      })),
    );
    await persistAttention(
      transaction,
      workspaceId,
      customerId,
      activeSignals.map((signal) => signal.id),
      attention,
      now,
    );
    await refreshRecommendationsForCustomer(
      transaction,
      workspaceId,
      customerId,
      now,
    );
    return { signalCount: activeSignals.length, attention };
  });
}

async function persistAttention(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  customerId: string,
  signalIds: string[],
  attention: ReturnType<typeof calculateAttention>,
  now: Date,
) {
  const active = await transaction.attentionItem.findFirst({
    where: {
      workspaceId,
      customerId,
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
    },
  });
  if (!attention) {
    if (active) {
      await transaction.attentionItem.update({
        where: { id: active.id },
        data: { status: "RESOLVED", resolvedAt: now },
      });
    }
    return;
  }
  let item = active;
  if (!item) {
    const dismissed = await transaction.attentionItem.findFirst({
      where: { workspaceId, customerId, status: "DISMISSED" },
      orderBy: { updatedAt: "desc" },
    });
    if (
      dismissed?.dismissedSignature === attention.evidenceSignature &&
      dismissed.dismissedPriority &&
      priorityRank[attention.priority] <=
        priorityRank[dismissed.dismissedPriority]
    ) {
      return;
    }
    item = await transaction.attentionItem.create({
      data: {
        workspaceId,
        customerId,
        priority: attention.priority,
        status: "OPEN",
        reasonSummary: attention.reasonKeys.join(","),
        evidenceSignature: attention.evidenceSignature,
        nearestDeadline: attention.nearestDeadline
          ? new Date(`${attention.nearestDeadline}T00:00:00Z`)
          : null,
      },
    });
  } else {
    item = await transaction.attentionItem.update({
      where: { id: item.id },
      data: {
        priority: attention.priority,
        reasonSummary: attention.reasonKeys.join(","),
        evidenceSignature: attention.evidenceSignature,
        nearestDeadline: attention.nearestDeadline
          ? new Date(`${attention.nearestDeadline}T00:00:00Z`)
          : null,
      },
    });
  }
  await transaction.attentionSignal.deleteMany({
    where: { workspaceId, attentionItemId: item.id },
  });
  if (signalIds.length) {
    await transaction.attentionSignal.createMany({
      data: signalIds.map((signalId) => ({
        workspaceId,
        customerId,
        attentionItemId: item!.id,
        signalId,
      })),
    });
  }
}
