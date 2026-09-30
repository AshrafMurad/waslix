import "server-only";

import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/config";

import {
  AuthenticationRequiredError,
  requireWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "./access-context";

export async function requireProtectedPage(locale: Locale) {
  try {
    const access = await requireWorkspaceAccess();
    if (!access.workspaceOnboardingCompleted) {
      redirect(`/${locale}/workspace`);
    }
    return access;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect(`/${locale}/sign-in`);
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      redirect(`/${locale}/workspace`);
    }

    throw error;
  }
}
