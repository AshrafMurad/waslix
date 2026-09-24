import "server-only";

import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  calculateHealth,
  engagementScoreForDays,
  goalProgressScore,
  healthRuleVersion,
  type HealthDimension,
  type HealthDimensionInput,
} from "../engine/calculate-health";
import { healthEvidenceSchema } from "../validation/health-evidence";

const dayMilliseconds = 24 * 60 * 60 * 1000;

type RecalculationRequest = {
  workspaceId: string;
  customerId: string;
  purpose?: "change" | "daily";
  now?: Date;
};

function workspaceLocalDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function recalculateCustomerHealth(request: RecalculationRequest) {
  const now = request.now ?? new Date();
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${request.workspaceId}:${request.customerId}:health`}, 0))`;
    const customer = await transaction.customer.findFirst({
      where: {
        id: request.customerId,
        workspaceId: request.workspaceId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        workspace: { select: { timezone: true } },
        activities: {
          where: { isMeaningful: true, occurredAt: { lte: now } },
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { id: true, occurredAt: true },
        },
        successGoals: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            progress: true,
            status: true,
            progressObservedAt: true,
          },
        },
        healthInputs: {
          orderBy: { dimension: "asc" },
          select: {
            id: true,
            dimension: true,
            isManualOverride: true,
            revisions: {
              orderBy: { version: "desc" },
              take: 1,
              select: {
                id: true,
                version: true,
                value: true,
                sourceType: true,
                sourceRef: true,
                isSimulated: true,
                observedAt: true,
              },
            },
          },
        },
        currentHealth: {
          select: {
            id: true,
            overallScore: true,
            status: true,
            confidence: true,
          },
        },
      },
    });
    if (!customer) return null;

    const inputs = selectedInputs(customer, now);
    const result = calculateHealth(inputs, now);
    const nativeFacts = {
      meaningfulActivity: customer.activities[0]
        ? {
            id: customer.activities[0].id,
            occurredAt: customer.activities[0].occurredAt.toISOString(),
          }
        : null,
      goals: customer.successGoals.map((goal) => ({
        id: goal.id,
        progress: goal.progress,
        status: goal.status,
        observedAt: goal.progressObservedAt.toISOString(),
      })),
    };
    const inputFingerprint = fingerprint({
      revisions: inputs.map((input) => input.sourceId),
      nativeFacts,
    });
    const calculationKey =
      request.purpose === "daily"
        ? `daily:${customer.id}:${workspaceLocalDate(now, customer.workspace.timezone)}:${healthRuleVersion}`
        : `change:${customer.id}:${inputFingerprint}:${healthRuleVersion}`;
    const evidenceValue = healthEvidenceSchema.parse({
      version: 1,
      dimensions: Object.fromEntries(
        Object.entries(result.dimensions).map(([dimension, value]) => [
          dimension,
          {
            score: value.score,
            observedAt: value.observedAt.toISOString(),
            source: value.source,
            sourceId: value.sourceId,
            isSimulated: value.isSimulated,
            freshness: value.freshness,
            originalWeight: value.originalWeight,
            effectiveWeight: value.effectiveWeight,
          },
        ]),
      ),
      nativeFacts,
    });
    const evidence = evidenceValue as Prisma.InputJsonValue;
    const dimensions = result.dimensions;
    const projection = {
      rawScore: result.rawScore,
      overallScore: result.overallScore,
      status: result.status,
      usageScore: dimensions.USAGE?.score ?? null,
      engagementScore: dimensions.ENGAGEMENT?.score ?? null,
      supportScore: dimensions.SUPPORT?.score ?? null,
      goalScore: dimensions.GOALS?.score ?? null,
      confidence: result.confidence,
      confidenceValue: result.confidenceValue,
      calculationKey,
      ruleVersion: healthRuleVersion,
      evidence,
    };
    await transaction.healthSnapshot.upsert({
      where: {
        workspaceId_customerId_calculationKey: {
          workspaceId: request.workspaceId,
          customerId: request.customerId,
          calculationKey,
        },
      },
      update: {},
      create: {
        workspaceId: request.workspaceId,
        customerId: request.customerId,
        snapshotAt: now,
        ...projection,
      },
    });
    const health = await transaction.customerHealth.upsert({
      where: {
        workspaceId_customerId: {
          workspaceId: request.workspaceId,
          customerId: request.customerId,
        },
      },
      update: { ...projection, calculatedAt: now, pendingSince: null },
      create: {
        workspaceId: request.workspaceId,
        customerId: request.customerId,
        ...projection,
        calculatedAt: now,
      },
      select: { id: true },
    });
    const changed =
      !customer.currentHealth ||
      customer.currentHealth.overallScore !== result.overallScore ||
      customer.currentHealth.status !== result.status ||
      customer.currentHealth.confidence !== result.confidence;
    if (changed) {
      await transaction.systemEvent.upsert({
        where: {
          workspaceId_idempotencyKey: {
            workspaceId: request.workspaceId,
            idempotencyKey: `health:${calculationKey}`,
          },
        },
        update: {},
        create: {
          workspaceId: request.workspaceId,
          customerId: request.customerId,
          type: "HEALTH_CHANGED",
          title: "HEALTH_CHANGED",
          entityType: "HEALTH",
          entityId: health.id,
          idempotencyKey: `health:${calculationKey}`,
          occurredAt: now,
          metadata: {
            version: 1,
            beforeScore: customer.currentHealth?.overallScore ?? null,
            afterScore: result.overallScore,
            beforeStatus: customer.currentHealth?.status ?? null,
            afterStatus: result.status,
          },
        },
      });
    }
    return { ...result, calculationKey };
  });
}

function selectedInputs(
  customer: {
    activities: Array<{ id: string; occurredAt: Date }>;
    successGoals: Array<{
      id: string;
      progress: number;
      status: string;
      progressObservedAt: Date;
    }>;
    healthInputs: Array<{
      id: string;
      dimension: HealthDimension;
      isManualOverride: boolean;
      revisions: Array<{
        id: string;
        version: number;
        value: number;
        sourceType: "MANUAL" | "SYSTEM" | "INTEGRATION";
        isSimulated: boolean;
        observedAt: Date;
      }>;
    }>;
  },
  now: Date,
) {
  const selected = new Map<HealthDimension, HealthDimensionInput>();
  for (const input of customer.healthInputs) {
    const revision = input.revisions[0];
    const shouldSelect =
      revision &&
      (input.dimension === "USAGE" ||
        input.dimension === "SUPPORT" ||
        input.isManualOverride);
    if (shouldSelect) {
      selected.set(input.dimension, {
        dimension: input.dimension,
        score: revision.value,
        observedAt: revision.observedAt,
        source: revision.sourceType,
        sourceId: revision.id,
        isSimulated: revision.isSimulated,
      });
    }
  }

  if (!selected.has("ENGAGEMENT") && customer.activities[0]) {
    const activity = customer.activities[0];
    const days = Math.max(
      0,
      Math.floor(
        (now.getTime() - activity.occurredAt.getTime()) / dayMilliseconds,
      ),
    );
    selected.set("ENGAGEMENT", {
      dimension: "ENGAGEMENT",
      score: engagementScoreForDays(days),
      observedAt: now,
      source: "SYSTEM",
      sourceId: `activity:${activity.id}:${days}`,
      isSimulated: false,
    });
  }

  if (!selected.has("GOALS")) {
    const score = goalProgressScore(customer.successGoals);
    const eligible = customer.successGoals.filter(
      (goal) => goal.status !== "CANCELLED",
    );
    const latestObservedAt = eligible.reduce<Date | null>(
      (latest, goal) =>
        !latest || goal.progressObservedAt > latest
          ? goal.progressObservedAt
          : latest,
      null,
    );
    if (score !== null && latestObservedAt) {
      selected.set("GOALS", {
        dimension: "GOALS",
        score,
        observedAt: latestObservedAt,
        source: "SYSTEM",
        sourceId: `goals:${fingerprint(
          eligible.map((goal) => [goal.id, goal.progress, goal.status]),
        )}`,
        isSimulated: false,
      });
    }
  }
  return [...selected.values()];
}

export async function runDailyHealthSweep(now = new Date()) {
  const customers = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      workspaceId: true,
      workspace: { select: { timezone: true } },
    },
  });
  let calculated = 0;
  for (const customer of customers) {
    const calculationKey = `daily:${customer.id}:${workspaceLocalDate(now, customer.workspace.timezone)}:${healthRuleVersion}`;
    const exists = await prisma.healthSnapshot.findUnique({
      where: {
        workspaceId_customerId_calculationKey: {
          workspaceId: customer.workspaceId,
          customerId: customer.id,
          calculationKey,
        },
      },
      select: { id: true },
    });
    if (exists) continue;
    await recalculateCustomerHealth({
      workspaceId: customer.workspaceId,
      customerId: customer.id,
      purpose: "daily",
      now,
    });
    calculated += 1;
  }
  return { selected: customers.length, calculated };
}
