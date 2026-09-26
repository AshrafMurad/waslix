import "server-only";

import { Prisma, type TaskStatus } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import {
  builtInPlaybooks,
  type BuiltInPlaybookKey,
} from "./built-in-playbooks";

export class PlaybookDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "PlaybookDomainError";
  }
}

function calendarDateFromOffset(now: Date, offsetDays: number) {
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + offsetDays);
  return new Date(`${next.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export async function ensureBuiltInPlaybookTemplates(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
) {
  for (const [key, template] of Object.entries(builtInPlaybooks)) {
    const current = await transaction.playbookTemplate.upsert({
      where: { workspaceId_key_version: { workspaceId, key, version: 1 } },
      update: { isActive: true },
      create: {
        workspaceId,
        key,
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        version: 1,
        isActive: true,
      },
      select: { id: true },
    });
    for (const [index, step] of template.steps.entries()) {
      await transaction.playbookTemplateStep.upsert({
        where: {
          workspaceId_templateId_position: {
            workspaceId,
            templateId: current.id,
            position: index + 1,
          },
        },
        update: {},
        create: {
          workspaceId,
          templateId: current.id,
          position: index + 1,
          title: step.title,
          description: step.description,
          dueOffsetDays: step.dueOffsetDays,
        },
      });
    }
  }
}

export async function startPlaybookRun(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    customerId: string;
    ownerId: string;
    templateKey: BuiltInPlaybookKey;
    riskId?: string | null;
    actorId: string;
    operationKey: string;
    now: Date;
  },
) {
  await ensureBuiltInPlaybookTemplates(transaction, input.workspaceId);
  const template = await transaction.playbookTemplate.findFirst({
    where: {
      workspaceId: input.workspaceId,
      key: input.templateKey,
      isActive: true,
    },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      steps: {
        orderBy: { position: "asc" },
        select: {
          title: true,
          description: true,
          position: true,
          dueOffsetDays: true,
        },
      },
    },
  });
  if (!template) throw new PlaybookDomainError("PLAYBOOK_TEMPLATE_NOT_FOUND");
  const activeRun = await transaction.playbookRun.findFirst({
    where: {
      workspaceId: input.workspaceId,
      customerId: input.customerId,
      templateId: template.id,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (activeRun) return activeRun;

  const run = await transaction.playbookRun.create({
    data: {
      workspaceId: input.workspaceId,
      customerId: input.customerId,
      templateId: template.id,
      templateVersion: template.version,
      ownerId: input.ownerId,
      riskId: input.riskId ?? null,
      status: "ACTIVE",
      startedAt: input.now,
    },
    select: { id: true },
  });
  for (const step of template.steps) {
    const task = await transaction.task.create({
      data: {
        workspaceId: input.workspaceId,
        customerId: input.customerId,
        playbookRunId: run.id,
        title: step.title,
        description: step.description,
        ownerId: input.ownerId,
        createdById: input.actorId,
        priority: "MEDIUM",
        dueDate: calendarDateFromOffset(input.now, step.dueOffsetDays),
      },
      select: { id: true },
    });
    await transaction.playbookStep.create({
      data: {
        workspaceId: input.workspaceId,
        customerId: input.customerId,
        playbookRunId: run.id,
        title: step.title,
        description: step.description,
        position: step.position,
        status: "OPEN",
        taskId: task.id,
      },
    });
  }
  await writeWorkEvent(transaction, {
    workspaceId: input.workspaceId,
    customerId: input.customerId,
    type: "PLAYBOOK_STARTED",
    entityType: "PLAYBOOK_RUN",
    entityId: run.id,
    actorId: input.actorId,
    idempotencyKey: `${input.operationKey}:playbook`,
    metadata: { version: 1, templateKey: input.templateKey },
    jobType: "PLAYBOOK_CHANGED",
  });
  return run;
}

export async function syncPlaybookForTaskStatus(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    taskId: string;
    taskStatus: TaskStatus;
    actorId: string;
    operationKey: string;
    now: Date;
  },
) {
  const step = await transaction.playbookStep.findUnique({
    where: {
      workspaceId_taskId: {
        workspaceId: input.workspaceId,
        taskId: input.taskId,
      },
    },
    select: {
      id: true,
      customerId: true,
      playbookRunId: true,
      status: true,
      playbookRun: { select: { status: true } },
    },
  });
  if (!step) return;

  const nextStepStatus =
    input.taskStatus === "COMPLETED"
      ? "COMPLETED"
      : input.taskStatus === "CANCELLED"
        ? "CANCELLED"
        : input.taskStatus === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : "OPEN";

  await transaction.playbookStep.update({
    where: { id: step.id },
    data: {
      status: nextStepStatus,
      completedAt: nextStepStatus === "COMPLETED" ? input.now : null,
    },
  });

  const steps = await transaction.playbookStep.findMany({
    where: {
      workspaceId: input.workspaceId,
      playbookRunId: step.playbookRunId,
    },
    select: { status: true },
  });
  const allCompleted = steps.every((item) => item.status === "COMPLETED");
  if (allCompleted) {
    await transaction.playbookRun.update({
      where: { id: step.playbookRunId },
      data: { status: "COMPLETED", completedAt: input.now },
    });
    await transaction.recommendation.updateMany({
      where: {
        workspaceId: input.workspaceId,
        playbookRunId: step.playbookRunId,
        status: "ACCEPTED",
      },
      data: { status: "COMPLETED", completedAt: input.now },
    });
    await writeWorkEvent(transaction, {
      workspaceId: input.workspaceId,
      customerId: step.customerId,
      type: "PLAYBOOK_COMPLETED",
      entityType: "PLAYBOOK_RUN",
      entityId: step.playbookRunId,
      actorId: input.actorId,
      idempotencyKey: `${input.operationKey}:playbook-completed`,
      metadata: { version: 1 },
      jobType: "PLAYBOOK_CHANGED",
    });
  } else if (
    step.playbookRun.status === "COMPLETED" &&
    nextStepStatus !== "COMPLETED"
  ) {
    await transaction.playbookRun.update({
      where: { id: step.playbookRunId },
      data: { status: "ACTIVE", completedAt: null },
    });
    await transaction.recommendation.updateMany({
      where: {
        workspaceId: input.workspaceId,
        playbookRunId: step.playbookRunId,
        status: "COMPLETED",
      },
      data: { status: "ACCEPTED", completedAt: null },
    });
  }
}

export async function dismissPlaybookRun(
  access: WorkspaceAccessContext,
  input: { playbookRunId: string; reason: string; operationKey: string },
) {
  if (access.role === "VIEWER")
    throw new PlaybookDomainError("PLAYBOOK_NOT_FOUND");
  if (!input.reason.trim()) {
    throw new PlaybookDomainError("PLAYBOOK_DISMISS_REASON_REQUIRED");
  }
  return prisma.$transaction(async (transaction) => {
    const run = await transaction.playbookRun.findFirst({
      where: {
        id: input.playbookRunId,
        workspaceId: access.workspaceId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        customerId: true,
        ownerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    const canAct =
      run &&
      run.customer.status === "ACTIVE" &&
      (access.role === "ADMIN" ||
        access.role === "CS_MANAGER" ||
        run.ownerId === access.memberId ||
        run.customer.ownerId === access.memberId);
    if (!canAct || !run) throw new PlaybookDomainError("PLAYBOOK_NOT_FOUND");
    await transaction.playbookRun.update({
      where: { id: run.id },
      data: { status: "DISMISSED", dismissedReason: input.reason.trim() },
    });
    await transaction.task.updateMany({
      where: {
        workspaceId: access.workspaceId,
        customerId: run.customerId,
        playbookRunId: run.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      data: { status: "CANCELLED" },
    });
    await transaction.playbookStep.updateMany({
      where: {
        workspaceId: access.workspaceId,
        playbookRunId: run.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      data: { status: "CANCELLED" },
    });
    await transaction.recommendation.updateMany({
      where: {
        workspaceId: access.workspaceId,
        playbookRunId: run.id,
        status: "ACCEPTED",
      },
      data: { status: "DISMISSED", dismissedReason: "PLAYBOOK_DISMISSED" },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: run.customerId,
      type: "PLAYBOOK_DISMISSED",
      entityType: "PLAYBOOK_RUN",
      entityId: run.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, reason: input.reason.trim() },
      jobType: "PLAYBOOK_CHANGED",
    });
    return { id: run.id };
  });
}
