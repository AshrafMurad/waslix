"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { RiskDomainError } from "../services/risk-errors";
import {
  changeRiskStatus,
  createRiskMitigation,
  saveRisk,
} from "../services/manage-risk";
import {
  riskInputSchema,
  riskMitigationInputSchema,
  riskStatusInputSchema,
} from "../validation/risk-input";

export type RiskActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function state(error: unknown): RiskActionState {
  if (error instanceof z.ZodError) {
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
  if (
    error instanceof RiskDomainError &&
    error.code === "RISK_RESOLUTION_NOTE_REQUIRED"
  ) {
    return {
      status: "error",
      code: error.code,
      fieldErrors: { resolutionNote: "REQUIRED" },
    };
  }
  return {
    status: "error",
    code: error instanceof RiskDomainError ? error.code : "RISK_SAVE_FAILED",
  };
}

function locale(data: FormData) {
  const value = data.get("locale");
  return typeof value === "string" && isLocale(value) ? value : "en";
}

function refresh(data: FormData, customerId?: string) {
  const activeLocale = locale(data);
  revalidatePath(`/${activeLocale}/risks`);
  revalidatePath(`/${activeLocale}/overview`);
  if (customerId)
    revalidatePath(`/${activeLocale}/customers/${customerId}/risks`);
}

export async function saveRiskAction(
  _previous: RiskActionState,
  data: FormData,
): Promise<RiskActionState> {
  const parsed = riskInputSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return state(parsed.error);
  try {
    await saveRisk(await requireWorkspaceAccess(), parsed.data);
    refresh(data, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}

export async function changeRiskStatusAction(
  _previous: RiskActionState,
  data: FormData,
): Promise<RiskActionState> {
  const parsed = riskStatusInputSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return state(parsed.error);
  try {
    await changeRiskStatus(await requireWorkspaceAccess(), parsed.data);
    refresh(data, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}

export async function createRiskMitigationAction(
  _previous: RiskActionState,
  data: FormData,
): Promise<RiskActionState> {
  const parsed = riskMitigationInputSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return state(parsed.error);
  try {
    await createRiskMitigation(
      await requireWorkspaceAccess(),
      parsed.data.riskId,
      parsed.data.operationKey,
    );
    refresh(data, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return state(error);
  }
}
