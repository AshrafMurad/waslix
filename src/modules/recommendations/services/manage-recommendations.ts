import "server-only";

import { Prisma, type SignalRuleKey } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { startPlaybookRun } from "@/modules/playbooks/services/manage-playbook";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import { mapSignalToRecommendation } from "../engine/map-signal-to-recommendation";

export class RecommendationDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RecommendationDomainError";
  }
}

function dateFromOffset(now: Date, days: number) {
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + days);
  return new Date(`${next.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function signalReason(signal: {
  ruleKey: SignalRuleKey;
  subjectKey: string;
  currentValue: Prisma.Decimal | null;
  previousValue: Prisma.Decimal | null;
}) {
  const current = signal.currentValue?.toString() ?? null;
  const previous = signal.previousValue?.toString() ?? null;
  return JSON.stringify({
    version: 1,
    ruleKey: signal.ruleKey,
    subjectKey: signal.subjectKey,
    current,
    previous,
  });
}

async function defaultOwnerForSignal(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    customerId: string;
    ruleKey: SignalRuleKey;
    subjectKey: string;
  },
) {
  const customer = await transaction.customer.findFirst({
    where: { id: input.customerId, workspaceId: input.workspaceId },
    select: { ownerId: true, status: true },
  });
  if (!customer || customer.status === "ARCHIVED") {
    throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
  }
  const subjectId = input.subjectKey.split(":")[1];
  if (!subjectId) return customer.ownerId;
  if (["UNMANAGED_RISK", "RISK_UNRESOLVED"].includes(input.ruleKey)) {
    const risk = await transaction.risk.findFirst({
      where: {
        id: subjectId,
        workspaceId: input.workspaceId,
        customerId: input.customerId,
      },
      select: { ownerId: true },
    });
    return risk?.ownerId ?? customer.ownerId;
  }
  if (
    ["RENEWAL_PREPARATION", "RENEWAL_DUE", "RENEWAL_RISK"].includes(
      input.ruleKey,
    )
  ) {
    const renewal = await transaction.renewal.findFirst({
      where: {
        id: subjectId,
        workspaceId: input.workspaceId,
        customerId: input.customerId,
      },
      select: { ownerId: true },
    });
    return renewal?.ownerId ?? customer.ownerId;
  }
  if (input.ruleKey === "ONBOARDING_DELAY") {
    const onboarding = await transaction.onboarding.findFirst({
      where: {
        id: subjectId,
        workspaceId: input.workspaceId,
        customerId: input.customerId,
      },
      select: { ownerId: true },
    });
    return onboarding?.ownerId ?? customer.ownerId;
  }
  if (input.ruleKey === "GOAL_STALLED") {
    const goal = await transaction.successGoal.findFirst({
      where: {
        id: subjectId,
        workspaceId: input.workspaceId,
        customerId: input.customerId,
      },
      select: { ownerId: true },
    });
    return goal?.ownerId ?? customer.ownerId;
  }
  if (input.ruleKey === "TASK_OVERDUE") {
    const task = await transaction.task.findFirst({
      where: {
        id: subjectId,
        workspaceId: input.workspaceId,
        customerId: input.customerId,
      },
      select: { ownerId: true },
    });
    return task?.ownerId ?? customer.ownerId;
  }
  return customer.ownerId;
}

async function requireEligibleOwner(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  ownerId: string,
) {
  const owner = await transaction.workspaceMember.findFirst({
    where: {
      id: ownerId,
      workspaceId,
      status: "ACTIVE",
      role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
    },
    select: { id: true },
  });
  if (!owner)
    throw new RecommendationDomainError("RECOMMENDATION_OWNER_INVALID");
}

export async function refreshRecommendationsForCustomer(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  customerId: string,
  now: Date,
) {
  const activeSignals = await transaction.signal.findMany({
    where: { workspaceId, customerId, status: "ACTIVE" },
    select: {
      id: true,
      ruleKey: true,
      subjectKey: true,
      episodeKey: true,
      severity: true,
      currentValue: true,
      previousValue: true,
    },
  });
  if (activeSignals.length) {
    await transaction.recommendation.updateMany({
      where: {
        workspaceId,
        customerId,
        status: "SUGGESTED",
        NOT: activeSignals.map((signal) => ({
          ruleKey: signal.ruleKey,
          episodeKey: signal.episodeKey,
        })),
      },
      data: { status: "DISMISSED", dismissedReason: "NO_LONGER_APPLICABLE" },
    });
  } else {
    await transaction.recommendation.updateMany({
      where: { workspaceId, customerId, status: "SUGGESTED" },
      data: { status: "DISMISSED", dismissedReason: "NO_LONGER_APPLICABLE" },
    });
  }
  for (const signal of activeSignals) {
    const mapping = mapSignalToRecommendation(signal.ruleKey);
    await transaction.recommendation.upsert({
      where: {
        workspaceId_customerId_ruleKey_episodeKey: {
          workspaceId,
          customerId,
          ruleKey: signal.ruleKey,
          episodeKey: signal.episodeKey,
        },
      },
      update: {
        signalId: signal.id,
        title: signal.ruleKey,
        reason: signalReason(signal),
        priority: signal.severity,
        type: mapping.type,
      },
      create: {
        workspaceId,
        customerId,
        signalId: signal.id,
        ruleKey: signal.ruleKey,
        episodeKey: signal.episodeKey,
        type: mapping.type,
        title: signal.ruleKey,
        reason: signalReason(signal),
        priority: signal.severity,
        status: "SUGGESTED",
      },
    });
  }
  return { refreshedAt: now };
}

export async function acceptRecommendation(
  access: WorkspaceAccessContext,
  input: {
    recommendationId: string;
    ownerId?: string | null;
    dueDate?: string | null;
    operationKey: string;
  },
  now = new Date(),
) {
  if (access.role === "VIEWER") {
    throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
  }
  return prisma.$transaction(async (transaction) => {
    const replay = await transaction.systemEvent.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: access.workspaceId,
          idempotencyKey: input.operationKey,
        },
      },
      select: { entityId: true },
    });
    if (replay?.entityId === input.recommendationId) {
      return { id: input.recommendationId };
    }
    const recommendation = await transaction.recommendation.findFirst({
      where: { id: input.recommendationId, workspaceId: access.workspaceId },
      select: {
        id: true,
        customerId: true,
        ruleKey: true,
        type: true,
        status: true,
        taskId: true,
        playbookRunId: true,
        signal: { select: { subjectKey: true } },
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (!recommendation || recommendation.customer.status !== "ACTIVE") {
      throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
    }
    if (
      access.role !== "ADMIN" &&
      access.role !== "CS_MANAGER" &&
      recommendation.customer.ownerId !== access.memberId
    ) {
      throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
    }
    if (recommendation.status !== "SUGGESTED") return { id: recommendation.id };

    const subjectKey = recommendation.signal?.subjectKey ?? "customer";
    const mapping = mapSignalToRecommendation(recommendation.ruleKey);
    const ownerId =
      input.ownerId ??
      (await defaultOwnerForSignal(transaction, {
        workspaceId: access.workspaceId,
        customerId: recommendation.customerId,
        ruleKey: recommendation.ruleKey,
        subjectKey,
      }));
    await requireEligibleOwner(transaction, access.workspaceId, ownerId);

    let taskId: string | null = null;
    let playbookRunId: string | null = null;
    if (mapping.targetKind === "EXISTING_TASK") {
      taskId = subjectKey.split(":")[1] ?? null;
      if (!taskId)
        throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
    } else if (mapping.targetKind === "PLAYBOOK") {
      const riskId = recommendation.ruleKey.includes("RISK")
        ? subjectKey.split(":")[1]
        : null;
      const run = await startPlaybookRun(transaction, {
        workspaceId: access.workspaceId,
        customerId: recommendation.customerId,
        ownerId,
        templateKey: mapping.templateKey!,
        riskId,
        actorId: access.memberId,
        operationKey: input.operationKey,
        now,
      });
      playbookRunId = run.id;
    } else {
      const task = await transaction.task.create({
        data: {
          workspaceId: access.workspaceId,
          customerId: recommendation.customerId,
          title: mapping.taskTitle!,
          ownerId,
          createdById: access.memberId,
          priority:
            recommendation.ruleKey === "TASK_OVERDUE" ? "HIGH" : "MEDIUM",
          dueDate: input.dueDate
            ? new Date(`${input.dueDate}T00:00:00.000Z`)
            : dateFromOffset(now, mapping.dueOffsetDays ?? 3),
          riskId:
            recommendation.ruleKey === "UNMANAGED_RISK"
              ? subjectKey.split(":")[1]
              : null,
          renewalId:
            recommendation.ruleKey === "RENEWAL_DUE"
              ? subjectKey.split(":")[1]
              : null,
        },
        select: { id: true },
      });
      taskId = task.id;
    }
    await transaction.recommendation.update({
      where: { id: recommendation.id },
      data: { status: "ACCEPTED", taskId, playbookRunId },
    });
    await transaction.attentionItem.updateMany({
      where: {
        workspaceId: access.workspaceId,
        customerId: recommendation.customerId,
        status: "OPEN",
      },
      data: { status: "ACKNOWLEDGED", actedById: access.memberId },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: recommendation.customerId,
      type: "RECOMMENDATION_ACCEPTED",
      entityType: "RECOMMENDATION",
      entityId: recommendation.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, taskId, playbookRunId },
      jobType: "RECOMMENDATION_CHANGED",
    });
    return { id: recommendation.id };
  });
}

export async function dismissRecommendation(
  access: WorkspaceAccessContext,
  input: { recommendationId: string; reason: string; operationKey: string },
) {
  if (access.role === "VIEWER") {
    throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
  }
  if (!input.reason.trim()) {
    throw new RecommendationDomainError(
      "RECOMMENDATION_DISMISS_REASON_REQUIRED",
    );
  }
  return prisma.$transaction(async (transaction) => {
    const recommendation = await transaction.recommendation.findFirst({
      where: {
        id: input.recommendationId,
        workspaceId: access.workspaceId,
        status: "SUGGESTED",
      },
      select: {
        id: true,
        customerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (
      !recommendation ||
      recommendation.customer.status !== "ACTIVE" ||
      (access.role !== "ADMIN" &&
        access.role !== "CS_MANAGER" &&
        recommendation.customer.ownerId !== access.memberId)
    ) {
      throw new RecommendationDomainError("RECOMMENDATION_NOT_FOUND");
    }
    await transaction.recommendation.update({
      where: { id: recommendation.id },
      data: { status: "DISMISSED", dismissedReason: input.reason.trim() },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: recommendation.customerId,
      type: "RECOMMENDATION_DISMISSED",
      entityType: "RECOMMENDATION",
      entityId: recommendation.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, reason: input.reason.trim() },
      jobType: "RECOMMENDATION_CHANGED",
    });
    return { id: recommendation.id };
  });
}
