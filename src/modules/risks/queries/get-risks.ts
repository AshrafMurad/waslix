import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 10;

export async function getRisks(
  access: WorkspaceAccessContext,
  options: { customerId?: string; page?: string; status?: string } = {},
) {
  const status = ["OPEN", "MONITORING", "RESOLVED"].includes(
    options.status ?? "",
  )
    ? (options.status as "OPEN" | "MONITORING" | "RESOLVED")
    : undefined;
  const where: Prisma.RiskWhereInput = {
    workspaceId: access.workspaceId,
    customerId: options.customerId,
    status,
  };
  if (!options.customerId && access.role === "CSM") {
    where.OR = [
      { ownerId: access.memberId },
      { customer: { ownerId: access.memberId } },
    ];
  }
  const totalCount = await prisma.risk.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = Math.min(
    Math.max(Number.parseInt(options.page ?? "1", 10) || 1, 1),
    10000,
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const rows = await prisma.risk.findMany({
    where,
    orderBy: [
      { status: "asc" },
      { severity: "desc" },
      { targetResolutionDate: "asc" },
      { id: "asc" },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      customerId: true,
      title: true,
      description: true,
      type: true,
      severity: true,
      status: true,
      targetResolutionDate: true,
      resolvedAt: true,
      resolutionNote: true,
      updatedAt: true,
      ownerId: true,
      customer: { select: { name: true, ownerId: true, status: true } },
      owner: { select: { user: { select: { name: true } } } },
      tasks: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        select: { id: true },
      },
    },
  });
  return {
    risks: rows,
    pagination: {
      currentPage,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages,
    },
  };
}

export async function getRiskOptions(access: WorkspaceAccessContext) {
  const [customers, owners] = await Promise.all([
    prisma.customer.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, ownerId: true },
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
        role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
      },
      orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);
  return {
    customers,
    owners: owners.map((owner) => ({ id: owner.id, name: owner.user.name })),
  };
}
