"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { createActivity } from "../services/create-activity";
import { ActivityDomainError } from "../services/activity-errors";
import { activityInputSchema } from "../validation/activity-input";

export type ActivityActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

export async function createActivityAction(
  _previous: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const parsed = activityInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      code: "VALIDATION_ERROR",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }
  const access = await requireWorkspaceAccess();
  try {
    await createActivity(access, parsed.data);
    const localeValue = formData.get("locale");
    const locale =
      typeof localeValue === "string" && isLocale(localeValue)
        ? localeValue
        : "en";
    revalidatePath(`/${locale}/customers/${parsed.data.customerId}/timeline`);
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      code:
        error instanceof ActivityDomainError
          ? error.code
          : "ACTIVITY_SAVE_FAILED",
    };
  }
}
