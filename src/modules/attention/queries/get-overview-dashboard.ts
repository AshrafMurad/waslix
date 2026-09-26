import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getOverviewDashboard(
  access: WorkspaceAccessContext,
  now = new Date(),
) {
  const customerScope: Prisma.CustomerWhereInput =
    access.role === "CSM" ? { ownerId: access.memberId } : {};
  const attentionWhere: Prisma.AttentionItemWhereInput = {
    workspaceId: access.workspaceId,
    status: { in: ["OPEN", "ACKNOWLEDGED"] },
    customer: customerScope,
  };
  const [
    items,
    attentionCount,
    criticalCount,
    atRiskCount,
    overdueCount,
    healthGroups,
    tasks,
  ] = await Promise.all([
    prisma.attentionItem.findMany({
      where: attentionWhere,
      orderBy: [
        { priority: "desc" },
        { nearestDeadline: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      take: 25,
      select: {
        id: true,
        priority: true,
        status: true,
        reasonSummary: true,
        nearestDeadline: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            renewalDate: true,
            owner: { select: { user: { select: { name: true } } } },
            currentHealth: { select: { overallScore: true, status: true } },
          },
        },
      },
    }),
    prisma.attentionItem.count({ where: attentionWhere }),
    prisma.attentionItem.count({
      where: { ...attentionWhere, priority: "CRITICAL" },
    }),
    prisma.customerHealth.count({
      where: {
        workspaceId: access.workspaceId,
        status: "AT_RISK",
        customer: customerScope,
      },
    }),
    prisma.task.count({
      where: {
        workspaceId: access.workspaceId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
        ownerId: access.role === "CSM" ? access.memberId : undefined,
        OR: [
          { dueAt: { lt: now } },
          {
            dueDate: {
              lt: new Date(now.toISOString().slice(0, 10) + "T00:00:00Z"),
            },
          },
        ],
      },
    }),
    prisma.customerHealth.groupBy({
      by: ["status"],
      where: { workspaceId: access.workspaceId, customer: customerScope },
      _count: true,
    }),
    prisma.task.findMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: access.memberId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      orderBy: [
        { dueDate: { sort: "asc", nulls: "last" } },
        { dueAt: { sort: "asc", nulls: "last" } },
        { id: "asc" },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        dueAt: true,
        customer: { select: { name: true } },
      },
    }),
  ]);
  const baselineTarget = new Date(now.getTime() - 30 * 86_400_000);
  const baselines = items.length
    ? await prisma.healthSnapshot.findMany({
        where: {
          workspaceId: access.workspaceId,
          customerId: { in: items.map((item) => item.customer.id) },
          snapshotAt: {
            lte: baselineTarget,
            gte: new Date(baselineTarget.getTime() - 7 * 86_400_000),
          },
        },
        orderBy: [{ snapshotAt: "desc" }, { id: "desc" }],
        select: { customerId: true, overallScore: true },
      })
    : [];
  const baselineByCustomer = new Map<string, number | null>();
  for (const baseline of baselines)
    if (!baselineByCustomer.has(baseline.customerId))
      baselineByCustomer.set(baseline.customerId, baseline.overallScore);
  return {
    metrics: { attentionCount, criticalCount, atRiskCount, overdueCount },
    items: items.map((item) => ({
      ...item,
      healthDelta:
        item.customer.currentHealth?.overallScore != null &&
        baselineByCustomer.get(item.customer.id) != null
          ? item.customer.currentHealth.overallScore -
            baselineByCustomer.get(item.customer.id)!
          : null,
    })),
    healthGroups: Object.fromEntries(
      healthGroups.map((group) => [group.status ?? "UNKNOWN", group._count]),
    ),
    tasks,
  };
}
