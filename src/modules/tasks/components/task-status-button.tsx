"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { Check } from "lucide-react";
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
        <Button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-busy={pending}
          variant="ghost"
          className="text-risk"
        >
          {pending ? <Spinner aria-label={t("actions.cancel")} /> : null}
          {t("actions.cancel")}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-busy={pending}
          variant="outline"
          size="icon"
          aria-label={
            target === "COMPLETED" ? t("actions.complete") : t("actions.reopen")
          }
          className="border-brand text-brand-accent rounded-full border-2"
        >
          {pending ? (
            <Spinner
              aria-label={
                target === "COMPLETED"
                  ? t("actions.complete")
                  : t("actions.reopen")
              }
            />
          ) : optimisticStatus === "COMPLETED" ? (
            <Check aria-hidden="true" className="size-5" />
          ) : null}
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
