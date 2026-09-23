import "server-only";

import { headers } from "next/headers";

import { auth } from "./auth";
import { prisma } from "../db/prisma";
import {
  resolveWorkspaceAccess,
  type WorkspaceAccessContext,
} from "./resolve-workspace-access";

export {
  AuthenticationRequiredError,
  WorkspaceAccessDeniedError,
  type WorkspaceAccessContext,
} from "./resolve-workspace-access";

export async function requireWorkspaceAccess(
  requestHeaders?: Headers,
): Promise<WorkspaceAccessContext> {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  return resolveWorkspaceAccess(session, ({ userId, workspaceId }) =>
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      select: {
        id: true,
        workspaceId: true,
        role: true,
        status: true,
      },
    }),
  );
}
