import "server-only";

import { randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth/auth";
import {
  AuthenticationRequiredError,
  WorkspaceAccessDeniedError,
  type WorkspaceAccessContext,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import {
  hasWorkspaceCapability,
  isWorkspaceRole,
  type WorkspaceRole,
} from "@/lib/permissions/roles";

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

const inviteAssignableRoles: WorkspaceRole[] = ["CS_MANAGER", "CSM", "VIEWER"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

function requireInvitationRole(role: string): WorkspaceRole {
  if (!isWorkspaceRole(role) || !inviteAssignableRoles.includes(role)) {
    throw new InvitationError("Invalid invitation role");
  }
  return role;
}

function requireCanInvite(access: WorkspaceAccessContext) {
  if (!hasWorkspaceCapability(access.role, "inviteWorkspaceMembers")) {
    throw new WorkspaceAccessDeniedError();
  }
}

export async function getWorkspaceInvitations(access: WorkspaceAccessContext) {
  requireCanInvite(access);

  return prisma.invitation.findMany({
    where: { workspaceId: access.workspaceId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      createdAt: true,
      inviter: { select: { name: true, email: true } },
    },
  });
}

export async function inviteWorkspaceMember(
  access: WorkspaceAccessContext,
  input: { email: string; role: string },
) {
  requireCanInvite(access);
  const email = normalizeEmail(input.email);
  const role = requireInvitationRole(input.role);

  return prisma.$transaction(async (transaction) => {
    const existingMember = await transaction.workspaceMember.findFirst({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
        user: { email: { equals: email, mode: "insensitive" } },
      },
      select: { id: true },
    });
    if (existingMember) throw new InvitationError("User is already a member");

    const existingInvitation = await transaction.invitation.findFirst({
      where: {
        workspaceId: access.workspaceId,
        email: { equals: email, mode: "insensitive" },
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (existingInvitation)
      throw new InvitationError("Invitation already exists");

    return transaction.invitation.create({
      data: {
        workspaceId: access.workspaceId,
        email,
        role,
        token: createInvitationToken(),
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        inviterId: access.userId,
      },
      select: { id: true, token: true },
    });
  });
}

export async function revokeWorkspaceInvitation(
  access: WorkspaceAccessContext,
  invitationId: string,
) {
  requireCanInvite(access);

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      workspaceId: access.workspaceId,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (!invitation) throw new WorkspaceAccessDeniedError();

  return prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "REVOKED" },
    select: { id: true, status: true },
  });
}

export async function resendWorkspaceInvitation(
  access: WorkspaceAccessContext,
  invitationId: string,
) {
  requireCanInvite(access);

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      workspaceId: access.workspaceId,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (!invitation) throw new WorkspaceAccessDeniedError();

  return prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      token: createInvitationToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    select: { id: true, token: true },
  });
}

export async function getInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      workspace: { select: { name: true, slug: true } },
    },
  });
}

export async function acceptInvitationForCurrentUser(
  token: string,
  requestHeaders: Headers,
) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) throw new AuthenticationRequiredError();

  const membership = await prisma.$transaction(async (transaction) => {
    const invitation = await transaction.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation) throw new InvitationError("Invalid invitation");
    if (invitation.status !== "PENDING") {
      throw new InvitationError("Invitation is no longer pending");
    }
    if (invitation.expiresAt <= new Date()) {
      await transaction.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new InvitationError("Invitation has expired");
    }
    if (
      normalizeEmail(session.user.email) !== normalizeEmail(invitation.email)
    ) {
      throw new InvitationError("Invitation email does not match this account");
    }

    const role = requireInvitationRole(invitation.role);
    const createdMembership = await transaction.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: session.user.id,
        },
      },
      update: { role, status: "ACTIVE", joinedAt: new Date() },
      create: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        role,
        status: "ACTIVE",
      },
      select: { workspaceId: true },
    });

    await transaction.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    return createdMembership;
  });

  await auth.api.setActiveOrganization({
    headers: requestHeaders,
    body: { organizationId: membership.workspaceId },
  });

  return membership;
}

export type WorkspaceInvitationTransaction = Prisma.TransactionClient;
