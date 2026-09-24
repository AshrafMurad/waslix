import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type OutboxDelivery = {
  eventKey: string;
  jobType: string;
  payload: Prisma.JsonValue;
};

export type JobSender = (delivery: OutboxDelivery) => Promise<void>;

export async function dispatchOutboxBatch(
  send: JobSender,
  options: { limit?: number; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const jobs = await prisma.jobOutbox.findMany({
    where: { dispatchedAt: null, availableAt: { lte: now }, attempts: { lt: 5 } },
    orderBy: [{ availableAt: "asc" }, { id: "asc" }],
    take: options.limit ?? 100,
    select: {
      id: true,
      workspaceId: true,
      eventKey: true,
      jobType: true,
      payload: true,
    },
  });
  let dispatched = 0;
  for (const job of jobs) {
    try {
      await send({
        eventKey: job.eventKey,
        jobType: job.jobType,
        payload: job.payload,
      });
      const result = await prisma.jobOutbox.updateMany({
        where: {
          id: job.id,
          workspaceId: job.workspaceId,
          dispatchedAt: null,
        },
        data: { dispatchedAt: now, lastErrorCode: null },
      });
      dispatched += result.count;
    } catch (error) {
      await prisma.jobOutbox.updateMany({
        where: {
          id: job.id,
          workspaceId: job.workspaceId,
          dispatchedAt: null,
        },
        data: {
          attempts: { increment: 1 },
          lastErrorCode:
            error instanceof Error && error.name
              ? error.name.slice(0, 100)
              : "DISPATCH_FAILED",
        },
      });
    }
  }
  return { selected: jobs.length, dispatched };
}
