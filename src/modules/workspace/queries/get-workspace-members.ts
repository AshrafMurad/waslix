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
