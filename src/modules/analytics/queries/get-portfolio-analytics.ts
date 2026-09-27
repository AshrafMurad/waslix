import "server-only";

import { z } from "zod";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const analyticsFilterSchema = z.object({
  period: z.enum(["30", "90", "180"]).catch("90"),
  owner: z.string().uuid().optional().catch(undefined),
  lifecycle: z.string().uuid().optional().catch(undefined),
});

type AnalyticsFilters = Partial<{
  period: string;
  owner: string;
  lifecycle: string;
}>;

const terminalRenewalStages: ["RENEWED", "CHURNED"] = ["RENEWED", "CHURNED"];

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export async function getPortfolioAnalytics(
  access: WorkspaceAccessContext,
  input: AnalyticsFilters,
) {
  const filters = analyticsFilterSchema.parse(input);
  const periodDays = Number(filters.period);
  const since = daysAgo(periodDays);
  const customerWhere = {
    workspaceId: access.workspaceId,
    status: "ACTIVE" as const,
    ...(filters.owner ? { ownerId: filters.owner } : {}),
    ...(filters.lifecycle ? { lifecycleStageId: filters.lifecycle } : {}),
  };

  const [customers, risks, renewals, closedRenewals, onboardings, tasks] =
    await Promise.all([
      prisma.customer.findMany({
        where: customerWhere,
        select: {
          id: true,
          ownerId: true,
          lifecycleStage: { select: { id: true, key: true, name: true } },
          owner: { select: { id: true, user: { select: { name: true } } } },
          currentHealth: { select: { overallScore: true, status: true } },
          healthSnapshots: {
            where: { snapshotAt: { lte: since } },
            orderBy: { snapshotAt: "desc" },
            take: 1,
            select: { overallScore: true },
          },
        },
      }),
      prisma.risk.findMany({
        where: {
          workspaceId: access.workspaceId,
          status: { in: ["OPEN", "MONITORING"] },
          customer: customerWhere,
        },
        select: { severity: true, ownerId: true },
      }),
      prisma.renewal.findMany({
        where: {
          workspaceId: access.workspaceId,
          stage: { notIn: terminalRenewalStages },
          renewalAt: { gte: new Date(), lte: daysAgo(-90) },
          customer: customerWhere,
        },
        select: { contractValue: true, currency: true },
      }),
      prisma.renewal.findMany({
        where: {
          workspaceId: access.workspaceId,
          stage: { in: terminalRenewalStages },
          completedAt: { gte: since },
          customer: customerWhere,
        },
        select: { stage: true },
      }),
      prisma.onboarding.findMany({
        where: {
          workspaceId: access.workspaceId,
          customer: customerWhere,
          OR: [
            { completedAt: { gte: since } },
            { completedAt: null },
            { createdAt: { gte: since } },
          ],
        },
        select: {
          status: true,
          startDate: true,
          completedAt: true,
          ownerId: true,
        },
      }),
      prisma.task.findMany({
        where: {
          workspaceId: access.workspaceId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
          OR: [{ customer: customerWhere }, { customerId: null }],
        },
        select: { ownerId: true, status: true },
      }),
    ]);

  const healthDistribution = {
    HEALTHY: 0,
    NEEDS_ATTENTION: 0,
    AT_RISK: 0,
    UNKNOWN: 0,
  };
  let scoreTotal = 0;
  let scoreCount = 0;
  let trendTotal = 0;
  let trendCount = 0;
  for (const customer of customers) {
    const status = customer.currentHealth?.status ?? "UNKNOWN";
    healthDistribution[status] += 1;
    if (customer.currentHealth?.overallScore != null) {
      scoreTotal += customer.currentHealth.overallScore;
      scoreCount += 1;
    }
    const baseline = customer.healthSnapshots[0]?.overallScore;
    if (customer.currentHealth?.overallScore != null && baseline != null) {
      trendTotal += customer.currentHealth.overallScore - baseline;
      trendCount += 1;
    }
  }

  const renewalValueByCurrency = new Map<string, number>();
  for (const renewal of renewals) {
    renewalValueByCurrency.set(
      renewal.currency,
      (renewalValueByCurrency.get(renewal.currency) ?? 0) +
        Number(renewal.contractValue),
    );
  }

  const ownerWorkload = new Map<
    string,
    {
      ownerId: string;
      ownerName: string;
      customers: number;
      tasks: number;
      risks: number;
    }
  >();
  for (const customer of customers) {
    const row = ownerWorkload.get(customer.ownerId) ?? {
      ownerId: customer.ownerId,
      ownerName: customer.owner.user.name,
      customers: 0,
      tasks: 0,
      risks: 0,
    };
    row.customers += 1;
    ownerWorkload.set(customer.ownerId, row);
  }
  for (const task of tasks) {
    const row = ownerWorkload.get(task.ownerId);
    if (row) row.tasks += 1;
  }
  for (const risk of risks) {
    const row = ownerWorkload.get(risk.ownerId);
    if (row) row.risks += 1;
  }

  const renewed = closedRenewals.filter(
    (renewal) => renewal.stage === "RENEWED",
  ).length;
  const churned = closedRenewals.filter(
    (renewal) => renewal.stage === "CHURNED",
  ).length;
  const completionDurations = onboardings
    .filter((item) => item.startDate && item.completedAt)
    .map((item) =>
      Math.max(
        0,
        Math.round(
          (item.completedAt!.getTime() - item.startDate!.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
    );

  return {
    filters,
    customerCount: customers.length,
    averageHealth: scoreCount ? Math.round(scoreTotal / scoreCount) : null,
    healthCoverage: { known: scoreCount, total: customers.length },
    healthDistribution,
    trend: trendCount ? Math.round(trendTotal / trendCount) : null,
    trendCoverage: { known: trendCount, total: customers.length },
    riskSeverity: risks.reduce<Record<string, number>>((accumulator, risk) => {
      accumulator[risk.severity] = (accumulator[risk.severity] ?? 0) + 1;
      return accumulator;
    }, {}),
    renewalValue: [...renewalValueByCurrency.entries()].map(
      ([currency, value]) => ({
        currency,
        value,
      }),
    ),
    renewalOutcomeRate:
      renewed + churned
        ? Math.round((renewed / (renewed + churned)) * 100)
        : null,
    onboarding: {
      completed: onboardings.filter((item) => item.status === "COMPLETED")
        .length,
      total: onboardings.length,
      medianCompletionDays: median(completionDurations),
    },
    ownerWorkload: [...ownerWorkload.values()].sort((a, b) =>
      a.ownerName.localeCompare(b.ownerName),
    ),
  };
}
