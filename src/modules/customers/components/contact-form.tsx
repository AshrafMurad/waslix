"use client";

import { startTransition, useActionState, useRef } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import {
  createContactAction,
  type CustomerActionState,
  setPrimaryContactAction,
  updateContactAction,
} from "../actions/customer-actions";

const initialState: CustomerActionState = { status: "idle" };

type ContactFormProps = {
  customerId: string;
  locale: string;
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    accountRole: string;
    isPrimary: boolean;
    status: "ACTIVE" | "INACTIVE";
  };
};

export function ContactForm({ customerId, locale, contact }: ContactFormProps) {
  const t = useTranslations("customers.contacts");
  const [state, action, pending] = useActionState(
    contact ? updateContactAction : createContactAction,
    initialState,
  );
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="locale" value={locale} />
      {contact ? (
        <input type="hidden" name="contactId" value={contact.id} />
      ) : null}
      <ContactField
        label={t("name")}
        name="name"
        required
        defaultValue={contact?.name}
      />
      <ContactField
        label={t("email")}
        name="email"
        type="email"
        direction="ltr"
        defaultValue={contact?.email ?? ""}
      />
      <ContactField
        label={t("phone")}
        name="phone"
        direction="ltr"
        defaultValue={contact?.phone ?? ""}
      />
      <ContactField
        label={t("jobTitle")}
        name="jobTitle"
        defaultValue={contact?.jobTitle ?? ""}
      />
      <label className="grid gap-2 text-sm font-medium">
        {t("role")}
        <select
          name="accountRole"
          defaultValue={contact?.accountRole}
          className="bg-background h-10 rounded-md border px-3"
        >
          {[
            "CHAMPION",
            "DECISION_MAKER",
            "EXECUTIVE_SPONSOR",
            "ADMIN",
            "BILLING",
            "USER",
            "OTHER",
          ].map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
        <input
          type="checkbox"
          name="isPrimary"
          defaultChecked={contact?.isPrimary}
          className="accent-primary size-4"
        />
        {t("primary")}
      </label>
      {contact ? (
        <label className="grid gap-2 text-sm font-medium">
          {t("status")}
          <select
            name="status"
            defaultValue={contact.status}
            className="bg-background h-10 rounded-md border px-3"
          >
            <option value="ACTIVE">{t("statuses.ACTIVE")}</option>
            <option value="INACTIVE">{t("statuses.INACTIVE")}</option>
          </select>
        </label>
      ) : null}
      <div className="flex items-center gap-3 md:col-span-2">
        <Button disabled={pending}>
          {pending ? t("saving") : t(contact ? "save" : "add")}
        </Button>
        {state.status === "error" ? (
          <span className="text-risk text-sm" role="alert">
            {t("failed")}
          </span>
        ) : null}
        {state.status === "success" ? (
          <span className="text-healthy text-sm" role="status">
            {t("added")}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function ContactField({
  label,
  name,
  type = "text",
  required,
  direction = "auto",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  direction?: "auto" | "ltr";
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        dir={direction}
        defaultValue={defaultValue}
        className="bg-background h-10 rounded-md border px-3"
      />
    </label>
  );
}

export function SetPrimaryContactButton({
  customerId,
  contactId,
  locale,
}: {
  customerId: string;
  contactId: string;
  locale: string;
}) {
  const t = useTranslations("customers.contacts");
  const formRef = useRef<HTMLFormElement>(null);
  const [, action, pending] = useActionState(
    setPrimaryContactAction,
    initialState,
  );
  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="locale" value={locale} />
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => formRef.current?.requestSubmit())}
        className="text-brand-accent hover:underline disabled:opacity-50"
      >
        {t("makePrimary")}
      </button>
    </form>
  );
}
