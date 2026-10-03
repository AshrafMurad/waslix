import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 10;

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
  options: { page?: string; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const where: Prisma.RenewalWhereInput = {
    workspaceId: access.workspaceId,
    stage: { notIn: ["RENEWED", "CHURNED"] },
    customer: {
      status: "ACTIVE",
      ...(access.role === "CSM" ? { ownerId: access.memberId } : {}),
    },
  };
  const totalCount = await prisma.renewal.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = Math.min(
    Math.max(Number.parseInt(options.page ?? "1", 10) || 1, 1),
    10000,
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const renewals = await prisma.renewal.findMany({
    where,
    orderBy: [{ renewalAt: "asc" }, { id: "asc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
  return {
    renewals,
    generatedAt: now,
    pagination: {
      currentPage,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages,
    },
  };
}
