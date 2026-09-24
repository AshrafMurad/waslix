import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import type { GoalInput } from "../validation/goal-input";
import { GoalDomainError } from "./goal-errors";

function calendarDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function requireGoalOwner(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  ownerId: string,
) {
  const owner = await transaction.workspaceMember.findFirst({
    where: {
      id: ownerId,
      workspaceId,
      status: "ACTIVE",
      role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
    },
    select: { id: true },
  });
  if (!owner) throw new GoalDomainError("GOAL_OWNER_INVALID");
}

function normalizedProgress(input: GoalInput) {
  if (input.status === "ACHIEVED") return 100;
  if (input.progress === 100)
    throw new GoalDomainError("GOAL_PROGRESS_INVALID");
  return input.progress;
}

export async function saveGoal(
  access: WorkspaceAccessContext,
  input: GoalInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") throw new GoalDomainError("GOAL_NOT_FOUND");
  try {
    return await prisma.$transaction(async (transaction) => {
      const replay = await transaction.systemEvent.findUnique({
        where: {
          workspaceId_idempotencyKey: {
            workspaceId: access.workspaceId,
            idempotencyKey: input.operationKey,
          },
        },
        select: { entityId: true, type: true },
      });
      if (replay?.type === "GOAL_CHANGED") return { id: replay.entityId };

      const customer = await transaction.customer.findFirst({
        where: { id: input.customerId, workspaceId: access.workspaceId },
        select: { ownerId: true, status: true },
      });
      if (
        !customer ||
        customer.status === "ARCHIVED" ||
        !canEditCustomer(access, customer.ownerId)
      ) {
        throw new GoalDomainError("GOAL_NOT_FOUND");
      }
      await requireGoalOwner(transaction, access.workspaceId, input.ownerId);
      const progress = normalizedProgress(input);
      const existing = input.goalId
        ? await transaction.successGoal.findFirst({
            where: {
              id: input.goalId,
              customerId: input.customerId,
              workspaceId: access.workspaceId,
            },
            select: {
              id: true,
              progress: true,
              status: true,
              progressObservedAt: true,
            },
          })
        : null;
      if (input.goalId && !existing)
        throw new GoalDomainError("GOAL_NOT_FOUND");
      const progressChanged =
        !existing ||
        existing.progress !== progress ||
        existing.status !== input.status;
      const completedAt =
        input.status === "ACHIEVED"
          ? existing?.status === "ACHIEVED"
            ? undefined
            : now
          : null;
      const data = {
        title: input.title,
        description: input.description,
        ownerId: input.ownerId,
        progress,
        status: input.status,
        targetDate: calendarDate(input.targetDate),
        ...(progressChanged ? { progressObservedAt: now } : {}),
        ...(completedAt !== undefined ? { completedAt } : {}),
      };
      const goal = existing
        ? await transaction.successGoal.update({
            where: { id: existing.id },
            data,
            select: { id: true },
          })
        : await transaction.successGoal.create({
            data: {
              workspaceId: access.workspaceId,
              customerId: input.customerId,
              ...data,
            },
            select: { id: true },
          });
      await transaction.customerHealth.updateMany({
        where: {
          workspaceId: access.workspaceId,
          customerId: input.customerId,
        },
        data: { pendingSince: now },
      });
      await writeWorkEvent(transaction, {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        type: "GOAL_CHANGED",
        entityType: "GOAL",
        entityId: goal.id,
        actorId: access.memberId,
        idempotencyKey: input.operationKey,
        metadata: {
          version: 1,
          changed: existing
            ? [
                "title",
                "description",
                "ownerId",
                "progress",
                "status",
                "targetDate",
              ]
            : ["created"],
          beforeStatus: existing?.status ?? null,
          afterStatus: input.status,
        },
        jobType: "HEALTH_RECALCULATE",
      });
      return goal;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const replay = await prisma.systemEvent.findUnique({
        where: {
          workspaceId_idempotencyKey: {
            workspaceId: access.workspaceId,
            idempotencyKey: input.operationKey,
          },
        },
        select: { entityId: true, type: true },
      });
      if (replay?.type === "GOAL_CHANGED") return { id: replay.entityId };
    }
    throw error;
  }
}
