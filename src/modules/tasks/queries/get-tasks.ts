import "server-only";

import type { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

type TaskFilter = "my" | "team" | "overdue" | "completed";
const PAGE_SIZE = 10;

export async function getTasks(
  access: WorkspaceAccessContext,
  filters: { filter?: string; page?: string; customerId?: string } = {},
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
  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: workspace.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((parts, part) => {
      parts[part.type] = part.value;
      return parts;
    }, {});
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
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
  const totalCount = await prisma.task.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = Math.min(
    Math.max(Number.parseInt(filters.page ?? "1", 10) || 1, 1),
    10000,
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const rows = await prisma.task.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
    tasks: rows,
    filter,
    pagination: {
      currentPage,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages,
    },
    timezone: workspace.timezone,
  };
}
