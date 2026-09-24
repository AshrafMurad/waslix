"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { HealthDomainError } from "../services/health-errors";
import {
  selectSystemHealthInput,
  updateHealthInput,
} from "../services/manage-health-input";
import {
  healthInputSchema,
  useSystemHealthInputSchema,
} from "../validation/health-input";

export type HealthActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function validationState(error: z.ZodError): HealthActionState {
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

function errorState(error: unknown): HealthActionState {
  return {
    status: "error",
    code:
      error instanceof HealthDomainError ? error.code : "HEALTH_SAVE_FAILED",
  };
}

function revalidateHealth(formData: FormData, customerId: string) {
  const localeValue = formData.get("locale");
  const locale =
    typeof localeValue === "string" && isLocale(localeValue)
      ? localeValue
      : "en";
  revalidatePath(`/${locale}/customers`);
  revalidatePath(`/${locale}/customers/${customerId}`);
  revalidatePath(`/${locale}/customers/${customerId}/health`);
}

export async function updateHealthInputAction(
  _previous: HealthActionState,
  formData: FormData,
): Promise<HealthActionState> {
  const parsed = healthInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await updateHealthInput(access, parsed.data);
    revalidateHealth(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return errorState(error);
  }
}

export async function useSystemHealthInputAction(
  _previous: HealthActionState,
  formData: FormData,
): Promise<HealthActionState> {
  const parsed = useSystemHealthInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await selectSystemHealthInput(access, parsed.data);
    revalidateHealth(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return errorState(error);
  }
}
