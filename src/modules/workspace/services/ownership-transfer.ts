import "server-only";

import type { Prisma } from "@prisma/client";

import {
  WorkspaceAccessDeniedError,
  type WorkspaceAccessContext,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { hasWorkspaceCapability } from "@/lib/permissions/roles";
import { writeWorkEvent } from "@/modules/work-events/services/write-work-event";

export type OwnershipTransferPreview = {
  customers: number;
  tasks: number;
  risks: number;
  onboardings: number;
  milestones: number;
  renewals: number;
  goals: number;
  playbookRuns: number;
};

const emptyPreview: OwnershipTransferPreview = {
  customers: 0,
  tasks: 0,
  risks: 0,
  onboardings: 0,
  milestones: 0,
  renewals: 0,
  goals: 0,
  playbookRuns: 0,
};

export function totalPreviewCount(preview: OwnershipTransferPreview) {
  return Object.values(preview).reduce((sum, count) => sum + count, 0);
}

function requireTransferCapability(access: WorkspaceAccessContext) {
  if (!hasWorkspaceCapability(access.role, "transferWorkspaceOwnership")) {
    throw new WorkspaceAccessDeniedError();
  }
}

async function requireEligibleAssignee(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  memberId: string,
) {
  const member = await transaction.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId,
      status: "ACTIVE",
      role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
    },
    select: { id: true },
  });
  if (!member) throw new WorkspaceAccessDeniedError();
}

export async function getOwnershipTransferPreview(
  access: WorkspaceAccessContext,
  fromMemberId: string,
): Promise<OwnershipTransferPreview> {
  requireTransferCapability(access);

  const member = await prisma.workspaceMember.findFirst({
    where: { id: fromMemberId, workspaceId: access.workspaceId },
    select: { id: true },
  });
  if (!member) throw new WorkspaceAccessDeniedError();

  const [
    customers,
    tasks,
    risks,
    onboardings,
    milestones,
    renewals,
    goals,
    playbookRuns,
  ] = await Promise.all([
    prisma.customer.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: "ACTIVE",
      },
    }),
    prisma.task.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.risk.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: { in: ["OPEN", "MONITORING"] },
      },
    }),
    prisma.onboarding.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
    }),
    prisma.onboardingMilestone.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
    }),
    prisma.renewal.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        stage: {
          in: [
            "UPCOMING",
            "PREPARING",
            "DISCUSSION",
            "NEGOTIATION",
            "COMMITTED",
          ],
        },
      },
    }),
    prisma.successGoal.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "AT_RISK"] },
      },
    }),
    prisma.playbookRun.count({
      where: {
        workspaceId: access.workspaceId,
        ownerId: fromMemberId,
        status: "ACTIVE",
      },
    }),
  ]);

  return {
    customers,
    tasks,
    risks,
    onboardings,
    milestones,
    renewals,
    goals,
    playbookRuns,
  };
}

export async function getOwnershipTransferPreviewInTransaction(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  fromMemberId: string,
): Promise<OwnershipTransferPreview> {
  const [
    customers,
    tasks,
    risks,
    onboardings,
    milestones,
    renewals,
    goals,
    playbookRuns,
  ] = await Promise.all([
    transaction.customer.count({
      where: { workspaceId, ownerId: fromMemberId, status: "ACTIVE" },
    }),
    transaction.task.count({
      where: {
        workspaceId,
        ownerId: fromMemberId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    transaction.risk.count({
      where: {
        workspaceId,
        ownerId: fromMemberId,
        status: { in: ["OPEN", "MONITORING"] },
      },
    }),
    transaction.onboarding.count({
      where: {
        workspaceId,
        ownerId: fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
    }),
    transaction.onboardingMilestone.count({
      where: {
        workspaceId,
        ownerId: fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
    }),
    transaction.renewal.count({
      where: {
        workspaceId,
        ownerId: fromMemberId,
        stage: {
          in: [
            "UPCOMING",
            "PREPARING",
            "DISCUSSION",
            "NEGOTIATION",
            "COMMITTED",
          ],
        },
      },
    }),
    transaction.successGoal.count({
      where: {
        workspaceId,
        ownerId: fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "AT_RISK"] },
      },
    }),
    transaction.playbookRun.count({
      where: { workspaceId, ownerId: fromMemberId, status: "ACTIVE" },
    }),
  ]);

  return {
    customers,
    tasks,
    risks,
    onboardings,
    milestones,
    renewals,
    goals,
    playbookRuns,
  };
}

export async function transferOwnership(
  access: WorkspaceAccessContext,
  input: { fromMemberId: string; toMemberId: string; operationKey: string },
) {
  requireTransferCapability(access);
  if (input.fromMemberId === input.toMemberId) return emptyPreview;

  return prisma.$transaction(async (transaction) => {
    const replay = await transaction.systemEvent.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: access.workspaceId,
          idempotencyKey: input.operationKey,
        },
      },
      select: { metadata: true },
    });
    if (replay?.metadata && typeof replay.metadata === "object") {
      return replay.metadata as OwnershipTransferPreview;
    }

    await requireEligibleAssignee(
      transaction,
      access.workspaceId,
      input.toMemberId,
    );
    const from = await transaction.workspaceMember.findFirst({
      where: { id: input.fromMemberId, workspaceId: access.workspaceId },
      select: { id: true },
    });
    if (!from) throw new WorkspaceAccessDeniedError();

    const preview = await getOwnershipTransferPreviewInTransaction(
      transaction,
      access.workspaceId,
      input.fromMemberId,
    );
    const customers = await transaction.customer.findMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    await transaction.customer.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: "ACTIVE",
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.task.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.risk.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: { in: ["OPEN", "MONITORING"] },
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.onboarding.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.onboardingMilestone.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.renewal.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        stage: {
          in: [
            "UPCOMING",
            "PREPARING",
            "DISCUSSION",
            "NEGOTIATION",
            "COMMITTED",
          ],
        },
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.successGoal.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "AT_RISK"] },
      },
      data: { ownerId: input.toMemberId },
    });
    await transaction.playbookRun.updateMany({
      where: {
        workspaceId: access.workspaceId,
        ownerId: input.fromMemberId,
        status: "ACTIVE",
      },
      data: { ownerId: input.toMemberId },
    });

    for (const customer of customers) {
      await writeWorkEvent(transaction, {
        workspaceId: access.workspaceId,
        customerId: customer.id,
        type: "OWNER_CHANGED",
        entityType: "CUSTOMER",
        entityId: customer.id,
        actorId: access.memberId,
        idempotencyKey: `${input.operationKey}:customer:${customer.id}`,
        metadata: {
          version: 1,
          fromMemberId: input.fromMemberId,
          toMemberId: input.toMemberId,
        },
        jobType: "CUSTOMER_CHANGED",
      });
    }

    await transaction.systemEvent.create({
      data: {
        workspaceId: access.workspaceId,
        customerId: null,
        type: "OWNER_CHANGED",
        title: "OWNER_CHANGED",
        entityType: "WORKSPACE_MEMBER",
        entityId: input.fromMemberId,
        actorId: access.memberId,
        idempotencyKey: input.operationKey,
        metadata: preview,
      },
    });

    return preview;
  });
}
