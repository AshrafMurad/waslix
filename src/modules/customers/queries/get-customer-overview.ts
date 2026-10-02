import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import {
  compareHealth,
  selectHealthBaseline,
} from "@/modules/health/engine/compare-health";

export async function getCustomerOverview(
  access: WorkspaceAccessContext,
  customerId: string,
  now = new Date(),
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: {
      id: true,
      name: true,
      website: true,
      industry: true,
      companySize: true,
      contractValue: true,
      currency: true,
      customerSince: true,
      renewalDate: true,
      status: true,
      archivedAt: true,
      lifecycleStage: { select: { id: true, name: true, key: true } },
      owner: { select: { id: true, user: { select: { name: true } } } },
      currentHealth: {
        select: {
          overallScore: true,
          status: true,
          confidence: true,
          calculatedAt: true,
          pendingSince: true,
        },
      },
      healthSnapshots: {
        where: {
          snapshotAt: {
            gte: new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000),
            lte: now,
          },
        },
        orderBy: [{ snapshotAt: "asc" }, { id: "asc" }],
        select: { snapshotAt: true, overallScore: true },
      },
      successGoals: {
        orderBy: [{ status: "asc" }, { targetDate: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          progress: true,
          status: true,
          targetDate: true,
          progressObservedAt: true,
          completedAt: true,
          owner: { select: { id: true, user: { select: { name: true } } } },
        },
      },
      tags: { select: { tag: { select: { id: true, name: true } } } },
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          jobTitle: true,
          accountRole: true,
          isPrimary: true,
          status: true,
        },
      },
    },
  });
  if (!customer) return null;
  const { healthSnapshots, ...customerData } = customer;
  const healthBaseline30 = selectHealthBaseline(healthSnapshots, now, 30);
  return {
    ...customerData,
    contractValue: customer.contractValue?.toString() ?? null,
    tags: customer.tags.map(({ tag }) => tag),
    health: customer.currentHealth,
    healthComparison30: compareHealth(
      customer.currentHealth?.overallScore ?? null,
      healthBaseline30,
    ),
  };
}
