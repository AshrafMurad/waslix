import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getCustomerRenewals(
  access: WorkspaceAccessContext,
  customerId: string,
) {
  return prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      renewals: {
        orderBy: [{ renewalAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          ownerId: true,
          contractValue: true,
          currency: true,
          startAt: true,
          renewalAt: true,
          stage: true,
          readinessStatus: true,
          readinessPending: true,
          readinessReasons: true,
          readinessCalculatedAt: true,
          expectedOutcome: true,
          outcome: true,
          completedAt: true,
          notes: true,
          churnReason: true,
          owner: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
}

export async function getRenewalPortfolio(
  access: WorkspaceAccessContext,
  now = new Date(),
) {
  const where: Prisma.RenewalWhereInput = {
    workspaceId: access.workspaceId,
    stage: { notIn: ["RENEWED", "CHURNED"] },
    customer: {
      status: "ACTIVE",
      ...(access.role === "CSM" ? { ownerId: access.memberId } : {}),
    },
  };
  const renewals = await prisma.renewal.findMany({
    where,
    orderBy: [{ renewalAt: "asc" }, { id: "asc" }],
    take: 50,
    select: {
      id: true,
      contractValue: true,
      currency: true,
      renewalAt: true,
      stage: true,
      readinessStatus: true,
      readinessPending: true,
      owner: { select: { user: { select: { name: true } } } },
      customer: { select: { id: true, name: true } },
    },
  });
  return { renewals, generatedAt: now };
}
