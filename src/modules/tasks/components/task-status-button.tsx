"use client";

import { startTransition, useActionState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  display = "button",
}: {
  taskId: string;
  customerId: string | null;
  locale: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  operationKey: string;
  targetStatus?: "COMPLETED" | "OPEN" | "CANCELLED";
  display?: "button" | "menu-item";
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

  const label =
    target === "COMPLETED"
      ? t("actions.complete")
      : target === "OPEN"
        ? t("actions.reopen")
        : t("actions.cancel");
  const icon = pending ? (
    <Spinner aria-label={label} />
  ) : target === "COMPLETED" ? (
    <Check aria-hidden="true" />
  ) : target === "OPEN" ? (
    <RotateCcw aria-hidden="true" />
  ) : (
    <X aria-hidden="true" />
  );

  return (
    <form
      onSubmit={submit}
      className={display === "button" ? "flex items-center gap-2" : undefined}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="customerId" value={customerId ?? ""} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="status" value={target} />
      <input type="hidden" name="operationKey" value={operationKey} />
      {display === "menu-item" ? (
        <DropdownMenuItem
          asChild
          variant={target === "CANCELLED" ? "destructive" : "default"}
        >
          <button type="submit" disabled={pending || status === "CANCELLED"}>
            {icon}
            {label}
          </button>
        </DropdownMenuItem>
      ) : target === "CANCELLED" ? (
        <Button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-busy={pending}
          variant="ghost"
          className="text-risk"
        >
          {icon}
          {label}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={pending || status === "CANCELLED"}
          aria-busy={pending}
          variant={target === "COMPLETED" ? "default" : "outline"}
        >
          {icon}
          {label}
        </Button>
      )}
      {state.status === "error" ? (
        display === "menu-item" ? (
          <DropdownMenuLabel className="text-risk font-normal" role="alert">
            {t("feedback.failed")}
          </DropdownMenuLabel>
        ) : (
          <span className="text-risk text-xs" role="alert">
            {t("feedback.failed")}
          </span>
        )
      ) : null}
    </form>
  );
}
