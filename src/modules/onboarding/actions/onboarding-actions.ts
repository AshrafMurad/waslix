"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { OnboardingDomainError } from "../services/onboarding-errors";
import {
  changeMilestoneStatus,
  moveCompletedOnboardingToAdoption,
  startOnboarding,
  updateMilestone,
} from "../services/manage-onboarding";
import {
  adoptionInputSchema,
  milestoneInputSchema,
  milestoneStatusInputSchema,
  startOnboardingInputSchema,
} from "../validation/onboarding-input";

export type OnboardingActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function actionState(error: unknown): OnboardingActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      code: "VALIDATION_ERROR",
      fieldErrors: Object.fromEntries(
        error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          "INVALID",
        ]),
      ),
    };
  }
  return {
    status: "error",
    code:
      error instanceof OnboardingDomainError
        ? error.code
        : "ONBOARDING_SAVE_FAILED",
  };
}

function localeFrom(formData: FormData) {
  const value = formData.get("locale");
  return typeof value === "string" && isLocale(value) ? value : "en";
}

function refresh(formData: FormData, customerId: string) {
  const locale = localeFrom(formData);
  revalidatePath(`/${locale}/customers/${customerId}`);
  revalidatePath(`/${locale}/customers/${customerId}/onboarding`);
  revalidatePath(`/${locale}/overview`);
}

export async function startOnboardingAction(
  _previous: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = startOnboardingInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return actionState(parsed.error);
  try {
    await startOnboarding(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return actionState(error);
  }
}

export async function updateMilestoneAction(
  _previous: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = milestoneInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionState(parsed.error);
  try {
    await updateMilestone(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return actionState(error);
  }
}

export async function changeMilestoneStatusAction(
  _previous: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = milestoneStatusInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return actionState(parsed.error);
  try {
    await changeMilestoneStatus(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return actionState(error);
  }
}

export async function moveToAdoptionAction(
  _previous: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = adoptionInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionState(parsed.error);
  try {
    await moveCompletedOnboardingToAdoption(
      await requireWorkspaceAccess(),
      parsed.data,
    );
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return actionState(error);
  }
}
