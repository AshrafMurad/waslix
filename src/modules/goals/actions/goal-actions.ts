"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { GoalDomainError } from "../services/goal-errors";
import { saveGoal } from "../services/manage-goal";
import { goalInputSchema } from "../validation/goal-input";

export type GoalActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveGoalAction(
  _previous: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const parsed = goalInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await saveGoal(access, parsed.data);
    const localeValue = formData.get("locale");
    const locale =
      typeof localeValue === "string" && isLocale(localeValue)
        ? localeValue
        : "en";
    revalidatePath(`/${locale}/customers/${parsed.data.customerId}`);
    revalidatePath(`/${locale}/customers/${parsed.data.customerId}/health`);
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      code: error instanceof GoalDomainError ? error.code : "GOAL_SAVE_FAILED",
    };
  }
}

function validationState(error: z.ZodError): GoalActionState {
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
