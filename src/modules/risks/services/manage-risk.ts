import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

import type { RiskInput, RiskStatusInput } from "../validation/risk-input";
import { RiskDomainError } from "./risk-errors";

function date(value: string | null) {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

function managesCustomer(access: WorkspaceAccessContext, ownerId: string) {
  return (
    access.role === "ADMIN" ||
    access.role === "CS_MANAGER" ||
    access.memberId === ownerId
  );
}

async function eligibleOwner(
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
  if (!owner) throw new RiskDomainError("RISK_OWNER_INVALID");
}

export async function saveRisk(
  access: WorkspaceAccessContext,
  input: RiskInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") throw new RiskDomainError("RISK_NOT_FOUND");
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
    if (replay) return { id: replay.entityId };
    const customer = await transaction.customer.findFirst({
      where: {
        id: input.customerId,
        workspaceId: access.workspaceId,
        status: "ACTIVE",
      },
      select: { id: true, ownerId: true },
    });
    if (!customer) throw new RiskDomainError("RISK_NOT_FOUND");
    await eligibleOwner(transaction, access.workspaceId, input.ownerId);
    let risk;
    if (input.riskId) {
      const current = await transaction.risk.findFirst({
        where: {
          id: input.riskId,
          customerId: customer.id,
          workspaceId: access.workspaceId,
        },
        select: {
          id: true,
          ownerId: true,
          status: true,
          title: true,
          type: true,
          severity: true,
        },
      });
      const managesAccount = managesCustomer(access, customer.ownerId);
      if (
        !current ||
        current.status === "RESOLVED" ||
        (!managesAccount && current.ownerId !== access.memberId)
      )
        throw new RiskDomainError("RISK_NOT_FOUND");
      risk = await transaction.risk.update({
        where: { id: current.id },
        data: {
          title: managesAccount ? input.title : current.title,
          description: input.description,
          type: managesAccount ? input.type : current.type,
          severity: managesAccount ? input.severity : current.severity,
          ownerId: managesAccount ? input.ownerId : current.ownerId,
          targetResolutionDate: date(input.targetResolutionDate),
          updatedAt: now,
        },
        select: { id: true, severity: true, ownerId: true },
      });
    } else {
      if (!managesCustomer(access, customer.ownerId))
        throw new RiskDomainError("RISK_NOT_FOUND");
      risk = await transaction.risk.create({
        data: {
          workspaceId: access.workspaceId,
          customerId: customer.id,
          title: input.title,
          description: input.description,
          type: input.type,
          severity: input.severity,
          ownerId: input.ownerId,
          targetResolutionDate: date(input.targetResolutionDate),
          createdAt: now,
          updatedAt: now,
        },
        select: { id: true, severity: true, ownerId: true },
      });
    }
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: customer.id,
      type: input.riskId ? "RISK_UPDATED" : "RISK_CREATED",
      entityType: "RISK",
      entityId: risk.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: {
        version: 1,
        severity: risk.severity,
        ownerId: risk.ownerId,
      },
      jobType: "INTELLIGENCE_REFRESH",
    });
    return risk;
  });
}

export async function changeRiskStatus(
  access: WorkspaceAccessContext,
  input: RiskStatusInput,
  now = new Date(),
) {
  if (access.role === "VIEWER") throw new RiskDomainError("RISK_NOT_FOUND");
  if (input.status === "RESOLVED" && !input.resolutionNote)
    throw new RiskDomainError("RISK_RESOLUTION_NOTE_REQUIRED");
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
    if (replay?.entityId === input.riskId) return { id: input.riskId };
    const risk = await transaction.risk.findFirst({
      where: { id: input.riskId, workspaceId: access.workspaceId },
      select: {
        id: true,
        status: true,
        ownerId: true,
        customerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (
      !risk ||
      risk.customer.status === "ARCHIVED" ||
      (risk.ownerId !== access.memberId &&
        !managesCustomer(access, risk.customer.ownerId))
    ) {
      throw new RiskDomainError("RISK_NOT_FOUND");
    }
    if (risk.status === input.status) return { id: risk.id };
    await transaction.risk.update({
      where: { id: risk.id },
      data: {
        status: input.status,
        resolvedAt: input.status === "RESOLVED" ? now : null,
        resolutionNote:
          input.status === "RESOLVED" ? input.resolutionNote : null,
      },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: risk.customerId,
      type:
        input.status === "RESOLVED"
          ? "RISK_RESOLVED"
          : input.status === "MONITORING"
            ? "RISK_MONITORING"
            : "RISK_REOPENED",
      entityType: "RISK",
      entityId: risk.id,
      actorId: access.memberId,
      idempotencyKey: input.operationKey,
      metadata: {
        version: 1,
        before: risk.status,
        after: input.status,
        resolutionNote: input.resolutionNote,
      },
      jobType: "INTELLIGENCE_REFRESH",
    });
    return { id: risk.id };
  });
}

export async function createRiskMitigation(
  access: WorkspaceAccessContext,
  riskId: string,
  operationKey: string,
  now = new Date(),
) {
  if (access.role === "VIEWER") throw new RiskDomainError("RISK_NOT_FOUND");
  return prisma.$transaction(async (transaction) => {
    const replay = await transaction.systemEvent.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: access.workspaceId,
          idempotencyKey: operationKey,
        },
      },
      select: { entityId: true },
    });
    if (replay) return { id: replay.entityId };
    const risk = await transaction.risk.findFirst({
      where: {
        id: riskId,
        workspaceId: access.workspaceId,
        status: { in: ["OPEN", "MONITORING"] },
      },
      select: {
        id: true,
        title: true,
        ownerId: true,
        customerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    if (
      !risk ||
      risk.customer.status === "ARCHIVED" ||
      (risk.ownerId !== access.memberId &&
        !managesCustomer(access, risk.customer.ownerId))
    )
      throw new RiskDomainError("RISK_NOT_FOUND");
    const existing = await transaction.task.findFirst({
      where: {
        workspaceId: access.workspaceId,
        riskId: risk.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      select: { id: true },
    });
    if (existing) return existing;
    const task = await transaction.task.create({
      data: {
        workspaceId: access.workspaceId,
        customerId: risk.customerId,
        riskId: risk.id,
        title: risk.title,
        ownerId: risk.ownerId,
        createdById: access.memberId,
        priority: "HIGH",
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    await writeWorkEvent(transaction, {
      workspaceId: access.workspaceId,
      customerId: risk.customerId,
      type: "RISK_MITIGATION_CREATED",
      entityType: "TASK",
      entityId: task.id,
      actorId: access.memberId,
      idempotencyKey: operationKey,
      metadata: { version: 1, riskId: risk.id },
      jobType: "INTELLIGENCE_REFRESH",
    });
    return task;
  });
}
