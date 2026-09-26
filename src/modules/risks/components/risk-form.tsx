"use client";

import { startTransition, useActionState } from "react";
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

import { saveRiskAction, type RiskActionState } from "../actions/risk-actions";

const initialState: RiskActionState = { status: "idle" };
const riskTypes = [
  "USAGE",
  "ENGAGEMENT",
  "SUPPORT",
  "STAKEHOLDER",
  "ONBOARDING",
  "RENEWAL",
  "COMMERCIAL",
  "OTHER",
] as const;
const riskSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type RiskValue = {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  type: (typeof riskTypes)[number];
  severity: (typeof riskSeverities)[number];
  ownerId: string;
  targetResolutionDate: string | null;
};

type RiskFormProps = {
  locale: string;
  operationKey: string;
  customers: Array<{ id: string; name: string; ownerId: string }>;
  owners: Array<{ id: string; name: string }>;
  lockedCustomerId?: string;
  value?: RiskValue;
};

export function RiskForm({
  locale,
  operationKey,
  customers,
  owners,
  lockedCustomerId,
  value,
}: RiskFormProps) {
  const t = useTranslations("risks");
  const [state, action, pending] = useActionState(saveRiskAction, initialState);
  const customerId = lockedCustomerId ?? value?.customerId;
  const defaultOwner =
    value?.ownerId ??
    customers.find((item) => item.id === customerId)?.ownerId ??
    owners[0]?.id;
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => action(new FormData(event.currentTarget)));
  };
  const fieldError = (field: string) => {
    const error = state.fieldErrors?.[field];
    if (!error) return null;
    return t(`validation.${error === "REQUIRED" ? "required" : "invalid"}`);
  };
  const fieldId = (field: string) => `risk-${field}-${operationKey}`;

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="operationKey" value={operationKey} />
      {value ? <input type="hidden" name="riskId" value={value.id} /> : null}
      {lockedCustomerId ? (
        <input type="hidden" name="customerId" value={lockedCustomerId} />
      ) : (
        <FormField
          id={fieldId("customer")}
          label={t("fields.customer")}
          error={fieldError("customerId")}
        >
          <Select name="customerId" defaultValue={customerId}>
            <SelectTrigger
              id={fieldId("customer")}
              className="w-full"
              aria-invalid={Boolean(fieldError("customerId"))}
              aria-describedby={
                fieldError("customerId")
                  ? `${fieldId("customer")}-error`
                  : undefined
              }
            >
              <SelectValue placeholder={t("fields.chooseCustomer")} />
            </SelectTrigger>
            <SelectContent>
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
        id={fieldId("title")}
        label={t("fields.title")}
        error={fieldError("title")}
      >
        <Input
          id={fieldId("title")}
          name="title"
          defaultValue={value?.title ?? ""}
          maxLength={200}
          dir="auto"
          aria-required="true"
          aria-invalid={Boolean(fieldError("title"))}
          aria-describedby={
            fieldError("title") ? `${fieldId("title")}-error` : undefined
          }
        />
      </FormField>
      <FormField
        id={fieldId("description")}
        label={t("fields.description")}
        error={fieldError("description")}
      >
        <Textarea
          id={fieldId("description")}
          name="description"
          defaultValue={value?.description ?? ""}
          maxLength={10000}
          rows={3}
          dir="auto"
          aria-invalid={Boolean(fieldError("description"))}
          aria-describedby={
            fieldError("description")
              ? `${fieldId("description")}-error`
              : undefined
          }
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={fieldId("type")}
          label={t("fields.type")}
          error={fieldError("type")}
        >
          <Select name="type" defaultValue={value?.type ?? "OTHER"}>
            <SelectTrigger
              id={fieldId("type")}
              className="w-full"
              aria-invalid={Boolean(fieldError("type"))}
              aria-describedby={
                fieldError("type") ? `${fieldId("type")}-error` : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {riskTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`type.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          id={fieldId("severity")}
          label={t("fields.severity")}
          error={fieldError("severity")}
        >
          <Select name="severity" defaultValue={value?.severity ?? "MEDIUM"}>
            <SelectTrigger
              id={fieldId("severity")}
              className="w-full"
              aria-invalid={Boolean(fieldError("severity"))}
              aria-describedby={
                fieldError("severity")
                  ? `${fieldId("severity")}-error`
                  : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {riskSeverities.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {t(`severity.${severity}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={fieldId("owner")}
          label={t("fields.owner")}
          error={fieldError("ownerId")}
        >
          <Select name="ownerId" defaultValue={defaultOwner}>
            <SelectTrigger
              id={fieldId("owner")}
              className="w-full"
              aria-invalid={Boolean(fieldError("ownerId"))}
              aria-describedby={
                fieldError("ownerId") ? `${fieldId("owner")}-error` : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          id={fieldId("target-date")}
          label={t("fields.targetDate")}
          error={fieldError("targetResolutionDate")}
        >
          <DatePicker
            name="targetResolutionDate"
            defaultValue={value?.targetResolutionDate ?? ""}
            invalid={Boolean(fieldError("targetResolutionDate"))}
            describedBy={
              fieldError("targetResolutionDate")
                ? `${fieldId("target-date")}-error`
                : undefined
            }
          />
        </FormField>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.status === "success" ? (
          <span className="text-healthy">{t("feedback.saved")}</span>
        ) : state.status === "error" && state.code !== "VALIDATION_ERROR" ? (
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
