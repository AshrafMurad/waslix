"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import {
  acceptRecommendation,
  dismissRecommendation,
  RecommendationDomainError,
} from "../services/manage-recommendations";
import {
  acceptRecommendationInputSchema,
  dismissRecommendationInputSchema,
} from "../validation/recommendation-input";

export type RecommendationActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function validationState(error: z.ZodError): RecommendationActionState {
  return {
    status: "error",
    code: "VALIDATION_ERROR",
    fieldErrors: Object.fromEntries(
      error.issues.map((issue) => [
        String(issue.path[0] ?? "form"),
        issue.message,
      ]),
    ),
  };
}

function errorState(error: unknown): RecommendationActionState {
  return {
    status: "error",
    code:
      error instanceof RecommendationDomainError
        ? error.code
        : "RECOMMENDATION_ACTION_FAILED",
  };
}

function localeFrom(formData: FormData) {
  const locale = formData.get("locale");
  return typeof locale === "string" && isLocale(locale) ? locale : "en";
}

function revalidateRecommendationViews(formData: FormData) {
  const locale = localeFrom(formData);
  const customerId = formData.get("customerId");
  revalidatePath(`/${locale}/overview`);
  revalidatePath(`/${locale}/tasks`);
  if (typeof customerId === "string" && customerId) {
    revalidatePath(`/${locale}/customers/${customerId}`);
  }
}

export async function acceptRecommendationAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const parsed = acceptRecommendationInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await acceptRecommendation(access, parsed.data);
    revalidateRecommendationViews(formData);
    return { status: "success" };
  } catch (error) {
    return errorState(error);
  }
}

export async function dismissRecommendationAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const parsed = dismissRecommendationInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await dismissRecommendation(access, parsed.data);
    revalidateRecommendationViews(formData);
    return { status: "success" };
  } catch (error) {
    return errorState(error);
  }
}
