import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getRisks(
  access: WorkspaceAccessContext,
  options: { customerId?: string; cursor?: string; status?: string } = {},
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
  const rows = await prisma.risk.findMany({
    where,
    orderBy: [
      { status: "asc" },
      { severity: "desc" },
      { targetResolutionDate: "asc" },
      { id: "asc" },
    ],
    take: 26,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
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
    risks: rows.slice(0, 25),
    nextCursor: rows.length > 25 ? rows[24].id : null,
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
