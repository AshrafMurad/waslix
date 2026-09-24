"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { changeTaskStatus, createTask, updateTask } from "../services/manage-task";
import { TaskDomainError } from "../services/task-errors";
import { taskInputSchema, taskStatusInputSchema } from "../validation/task-input";

export type TaskActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function validationState(error: z.ZodError): TaskActionState {
  return {
    status: "error",
    code: "VALIDATION_ERROR",
    fieldErrors: Object.fromEntries(
      error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
    ),
  };
}

function errorState(error: unknown): TaskActionState {
  return {
    status: "error",
    code: error instanceof TaskDomainError ? error.code : "TASK_SAVE_FAILED",
  };
}

function localeFrom(formData: FormData) {
  const locale = formData.get("locale");
  return typeof locale === "string" && isLocale(locale) ? locale : "en";
}

function revalidateTaskViews(formData: FormData, customerId?: string | null) {
  const locale = localeFrom(formData);
  revalidatePath(`/${locale}/tasks`);
  if (customerId) revalidatePath(`/${locale}/customers/${customerId}`);
}

export async function saveTaskAction(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = taskInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    if (parsed.data.taskId) {
      await updateTask(access, { ...parsed.data, taskId: parsed.data.taskId });
    } else {
      await createTask(access, parsed.data);
    }
    revalidateTaskViews(formData, parsed.data.customerId);
    return { status: "success" };
  } catch (error) {
    return errorState(error);
  }
}

export async function changeTaskStatusAction(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = taskStatusInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await changeTaskStatus(access, parsed.data);
    const customerId = formData.get("customerId");
    revalidateTaskViews(
      formData,
      typeof customerId === "string" ? customerId : null,
    );
    return { status: "success" };
  } catch (error) {
    return errorState(error);
  }
}
