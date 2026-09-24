"use client";

import { startTransition, useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

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
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="operationKey" value={operationKey} />
      <label className="grid gap-1 text-sm font-medium">
        {t("activity.type")}
        <select
          name="type"
          className="bg-background h-10 rounded-md border px-3"
        >
          {(["MEETING", "CALL", "EMAIL", "NOTE"] as const).map((type) => (
            <option value={type} key={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {t("activity.title")}
        <input
          name="title"
          required
          maxLength={200}
          className="bg-background h-10 rounded-md border px-3"
          dir="auto"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {t("activity.description")}
        <textarea
          name="description"
          maxLength={10000}
          rows={3}
          className="bg-background rounded-md border px-3 py-2"
          dir="auto"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {t("activity.contact")}
        <select
          name="contactId"
          className="bg-background h-10 rounded-md border px-3"
        >
          <option value="">{t("activity.noContact")}</option>
          {contacts.map((contact) => (
            <option value={contact.id} key={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {t("activity.occurredAt")}
        <input
          name="occurredAt"
          type="datetime-local"
          required
          className="bg-background h-10 rounded-md border px-3"
          dir="ltr"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isMeaningful" type="checkbox" defaultChecked />
        {t("activity.meaningful")}
      </label>
      <div aria-live="polite" className="text-sm">
        {state.status === "success" ? (
          <span className="text-healthy">{t("feedback.saved")}</span>
        ) : null}
        {state.status === "error" ? (
          <span className="text-risk">{t("feedback.failed")}</span>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.saving") : t("actions.addActivity")}
      </Button>
    </form>
  );
}
