"use client";

import { startTransition, useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { saveTaskAction, type TaskActionState } from "../actions/task-actions";

type TaskFormProps = {
  locale: string;
  operationKey: string;
  task?: {
    id: string;
    customerId: string | null;
    title: string;
    description: string | null;
    ownerId: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate: string | null;
  };
  lockedCustomerId?: string;
  owners: Array<{ id: string; user: { name: string } }>;
  customers: Array<{ id: string; name: string }>;
  defaultOwnerId: string;
  canAssignOwner: boolean;
};

const initialState: TaskActionState = { status: "idle" };

export function TaskForm({
  locale,
  operationKey,
  task,
  lockedCustomerId,
  owners,
  customers,
  defaultOwnerId,
  canAssignOwner,
}: TaskFormProps) {
  const t = useTranslations("tasks");
  const [state, action, pending] = useActionState(saveTaskAction, initialState);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
  const hasError = (field: string) => Boolean(state.fieldErrors?.[field]);

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="operationKey" value={operationKey} />
      <input type="hidden" name="dueAt" value="" />
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      {lockedCustomerId ? (
        <input type="hidden" name="customerId" value={lockedCustomerId} />
      ) : (
        <Field label={t("fields.customer")} error={hasError("customerId")}>
          <select
            name="customerId"
            defaultValue={task?.customerId ?? ""}
            className="bg-background h-10 w-full rounded-md border px-3"
          >
            <option value="">{t("standalone")}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={t("fields.title")} error={hasError("title")}>
        <input
          name="title"
          defaultValue={task?.title ?? ""}
          required
          maxLength={200}
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="auto"
        />
      </Field>
      <Field label={t("fields.description")} error={hasError("description")}>
        <textarea
          name="description"
          defaultValue={task?.description ?? ""}
          maxLength={10000}
          rows={3}
          className="bg-background w-full rounded-md border px-3 py-2"
          dir="auto"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("fields.owner")} error={hasError("ownerId")}>
          <select
            name="ownerId"
            defaultValue={task?.ownerId ?? defaultOwnerId}
            disabled={!canAssignOwner}
            className="bg-background h-10 w-full rounded-md border px-3 disabled:opacity-60"
          >
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.user.name}
              </option>
            ))}
          </select>
          {!canAssignOwner ? (
            <input
              type="hidden"
              name="ownerId"
              value={task?.ownerId ?? defaultOwnerId}
            />
          ) : null}
        </Field>
        <Field label={t("fields.priority")} error={hasError("priority")}>
          <select
            name="priority"
            defaultValue={task?.priority ?? "MEDIUM"}
            className="bg-background h-10 w-full rounded-md border px-3"
          >
            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((priority) => (
              <option key={priority} value={priority}>
                {t(`priority.${priority}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("fields.dueDate")} error={hasError("dueDate")}>
          <input
            name="dueDate"
            type="date"
            defaultValue={task?.dueDate ?? ""}
            className="bg-background h-10 w-full rounded-md border px-3"
            dir="ltr"
          />
        </Field>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.status === "success" ? (
          <span className="text-healthy">{t("feedback.saved")}</span>
        ) : state.status === "error" ? (
          <span className="text-risk">{t("feedback.failed")}</span>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.saving") : t("actions.save")}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("tasks");
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
      {error ? (
        <span className="text-risk text-xs">{t("validation.invalid")}</span>
      ) : null}
    </label>
  );
}
