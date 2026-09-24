import type { Prisma } from "@prisma/client";

type WorkEventInput = {
  workspaceId: string;
  customerId: string | null;
  type: string;
  entityType: "TASK" | "CUSTOMER";
  entityId: string;
  actorId: string;
  idempotencyKey: string;
  metadata: Prisma.InputJsonValue;
  jobType: string;
};

export async function writeWorkEvent(
  transaction: Prisma.TransactionClient,
  input: WorkEventInput,
) {
  await transaction.systemEvent.create({
    data: {
      workspaceId: input.workspaceId,
      customerId: input.customerId,
      type: input.type,
      title: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata,
    },
  });
  await transaction.jobOutbox.create({
    data: {
      workspaceId: input.workspaceId,
      customerId: input.customerId,
      eventKey: input.idempotencyKey,
      jobType: input.jobType,
      payload: {
        workspaceId: input.workspaceId,
        customerId: input.customerId,
        entityId: input.entityId,
        eventKey: input.idempotencyKey,
      },
    },
  });
}
