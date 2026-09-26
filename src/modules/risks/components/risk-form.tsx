"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { saveRiskAction, type RiskActionState } from "../actions/risk-actions";

const initial: RiskActionState = { status: "idle" };

type RiskValue = {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  type: string;
  severity: string;
  ownerId: string;
  targetResolutionDate: string | null;
};

export function RiskForm({
  locale,
  operationKey,
  customers,
  owners,
  lockedCustomerId,
  value,
}: {
  locale: string;
  operationKey: string;
  customers: Array<{ id: string; name: string; ownerId: string }>;
  owners: Array<{ id: string; name: string }>;
  lockedCustomerId?: string;
  value?: RiskValue;
}) {
  const t = useTranslations("risks");
  const [state, action, pending] = useActionState(saveRiskAction, initial);
  const customerId = lockedCustomerId ?? value?.customerId;
  const defaultOwner =
    value?.ownerId ??
    customers.find((item) => item.id === customerId)?.ownerId ??
    owners[0]?.id;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="operationKey" value={operationKey} />
      {value ? <input type="hidden" name="riskId" value={value.id} /> : null}
      {lockedCustomerId ? (
        <input type="hidden" name="customerId" value={lockedCustomerId} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`risk-customer-${operationKey}`}>
            {t("fields.customer")}
          </Label>
          <select
            id={`risk-customer-${operationKey}`}
            name="customerId"
            defaultValue={customerId}
            required
            className="bg-background min-h-10 w-full rounded-md border px-3"
          >
            <option value="">{t("fields.chooseCustomer")}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`risk-title-${operationKey}`}>
          {t("fields.title")}
        </Label>
        <Input
          id={`risk-title-${operationKey}`}
          name="title"
          defaultValue={value?.title}
          required
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`risk-description-${operationKey}`}>
          {t("fields.description")}
        </Label>
        <Textarea
          id={`risk-description-${operationKey}`}
          name="description"
          defaultValue={value?.description ?? ""}
          maxLength={10000}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`risk-type-${operationKey}`}>
            {t("fields.type")}
          </Label>
          <select
            id={`risk-type-${operationKey}`}
            name="type"
            defaultValue={value?.type ?? "OTHER"}
            className="bg-background min-h-10 w-full rounded-md border px-3"
          >
            {(
              [
                "USAGE",
                "ENGAGEMENT",
                "SUPPORT",
                "STAKEHOLDER",
                "ONBOARDING",
                "RENEWAL",
                "COMMERCIAL",
                "OTHER",
              ] as const
            ).map((type) => (
              <option key={type} value={type}>
                {t(`type.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`risk-severity-${operationKey}`}>
            {t("fields.severity")}
          </Label>
          <select
            id={`risk-severity-${operationKey}`}
            name="severity"
            defaultValue={value?.severity ?? "MEDIUM"}
            className="bg-background min-h-10 w-full rounded-md border px-3"
          >
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map(
              (severity) => (
                <option key={severity} value={severity}>
                  {t(`severity.${severity}`)}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`risk-owner-${operationKey}`}>
            {t("fields.owner")}
          </Label>
          <select
            id={`risk-owner-${operationKey}`}
            name="ownerId"
            defaultValue={defaultOwner}
            className="bg-background min-h-10 w-full rounded-md border px-3"
          >
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`risk-target-${operationKey}`}>
            {t("fields.targetDate")}
          </Label>
          <Input
            id={`risk-target-${operationKey}`}
            type="date"
            name="targetResolutionDate"
            defaultValue={value?.targetResolutionDate ?? ""}
          />
        </div>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-risk text-sm">
          {t(
            `feedback.${state.code === "RISK_RESOLUTION_NOTE_REQUIRED" ? "noteRequired" : "failed"}`,
          )}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p role="status" className="text-healthy text-sm">
          {t("feedback.saved")}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.saving") : t("actions.save")}
      </Button>
    </form>
  );
}
