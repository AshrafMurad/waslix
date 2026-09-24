"use client";

import { startTransition, useActionState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
  const target =
    targetStatus ?? (status === "COMPLETED" ? "OPEN" : "COMPLETED");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
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
        <Button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-busy={pending}
          variant="ghost"
          className="text-risk"
        >
          {pending ? <Spinner aria-label={t("actions.cancel")} /> : null}
          {!pending ? <X aria-hidden="true" /> : null}
          {t("actions.cancel")}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-busy={pending}
          variant={target === "COMPLETED" ? "default" : "outline"}
        >
          {pending ? (
            <Spinner
              aria-label={
                target === "COMPLETED"
                  ? t("actions.complete")
                  : t("actions.reopen")
              }
            />
          ) : target === "COMPLETED" ? (
            <Check aria-hidden="true" />
          ) : (
            <RotateCcw aria-hidden="true" />
          )}
          {target === "COMPLETED" ? t("actions.complete") : t("actions.reopen")}
        </Button>
      )}
      {state.status === "error" ? (
        <span className="text-risk text-xs" role="alert">
          {t("feedback.failed")}
        </span>
      ) : null}
    </form>
  );
}
