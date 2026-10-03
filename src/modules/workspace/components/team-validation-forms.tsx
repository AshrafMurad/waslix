"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";

import { useCustomFormValidation } from "@/components/shared/use-custom-form-validation";
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

import { transferOwnershipAction } from "../actions/team-settings-actions";
import {
  inviteWorkspaceMemberAction,
  type InviteWorkspaceMemberState,
} from "../actions/workspace-invitation-actions";

type TransferMember = {
  id: string;
  user: { name: string; email: string };
};

function focusFirstInvalid(form: HTMLFormElement | null) {
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

export function InviteMemberForm({ locale }: { locale: string }) {
  const t = useTranslations("workspace");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    InviteWorkspaceMemberState,
    FormData
  >(inviteWorkspaceMemberAction, { status: "idle" });
  const { errors, validate, clearError } = useCustomFormValidation([
    { name: "email", type: "email", message: t("validation.email") },
  ]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-raised grid gap-4 rounded-md border p-4 md:grid-cols-[minmax(16rem,1fr)_12rem_auto] md:items-end"
      noValidate
      onSubmit={(event) => {
        if (!validate(new FormData(event.currentTarget))) {
          event.preventDefault();
          focusFirstInvalid(formRef.current);
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="invite-email">{t("team.invite.email")}</FieldLabel>
        <Input
          id="invite-email"
          name="email"
          type="email"
          aria-required="true"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "invite-email-error" : undefined}
          onChange={() => clearError("email")}
        />
        {errors.email ? (
          <FieldError id="invite-email-error">{errors.email}</FieldError>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="invite-role">{t("team.invite.role")}</FieldLabel>
        <Select name="role" defaultValue="CSM">
          <SelectTrigger id="invite-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["CS_MANAGER", "CSM", "VIEWER"] as const).map((role) => (
              <SelectItem key={role} value={role}>
                {t(`roles.${role}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button disabled={pending}>{t("team.invite.send")}</Button>
      {state.messageKey ? (
        <p
          className={
            state.status === "error"
              ? "text-destructive text-sm md:col-span-full"
              : "text-brand-accent text-sm md:col-span-full"
          }
        >
          {t(state.messageKey)}
        </p>
      ) : null}
    </form>
  );
}

export function OwnershipTransferForm({
  locale,
  fromMemberId,
  operationKey,
  targets,
  disabled,
  compact = false,
}: {
  locale: string;
  fromMemberId: string;
  operationKey: string;
  targets: TransferMember[];
  disabled: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("workspace");
  const formRef = useRef<HTMLFormElement>(null);
  const targetErrorId = `transfer-target-${operationKey}-error`;
  const { errors, validate, clearError } = useCustomFormValidation([
    { name: "toMemberId", message: t("validation.transferTarget") },
  ]);

  return (
    <form
      ref={formRef}
      action={transferOwnershipAction}
      className={
        compact
          ? "grid gap-4"
          : "grid gap-4 border-t pt-4 md:grid-cols-[minmax(18rem,auto)_auto_1fr] md:items-end"
      }
      noValidate
      onSubmit={(event) => {
        if (!validate(new FormData(event.currentTarget))) {
          event.preventDefault();
          focusFirstInvalid(formRef.current);
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="fromMemberId" value={fromMemberId} />
      <input type="hidden" name="operationKey" value={operationKey} />
      <Field data-invalid={Boolean(errors.toMemberId)} className="min-w-0">
        <FieldLabel>{t("team.transfer.to")}</FieldLabel>
        <Select
          name="toMemberId"
          onValueChange={() => clearError("toMemberId")}
        >
          <SelectTrigger
            className={compact ? "w-full min-w-0" : "w-full min-w-0 md:w-80"}
            aria-required="true"
            aria-invalid={Boolean(errors.toMemberId)}
            aria-describedby={errors.toMemberId ? targetErrorId : undefined}
          >
            <SelectValue placeholder={t("team.transfer.chooseTarget")} />
          </SelectTrigger>
          <SelectContent>
            {targets.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.user.name} ({member.user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.toMemberId ? (
          <FieldError id={targetErrorId}>{errors.toMemberId}</FieldError>
        ) : null}
      </Field>
      <Button
        className={
          compact ? "w-full" : "md:-translate-y-2 md:justify-self-start"
        }
        disabled={disabled}
      >
        {t("team.transfer.apply")}
      </Button>
    </form>
  );
}
