import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import { calculateOnboardingProgress } from "../engine/calculate-onboarding";
import type {
  AdoptionInput,
  MilestoneInput,
  MilestoneStatusInput,
  StartOnboardingInput,
} from "../validation/onboarding-input";
import { OnboardingDomainError } from "./onboarding-errors";

const defaultMilestones = [
  ["Kickoff", true],
  ["Configuration", true],
  ["Data setup", true],
  ["Training", false],
  ["First value", true],
  ["Complete", false],
] as const;

function calendarDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

async function requireEligibleOwner(
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
  if (!owner) throw new OnboardingDomainError("ONBOARDING_OWNER_INVALID");
}

async function requireEditableCustomer(
  transaction: Prisma.TransactionClient,
  access: WorkspaceAccessContext,
  customerId: string,
) {
  const customer = await transaction.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!customer || !canEditCustomer(access, customer.ownerId)) {
    throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
  }
  if (customer.status === "ARCHIVED") {
    throw new OnboardingDomainError("ONBOARDING_CUSTOMER_ARCHIVED");
  }
  return customer;
}

async function syncOnboardingStatus(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  onboardingId: string,
  localToday: string,
  now: Date,
) {
  const onboarding = await transaction.onboarding.findFirst({
    where: { id: onboardingId, workspaceId },
    select: {
      id: true,
      targetCompletionDate: true,
      completedAt: true,
      milestones: {
        orderBy: { position: "asc" },
        select: { id: true, status: true, isCritical: true, dueDate: true },
      },
    },
  });
  if (!onboarding) throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
  const progress = calculateOnboardingProgress({
    localToday,
    targetCompletionDate: dateOnly(onboarding.targetCompletionDate),
    milestones: onboarding.milestones.map((milestone) => ({
      ...milestone,
      dueDate: dateOnly(milestone.dueDate),
    })),
  });
  await transaction.onboarding.update({
    where: { id: onboarding.id },
    data: {
      status: progress.status,
      completedAt:
        progress.status === "COMPLETED"
          ? (onboarding.completedAt ?? now)
          : null,
      adoptionDismissedForCompletedAt:
        progress.status === "COMPLETED"
          ? onboarding.completedAt
            ? undefined
            : null
          : null,
    },
  });
  return progress;
}

export async function startOnboarding(
  access: WorkspaceAccessContext,
  input: StartOnboardingInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") {
    throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
  }
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
    if (replay?.type === "ONBOARDING_STARTED") return { id: replay.entityId };
    await requireEditableCustomer(transaction, access, input.customerId);
    await requireEligibleOwner(transaction, access.workspaceId, input.ownerId);
    const onboarding = await transaction.onboarding.upsert({
      where: {
        workspaceId_customerId: {
          workspaceId: access.workspaceId,
          customerId: input.customerId,
        },
      },
      update: {
        ownerId: input.ownerId,
        startDate: calendarDate(input.startDate),
        targetCompletionDate: calendarDate(input.targetCompletionDate),
      },
      create: {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        ownerId: input.ownerId,
        startDate: calendarDate(input.startDate),
        targetCompletionDate: calendarDate(input.targetCompletionDate),
      },
      select: { id: true },
    });
    const count = await transaction.onboardingMilestone.count({
      where: { workspaceId: access.workspaceId, onboardingId: onboarding.id },
    });
    if (count === 0) {
      await transaction.onboardingMilestone.createMany({
        data: defaultMilestones.map(([title, isCritical], index) => ({
          workspaceId: access.workspaceId,
          customerId: input.customerId,
          onboardingId: onboarding.id,
          title,
          ownerId: input.ownerId,
          position: index + 1,
          isCritical,
        })),
      });
    }
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "ONBOARDING_STARTED",
      entityType: "ONBOARDING",
      entityId: onboarding.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1 },
      jobType: "ONBOARDING_CHANGED",
    });
    await syncOnboardingStatus(
      transaction,
      access.workspaceId,
      onboarding.id,
      now.toISOString().slice(0, 10),
      now,
    );
    return onboarding;
  });
}

export async function updateMilestone(
  access: WorkspaceAccessContext,
  input: MilestoneInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") {
    throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
  }
  return prisma.$transaction(async (transaction) => {
    const milestone = await transaction.onboardingMilestone.findFirst({
      where: {
        id: input.milestoneId,
        customerId: input.customerId,
        workspaceId: access.workspaceId,
      },
      select: { id: true, onboardingId: true, ownerId: true, customerId: true },
    });
    if (!milestone) throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
    const customer = await requireEditableCustomer(
      transaction,
      access,
      input.customerId,
    );
    if (
      input.ownerId !== milestone.ownerId &&
      !canEditCustomer(access, customer.ownerId)
    ) {
      throw new OnboardingDomainError("ONBOARDING_FORBIDDEN");
    }
    await requireEligibleOwner(transaction, access.workspaceId, input.ownerId);
    await transaction.onboardingMilestone.update({
      where: { id: milestone.id },
      data: {
        title: input.title,
        description: input.description,
        ownerId: input.ownerId,
        dueDate: calendarDate(input.dueDate),
        isCritical: input.isCritical,
      },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "ONBOARDING_STARTED",
      entityType: "MILESTONE",
      entityId: milestone.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, changed: ["milestone"] },
      jobType: "ONBOARDING_CHANGED",
    });
    await syncOnboardingStatus(
      transaction,
      access.workspaceId,
      milestone.onboardingId,
      now.toISOString().slice(0, 10),
      now,
    );
    return { id: milestone.id };
  });
}

export async function changeMilestoneStatus(
  access: WorkspaceAccessContext,
  input: MilestoneStatusInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") {
    throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
  }
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
    if (replay?.entityId === input.milestoneId)
      return { id: input.milestoneId };
    const milestone = await transaction.onboardingMilestone.findFirst({
      where: {
        id: input.milestoneId,
        customerId: input.customerId,
        workspaceId: access.workspaceId,
      },
      select: {
        id: true,
        onboardingId: true,
        status: true,
        ownerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (!milestone || milestone.customer.status === "ARCHIVED") {
      throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
    }
    if (
      milestone.ownerId !== access.memberId &&
      !canEditCustomer(access, milestone.customer.ownerId)
    ) {
      throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
    }
    await transaction.onboardingMilestone.update({
      where: { id: milestone.id },
      data: {
        status: input.status,
        completedAt: input.status === "COMPLETED" ? now : null,
      },
    });
    const progress = await syncOnboardingStatus(
      transaction,
      access.workspaceId,
      milestone.onboardingId,
      now.toISOString().slice(0, 10),
      now,
    );
    const eventType =
      input.status === "COMPLETED"
        ? "MILESTONE_COMPLETED"
        : milestone.status === "COMPLETED"
          ? "MILESTONE_REOPENED"
          : "ONBOARDING_STARTED";
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: eventType,
      entityType: "MILESTONE",
      entityId: milestone.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, before: milestone.status, after: input.status },
      jobType: "ONBOARDING_CHANGED",
    });
    if (progress.status === "COMPLETED") {
      await writeWorkEvent(transaction, {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        type: "ONBOARDING_COMPLETED",
        entityType: "ONBOARDING",
        entityId: milestone.onboardingId,
        actorId: access.memberId,
        idempotencyKey: `${input.operationKey}:completed`,
        metadata: { version: 1 },
        jobType: "ONBOARDING_CHANGED",
      });
    }
    return { id: milestone.id };
  });
}

export async function moveCompletedOnboardingToAdoption(
  access: WorkspaceAccessContext,
  input: AdoptionInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") {
    throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
  }
  return prisma.$transaction(async (transaction) => {
    const onboarding = await transaction.onboarding.findFirst({
      where: {
        id: input.onboardingId,
        customerId: input.customerId,
        workspaceId: access.workspaceId,
      },
      select: {
        id: true,
        status: true,
        completedAt: true,
        customer: {
          select: { ownerId: true, lifecycleStage: { select: { key: true } } },
        },
      },
    });
    if (
      !onboarding ||
      onboarding.status !== "COMPLETED" ||
      !onboarding.completedAt ||
      !canEditCustomer(access, onboarding.customer.ownerId)
    ) {
      throw new OnboardingDomainError("ONBOARDING_NOT_FOUND");
    }
    if (onboarding.customer.lifecycleStage.key === "adoption")
      return { id: input.customerId };
    const adoption = await transaction.lifecycleStage.findFirst({
      where: {
        workspaceId: access.workspaceId,
        key: "adoption",
        isActive: true,
      },
      select: { id: true },
    });
    if (!adoption) throw new OnboardingDomainError("ONBOARDING_STAGE_INVALID");
    await transaction.customer.update({
      where: { id: input.customerId },
      data: { lifecycleStageId: adoption.id },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "LIFECYCLE_CHANGED",
      entityType: "CUSTOMER",
      entityId: input.customerId,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, afterKey: "adoption" },
      jobType: "CUSTOMER_CHANGED",
    });
    return { id: input.customerId, movedAt: now };
  });
}
