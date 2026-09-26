"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import {
  AttentionDomainError,
  changeAttentionStatus,
} from "../services/manage-attention";

export type AttentionActionState = {
  status: "idle" | "success" | "error";
  code?: string;
};

export async function changeAttentionAction(
  _previous: AttentionActionState,
  data: FormData,
): Promise<AttentionActionState> {
  const parsed = z
    .object({
      itemId: z.uuid(),
      status: z.enum(["ACKNOWLEDGED", "DISMISSED"]),
      reason: z.string().trim().max(10000).optional(),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", code: "VALIDATION_ERROR" };
  try {
    await changeAttentionStatus(
      await requireWorkspaceAccess(),
      parsed.data.itemId,
      parsed.data.status,
      parsed.data.reason ?? null,
    );
    const rawLocale = data.get("locale");
    const locale =
      typeof rawLocale === "string" && isLocale(rawLocale) ? rawLocale : "en";
    revalidatePath(`/${locale}/overview`);
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      code:
        error instanceof AttentionDomainError
          ? error.code
          : "ATTENTION_SAVE_FAILED",
    };
  }
}
