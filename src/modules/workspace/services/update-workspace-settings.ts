import "server-only";

import {
  WorkspaceAccessDeniedError,
  type WorkspaceAccessContext,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { hasWorkspaceCapability } from "@/lib/permissions/roles";

export async function updateWorkspaceSettings(
  access: WorkspaceAccessContext,
  input: { name: string; timezone: string; defaultCurrency: string },
) {
  if (!hasWorkspaceCapability(access.role, "manageWorkspaceMembership")) {
    throw new WorkspaceAccessDeniedError();
  }

  return prisma.workspace.update({
    where: { id: access.workspaceId },
    data: {
      name: input.name.trim(),
      timezone: input.timezone.trim(),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
    },
    select: { id: true },
  });
}

export async function updateLifecycleStageSettings(
  access: WorkspaceAccessContext,
  input: { stageId: string; name: string; isActive: boolean },
) {
  if (!hasWorkspaceCapability(access.role, "manageWorkspaceMembership")) {
    throw new WorkspaceAccessDeniedError();
  }

  return prisma.$transaction(async (transaction) => {
    const stage = await transaction.lifecycleStage.findFirst({
      where: { id: input.stageId, workspaceId: access.workspaceId },
      select: { id: true, key: true, isActive: true },
    });
    if (!stage) throw new WorkspaceAccessDeniedError();

    const reservedKeys = new Set(["new", "adoption", "churned"]);
    if (!input.isActive && reservedKeys.has(stage.key)) {
      throw new WorkspaceAccessDeniedError();
    }

    if (stage.isActive && !input.isActive) {
      const activeCustomerCount = await transaction.customer.count({
        where: {
          workspaceId: access.workspaceId,
          lifecycleStageId: stage.id,
          status: "ACTIVE",
        },
      });
      if (activeCustomerCount > 0) throw new WorkspaceAccessDeniedError();
    }

    return transaction.lifecycleStage.update({
      where: { id: stage.id },
      data: { name: input.name.trim(), isActive: input.isActive },
      select: { id: true },
    });
  });
}
