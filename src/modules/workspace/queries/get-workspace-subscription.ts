import "server-only";

import { WorkspaceAccessDeniedError } from "@/lib/auth/access-context";
import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { hasWorkspaceCapability } from "@/lib/permissions/roles";

export async function getWorkspaceSubscription(access: WorkspaceAccessContext) {
  if (!hasWorkspaceCapability(access.role, "readSubscription")) {
    throw new WorkspaceAccessDeniedError();
  }

  return prisma.workspace.findUniqueOrThrow({
    where: { id: access.workspaceId },
    select: {
      name: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          startedAt: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  });
}
