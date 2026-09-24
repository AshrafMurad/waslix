import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

type TaskFilter = "my" | "team" | "overdue" | "completed";

export async function getTasks(
  access: WorkspaceAccessContext,
  filters: { filter?: string; cursor?: string; customerId?: string } = {},
) {
  const defaultFilter = filters.customerId ? "team" : "my";
  const filter: TaskFilter = ["team", "overdue", "completed", "my"].includes(
    filters.filter ?? "",
  )
    ? (filters.filter as TaskFilter)
    : defaultFilter;
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: access.workspaceId },
    select: { timezone: true },
  });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: workspace.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const now = new Date();
  const where: Prisma.TaskWhereInput = {
    workspaceId: access.workspaceId,
    customerId: filters.customerId,
  };
  if (filter === "my") {
    where.ownerId = access.memberId;
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  } else if (filter === "completed") {
    where.status = "COMPLETED";
  } else if (filter === "overdue") {
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
    where.OR = [
      { dueDate: { lt: new Date(`${today}T00:00:00.000Z`) } },
      { dueAt: { lt: now } },
    ];
  } else {
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  }
  const rows = await prisma.task.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 26,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      status: true,
      dueDate: true,
      dueAt: true,
      customerId: true,
      ownerId: true,
      customer: { select: { name: true, ownerId: true } },
      owner: { select: { user: { select: { name: true } } } },
    },
  });
  return {
    tasks: rows.slice(0, 25),
    nextCursor: rows.length > 25 ? rows[24].id : null,
    filter,
  };
}
