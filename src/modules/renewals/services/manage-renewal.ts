import "server-only";

import { Prisma, type RenewalReadinessStatus } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";
import { calculateOnboardingProgress } from "@/modules/onboarding/engine/calculate-onboarding";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import { calculateRenewalReadiness } from "../engine/calculate-renewal-readiness";
import type {
  ChurnedInput,
  RenewalInput,
  RenewalStageInput,
  RenewedInput,
} from "../validation/renewal-input";
import { RenewalDomainError } from "./renewal-errors";

const nonterminalStages = [
  "UPCOMING",
  "PREPARING",
  "DISCUSSION",
  "NEGOTIATION",
  "COMMITTED",
] as const;
const stageRank = new Map(
  nonterminalStages.map((stage, index) => [stage, index]),
);

function calendarDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
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
  if (!owner) throw new RenewalDomainError("RENEWAL_OWNER_INVALID");
}

async function requireEditableCustomer(
  transaction: Prisma.TransactionClient,
  access: WorkspaceAccessContext,
  customerId: string,
) {
  const customer = await transaction.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      workspace: { select: { timezone: true } },
    },
  });
  if (!customer || !canEditCustomer(access, customer.ownerId)) {
    throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  }
  if (customer.status === "ARCHIVED") {
    throw new RenewalDomainError("RENEWAL_CUSTOMER_ARCHIVED");
  }
  return customer;
}

async function readinessFacts(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  customerId: string,
  localToday: string,
) {
  const customer = await transaction.customer.findFirst({
    where: { id: customerId, workspaceId },
    select: {
      currentHealth: { select: { overallScore: true, supportScore: true } },
      activities: {
        where: { isMeaningful: true },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { occurredAt: true },
      },
      risks: {
        where: { status: { in: ["OPEN", "MONITORING"] } },
        select: { severity: true },
      },
      successGoals: {
        where: { status: { not: "CANCELLED" } },
        select: { progress: true, status: true },
      },
      onboarding: {
        select: {
          targetCompletionDate: true,
          milestones: {
            select: { id: true, status: true, isCritical: true, dueDate: true },
          },
        },
      },
    },
  });
  if (!customer) throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  const onboardingDelayed = customer.onboarding
    ? calculateOnboardingProgress({
        localToday,
        targetCompletionDate: dateOnly(
          customer.onboarding.targetCompletionDate,
        ),
        milestones: customer.onboarding.milestones.map((milestone) => ({
          ...milestone,
          dueDate: dateOnly(milestone.dueDate),
        })),
      }).isDelayed
    : false;
  return {
    healthScore: customer.currentHealth?.overallScore ?? null,
    supportScore: customer.currentHealth?.supportScore ?? null,
    lastMeaningfulInteractionAt: dateOnly(
      customer.activities[0]?.occurredAt ?? null,
    ),
    unresolvedRisks: customer.risks,
    goals: customer.successGoals,
    onboardingDelayed,
  };
}

async function updateRenewalReadiness(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  customerId: string,
  renewalId: string,
  localToday: string,
  now: Date,
) {
  const renewal = await transaction.renewal.findFirst({
    where: { id: renewalId, customerId, workspaceId },
    select: { renewalAt: true, stage: true },
  });
  if (!renewal) throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  const facts = await readinessFacts(
    transaction,
    workspaceId,
    customerId,
    localToday,
  );
  const readiness = calculateRenewalReadiness({
    localToday,
    renewalAt: dateOnly(renewal.renewalAt)!,
    ...facts,
  });
  await transaction.renewal.update({
    where: { id: renewalId },
    data: {
      readinessStatus: readiness.status as RenewalReadinessStatus | null,
      readinessPending: readiness.pending,
      readinessReasons: readiness.reasons,
      readinessCalculatedAt: readiness.status ? now : null,
    },
  });
  return readiness;
}

export async function saveRenewal(
  access: WorkspaceAccessContext,
  input: RenewalInput,
  now = new Date(),
) {
  if (access.role === "VIEWER")
    throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const customer = await requireEditableCustomer(
      transaction,
      access,
      input.customerId,
    );
    await requireEligibleOwner(transaction, access.workspaceId, input.ownerId);
    const localToday = localDate(now, customer.workspace.timezone);
    const data = {
      ownerId: input.ownerId,
      contractValue: new Prisma.Decimal(input.contractValue),
      currency: input.currency,
      startAt: calendarDate(input.startAt),
      renewalAt: calendarDate(input.renewalAt)!,
      expectedOutcome: input.expectedOutcome ?? "UNKNOWN",
    };
    const renewal = input.renewalId
      ? await transaction.renewal.update({
          where: { id: input.renewalId },
          data,
          select: { id: true },
        })
      : await transaction.renewal.create({
          data: {
            workspaceId: access.workspaceId,
            customerId: input.customerId,
            ...data,
          },
          select: { id: true },
        });
    await transaction.customer.update({
      where: { id: input.customerId },
      data: { renewalDate: calendarDate(input.renewalAt) },
    });
    await updateRenewalReadiness(
      transaction,
      access.workspaceId,
      input.customerId,
      renewal.id,
      localToday,
      now,
    );
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "RENEWAL_STAGE_CHANGED",
      entityType: "RENEWAL",
      entityId: renewal.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, stage: "UPCOMING" },
      jobType: "RENEWAL_CHANGED",
    });
    return renewal;
  });
}

export async function changeRenewalStage(
  access: WorkspaceAccessContext,
  input: RenewalStageInput,
) {
  if (access.role === "VIEWER")
    throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const renewal = await transaction.renewal.findFirst({
      where: {
        id: input.renewalId,
        customerId: input.customerId,
        workspaceId: access.workspaceId,
      },
      select: {
        id: true,
        stage: true,
        ownerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (!renewal || renewal.customer.status === "ARCHIVED")
      throw new RenewalDomainError("RENEWAL_NOT_FOUND");
    if (
      renewal.ownerId !== access.memberId &&
      !canEditCustomer(access, renewal.customer.ownerId)
    ) {
      throw new RenewalDomainError("RENEWAL_NOT_FOUND");
    }
    if (
      stageRank.get(input.stage)! <
        (stageRank.get(renewal.stage as never) ?? 99) &&
      !input.note
    ) {
      throw new RenewalDomainError("RENEWAL_BACKWARD_NOTE_REQUIRED");
    }
    await transaction.renewal.update({
      where: { id: renewal.id },
      data: { stage: input.stage, notes: input.note || undefined },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "RENEWAL_STAGE_CHANGED",
      entityType: "RENEWAL",
      entityId: renewal.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: {
        version: 1,
        before: renewal.stage,
        after: input.stage,
        note: input.note || null,
      },
      jobType: "RENEWAL_CHANGED",
    });
    return { id: renewal.id };
  });
}

export async function recordRenewedOutcome(
  access: WorkspaceAccessContext,
  input: RenewedInput,
  now = new Date(),
) {
  if (access.role === "VIEWER")
    throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const renewal = await transaction.renewal.findFirst({
      where: {
        id: input.renewalId,
        customerId: input.customerId,
        workspaceId: access.workspaceId,
      },
      select: {
        id: true,
        stage: true,
        ownerId: true,
        customer: {
          select: {
            ownerId: true,
            status: true,
            workspace: { select: { timezone: true } },
          },
        },
      },
    });
    if (
      !renewal ||
      renewal.customer.status === "ARCHIVED" ||
      renewal.stage === "RENEWED" ||
      renewal.stage === "CHURNED"
    ) {
      throw new RenewalDomainError("RENEWAL_NOT_FOUND");
    }
    if (
      renewal.ownerId !== access.memberId &&
      !canEditCustomer(access, renewal.customer.ownerId)
    ) {
      throw new RenewalDomainError("RENEWAL_NOT_FOUND");
    }
    await transaction.renewal.update({
      where: { id: renewal.id },
      data: { stage: "RENEWED", outcome: input.outcome, completedAt: now },
    });
    const next = await transaction.renewal.create({
      data: {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        ownerId: renewal.ownerId,
        contractValue: new Prisma.Decimal(input.nextContractValue),
        currency: input.nextCurrency,
        renewalAt: calendarDate(input.nextRenewalAt)!,
      },
      select: { id: true },
    });
    await transaction.customer.update({
      where: { id: input.customerId },
      data: { renewalDate: calendarDate(input.nextRenewalAt) },
    });
    await updateRenewalReadiness(
      transaction,
      access.workspaceId,
      input.customerId,
      next.id,
      localDate(now, renewal.customer.workspace.timezone),
      now,
    );
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "RENEWAL_COMPLETED",
      entityType: "RENEWAL",
      entityId: renewal.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, outcome: input.outcome, nextRenewalId: next.id },
      jobType: "RENEWAL_CHANGED",
    });
    return { id: renewal.id, nextRenewalId: next.id };
  });
}

export async function recordChurnedOutcome(
  access: WorkspaceAccessContext,
  input: ChurnedInput,
  now = new Date(),
) {
  if (access.role === "VIEWER")
    throw new RenewalDomainError("RENEWAL_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const renewal = await transaction.renewal.findFirst({
      where: {
        id: input.renewalId,
        customerId: input.customerId,
        workspaceId: access.workspaceId,
      },
      select: {
        id: true,
        stage: true,
        ownerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (
      !renewal ||
      renewal.customer.status === "ARCHIVED" ||
      renewal.stage === "RENEWED" ||
      renewal.stage === "CHURNED"
    ) {
      throw new RenewalDomainError("RENEWAL_NOT_FOUND");
    }
    if (
      renewal.ownerId !== access.memberId &&
      !canEditCustomer(access, renewal.customer.ownerId)
    ) {
      throw new RenewalDomainError("RENEWAL_NOT_FOUND");
    }
    const churnedStage = await transaction.lifecycleStage.findFirst({
      where: {
        workspaceId: access.workspaceId,
        key: "churned",
        isActive: true,
      },
      select: { id: true },
    });
    if (!churnedStage) throw new RenewalDomainError("RENEWAL_STAGE_INVALID");
    await transaction.renewal.update({
      where: { id: renewal.id },
      data: {
        stage: "CHURNED",
        outcome: "CHURNED",
        churnReason: input.churnReason,
        completedAt: now,
      },
    });
    await transaction.customer.update({
      where: { id: input.customerId },
      data: { lifecycleStageId: churnedStage.id, renewalDate: null },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "RENEWAL_COMPLETED",
      entityType: "RENEWAL",
      entityId: renewal.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, outcome: "CHURNED", reason: input.churnReason },
      jobType: "RENEWAL_CHANGED",
    });
    return { id: renewal.id };
  });
}
