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
    return await requireWorkspaceAccess();
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      redirect(`/${locale}/sign-in`);
    }

    throw error;
  }
}
