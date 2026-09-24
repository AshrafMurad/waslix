"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

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
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({ defaultValues });

  const fieldError = (field: keyof CustomerFormValues) => {
    if (errors[field]) return t("validation.required");
    if (state.fieldErrors?.[field]) return t("validation.invalid");
    return null;
  };
  const submit = handleSubmit((_values, event) => {
    if (!(event?.currentTarget instanceof HTMLFormElement)) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => submitAction(formData));
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
      <input type="hidden" name="locale" value={locale} />
      {customerId ? (
        <input type="hidden" name="customerId" value={customerId} />
      ) : null}
      <Field label={t("fields.name")} error={fieldError("name")}>
        <input
          {...register("name", { required: true })}
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="auto"
        />
      </Field>
      <Field label={t("fields.website")} error={fieldError("website")}>
        <input
          {...register("website")}
          type="url"
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="ltr"
        />
      </Field>
      <Field label={t("fields.industry")} error={fieldError("industry")}>
        <input
          {...register("industry")}
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="auto"
        />
      </Field>
      <Field label={t("fields.companySize")} error={fieldError("companySize")}>
        <input
          {...register("companySize")}
          type="number"
          min="0"
          className="bg-background h-10 w-full rounded-md border px-3"
        />
      </Field>
      <Field
        label={t("fields.contractValue")}
        error={fieldError("contractValue")}
      >
        <div className="flex gap-2">
          <input
            {...register("contractValue")}
            inputMode="decimal"
            className="bg-background h-10 min-w-0 flex-1 rounded-md border px-3"
            dir="ltr"
          />
          <input
            {...register("currency", { required: true })}
            maxLength={3}
            className="bg-background h-10 w-20 rounded-md border px-3 uppercase"
            dir="ltr"
            aria-label={t("fields.currency")}
          />
        </div>
      </Field>
      <Field
        label={t("fields.lifecycle")}
        error={fieldError("lifecycleStageId")}
      >
        <select
          {...register("lifecycleStageId", { required: true })}
          className="bg-background h-10 w-full rounded-md border px-3"
        >
          {lifecycleStages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("fields.owner")} error={fieldError("ownerId")}>
        <select
          {...register("ownerId", { required: true })}
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
          <input type="hidden" name="ownerId" value={defaultValues.ownerId} />
        ) : null}
      </Field>
      <Field label={t("fields.tags")} error={fieldError("tags")}>
        <input
          {...register("tags")}
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="auto"
          placeholder={t("fields.tagsHint")}
        />
      </Field>
      <Field
        label={t("fields.customerSince")}
        error={fieldError("customerSince")}
      >
        <input
          {...register("customerSince")}
          type="date"
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="ltr"
        />
      </Field>
      <Field label={t("fields.renewalDate")} error={fieldError("renewalDate")}>
        <input
          {...register("renewalDate")}
          type="date"
          className="bg-background h-10 w-full rounded-md border px-3"
          dir="ltr"
        />
      </Field>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={isPending}>
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
      <Button type="submit" variant="outline" disabled={pending}>
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="grid content-start gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <span className="text-risk text-xs">{error}</span> : null}
    </label>
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
