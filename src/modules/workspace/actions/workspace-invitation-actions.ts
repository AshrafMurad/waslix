"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import {
  acceptInvitationForCurrentUser,
  deleteWorkspaceInvitation,
  declineInvitationForCurrentUser,
  inviteWorkspaceMember,
  InvitationError,
  resendWorkspaceInvitation,
  revokeWorkspaceInvitation,
} from "../services/workspace-invitations";

export type InviteWorkspaceMemberState = {
  status: "idle" | "success" | "error";
  messageKey?: string;
};

function getInvitationMessageKey(error: InvitationError) {
  switch (error.message) {
    case "User is already a member":
      return "team.invite.errors.alreadyMember";
    case "Invitation already exists":
      return "team.invite.errors.alreadyPending";
    case "Invitation was already accepted":
      return "team.invite.errors.alreadyAccepted";
    default:
      return "team.invite.errors.generic";
  }
}

const inviteSchema = z.object({
  locale: z.string().refine(isLocale),
  email: z.email(),
  role: z.enum(["CS_MANAGER", "CSM", "VIEWER"]),
});

const invitationIdSchema = z.object({
  locale: z.string().refine(isLocale),
  invitationId: z.uuid(),
});

export async function inviteWorkspaceMemberAction(
  _state: InviteWorkspaceMemberState,
  formData: FormData,
): Promise<InviteWorkspaceMemberState> {
  try {
    const parsed = inviteSchema.parse(Object.fromEntries(formData));
    const access = await requireWorkspaceAccess();
    await inviteWorkspaceMember(access, parsed);
    revalidatePath(`/${parsed.locale}/team`);
    return { status: "success", messageKey: "team.invite.sent" };
  } catch (error) {
    if (error instanceof InvitationError) {
      return { status: "error", messageKey: getInvitationMessageKey(error) };
    }

    return { status: "error", messageKey: "team.invite.errors.generic" };
  }
}

export async function revokeWorkspaceInvitationAction(formData: FormData) {
  const parsed = invitationIdSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await revokeWorkspaceInvitation(access, parsed.invitationId);
  revalidatePath(`/${parsed.locale}/team`);
}

export async function resendWorkspaceInvitationAction(formData: FormData) {
  const parsed = invitationIdSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await resendWorkspaceInvitation(access, parsed.invitationId);
  revalidatePath(`/${parsed.locale}/team`);
}

export async function deleteWorkspaceInvitationAction(formData: FormData) {
  const parsed = invitationIdSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await deleteWorkspaceInvitation(access, parsed.invitationId);
  revalidatePath(`/${parsed.locale}/team`);
}

export async function acceptInvitationAction(formData: FormData) {
  const parsed = z
    .object({ locale: z.string().refine(isLocale), token: z.string().min(32) })
    .parse(Object.fromEntries(formData));

  await acceptInvitationForCurrentUser(parsed.token, await headers());
  redirect(`/${parsed.locale}/overview`);
}

export async function declineInvitationAction(formData: FormData) {
  const parsed = z
    .object({ locale: z.string().refine(isLocale), token: z.string().min(32) })
    .parse(Object.fromEntries(formData));

  await declineInvitationForCurrentUser(parsed.token, await headers());
  revalidatePath(`/${parsed.locale}/invite/${parsed.token}`);
  redirect(`/${parsed.locale}/invite/${parsed.token}`);
}
