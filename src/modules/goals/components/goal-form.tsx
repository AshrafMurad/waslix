"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

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

import { saveGoalAction, type GoalActionState } from "../actions/goal-actions";

const initialState: GoalActionState = { status: "idle" };

type GoalFormProps = {
  customerId: string;
  locale: string;
  operationKey: string;
  owners: Array<{ id: string; name: string }>;
  defaultOwnerId: string;
  goal?: {
    id: string;
    title: string;
    description: string | null;
    ownerId: string;
    progress: number;
    status: string;
    targetDate: Date | null;
  };
};

export function GoalForm(props: GoalFormProps) {
  const t = useTranslations("goals");
  const [state, action, pending] = useActionState(saveGoalAction, initialState);
  const fieldError = (field: string) => {
    const error = state.fieldErrors?.[field];
    return error
      ? t(error === "REQUIRED" ? "validation.required" : "validation.invalid")
      : null;
  };

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="hidden" name="customerId" value={props.customerId} />
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="operationKey" value={props.operationKey} />
      {props.goal ? (
        <input type="hidden" name="goalId" value={props.goal.id} />
      ) : null}
      <Field
        data-invalid={Boolean(fieldError("title"))}
        className="sm:col-span-2"
      >
        <FieldLabel htmlFor={`goal-title-${props.goal?.id ?? "new"}`}>
          {t("fields.title")}
        </FieldLabel>
        <Input
          id={`goal-title-${props.goal?.id ?? "new"}`}
          name="title"
          defaultValue={props.goal?.title}
          dir="auto"
          aria-invalid={Boolean(fieldError("title"))}
        />
        <FieldError>{fieldError("title")}</FieldError>
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`goal-description-${props.goal?.id ?? "new"}`}>
          {t("fields.description")}
        </FieldLabel>
        <Textarea
          id={`goal-description-${props.goal?.id ?? "new"}`}
          name="description"
          defaultValue={props.goal?.description ?? ""}
          dir="auto"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`goal-owner-${props.goal?.id ?? "new"}`}>
          {t("fields.owner")}
        </FieldLabel>
        <Select
          name="ownerId"
          defaultValue={props.goal?.ownerId ?? props.defaultOwnerId}
        >
          <SelectTrigger
            id={`goal-owner-${props.goal?.id ?? "new"}`}
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.owners.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={`goal-status-${props.goal?.id ?? "new"}`}>
          {t("fields.status")}
        </FieldLabel>
        <Select
          name="status"
          defaultValue={props.goal?.status ?? "NOT_STARTED"}
        >
          <SelectTrigger
            id={`goal-status-${props.goal?.id ?? "new"}`}
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                "NOT_STARTED",
                "IN_PROGRESS",
                "AT_RISK",
                "ACHIEVED",
                "CANCELLED",
              ] as const
            ).map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field data-invalid={Boolean(fieldError("progress"))}>
        <FieldLabel htmlFor={`goal-progress-${props.goal?.id ?? "new"}`}>
          {t("fields.progress")}
        </FieldLabel>
        <Input
          id={`goal-progress-${props.goal?.id ?? "new"}`}
          name="progress"
          type="number"
          min="0"
          max="100"
          defaultValue={props.goal?.progress ?? 0}
          aria-invalid={Boolean(fieldError("progress"))}
        />
        <FieldError>{fieldError("progress")}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor={`goal-target-${props.goal?.id ?? "new"}`}>
          {t("fields.targetDate")}
        </FieldLabel>
        <Input
          id={`goal-target-${props.goal?.id ?? "new"}`}
          name="targetDate"
          type="date"
          defaultValue={
            props.goal?.targetDate?.toISOString().slice(0, 10) ?? ""
          }
        />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={pending} aria-busy={pending}>
          {pending ? <Spinner aria-label={t("actions.saving")} /> : null}
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
        {state.status === "error" ? (
          <span className="text-risk text-sm" role="alert">
            {t("feedback.failed")}
          </span>
        ) : null}
        {state.status === "success" ? (
          <span className="text-healthy text-sm" role="status">
            {t("feedback.saved")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
