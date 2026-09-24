import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import type { HealthInputCommand } from "../validation/health-input";
import { HealthDomainError } from "./health-errors";

async function requireEditableCustomer(
  transaction: Prisma.TransactionClient,
  access: WorkspaceAccessContext,
  customerId: string,
) {
  const customer = await transaction.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { ownerId: true, status: true },
  });
  if (
    !customer ||
    customer.status === "ARCHIVED" ||
    !canEditCustomer(access, customer.ownerId)
  ) {
    throw new HealthDomainError("HEALTH_NOT_FOUND");
  }
}

export async function updateHealthInput(
  access: WorkspaceAccessContext,
  input: HealthInputCommand,
  now = new Date(),
) {
  if (input.observedAt > now)
    throw new HealthDomainError("HEALTH_OBSERVED_FUTURE");
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${access.workspaceId}:${input.customerId}:${input.dimension}`}, 0))`;
    const replay = await transaction.systemEvent.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: access.workspaceId,
          idempotencyKey: input.operationKey,
        },
      },
      select: { entityId: true, type: true },
    });
    if (replay?.type === "HEALTH_INPUT_UPDATED") return { id: replay.entityId };
    await requireEditableCustomer(transaction, access, input.customerId);
    const healthInput = await transaction.healthInput.upsert({
      where: {
        workspaceId_customerId_dimension: {
          workspaceId: access.workspaceId,
          customerId: input.customerId,
          dimension: input.dimension,
        },
      },
      update: { isManualOverride: true },
      create: {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        dimension: input.dimension,
        isManualOverride: true,
      },
      select: { id: true },
    });
    const previous = await transaction.healthInputRevision.findFirst({
      where: { workspaceId: access.workspaceId, healthInputId: healthInput.id },
      orderBy: { version: "desc" },
      select: {
        version: true,
        value: true,
        sourceType: true,
        observedAt: true,
      },
    });
    const revision = await transaction.healthInputRevision.create({
      data: {
        workspaceId: access.workspaceId,
        customerId: input.customerId,
        healthInputId: healthInput.id,
        version: (previous?.version ?? 0) + 1,
        value: input.value,
        sourceType: "MANUAL",
        isSimulated: input.isSimulated,
        observedAt: input.observedAt,
        createdById: access.memberId,
      },
      select: { id: true },
    });
    await transaction.customerHealth.updateMany({
      where: { workspaceId: access.workspaceId, customerId: input.customerId },
      data: { pendingSince: now },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "HEALTH_INPUT_UPDATED",
      entityType: "HEALTH_INPUT",
      entityId: healthInput.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: {
        version: 1,
        dimension: input.dimension,
        previousValue: previous?.value ?? null,
        value: input.value,
        previousSource: previous?.sourceType ?? null,
        source: "MANUAL",
        revisionId: revision.id,
      },
      jobType: "HEALTH_RECALCULATE",
    });
    return { id: healthInput.id };
  });
}

export async function selectSystemHealthInput(
  access: WorkspaceAccessContext,
  input: {
    customerId: string;
    dimension: "ENGAGEMENT" | "GOALS";
    operationKey: string;
  },
  now = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    await requireEditableCustomer(transaction, access, input.customerId);
    const healthInput = await transaction.healthInput.findUnique({
      where: {
        workspaceId_customerId_dimension: {
          workspaceId: access.workspaceId,
          customerId: input.customerId,
          dimension: input.dimension,
        },
      },
      select: { id: true, isManualOverride: true },
    });
    if (!healthInput?.isManualOverride) return { id: healthInput?.id ?? null };
    await transaction.healthInput.update({
      where: { id: healthInput.id },
      data: { isManualOverride: false },
    });
    await transaction.customerHealth.updateMany({
      where: { workspaceId: access.workspaceId, customerId: input.customerId },
      data: { pendingSince: now },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: input.customerId,
      type: "HEALTH_INPUT_UPDATED",
      entityType: "HEALTH_INPUT",
      entityId: healthInput.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: { version: 1, dimension: input.dimension, source: "SYSTEM" },
      jobType: "HEALTH_RECALCULATE",
    });
    return { id: healthInput.id };
  });
}
