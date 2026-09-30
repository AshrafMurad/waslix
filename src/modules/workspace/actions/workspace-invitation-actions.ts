"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import {
  acceptInvitationForCurrentUser,
  inviteWorkspaceMember,
  resendWorkspaceInvitation,
  revokeWorkspaceInvitation,
} from "../services/workspace-invitations";

const inviteSchema = z.object({
  locale: z.string().refine(isLocale),
  email: z.email(),
  role: z.enum(["CS_MANAGER", "CSM", "VIEWER"]),
});

const invitationIdSchema = z.object({
  locale: z.string().refine(isLocale),
  invitationId: z.uuid(),
});

export async function inviteWorkspaceMemberAction(formData: FormData) {
  const parsed = inviteSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await inviteWorkspaceMember(access, parsed);
  revalidatePath(`/${parsed.locale}/settings/team`);
}

export async function revokeWorkspaceInvitationAction(formData: FormData) {
  const parsed = invitationIdSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await revokeWorkspaceInvitation(access, parsed.invitationId);
  revalidatePath(`/${parsed.locale}/settings/team`);
}

export async function resendWorkspaceInvitationAction(formData: FormData) {
  const parsed = invitationIdSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await resendWorkspaceInvitation(access, parsed.invitationId);
  revalidatePath(`/${parsed.locale}/settings/team`);
}

export async function acceptInvitationAction(formData: FormData) {
  const parsed = z
    .object({ locale: z.string().refine(isLocale), token: z.string().min(32) })
    .parse(Object.fromEntries(formData));

  await acceptInvitationForCurrentUser(parsed.token, await headers());
  redirect(`/${parsed.locale}/overview`);
}
