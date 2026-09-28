"use server";

import { z } from "zod";

import { requireWorkspaceAccess } from "@/lib/auth/access-context";
import { globalSearch } from "@/modules/search/services/global-search";

const searchSchema = z.string().trim().min(2).max(100);

export async function globalSearchAction(query: string) {
  const access = await requireWorkspaceAccess();
  const parsed = searchSchema.safeParse(query);
  if (!parsed.success) return [];
  return globalSearch(access, parsed.data);
}
