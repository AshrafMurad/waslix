"use client";

import { startTransition, useActionState } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { DatePicker } from "@/components/shared/date-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  changeRenewalStageAction,
  recordChurnedAction,
  recordRenewedAction,
  saveRenewalAction,
  type RenewalActionState,
} from "../actions/renewal-actions";

const initialState: RenewalActionState = { status: "idle" };
const stages = [
  "UPCOMING",
  "PREPARING",
  "DISCUSSION",
  "NEGOTIATION",
  "COMMITTED",
] as const;
const outcomes = ["RENEWED", "EXPANDED", "CONTRACTED"] as const;

function operationKey() {
  return crypto.randomUUID();
}

type Owner = { id: string; name: string };
type Renewal = {
  id: string;
  ownerId: string;
  contractValue: string;
  currency: string;
  startAt: Date | null;
  renewalAt: Date;
  stage: string;
  readinessStatus: string | null;
  readinessPending: boolean;
  readinessReasons: unknown;
  readinessCalculatedAt: Date | null;
  expectedOutcome: string | null;
  outcome: string | null;
  completedAt: Date | null;
  churnReason: string | null;
  owner: { user: { name: string } };
};

export function RenewalPanel({
  locale,
  customerId,
  renewals,
  owners,
  defaultOwnerId,
  defaultCurrency,
  canManage,
}: {
  locale: string;
  customerId: string;
  renewals: Renewal[];
  owners: Owner[];
  defaultOwnerId: string;
  defaultCurrency: string;
  canManage: boolean;
}) {
  const t = useTranslations("renewals");
  const active = renewals.find(
    (renewal) => !["RENEWED", "CHURNED"].includes(renewal.stage),
  );
  const history = renewals.filter((renewal) =>
    ["RENEWED", "CHURNED"].includes(renewal.stage),
  );
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
        {active ? (
          <RenewalDetails
            locale={locale}
            customerId={customerId}
            renewal={active}
            canManage={canManage || active.ownerId === defaultOwnerId}
          />
        ) : (
          <p className="text-muted-foreground mt-5 text-sm">{t("empty")}</p>
        )}
      </Card>
      <div className="space-y-6">
        {canManage ? (
          <RenewalForm
            locale={locale}
            customerId={customerId}
            renewal={active ?? null}
            owners={owners}
            defaultOwnerId={active?.ownerId ?? defaultOwnerId}
            defaultCurrency={active?.currency ?? defaultCurrency}
          />
        ) : null}
        <Card className="p-5">
          <h3 className="font-semibold">{t("history.title")}</h3>
          {history.length ? (
            <ul className="mt-3 divide-y">
              {history.map((renewal) => (
                <HistoryItem key={renewal.id} renewal={renewal} />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              {t("history.empty")}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function RenewalDetails({
  locale,
  customerId,
  renewal,
  canManage,
}: {
  locale: string;
  customerId: string;
  renewal: Renewal;
  canManage: boolean;
}) {
  const t = useTranslations("renewals");
  const format = useFormatter();
  const reasons = Array.isArray(renewal.readinessReasons)
    ? renewal.readinessReasons.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("fields.renewalAt")}
          value={format.dateTime(renewal.renewalAt, { dateStyle: "medium" })}
        />
        <Metric
          label={t("fields.value")}
          value={format.number(Number(renewal.contractValue), {
            style: "currency",
            currency: renewal.currency,
            currencyDisplay: "code",
          })}
        />
        <Metric label={t("fields.stage")} value={t(`stage.${renewal.stage}`)} />
      </div>
      <div className="rounded-md border p-4">
        <p
          className={
            renewal.readinessStatus === "AT_RISK"
              ? "text-risk font-medium"
              : renewal.readinessStatus === "NEEDS_ATTENTION"
                ? "text-attention font-medium"
                : renewal.readinessStatus === "HEALTHY"
                  ? "text-healthy font-medium"
                  : "font-medium"
          }
        >
          {renewal.readinessStatus
            ? t(`readiness.${renewal.readinessStatus}`)
            : t("readiness.notAssessed")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {renewal.readinessPending
            ? t("readiness.pending")
            : renewal.readinessCalculatedAt
              ? t("readiness.calculated", {
                  date: format.dateTime(renewal.readinessCalculatedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })
              : t("readiness.window")}
        </p>
        {reasons.length ? (
          <ul className="mt-3 grid gap-1 text-sm">
            {reasons.map((reason) => (
              <li key={reason} className="text-muted-foreground">
                {t(`reasons.${reason}`)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {canManage ? (
        <RenewalWorkflow
          locale={locale}
          customerId={customerId}
          renewal={renewal}
        />
      ) : null}
    </div>
  );
}

function RenewalWorkflow({
  locale,
  customerId,
  renewal,
}: {
  locale: string;
  customerId: string;
  renewal: Renewal;
}) {
  const t = useTranslations("renewals");
  const [stageState, stageAction, stagePending] = useActionState(
    changeRenewalStageAction,
    initialState,
  );
  const [renewedState, renewedAction, renewedPending] = useActionState(
    recordRenewedAction,
    initialState,
  );
  const [churnedState, churnedAction, churnedPending] = useActionState(
    recordChurnedAction,
    initialState,
  );
  const submit = (
    action: (formData: FormData) => void,
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    startTransition(() => action(new FormData(event.currentTarget)));
  };
  return (
    <div className="grid gap-4 rounded-md border p-4">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => submit(stageAction, event)}
      >
        <Hidden
          locale={locale}
          customerId={customerId}
          renewalId={renewal.id}
        />
        <Field>
          <FieldLabel>{t("fields.stage")}</FieldLabel>
          <Select name="stage" defaultValue={renewal.stage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {t(`stage.${stage}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>{t("fields.note")}</FieldLabel>
          <Input name="note" />
        </Field>
        <Button type="submit" className="self-end" disabled={stagePending}>
          {stagePending ? t("actions.saving") : t("actions.changeStage")}
        </Button>
      </form>
      <ActionFeedback
        state={stageState}
        success={t("feedback.saved")}
        failed={t("feedback.failed")}
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => submit(renewedAction, event)}
      >
        <Hidden
          locale={locale}
          customerId={customerId}
          renewalId={renewal.id}
        />
        <Field>
          <FieldLabel>{t("fields.outcome")}</FieldLabel>
          <Select name="outcome" defaultValue="RENEWED">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {outcomes.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {t(`outcome.${outcome}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DateField name="nextRenewalAt" label={t("fields.nextRenewalAt")} />
        <Field>
          <FieldLabel>{t("fields.nextValue")}</FieldLabel>
          <Input
            name="nextContractValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue={renewal.contractValue}
          />
        </Field>
        <Field>
          <FieldLabel>{t("fields.currency")}</FieldLabel>
          <Input
            name="nextCurrency"
            maxLength={3}
            defaultValue={renewal.currency}
            dir="ltr"
          />
        </Field>
        <Button type="submit" disabled={renewedPending}>
          {renewedPending ? t("actions.saving") : t("actions.recordRenewed")}
        </Button>
      </form>
      <ActionFeedback
        state={renewedState}
        success={t("feedback.completed")}
        failed={t("feedback.failed")}
      />
      <form
        className="grid gap-3"
        onSubmit={(event) => submit(churnedAction, event)}
      >
        <Hidden
          locale={locale}
          customerId={customerId}
          renewalId={renewal.id}
        />
        <Field>
          <FieldLabel>{t("fields.churnReason")}</FieldLabel>
          <Textarea name="churnReason" rows={3} maxLength={10000} />
        </Field>
        <Button type="submit" variant="outline" disabled={churnedPending}>
          {churnedPending ? t("actions.saving") : t("actions.recordChurned")}
        </Button>
      </form>
      <ActionFeedback
        state={churnedState}
        success={t("feedback.completed")}
        failed={t("feedback.failed")}
      />
    </div>
  );
}

function RenewalForm({
  locale,
  customerId,
  renewal,
  owners,
  defaultOwnerId,
  defaultCurrency,
}: {
  locale: string;
  customerId: string;
  renewal: Renewal | null;
  owners: Owner[];
  defaultOwnerId: string;
  defaultCurrency: string;
}) {
  const t = useTranslations("renewals");
  const [state, action, pending] = useActionState(
    saveRenewalAction,
    initialState,
  );
  return (
    <Card className="p-5">
      <h3 className="font-semibold">
        {renewal ? t("form.edit") : t("form.create")}
      </h3>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => action(new FormData(event.currentTarget)));
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="operationKey" value={operationKey()} />
        {renewal ? (
          <input type="hidden" name="renewalId" value={renewal.id} />
        ) : null}
        <Field>
          <FieldLabel>{t("fields.owner")}</FieldLabel>
          <Select name="ownerId" defaultValue={defaultOwnerId}>
            <SelectTrigger className="w-full">
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
        </Field>
        <DateField
          name="renewalAt"
          label={t("fields.renewalAt")}
          defaultValue={renewal?.renewalAt.toISOString().slice(0, 10) ?? ""}
        />
        <DateField
          name="startAt"
          label={t("fields.startAt")}
          defaultValue={renewal?.startAt?.toISOString().slice(0, 10) ?? ""}
        />
        <Field>
          <FieldLabel>{t("fields.value")}</FieldLabel>
          <Input
            name="contractValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue={renewal?.contractValue ?? "0"}
          />
        </Field>
        <Field>
          <FieldLabel>{t("fields.currency")}</FieldLabel>
          <Input
            name="currency"
            maxLength={3}
            defaultValue={renewal?.currency ?? defaultCurrency}
            dir="ltr"
          />
        </Field>
        <ActionFeedback
          state={state}
          success={t("feedback.saved")}
          failed={t("feedback.failed")}
        />
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner aria-label={t("actions.saving")} /> : null}
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
      </form>
    </Card>
  );
}

function Hidden({
  locale,
  customerId,
  renewalId,
}: {
  locale: string;
  customerId: string;
  renewalId: string;
}) {
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="renewalId" value={renewalId} />
      <input type="hidden" name="operationKey" value={operationKey()} />
    </>
  );
}

function DateField({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <DatePicker name={name} defaultValue={defaultValue} />
    </Field>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-raised rounded-md p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-medium" dir="auto">
        {value}
      </p>
    </div>
  );
}

function HistoryItem({ renewal }: { renewal: Renewal }) {
  const t = useTranslations("renewals");
  const format = useFormatter();
  return (
    <li className="py-3">
      <p className="font-medium">
        {t(`stage.${renewal.stage}`)} ·{" "}
        {format.dateTime(renewal.renewalAt, { dateStyle: "medium" })}
      </p>
      <p className="text-muted-foreground text-sm">
        {renewal.outcome ? t(`outcome.${renewal.outcome}`) : t("missing")}
      </p>
    </li>
  );
}

function ActionFeedback({
  state,
  success,
  failed,
}: {
  state: RenewalActionState;
  success: string;
  failed: string;
}) {
  return (
    <div aria-live="polite" className="text-sm">
      {state.status === "success" ? (
        <span className="text-healthy">{success}</span>
      ) : state.status === "error" ? (
        <FieldError>{failed}</FieldError>
      ) : null}
    </div>
  );
}
