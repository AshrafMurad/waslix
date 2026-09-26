import "server-only";

import type { MembershipStatus } from "@prisma/client";

import {
  WorkspaceAccessDeniedError,
  type WorkspaceAccessContext,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import {
  hasWorkspaceCapability,
  type WorkspaceRole,
} from "@/lib/permissions/roles";

export class LastActiveAdminError extends Error {
  constructor() {
    super("The last active workspace admin cannot be changed");
    this.name = "LastActiveAdminError";
  }
}

function requireMembershipAdmin(access: WorkspaceAccessContext) {
  if (!hasWorkspaceCapability(access.role, "manageWorkspaceMembership")) {
    throw new WorkspaceAccessDeniedError();
  }
}

export async function changeMembershipRole(
  access: WorkspaceAccessContext,
  memberId: string,
  role: WorkspaceRole,
) {
  requireMembershipAdmin(access);

  return prisma.$transaction(async (transaction) => {
    const target = await transaction.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: access.workspaceId },
      select: { id: true, role: true, status: true },
    });

    if (!target) {
      throw new WorkspaceAccessDeniedError();
    }

    if (
      target.role === "ADMIN" &&
      target.status === "ACTIVE" &&
      role !== "ADMIN"
    ) {
      const activeAdminCount = await transaction.workspaceMember.count({
        where: {
          workspaceId: access.workspaceId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

      if (activeAdminCount <= 1) {
        throw new LastActiveAdminError();
      }
    }

    return transaction.workspaceMember.update({
      where: { id: target.id },
      data: { role },
      select: { id: true, role: true, status: true },
    });
  });
}

export async function changeMembershipStatus(
  access: WorkspaceAccessContext,
  memberId: string,
  status: MembershipStatus,
) {
  requireMembershipAdmin(access);

  return prisma.$transaction(async (transaction) => {
    const target = await transaction.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: access.workspaceId },
      select: { id: true, role: true, status: true },
    });

    if (!target) {
      throw new WorkspaceAccessDeniedError();
    }

    if (
      target.role === "ADMIN" &&
      target.status === "ACTIVE" &&
      status === "INACTIVE"
    ) {
      const activeAdminCount = await transaction.workspaceMember.count({
        where: {
          workspaceId: access.workspaceId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

      if (activeAdminCount <= 1) {
        throw new LastActiveAdminError();
      }
    }

    if (target.status === "ACTIVE" && status === "INACTIVE") {
      const ownedOpenWork = await transaction.risk.count({
        where: {
          workspaceId: access.workspaceId,
          ownerId: target.id,
          status: { in: ["OPEN", "MONITORING"] },
        },
      });
      if (ownedOpenWork > 0) throw new WorkspaceAccessDeniedError();
    }

    return transaction.workspaceMember.update({
      where: { id: target.id },
      data: { status },
      select: { id: true, role: true, status: true },
    });
  });
}
