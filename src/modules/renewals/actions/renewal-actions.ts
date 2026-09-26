"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { RenewalDomainError } from "../services/renewal-errors";
import {
  changeRenewalStage,
  recordChurnedOutcome,
  recordRenewedOutcome,
  saveRenewal,
} from "../services/manage-renewal";
import {
  churnedInputSchema,
  renewedInputSchema,
  renewalInputSchema,
  renewalStageInputSchema,
} from "../validation/renewal-input";

export type RenewalActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function state(error: unknown): RenewalActionState {
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
      error instanceof RenewalDomainError ? error.code : "RENEWAL_SAVE_FAILED",
  };
}

function localeFrom(formData: FormData) {
  const value = formData.get("locale");
  return typeof value === "string" && isLocale(value) ? value : "en";
}

function refresh(formData: FormData, customerId: string) {
  const locale = localeFrom(formData);
  revalidatePath(`/${locale}/customers/${customerId}`);
  revalidatePath(`/${locale}/customers/${customerId}/renewal`);
  revalidatePath(`/${locale}/renewals`);
  revalidatePath(`/${locale}/overview`);
}

export async function saveRenewalAction(
  _previous: RenewalActionState,
  formData: FormData,
): Promise<RenewalActionState> {
  const parsed = renewalInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return state(parsed.error);
  try {
    await saveRenewal(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}

export async function changeRenewalStageAction(
  _previous: RenewalActionState,
  formData: FormData,
): Promise<RenewalActionState> {
  const parsed = renewalStageInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return state(parsed.error);
  try {
    await changeRenewalStage(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}

export async function recordRenewedAction(
  _previous: RenewalActionState,
  formData: FormData,
): Promise<RenewalActionState> {
  const parsed = renewedInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return state(parsed.error);
  try {
    await recordRenewedOutcome(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}

export async function recordChurnedAction(
  _previous: RenewalActionState,
  formData: FormData,
): Promise<RenewalActionState> {
  const parsed = churnedInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return state(parsed.error);
  try {
    await recordChurnedOutcome(await requireWorkspaceAccess(), parsed.data);
    refresh(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}
