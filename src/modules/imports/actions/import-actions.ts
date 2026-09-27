"use server";

import { revalidatePath } from "next/cache";

import { requireWorkspaceAccess } from "@/lib/auth/access-context";
import { importCustomersFromCsv } from "@/modules/imports/services/import-customers";

export async function importCustomersAction(formData: FormData) {
  const access = await requireWorkspaceAccess();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, code: "IMPORT_FILE_REQUIRED" };
  }
  if (file.type && file.type !== "text/csv" && !file.name.endsWith(".csv")) {
    return { ok: false as const, code: "IMPORT_FILE_TYPE" };
  }
  const result = await importCustomersFromCsv(access, await file.text());
  if (result.ok) {
    revalidatePath("/customers");
    revalidatePath("/analytics");
  }
  return result;
}
