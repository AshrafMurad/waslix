import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { WorkspaceAccessContext } from "@/lib/auth/access-context";

export function getWorkspaceMembers(access: WorkspaceAccessContext) {
  return prisma.workspaceMember.findMany({
    where: {
      workspaceId: access.workspaceId,
    },
    orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      role: true,
      status: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          customers: { where: { status: "ACTIVE" } },
          ownedTasks: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
          ownedRisks: { where: { status: { in: ["OPEN", "MONITORING"] } } },
          ownedGoals: {
            where: {
              status: { in: ["NOT_STARTED", "IN_PROGRESS", "AT_RISK"] },
            },
          },
          ownedOnboardings: {
            where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
          },
          ownedMilestones: {
            where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
          },
          ownedRenewals: {
            where: {
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
          },
          ownedPlaybookRuns: { where: { status: "ACTIVE" } },
        },
      },
    },
  });
}

export function getWorkspaceMemberById(
  access: WorkspaceAccessContext,
  memberId: string,
) {
  return prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId: access.workspaceId,
    },
    select: {
      id: true,
      role: true,
      status: true,
      userId: true,
    },
  });
}
