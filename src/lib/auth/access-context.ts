import "server-only";

import { headers } from "next/headers";

import { auth } from "./auth";
import { prisma } from "../db/prisma";
import { isWorkspaceRole, type WorkspaceRole } from "../permissions/roles";

export type WorkspaceAccessContext = {
  userId: string;
  workspaceId: string;
  memberId: string;
  role: WorkspaceRole;
};

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationRequiredError";
  }
}

export class WorkspaceAccessDeniedError extends Error {
  constructor() {
    super("An active workspace membership is required");
    this.name = "WorkspaceAccessDeniedError";
  }
}

type SessionSelection = {
  user: { id: string };
  session: { activeOrganizationId?: string | null };
} | null;

type MembershipProjection = {
  id: string;
  workspaceId: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
};

type FindMembership = (input: {
  userId: string;
  workspaceId: string;
}) => Promise<MembershipProjection | null>;

export async function resolveWorkspaceAccess(
  session: SessionSelection,
  findMembership: FindMembership,
): Promise<WorkspaceAccessContext> {
  if (!session) {
    throw new AuthenticationRequiredError();
  }

  const workspaceId = session.session.activeOrganizationId;
  if (!workspaceId) {
    throw new WorkspaceAccessDeniedError();
  }

  const membership = await findMembership({
    userId: session.user.id,
    workspaceId,
  });

  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    !isWorkspaceRole(membership.role)
  ) {
    throw new WorkspaceAccessDeniedError();
  }

  return {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    memberId: membership.id,
    role: membership.role,
  };
}

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
