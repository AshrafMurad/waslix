import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

import type { ActivityInput } from "../validation/activity-input";
import { ActivityDomainError } from "./activity-errors";

function replayEntityId(payload: Prisma.JsonValue) {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    typeof payload.entityId === "string"
  ) {
    return payload.entityId;
  }
  return null;
}

export async function createActivity(
  access: WorkspaceAccessContext,
  input: ActivityInput,
) {
  if (access.role === "VIEWER") {
    throw new ActivityDomainError("ACTIVITY_FORBIDDEN");
  }
  try {
    return await prisma.$transaction(async (transaction) => {
      const replay = await transaction.jobOutbox.findUnique({
        where: {
          workspaceId_eventKey: {
            workspaceId: access.workspaceId,
            eventKey: input.operationKey,
          },
        },
        select: { payload: true },
      });
      const replayId = replay && replayEntityId(replay.payload);
      if (replayId) return { id: replayId };

      const customer = await transaction.customer.findFirst({
        where: { id: input.customerId, workspaceId: access.workspaceId },
        select: { ownerId: true, status: true },
      });
      if (!customer) throw new ActivityDomainError("ACTIVITY_NOT_FOUND");
      if (customer.status === "ARCHIVED") {
        throw new ActivityDomainError("ACTIVITY_CUSTOMER_ARCHIVED");
      }
      if (access.role === "CSM" && customer.ownerId !== access.memberId) {
        throw new ActivityDomainError("ACTIVITY_NOT_FOUND");
      }
      if (input.contactId) {
        const contact = await transaction.contact.findFirst({
          where: {
            id: input.contactId,
            customerId: input.customerId,
            workspaceId: access.workspaceId,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        if (!contact) {
          throw new ActivityDomainError("ACTIVITY_CONTACT_INVALID");
        }
      }
      const isMeaningful = input.type === "NOTE" ? false : input.isMeaningful;
      const activity = await transaction.activity.create({
        data: {
          workspaceId: access.workspaceId,
          customerId: input.customerId,
          type: input.type,
          title: input.title,
          description: input.description,
          contactId: input.contactId,
          createdById: access.memberId,
          occurredAt: input.occurredAt,
          isMeaningful,
        },
        select: { id: true },
      });
      if (input.contactId && isMeaningful) {
        const latest = await transaction.activity.findFirst({
          where: {
            workspaceId: access.workspaceId,
            customerId: input.customerId,
            contactId: input.contactId,
            isMeaningful: true,
          },
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          select: { occurredAt: true },
        });
        await transaction.contact.updateMany({
          where: {
            id: input.contactId,
            customerId: input.customerId,
            workspaceId: access.workspaceId,
          },
          data: { lastInteractionAt: latest?.occurredAt ?? null },
        });
      }
      await transaction.jobOutbox.create({
        data: {
          workspaceId: access.workspaceId,
          customerId: input.customerId,
          eventKey: input.operationKey,
          jobType: "ACTIVITY_CHANGED",
          payload: {
            workspaceId: access.workspaceId,
            customerId: input.customerId,
            entityId: activity.id,
            eventKey: input.operationKey,
          },
        },
      });
      return activity;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const replay = await prisma.jobOutbox.findUnique({
        where: {
          workspaceId_eventKey: {
            workspaceId: access.workspaceId,
            eventKey: input.operationKey,
          },
        },
        select: { payload: true },
      });
      const id = replay && replayEntityId(replay.payload);
      if (id) return { id };
    }
    throw error;
  }
}
