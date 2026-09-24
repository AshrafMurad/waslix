import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import type { TaskInput, TaskStatusInput } from "../validation/task-input";
import { TaskDomainError } from "./task-errors";

function calendarDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function requireTaskOwner(
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
  if (!owner) throw new TaskDomainError("TASK_OWNER_INVALID");
}

async function getCustomerForTask(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  customerId: string | null,
) {
  if (!customerId) return null;
  const customer = await transaction.customer.findFirst({
    where: { id: customerId, workspaceId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!customer) throw new TaskDomainError("TASK_NOT_FOUND");
  if (customer.status === "ARCHIVED") {
    throw new TaskDomainError("TASK_CUSTOMER_ARCHIVED");
  }
  return customer;
}

function canAssignOwner(
  access: WorkspaceAccessContext,
  customerOwnerId: string | undefined,
) {
  return (
    access.role === "ADMIN" ||
    access.role === "CS_MANAGER" ||
    customerOwnerId === access.memberId
  );
}

function eventTypeForStatus(previous: string, next: string) {
  if (next === "COMPLETED") return "TASK_COMPLETED";
  if (next === "CANCELLED") return "TASK_CANCELLED";
  if (previous === "COMPLETED") return "TASK_REOPENED";
  return null;
}

export async function createTask(
  access: WorkspaceAccessContext,
  input: TaskInput,
) {
  if (access.role === "VIEWER") throw new TaskDomainError("TASK_FORBIDDEN");

  return prisma.$transaction(async (transaction) => {
    const replay = await transaction.systemEvent.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: access.workspaceId,
          idempotencyKey: input.operationKey,
        },
      },
      select: { entityId: true, type: true },
    });
    if (replay?.type === "TASK_CREATED") return { id: replay.entityId };

    const customer = await getCustomerForTask(
      transaction,
      access.workspaceId,
      input.customerId,
    );
    if (
      input.ownerId !== access.memberId &&
      !canAssignOwner(access, customer?.ownerId)
    ) {
      throw new TaskDomainError("TASK_FORBIDDEN");
    }
    await requireTaskOwner(transaction, access.workspaceId, input.ownerId);
    const task = await transaction.task.create({
      data: {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        title: input.title,
        description: input.description,
        ownerId: input.ownerId,
        createdById: access.memberId,
        priority: input.priority,
        dueDate: calendarDate(input.dueDate),
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
      select: { id: true },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, priority: input.priority, ownerId: input.ownerId },
      jobType: "TASK_CHANGED",
    });
    return task;
  });
}

export async function updateTask(
  access: WorkspaceAccessContext,
  input: TaskInput & { taskId: string },
) {
  if (access.role === "VIEWER") throw new TaskDomainError("TASK_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: { id: input.taskId, workspaceId: access.workspaceId },
      select: { title: true, priority: true, ownerId: true, customerId: true, customer: { select: { ownerId: true, status: true } } },
    });
    if (!task) throw new TaskDomainError("TASK_NOT_FOUND");
    if (task.customer?.status === "ARCHIVED") {
      throw new TaskDomainError("TASK_CUSTOMER_ARCHIVED");
    }
    const managesAccount = canAssignOwner(access, task.customer?.ownerId);
    if (task.ownerId !== access.memberId && !managesAccount) {
      throw new TaskDomainError("TASK_NOT_FOUND");
    }
    if (
      (input.ownerId !== task.ownerId || input.customerId !== task.customerId) &&
      !managesAccount
    ) {
      throw new TaskDomainError("TASK_FORBIDDEN");
    }
    await getCustomerForTask(transaction, access.workspaceId, input.customerId);
    await requireTaskOwner(transaction, access.workspaceId, input.ownerId);
    await transaction.task.updateMany({
      where: { id: input.taskId, workspaceId: access.workspaceId },
      data: {
        customerId: input.customerId,
        title: managesAccount ? input.title : task.title,
        description: input.description,
        ownerId: input.ownerId,
        priority: managesAccount ? input.priority : task.priority,
        dueDate: calendarDate(input.dueDate),
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
    });
    return { id: input.taskId };
  });
}

export async function changeTaskStatus(
  access: WorkspaceAccessContext,
  input: TaskStatusInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") throw new TaskDomainError("TASK_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const replay = await transaction.systemEvent.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: access.workspaceId,
          idempotencyKey: input.operationKey,
        },
      },
      select: { entityId: true },
    });
    if (replay?.entityId === input.taskId) return { id: input.taskId };

    const task = await transaction.task.findFirst({
      where: { id: input.taskId, workspaceId: access.workspaceId },
      select: {
        id: true,
        status: true,
        ownerId: true,
        customerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (!task) throw new TaskDomainError("TASK_NOT_FOUND");
    if (task.customer?.status === "ARCHIVED") {
      throw new TaskDomainError("TASK_CUSTOMER_ARCHIVED");
    }
    if (
      task.ownerId !== access.memberId &&
      !canAssignOwner(access, task.customer?.ownerId)
    ) {
      throw new TaskDomainError("TASK_NOT_FOUND");
    }
    if (task.status === input.status) return { id: task.id };
    if (task.status === "CANCELLED" || (task.status === "COMPLETED" && input.status === "IN_PROGRESS")) {
      throw new TaskDomainError("TASK_TRANSITION_INVALID");
    }
    const eventType = eventTypeForStatus(task.status, input.status);
    await transaction.task.updateMany({
      where: { id: task.id, workspaceId: access.workspaceId, status: task.status },
      data: {
        status: input.status,
        completedAt: input.status === "COMPLETED" ? now : null,
        completedById: input.status === "COMPLETED" ? access.memberId : null,
      },
    });
    if (eventType) {
      await writeWorkEvent(transaction, {
        workspaceId: access.workspaceId,
        customerId: task.customerId,
        type: eventType,
        entityType: "TASK",
        entityId: task.id,
        actorId: access.memberId,
        idempotencyKey: input.operationKey,
        metadata: { version: 1, before: task.status, after: input.status },
        jobType: "TASK_CHANGED",
      });
    }
    return { id: task.id };
  });
}
