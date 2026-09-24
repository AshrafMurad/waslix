"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";

import { DatePicker } from "@/components/shared/date-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

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
  onSuccess?: () => void;
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
  onSuccess,
}: TaskFormProps) {
  const t = useTranslations("tasks");
  const [state, action, pending] = useActionState(saveTaskAction, initialState);
  useEffect(() => {
    if (state.status === "success") onSuccess?.();
  }, [state.status, onSuccess]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
  const fieldError = (field: string) => {
    const error = state.fieldErrors?.[field];
    if (!error) return null;
    return t(`validation.${error === "REQUIRED" ? "required" : "invalid"}`);
  };

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="operationKey" value={operationKey} />
      <input type="hidden" name="dueAt" value="" />
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      {lockedCustomerId ? (
        <input type="hidden" name="customerId" value={lockedCustomerId} />
      ) : (
        <FormField
          id="task-customer"
          label={t("fields.customer")}
          error={fieldError("customerId")}
        >
          <Select
            name="customerId"
            defaultValue={task?.customerId ?? "standalone"}
          >
            <SelectTrigger
              id="task-customer"
              className="w-full"
              aria-invalid={Boolean(fieldError("customerId"))}
              aria-describedby={
                fieldError("customerId") ? "task-customer-error" : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standalone">{t("standalone")}</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      <FormField
        id="task-title"
        label={t("fields.title")}
        error={fieldError("title")}
      >
        <Input
          id="task-title"
          name="title"
          defaultValue={task?.title ?? ""}
          aria-required="true"
          maxLength={200}
          dir="auto"
          aria-invalid={Boolean(fieldError("title"))}
          aria-describedby={
            fieldError("title") ? "task-title-error" : undefined
          }
        />
      </FormField>
      <FormField
        id="task-description"
        label={t("fields.description")}
        error={fieldError("description")}
      >
        <Textarea
          id="task-description"
          name="description"
          defaultValue={task?.description ?? ""}
          maxLength={10000}
          rows={3}
          dir="auto"
          aria-invalid={Boolean(fieldError("description"))}
          aria-describedby={
            fieldError("description") ? "task-description-error" : undefined
          }
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="task-owner"
          label={t("fields.owner")}
          error={fieldError("ownerId")}
        >
          <Select
            name="ownerId"
            defaultValue={task?.ownerId ?? defaultOwnerId}
            disabled={!canAssignOwner}
          >
            <SelectTrigger
              id="task-owner"
              className="w-full"
              aria-invalid={Boolean(fieldError("ownerId"))}
              aria-describedby={
                fieldError("ownerId") ? "task-owner-error" : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canAssignOwner ? (
            <input
              type="hidden"
              name="ownerId"
              value={task?.ownerId ?? defaultOwnerId}
            />
          ) : null}
        </FormField>
        <FormField
          id="task-priority"
          label={t("fields.priority")}
          error={fieldError("priority")}
        >
          <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
            <SelectTrigger
              id="task-priority"
              className="w-full"
              aria-invalid={Boolean(fieldError("priority"))}
              aria-describedby={
                fieldError("priority") ? "task-priority-error" : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map(
                (priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`priority.${priority}`)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          id="task-due-date"
          label={t("fields.dueDate")}
          error={fieldError("dueDate")}
        >
          <DatePicker
            name="dueDate"
            defaultValue={task?.dueDate ?? ""}
            invalid={Boolean(fieldError("dueDate"))}
            describedBy={
              fieldError("dueDate") ? "task-due-date-error" : undefined
            }
          />
        </FormField>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.status === "success" ? (
          <span className="text-healthy">{t("feedback.saved")}</span>
        ) : state.status === "error" ? (
          <span className="text-risk">{t("feedback.failed")}</span>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? <Spinner aria-label={t("actions.saving")} /> : null}
        {pending ? t("actions.saving") : t("actions.save")}
      </Button>
    </form>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <Field
      data-invalid={Boolean(error)}
      className="[&>[data-slot=select-trigger]]:w-full"
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
