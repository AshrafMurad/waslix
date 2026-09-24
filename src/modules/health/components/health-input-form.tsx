"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import {
  type HealthActionState,
  updateHealthInputAction,
  useSystemHealthInputAction,
} from "../actions/health-actions";

const initialState: HealthActionState = { status: "idle" };

export function HealthInputForm({
  customerId,
  locale,
  dimension,
  operationKey,
  latest,
  isManualOverride,
}: {
  customerId: string;
  locale: string;
  dimension: "USAGE" | "ENGAGEMENT" | "SUPPORT" | "GOALS";
  operationKey: string;
  latest: { value: number; observedAt: Date; isSimulated: boolean } | null;
  isManualOverride: boolean;
}) {
  const t = useTranslations("health");
  const [state, action, pending] = useActionState(
    updateHealthInputAction,
    initialState,
  );
  const [systemState, systemAction, systemPending] = useActionState(
    useSystemHealthInputAction,
    initialState,
  );
  const error = state.fieldErrors?.value || state.fieldErrors?.observedAt;
  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="font-medium">{t(`dimensions.${dimension}`)}</h3>
      <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="dimension" value={dimension} />
        <input type="hidden" name="operationKey" value={operationKey} />
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor={`health-value-${dimension}`}>
            {t("inputs.value")}
          </FieldLabel>
          <Input
            id={`health-value-${dimension}`}
            name="value"
            type="number"
            min="0"
            max="100"
            defaultValue={latest?.value ?? ""}
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor={`health-observed-${dimension}`}>
            {t("inputs.observedAt")}
          </FieldLabel>
          <Input
            id={`health-observed-${dimension}`}
            name="observedAt"
            type="date"
            defaultValue={(latest?.observedAt ?? new Date())
              .toISOString()
              .slice(0, 10)}
            aria-invalid={Boolean(error)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <Checkbox name="isSimulated" defaultChecked={latest?.isSimulated} />
          {t("inputs.simulated")}
        </label>
        <FieldError className="sm:col-span-2">
          {error ? t("validation.invalid") : null}
        </FieldError>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button disabled={pending}>
            {pending ? <Spinner aria-label={t("actions.saving")} /> : null}
            {pending ? t("actions.saving") : t("actions.saveInput")}
          </Button>
          {state.status === "error" ? (
            <span className="text-risk text-sm" role="alert">
              {t("feedback.failed")}
            </span>
          ) : null}
          {state.status === "success" ? (
            <span className="text-healthy text-sm" role="status">
              {t("feedback.queued")}
            </span>
          ) : null}
        </div>
      </form>
      {(dimension === "ENGAGEMENT" || dimension === "GOALS") &&
      isManualOverride ? (
        <form action={systemAction}>
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="dimension" value={dimension} />
          <input
            type="hidden"
            name="operationKey"
            value={crypto.randomUUID()}
          />
          <Button variant="outline" disabled={systemPending}>
            {t("actions.useSystem")}
          </Button>
          {systemState.status === "error" ? (
            <span className="text-risk ms-3 text-sm" role="alert">
              {t("feedback.failed")}
            </span>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
