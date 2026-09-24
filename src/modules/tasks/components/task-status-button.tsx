"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  changeTaskStatusAction,
  type TaskActionState,
} from "../actions/task-actions";

const initialState: TaskActionState = { status: "idle" };

export function TaskStatusButton({
  taskId,
  customerId,
  locale,
  status,
  operationKey,
  targetStatus,
}: {
  taskId: string;
  customerId: string | null;
  locale: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  operationKey: string;
  targetStatus?: "COMPLETED" | "OPEN" | "CANCELLED";
}) {
  const t = useTranslations("tasks");
  const [state, action, pending] = useActionState(
    changeTaskStatusAction,
    initialState,
  );
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const target =
    targetStatus ?? (optimisticStatus === "COMPLETED" ? "OPEN" : "COMPLETED");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setOptimisticStatus(target);
      action(formData);
    });
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="customerId" value={customerId ?? ""} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="status" value={target} />
      <input type="hidden" name="operationKey" value={operationKey} />
      {target === "CANCELLED" ? (
        <button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          className="text-risk hover:bg-raised min-h-10 rounded-md px-3 text-sm font-medium disabled:opacity-50"
        >
          {t("actions.cancel")}
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-label={
            target === "COMPLETED" ? t("actions.complete") : t("actions.reopen")
          }
          className="border-brand text-brand-accent flex size-10 items-center justify-center rounded-full border-2 disabled:opacity-50"
        >
          {optimisticStatus === "COMPLETED" ? (
            <Check aria-hidden="true" className="size-5" />
          ) : null}
        </button>
      )}
      {state.status === "error" ? (
        <span className="text-risk text-xs" role="alert">
          {t("feedback.failed")}
        </span>
      ) : null}
    </form>
  );
}
