import "server-only";

import type { Prisma } from "@prisma/client";
import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 10;

type TimelineKind = "activity" | "system";
type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  type: string;
  title: string;
  description: string | null;
  occurredAt: Date;
  actor: string | null;
  metadata: Prisma.JsonValue | null;
};

function compareEntries(left: TimelineEntry, right: TimelineEntry) {
  const time = right.occurredAt.getTime() - left.occurredAt.getTime();
  if (time) return time;
  if (left.kind !== right.kind) return left.kind === "activity" ? -1 : 1;
  return right.id.localeCompare(left.id);
}

export async function getCustomerTimeline(
  access: WorkspaceAccessContext,
  customerId: string,
  filters: { filter?: string; page?: string } = {},
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { id: true },
  });
  if (!customer) return null;
  const filter = ["human", "system", "tasks"].includes(filters.filter ?? "")
    ? filters.filter
    : "all";
  const activityWhere = {
    workspaceId: access.workspaceId,
    customerId,
  };
  const eventWhere = {
    workspaceId: access.workspaceId,
    customerId,
    ...(filter === "tasks" ? { entityType: "TASK" } : {}),
  };
  const [activityCount, eventCount] = await Promise.all([
    filter === "system" || filter === "tasks"
      ? 0
      : prisma.activity.count({ where: activityWhere }),
    filter === "human" ? 0 : prisma.systemEvent.count({ where: eventWhere }),
  ]);
  const totalCount = activityCount + eventCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = Math.min(
    Math.max(Number.parseInt(filters.page ?? "1", 10) || 1, 1),
    10000,
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const take = offset + PAGE_SIZE;
  const [activities, events] = await Promise.all([
    filter === "system" || filter === "tasks"
      ? []
      : prisma.activity.findMany({
          where: activityWhere,
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          take,
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            occurredAt: true,
            createdBy: { select: { user: { select: { name: true } } } },
          },
        }),
    filter === "human"
      ? []
      : prisma.systemEvent.findMany({
          where: eventWhere,
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          take,
          select: {
            id: true,
            type: true,
            title: true,
            occurredAt: true,
            metadata: true,
            actor: { select: { user: { select: { name: true } } } },
          },
        }),
  ]);
  const entries: TimelineEntry[] = [
    ...activities.map((activity) => ({
      id: activity.id,
      kind: "activity" as const,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      occurredAt: activity.occurredAt,
      actor: activity.createdBy.user.name,
      metadata: null,
    })),
    ...events.map((event) => ({
      id: event.id,
      kind: "system" as const,
      type: event.type,
      title: event.title,
      description: null,
      occurredAt: event.occurredAt,
      actor: event.actor?.user.name ?? null,
      metadata: event.metadata,
    })),
  ].sort(compareEntries);
  const page = entries.slice(offset, offset + PAGE_SIZE);
  return {
    entries: page,
    filter,
    pagination: {
      currentPage,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages,
    },
  };
}
