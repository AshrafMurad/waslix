"use client";

import { startTransition, useActionState } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { DatePicker } from "@/components/shared/date-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  changeMilestoneStatusAction,
  moveToAdoptionAction,
  startOnboardingAction,
  updateMilestoneAction,
  type OnboardingActionState,
} from "../actions/onboarding-actions";

const initialState: OnboardingActionState = { status: "idle" };

function operationKey() {
  return crypto.randomUUID();
}

type Owner = { id: string; name: string };
type Milestone = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  position: number;
  isCritical: boolean;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  dueDate: Date | null;
  completedAt: Date | null;
  owner: { user: { name: string } };
};

export function OnboardingPanel({
  locale,
  customerId,
  onboarding,
  progress,
  owners,
  defaultOwnerId,
  canManage,
  shouldSuggestAdoption,
}: {
  locale: string;
  customerId: string;
  onboarding: {
    id: string;
    ownerId: string;
    startDate: Date | null;
    targetCompletionDate: Date | null;
    completedAt: Date | null;
    milestones: Milestone[];
  } | null;
  progress: {
    progress: number;
    completedCount: number;
    totalCount: number;
    isDelayed: boolean;
    delayedMilestoneIds: string[];
  } | null;
  owners: Owner[];
  defaultOwnerId: string;
  canManage: boolean;
  shouldSuggestAdoption: boolean;
}) {
  const t = useTranslations("onboarding");
  const format = useFormatter();
  const [startState, startAction, startPending] = useActionState(
    startOnboardingAction,
    initialState,
  );
  const [adoptionState, adoptionAction, adoptionPending] = useActionState(
    moveToAdoptionAction,
    initialState,
  );
  const submit = (
    action: (formData: FormData) => void,
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    startTransition(() => action(new FormData(event.currentTarget)));
  };

  if (!onboarding) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-semibold">{t("start.title")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("start.description")}
        </p>
        {canManage ? (
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => submit(startAction, event)}
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="customerId" value={customerId} />
            <input type="hidden" name="operationKey" value={operationKey()} />
            <OwnerSelect
              owners={owners}
              defaultValue={defaultOwnerId}
              label={t("fields.owner")}
            />
            <DateField name="startDate" label={t("fields.startDate")} />
            <DateField
              name="targetCompletionDate"
              label={t("fields.targetDate")}
            />
            <ActionFeedback
              state={startState}
              success={t("feedback.started")}
              failed={t("feedback.failed")}
            />
            <Button type="submit" disabled={startPending}>
              {startPending ? (
                <Spinner aria-label={t("actions.starting")} />
              ) : null}
              {startPending ? t("actions.starting") : t("actions.start")}
            </Button>
          </form>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("progress", {
                  completed: progress?.completedCount ?? 0,
                  total: progress?.totalCount ?? 0,
                  percent: progress?.progress ?? 0,
                })}
              </p>
            </div>
            <span
              className={
                progress?.isDelayed
                  ? "text-risk font-medium"
                  : "text-healthy font-medium"
              }
            >
              {progress?.isDelayed ? t("state.delayed") : t("state.onTrack")}
            </span>
          </div>
        </div>
        <ul className="divide-y">
          {onboarding.milestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              locale={locale}
              customerId={customerId}
              milestone={milestone}
              owners={owners}
              canManage={canManage || milestone.ownerId === defaultOwnerId}
              isDelayed={
                progress?.delayedMilestoneIds.includes(milestone.id) ?? false
              }
            />
          ))}
        </ul>
      </Card>
      <div className="space-y-6">
        <Card className="p-5">
          <h3 className="font-semibold">{t("summary.title")}</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <Summary
              label={t("fields.startDate")}
              value={
                onboarding.startDate
                  ? format.dateTime(onboarding.startDate, {
                      dateStyle: "medium",
                    })
                  : t("missing")
              }
            />
            <Summary
              label={t("fields.targetDate")}
              value={
                onboarding.targetCompletionDate
                  ? format.dateTime(onboarding.targetCompletionDate, {
                      dateStyle: "medium",
                    })
                  : t("missing")
              }
            />
            <Summary
              label={t("summary.completedAt")}
              value={
                onboarding.completedAt
                  ? format.dateTime(onboarding.completedAt, {
                      dateStyle: "medium",
                    })
                  : t("missing")
              }
            />
          </dl>
        </Card>
        {shouldSuggestAdoption ? (
          <Card className="border-information/40 p-5">
            <h3 className="font-semibold">{t("adoption.title")}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("adoption.description")}
            </p>
            <form
              className="mt-4"
              onSubmit={(event) => submit(adoptionAction, event)}
            >
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="customerId" value={customerId} />
              <input type="hidden" name="onboardingId" value={onboarding.id} />
              <input type="hidden" name="operationKey" value={operationKey()} />
              <ActionFeedback
                state={adoptionState}
                success={t("feedback.adopted")}
                failed={t("feedback.failed")}
              />
              <Button type="submit" disabled={adoptionPending} className="mt-3">
                {adoptionPending ? (
                  <Spinner aria-label={t("actions.moving")} />
                ) : null}
                {adoptionPending
                  ? t("actions.moving")
                  : t("actions.moveToAdoption")}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function MilestoneItem({
  locale,
  customerId,
  milestone,
  owners,
  canManage,
  isDelayed,
}: {
  locale: string;
  customerId: string;
  milestone: Milestone;
  owners: Owner[];
  canManage: boolean;
  isDelayed: boolean;
}) {
  const t = useTranslations("onboarding");
  const format = useFormatter();
  const [state, action, pending] = useActionState(
    changeMilestoneStatusAction,
    initialState,
  );
  const [editState, editAction, editPending] = useActionState(
    updateMilestoneAction,
    initialState,
  );
  const nextStatus =
    milestone.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
  return (
    <li className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium" dir="auto">
              {milestone.position}. {milestone.title}
            </p>
            {milestone.isCritical ? (
              <span className="text-attention text-xs font-medium">
                {t("critical")}
              </span>
            ) : null}
            {isDelayed ? (
              <span className="text-risk text-xs font-medium">
                {t("state.delayed")}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-sm" dir="auto">
            {milestone.description ?? t("noDescription")}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("milestoneMeta", {
              owner: milestone.owner.user.name,
              due: milestone.dueDate
                ? format.dateTime(milestone.dueDate, { dateStyle: "medium" })
                : t("missing"),
              status: t(`status.${milestone.status}`),
            })}
          </p>
        </div>
        {canManage ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => action(new FormData(event.currentTarget)));
            }}
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="customerId" value={customerId} />
            <input type="hidden" name="milestoneId" value={milestone.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <input type="hidden" name="operationKey" value={operationKey()} />
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? <Spinner aria-label={t("actions.saving")} /> : null}
              {milestone.status === "COMPLETED"
                ? t("actions.reopen")
                : t("actions.complete")}
            </Button>
          </form>
        ) : null}
      </div>
      {canManage ? (
        <form
          className="mt-4 grid gap-3 rounded-md border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() =>
              editAction(new FormData(event.currentTarget)),
            );
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="milestoneId" value={milestone.id} />
          <input type="hidden" name="operationKey" value={operationKey()} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("fields.title")}</FieldLabel>
              <Input
                name="title"
                defaultValue={milestone.title}
                maxLength={200}
                dir="auto"
              />
            </Field>
            <OwnerSelect
              owners={owners}
              defaultValue={milestone.ownerId}
              label={t("fields.owner")}
            />
          </div>
          <Field>
            <FieldLabel>{t("fields.description")}</FieldLabel>
            <Textarea
              name="description"
              defaultValue={milestone.description ?? ""}
              rows={2}
              maxLength={10000}
              dir="auto"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              name="dueDate"
              label={t("fields.dueDate")}
              defaultValue={milestone.dueDate?.toISOString().slice(0, 10) ?? ""}
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                name="isCritical"
                defaultChecked={milestone.isCritical}
              />
              {t("fields.critical")}
            </label>
          </div>
          <ActionFeedback
            state={editState}
            success={t("feedback.saved")}
            failed={t("feedback.failed")}
          />
          <Button type="submit" size="sm" disabled={editPending}>
            {editPending ? t("actions.saving") : t("actions.saveMilestone")}
          </Button>
        </form>
      ) : null}
      <ActionFeedback
        state={state}
        success={t("feedback.saved")}
        failed={t("feedback.failed")}
      />
    </li>
  );
}

function OwnerSelect({
  owners,
  defaultValue,
  label,
}: {
  owners: Owner[];
  defaultValue: string;
  label: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select name="ownerId" defaultValue={defaultValue}>
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

function ActionFeedback({
  state,
  success,
  failed,
}: {
  state: OnboardingActionState;
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium" dir="auto">
        {value}
      </dd>
    </div>
  );
}
