"use client";

import { startTransition, useActionState, useRef } from "react";
import { useTranslations } from "next-intl";

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
  const validation = useTranslations("customers.validation");
  const [state, action, pending] = useActionState(
    contact ? updateContactAction : createContactAction,
    initialState,
  );
  const fieldError = (field: string) => {
    const error = state.fieldErrors?.[field];
    if (!error) return null;
    return validation(error === "REQUIRED" ? "required" : "invalid");
  };

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2" noValidate>
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
        error={fieldError("name")}
      />
      <ContactField
        label={t("email")}
        name="email"
        type="email"
        direction="ltr"
        defaultValue={contact?.email ?? ""}
        error={fieldError("email")}
      />
      <ContactField
        label={t("phone")}
        name="phone"
        direction="ltr"
        defaultValue={contact?.phone ?? ""}
        error={fieldError("phone")}
      />
      <ContactField
        label={t("jobTitle")}
        name="jobTitle"
        defaultValue={contact?.jobTitle ?? ""}
        error={fieldError("jobTitle")}
      />
      <Field
        data-invalid={Boolean(fieldError("accountRole"))}
        className="[&>[data-slot=native-select-wrapper]]:w-full"
      >
        <FieldLabel htmlFor="contact-role">{t("role")}</FieldLabel>
        <Select
          name="accountRole"
          defaultValue={contact?.accountRole ?? "OTHER"}
        >
          <SelectTrigger
            id="contact-role"
            className="w-full"
            aria-invalid={Boolean(fieldError("accountRole"))}
            aria-describedby={
              fieldError("accountRole") ? "contact-role-error" : undefined
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "CHAMPION",
              "DECISION_MAKER",
              "EXECUTIVE_SPONSOR",
              "ADMIN",
              "BILLING",
              "USER",
              "OTHER",
            ].map((role) => (
              <SelectItem key={role} value={role}>
                {t(`roles.${role}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="contact-role-error">
          {fieldError("accountRole")}
        </FieldError>
      </Field>
      <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
        <Checkbox
          id="contact-primary"
          name="isPrimary"
          defaultChecked={contact?.isPrimary}
        />
        <label htmlFor="contact-primary">{t("primary")}</label>
      </label>
      {contact ? (
        <Field
          data-invalid={Boolean(fieldError("status"))}
          className="[&>[data-slot=native-select-wrapper]]:w-full"
        >
          <FieldLabel htmlFor="contact-status">{t("status")}</FieldLabel>
          <Select name="status" defaultValue={contact.status}>
            <SelectTrigger
              id="contact-status"
              className="w-full"
              aria-invalid={Boolean(fieldError("status"))}
              aria-describedby={
                fieldError("status") ? "contact-status-error" : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">{t("statuses.ACTIVE")}</SelectItem>
              <SelectItem value="INACTIVE">{t("statuses.INACTIVE")}</SelectItem>
            </SelectContent>
          </Select>
          <FieldError id="contact-status-error">
            {fieldError("status")}
          </FieldError>
        </Field>
      ) : null}
      <div className="flex items-center gap-3 md:col-span-2">
        <Button disabled={pending} aria-busy={pending}>
          {pending ? <Spinner aria-label={t("saving")} /> : null}
          {pending ? t("saving") : t(contact ? "save" : "add")}
        </Button>
        {state.status === "error" ? (
          <span className="text-risk text-sm" role="alert">
            {t("failed")}
          </span>
        ) : null}
        {state.status === "success" ? (
          <span className="text-healthy text-sm" role="status">
            {t(contact ? "saved" : "added")}
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
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  direction?: "auto" | "ltr";
  defaultValue?: string;
  error?: string | null;
}) {
  const id = `contact-${name}`;
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        dir={direction}
        defaultValue={defaultValue}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
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
      <Button
        type="button"
        variant="link"
        disabled={pending}
        aria-busy={pending}
        onClick={() => startTransition(() => formRef.current?.requestSubmit())}
      >
        {pending ? <Spinner aria-label={t("saving")} /> : null}
        {pending ? t("saving") : t("makePrimary")}
      </Button>
    </form>
  );
}
