"use client";

import { useActionState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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

import {
  archiveCustomerAction,
  createCustomerAction,
  type CustomerActionState,
  updateCustomerAction,
} from "../actions/customer-actions";

type CustomerFormValues = {
  name: string;
  website: string;
  industry: string;
  companySize: string;
  contractValue: string;
  currency: string;
  customerSince: string;
  renewalDate: string;
  lifecycleStageId: string;
  ownerId: string;
  tags: string;
};

type CustomerFormProps = {
  locale: string;
  customerId?: string;
  defaultValues: CustomerFormValues;
  lifecycleStages: Array<{ id: string; name: string }>;
  owners: Array<{ id: string; user: { name: string } }>;
  canAssignOwner: boolean;
};

const initialState: CustomerActionState = { status: "idle" };

export function CustomerForm({
  locale,
  customerId,
  defaultValues,
  lifecycleStages,
  owners,
  canAssignOwner,
}: CustomerFormProps) {
  const t = useTranslations("customers");
  const action = customerId ? updateCustomerAction : createCustomerAction;
  const [state, submitAction, isPending] = useActionState(action, initialState);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({ defaultValues });

  const fieldError = (field: keyof CustomerFormValues) => {
    if (errors[field]) return t("validation.required");
    if (state.fieldErrors?.[field] === "REQUIRED")
      return t("validation.required");
    if (state.fieldErrors?.[field]) return t("validation.invalid");
    return null;
  };
  const submit = handleSubmit((_values, event) => {
    if (!(event?.currentTarget instanceof HTMLFormElement)) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => submitAction(formData));
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={submit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      {customerId ? (
        <input type="hidden" name="customerId" value={customerId} />
      ) : null}
      <FormField
        id="customer-name"
        label={t("fields.name")}
        error={fieldError("name")}
      >
        <Input
          id="customer-name"
          {...register("name", { required: true })}
          dir="auto"
          aria-invalid={Boolean(fieldError("name"))}
          aria-describedby={
            fieldError("name") ? "customer-name-error" : undefined
          }
        />
      </FormField>
      <FormField
        id="customer-website"
        label={t("fields.website")}
        error={fieldError("website")}
      >
        <Input
          id="customer-website"
          {...register("website")}
          type="url"
          dir="ltr"
          aria-invalid={Boolean(fieldError("website"))}
          aria-describedby={
            fieldError("website") ? "customer-website-error" : undefined
          }
        />
      </FormField>
      <FormField
        id="customer-industry"
        label={t("fields.industry")}
        error={fieldError("industry")}
      >
        <Input
          id="customer-industry"
          {...register("industry")}
          dir="auto"
          aria-invalid={Boolean(fieldError("industry"))}
          aria-describedby={
            fieldError("industry") ? "customer-industry-error" : undefined
          }
        />
      </FormField>
      <FormField
        id="customer-company-size"
        label={t("fields.companySize")}
        error={fieldError("companySize")}
      >
        <Input
          id="customer-company-size"
          {...register("companySize")}
          type="number"
          min="0"
          aria-invalid={Boolean(fieldError("companySize"))}
          aria-describedby={
            fieldError("companySize")
              ? "customer-company-size-error"
              : undefined
          }
        />
      </FormField>
      <FormField
        id="customer-contract-value"
        label={t("fields.contractValue")}
        error={fieldError("contractValue") ?? fieldError("currency")}
      >
        <div className="flex gap-2">
          <Input
            id="customer-contract-value"
            {...register("contractValue")}
            inputMode="decimal"
            className="flex-1"
            dir="ltr"
            aria-invalid={Boolean(fieldError("contractValue"))}
            aria-describedby={
              fieldError("contractValue")
                ? "customer-contract-value-error"
                : undefined
            }
          />
          <Input
            {...register("currency", { required: true })}
            maxLength={3}
            className="w-20 uppercase"
            dir="ltr"
            aria-label={t("fields.currency")}
            aria-invalid={Boolean(fieldError("currency"))}
            aria-describedby={
              fieldError("currency")
                ? "customer-contract-value-error"
                : undefined
            }
          />
        </div>
      </FormField>
      <FormField
        id="customer-lifecycle"
        label={t("fields.lifecycle")}
        error={fieldError("lifecycleStageId")}
      >
        <Controller
          name="lifecycleStageId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="customer-lifecycle"
                className="w-full"
                aria-invalid={Boolean(fieldError("lifecycleStageId"))}
                aria-describedby={
                  fieldError("lifecycleStageId")
                    ? "customer-lifecycle-error"
                    : undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lifecycleStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField
        id="customer-owner"
        label={t("fields.owner")}
        error={fieldError("ownerId")}
      >
        <Controller
          name="ownerId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              disabled={!canAssignOwner}
            >
              <SelectTrigger
                id="customer-owner"
                className="w-full"
                aria-invalid={Boolean(fieldError("ownerId"))}
                aria-describedby={
                  fieldError("ownerId") ? "customer-owner-error" : undefined
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
          )}
        />
        {!canAssignOwner ? (
          <input type="hidden" name="ownerId" value={defaultValues.ownerId} />
        ) : null}
      </FormField>
      <FormField
        id="customer-tags"
        label={t("fields.tags")}
        error={fieldError("tags")}
      >
        <Input
          id="customer-tags"
          {...register("tags")}
          dir="auto"
          placeholder={t("fields.tagsHint")}
          aria-invalid={Boolean(fieldError("tags"))}
          aria-describedby={
            fieldError("tags") ? "customer-tags-error" : undefined
          }
        />
      </FormField>
      <FormField
        id="customer-since"
        label={t("fields.customerSince")}
        error={fieldError("customerSince")}
      >
        <Controller
          name="customerSince"
          control={control}
          render={({ field }) => (
            <DatePicker
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              invalid={Boolean(fieldError("customerSince"))}
              describedBy={
                fieldError("customerSince") ? "customer-since-error" : undefined
              }
            />
          )}
        />
      </FormField>
      <FormField
        id="customer-renewal-date"
        label={t("fields.renewalDate")}
        error={fieldError("renewalDate")}
      >
        <Controller
          name="renewalDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              invalid={Boolean(fieldError("renewalDate"))}
              describedBy={
                fieldError("renewalDate")
                  ? "customer-renewal-date-error"
                  : undefined
              }
            />
          )}
        />
      </FormField>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? <Spinner aria-label={t("actions.saving")} /> : null}
          {isPending ? t("actions.saving") : t("actions.save")}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}

export function ArchiveCustomerButton({
  customerId,
  locale,
}: {
  customerId: string;
  locale: string;
}) {
  const t = useTranslations("customers");
  const [state, action, pending] = useActionState(
    archiveCustomerAction,
    initialState,
  );
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="locale" value={locale} />
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? <Spinner aria-label={t("actions.archiving")} /> : null}
        {pending ? t("actions.archiving") : t("actions.archive")}
      </Button>
      {state.status === "error" ? (
        <span className="text-risk text-sm" role="alert">
          {t("feedback.failed")}
        </span>
      ) : null}
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
      className="[&>[data-slot=select]]:w-full"
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

function FormStatus({ state }: { state: CustomerActionState }) {
  const t = useTranslations("customers");
  if (state.status === "success") {
    return (
      <p className="text-healthy text-sm" role="status">
        {t("feedback.saved")}
      </p>
    );
  }
  if (state.status === "error") {
    const key = state.code === "CUSTOMER_ARCHIVED" ? "archived" : "failed";
    return (
      <p className="text-risk text-sm" role="alert">
        {t(`feedback.${key}`)}
      </p>
    );
  }
  return null;
}
import { DatePicker } from "@/components/shared/date-picker";
