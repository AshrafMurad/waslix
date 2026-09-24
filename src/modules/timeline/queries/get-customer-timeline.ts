import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const cursorSchema = z.object({
  occurredAt: z.iso.datetime(),
  kind: z.enum(["activity", "system"]),
  id: z.uuid(),
});

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

function decodeCursor(cursor?: string) {
  if (!cursor) return null;
  try {
    return cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
  } catch {
    return null;
  }
}

function compareEntries(left: TimelineEntry, right: TimelineEntry) {
  const time = right.occurredAt.getTime() - left.occurredAt.getTime();
  if (time) return time;
  if (left.kind !== right.kind) return left.kind === "activity" ? -1 : 1;
  return right.id.localeCompare(left.id);
}

function isAfterCursor(entry: TimelineEntry, cursor: NonNullable<ReturnType<typeof decodeCursor>>) {
  return (
    compareEntries(entry, {
      ...entry,
      id: cursor.id,
      kind: cursor.kind,
      occurredAt: new Date(cursor.occurredAt),
    }) > 0
  );
}

export async function getCustomerTimeline(
  access: WorkspaceAccessContext,
  customerId: string,
  filters: { filter?: string; cursor?: string } = {},
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { id: true },
  });
  if (!customer) return null;
  const filter = ["human", "system", "tasks"].includes(filters.filter ?? "")
    ? filters.filter
    : "all";
  const cursor = decodeCursor(filters.cursor);
  const before = cursor ? new Date(cursor.occurredAt) : undefined;
  const [activities, events] = await Promise.all([
    filter === "system" || filter === "tasks"
      ? []
      : prisma.activity.findMany({
          where: {
            workspaceId: access.workspaceId,
            customerId,
            occurredAt: before ? { lte: before } : undefined,
          },
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          take: 26,
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
          where: {
            workspaceId: access.workspaceId,
            customerId,
            occurredAt: before ? { lte: before } : undefined,
            ...(filter === "tasks" ? { entityType: "TASK" } : {}),
          },
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          take: 26,
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
  ]
    .sort(compareEntries)
    .filter((entry) => !cursor || isAfterCursor(entry, cursor));
  const page = entries.slice(0, 25);
  const last = page.at(-1);
  return {
    entries: page,
    filter,
    nextCursor:
      entries.length > 25 && last
        ? Buffer.from(
            JSON.stringify({
              occurredAt: last.occurredAt.toISOString(),
              kind: last.kind,
              id: last.id,
            }),
          ).toString("base64url")
        : null,
  };
}
