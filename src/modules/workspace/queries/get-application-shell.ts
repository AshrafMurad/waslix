import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getApplicationShell(access: WorkspaceAccessContext) {
  const [workspace, user] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: access.workspaceId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: access.userId },
      select: {
        name: true,
        email: true,
        memberships: {
          where: { status: "ACTIVE" },
          orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
          select: {
            workspace: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  if (!workspace || !user) {
    throw new Error("Verified shell context is unavailable");
  }

  return {
    workspace,
    user: { name: user.name, email: user.email },
    workspaces: user.memberships.map(
      ({ workspace: memberWorkspace }) => memberWorkspace,
    ),
  };
}
