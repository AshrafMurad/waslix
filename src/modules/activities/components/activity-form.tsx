"use client";

import { startTransition, useActionState } from "react";
import { useTranslations } from "next-intl";

import { DateTimePicker } from "@/components/shared/date-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import {
  createActivityAction,
  type ActivityActionState,
} from "../actions/activity-actions";

const initialState: ActivityActionState = { status: "idle" };

export function ActivityForm({
  customerId,
  locale,
  operationKey,
  contacts,
}: {
  customerId: string;
  locale: string;
  operationKey: string;
  contacts: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("timeline");
  const [state, action, pending] = useActionState(
    createActivityAction,
    initialState,
  );
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const localTime = formData.get("occurredAt");
    if (typeof localTime === "string" && localTime) {
      formData.set("occurredAt", new Date(localTime).toISOString());
    }
    startTransition(() => action(formData));
  };
  const fieldError = (field: string) => {
    const error = state.fieldErrors?.[field];
    if (!error) return null;
    return t(`validation.${error === "REQUIRED" ? "required" : "invalid"}`);
  };
  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="operationKey" value={operationKey} />
      <Field
        data-invalid={Boolean(fieldError("type"))}
        className="[&>[data-slot=native-select-wrapper]]:w-full"
      >
        <FieldLabel htmlFor="activity-type">{t("activity.type")}</FieldLabel>
        <Select name="type" defaultValue="MEETING">
          <SelectTrigger
            id="activity-type"
            className="w-full"
            aria-invalid={Boolean(fieldError("type"))}
            aria-describedby={
              fieldError("type") ? "activity-type-error" : undefined
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["MEETING", "CALL", "EMAIL", "NOTE"] as const).map((type) => (
              <SelectItem value={type} key={type}>
                {t(`types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="activity-type-error">{fieldError("type")}</FieldError>
      </Field>
      <Field data-invalid={Boolean(fieldError("title"))}>
        <FieldLabel htmlFor="activity-title">{t("activity.title")}</FieldLabel>
        <Input
          id="activity-title"
          name="title"
          aria-required="true"
          maxLength={200}
          dir="auto"
          aria-invalid={Boolean(fieldError("title"))}
          aria-describedby={
            fieldError("title") ? "activity-title-error" : undefined
          }
        />
        <FieldError id="activity-title-error">{fieldError("title")}</FieldError>
      </Field>
      <Field data-invalid={Boolean(fieldError("description"))}>
        <FieldLabel htmlFor="activity-description">
          {t("activity.description")}
        </FieldLabel>
        <Textarea
          id="activity-description"
          name="description"
          maxLength={10000}
          rows={3}
          dir="auto"
          aria-invalid={Boolean(fieldError("description"))}
          aria-describedby={
            fieldError("description") ? "activity-description-error" : undefined
          }
        />
        <FieldError id="activity-description-error">
          {fieldError("description")}
        </FieldError>
      </Field>
      <Field
        data-invalid={Boolean(fieldError("contactId"))}
        className="[&>[data-slot=native-select-wrapper]]:w-full"
      >
        <FieldLabel htmlFor="activity-contact">
          {t("activity.contact")}
        </FieldLabel>
        <Select name="contactId" defaultValue="none">
          <SelectTrigger
            id="activity-contact"
            className="w-full"
            aria-invalid={Boolean(fieldError("contactId"))}
            aria-describedby={
              fieldError("contactId") ? "activity-contact-error" : undefined
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("activity.noContact")}</SelectItem>
            {contacts.map((contact) => (
              <SelectItem value={contact.id} key={contact.id}>
                {contact.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="activity-contact-error">
          {fieldError("contactId")}
        </FieldError>
      </Field>
      <Field data-invalid={Boolean(fieldError("occurredAt"))}>
        <FieldLabel htmlFor="activity-occurred-at">
          {t("activity.occurredAt")}
        </FieldLabel>
        <DateTimePicker
          name="occurredAt"
          invalid={Boolean(fieldError("occurredAt"))}
          describedBy={
            fieldError("occurredAt") ? "activity-occurred-at-error" : undefined
          }
        />
        <FieldError id="activity-occurred-at-error">
          {fieldError("occurredAt")}
        </FieldError>
      </Field>
      <div className="flex items-center gap-2 text-sm">
        <Checkbox id="activity-meaningful" name="isMeaningful" defaultChecked />
        <label htmlFor="activity-meaningful">{t("activity.meaningful")}</label>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.status === "success" ? (
          <span className="text-healthy">{t("feedback.saved")}</span>
        ) : null}
        {state.status === "error" ? (
          <span className="text-risk">{t("feedback.failed")}</span>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? <Spinner aria-label={t("actions.saving")} /> : null}
        {pending ? t("actions.saving") : t("actions.addActivity")}
      </Button>
    </form>
  );
}
