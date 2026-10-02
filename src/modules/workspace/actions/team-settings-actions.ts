"use server";

import { randomUUID } from "node:crypto";

import type { MembershipStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";
import { isWorkspaceRole, type WorkspaceRole } from "@/lib/permissions/roles";

import commonCurrencies from "../data/common-currencies.json";
import {
  changeMembershipRole,
  changeMembershipStatus,
} from "../services/change-membership";
import { transferOwnership } from "../services/ownership-transfer";
import {
  updateLifecycleStageSettings,
  updateWorkspaceSettings,
} from "../services/update-workspace-settings";
import {
  addWorkspaceCurrency,
  updateWorkspaceCurrency,
} from "../services/workspace-currencies";

const workspaceSettingsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  timezone: z.string().trim().min(1).max(100),
});

const workspaceCurrencySchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  isDefault: z.preprocess((value) => value === "on", z.boolean()),
});

const workspaceCurrencyUpdateSchema = z.object({
  currencyId: z.uuid(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
  isDefault: z.preprocess((value) => value === "on", z.boolean()),
});

const lifecycleStageSettingsSchema = z.object({
  stageId: z.uuid(),
  name: z.string().trim().min(1).max(200),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

function localeFrom(formData: FormData) {
  const locale = formData.get("locale");
  return typeof locale === "string" && isLocale(locale) ? locale : "en";
}

export async function updateWorkspaceSettingsAction(formData: FormData) {
  const parsed = workspaceSettingsSchema.parse(Object.fromEntries(formData));
  const access = await requireWorkspaceAccess();
  await updateWorkspaceSettings(access, parsed);
  revalidatePath(`/${localeFrom(formData)}/settings`);
}

export async function updateLifecycleStageSettingsAction(formData: FormData) {
  const parsed = lifecycleStageSettingsSchema.parse(
    Object.fromEntries(formData),
  );
  const access = await requireWorkspaceAccess();
  await updateLifecycleStageSettings(access, parsed);
  revalidatePath(`/${localeFrom(formData)}/settings`);
}

export async function addWorkspaceCurrencyAction(formData: FormData) {
  const parsed = workspaceCurrencySchema.parse(Object.fromEntries(formData));
  const currency = commonCurrencies.find(
    (item) => item.code === parsed.currencyCode,
  );
  if (!currency) throw new Error("Invalid currency");
  const access = await requireWorkspaceAccess();
  await addWorkspaceCurrency(access, {
    ...currency,
    isActive: true,
    isDefault: parsed.isDefault,
  });
  revalidatePath(`/${localeFrom(formData)}/settings`);
}

export async function updateWorkspaceCurrencyAction(formData: FormData) {
  const parsed = workspaceCurrencyUpdateSchema.parse(
    Object.fromEntries(formData),
  );
  const access = await requireWorkspaceAccess();
  await updateWorkspaceCurrency(access, parsed);
  revalidatePath(`/${localeFrom(formData)}/settings`);
}

export async function changeMemberRoleAction(formData: FormData) {
  const memberId = formData.get("memberId");
  const role = formData.get("role");
  if (
    typeof memberId !== "string" ||
    typeof role !== "string" ||
    !isWorkspaceRole(role)
  ) {
    throw new Error("Invalid role change");
  }
  const access = await requireWorkspaceAccess();
  await changeMembershipRole(access, memberId, role as WorkspaceRole);
  revalidatePath(`/${localeFrom(formData)}/team`);
}

export async function changeMemberStatusAction(formData: FormData) {
  const memberId = formData.get("memberId");
  const status = formData.get("status");
  if (
    typeof memberId !== "string" ||
    (status !== "ACTIVE" && status !== "INACTIVE")
  ) {
    throw new Error("Invalid status change");
  }
  const access = await requireWorkspaceAccess();
  await changeMembershipStatus(access, memberId, status as MembershipStatus);
  revalidatePath(`/${localeFrom(formData)}/team`);
}

export async function transferOwnershipAction(formData: FormData) {
  const fromMemberId = formData.get("fromMemberId");
  const toMemberId = formData.get("toMemberId");
  const operationKey = formData.get("operationKey");
  if (
    typeof fromMemberId !== "string" ||
    typeof toMemberId !== "string" ||
    typeof operationKey !== "string"
  ) {
    throw new Error("Invalid ownership transfer");
  }
  const access = await requireWorkspaceAccess();
  await transferOwnership(access, {
    fromMemberId,
    toMemberId,
    operationKey: operationKey || randomUUID(),
  });
  revalidatePath(`/${localeFrom(formData)}/team`);
}
