"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { locales } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { updatePreferredLocale } from "../services/update-preferred-locale";

const updateLocaleSchema = z.object({
  locale: z.enum(locales),
});

export async function updateLocaleAction(input: unknown) {
  const result = updateLocaleSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, code: "VALIDATION_ERROR" as const };
  }

  const access = await requireWorkspaceAccess();
  await updatePreferredLocale(access, result.data.locale);
  (await cookies()).set("NEXT_LOCALE", result.data.locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return { ok: true as const };
}
