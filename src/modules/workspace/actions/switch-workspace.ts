"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { switchActiveWorkspace } from "../services/switch-active-workspace";

const switchWorkspaceSchema = z.object({
  workspaceId: z.uuid(),
});

export async function switchWorkspaceAction(input: unknown) {
  const result = switchWorkspaceSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, code: "VALIDATION_ERROR" as const };
  }

  try {
    await switchActiveWorkspace(result.data.workspaceId, await headers());
  } catch {
    return { ok: false as const, code: "NOT_FOUND" as const };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}
