"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/i18n/config";

import { createWorkspaceForCurrentUser } from "../services/workspace-onboarding";

const onboardingSchema = z.object({
  locale: z.string().refine(isLocale),
  name: z.string().trim().min(2).max(200),
  plan: z.enum(["FREE", "STARTER", "PRO", "BUSINESS"]),
});

export async function createWorkspaceAction(formData: FormData) {
  const parsed = onboardingSchema.parse(Object.fromEntries(formData));
  await createWorkspaceForCurrentUser(await headers(), {
    name: parsed.name,
    plan: parsed.plan,
  });

  redirect(`/${parsed.locale}/overview`);
}
