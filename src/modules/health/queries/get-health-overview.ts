import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

import { compareHealth, selectHealthBaseline } from "../engine/compare-health";
import { healthEvidenceSchema } from "../validation/health-evidence";

export async function getHealthOverview(
  access: WorkspaceAccessContext,
  customerId: string,
  now = new Date(),
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: {
      id: true,
      status: true,
      currentHealth: true,
      healthInputs: {
        orderBy: { dimension: "asc" },
        select: {
          dimension: true,
          isManualOverride: true,
          revisions: {
            orderBy: { version: "desc" },
            take: 1,
            select: {
              value: true,
              observedAt: true,
              sourceType: true,
              isSimulated: true,
            },
          },
        },
      },
      healthSnapshots: {
        where: {
          snapshotAt: {
            gte: new Date(now.getTime() - 97 * 24 * 60 * 60 * 1000),
            lte: now,
          },
        },
        orderBy: [{ snapshotAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          snapshotAt: true,
          overallScore: true,
          status: true,
        },
      },
      jobOutbox: {
        where: { jobType: "HEALTH_RECALCULATE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  if (!customer) return null;
  const current = customer.currentHealth;
  const evidence = current
    ? healthEvidenceSchema.safeParse(current.evidence)
    : null;
  const pending =
    Boolean(current?.pendingSince) ||
    Boolean(
      customer.jobOutbox[0] &&
      (!current || customer.jobOutbox[0].createdAt > current.calculatedAt),
    );
  const comparisons = Object.fromEntries(
    ([7, 30, 90] as const).map((window) => {
      const baseline = selectHealthBaseline(
        customer.healthSnapshots,
        now,
        window,
      );
      return [window, compareHealth(current?.overallScore ?? null, baseline)];
    }),
  ) as Record<7 | 30 | 90, ReturnType<typeof compareHealth>>;
  const dimensions = evidence?.success ? evidence.data.dimensions : {};

  return {
    customerStatus: customer.status,
    current: current
      ? {
          overallScore: current.overallScore,
          status: current.status,
          confidence: current.confidence,
          confidenceValue: Number(current.confidenceValue),
          calculatedAt: current.calculatedAt,
          dimensions,
        }
      : null,
    pending,
    comparisons,
    history: customer.healthSnapshots.map((snapshot) => ({
      ...snapshot,
      overallScore: snapshot.overallScore,
    })),
    inputs: customer.healthInputs.map((input) => ({
      dimension: input.dimension,
      isManualOverride: input.isManualOverride,
      latest: input.revisions[0] ?? null,
    })),
    reasons: (
      Object.entries(dimensions) as Array<
        [string, { score: number; freshness: string }]
      >
    )
      .sort((left, right) => left[1].score - right[1].score)
      .map(([dimension, value]) => ({
        dimension,
        score: value.score,
        tone:
          value.score < 60
            ? "negative"
            : value.score >= 80
              ? "positive"
              : "neutral",
        freshness: value.freshness,
      })),
  };
}
