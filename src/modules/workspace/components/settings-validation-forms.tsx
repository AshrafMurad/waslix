"use client";

import { useRef } from "react";
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

import {
  updateLifecycleStageSettingsAction,
  updateWorkspaceSettingsAction,
} from "../actions/team-settings-actions";

function focusFirstInvalid(form: HTMLFormElement | null) {
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

export function WorkspaceProfileForm({
  locale,
  name,
  timezone,
}: {
  locale: string;
  name: string;
  timezone: string;
}) {
  const t = useTranslations("workspace");
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, validate, clearError } = useCustomFormValidation([
    { name: "name", message: t("validation.required") },
    { name: "timezone", message: t("validation.required") },
  ]);

  return (
    <form
      ref={formRef}
      action={updateWorkspaceSettingsAction}
      className="grid gap-4 md:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        if (!validate(new FormData(event.currentTarget))) {
          event.preventDefault();
          focusFirstInvalid(formRef.current);
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="workspace-name">
          {t("settings.profile.name")}
        </FieldLabel>
        <Input
          id="workspace-name"
          name="name"
          defaultValue={name}
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "workspace-name-error" : undefined}
          onChange={() => clearError("name")}
        />
        {errors.name ? (
          <FieldError id="workspace-name-error">{errors.name}</FieldError>
        ) : null}
      </Field>
      <Field data-invalid={Boolean(errors.timezone)}>
        <FieldLabel htmlFor="workspace-timezone">
          {t("settings.profile.timezone")}
        </FieldLabel>
        <Input
          id="workspace-timezone"
          name="timezone"
          defaultValue={timezone}
          aria-required="true"
          aria-invalid={Boolean(errors.timezone)}
          aria-describedby={
            errors.timezone ? "workspace-timezone-error" : undefined
          }
          onChange={() => clearError("timezone")}
        />
        {errors.timezone ? (
          <FieldError id="workspace-timezone-error">
            {errors.timezone}
          </FieldError>
        ) : null}
      </Field>
      <div className="md:col-span-2">
        <Button>{t("settings.profile.save")}</Button>
      </div>
    </form>
  );
}

export function LifecycleStageSettingsForm({
  locale,
  stage,
}: {
  locale: string;
  stage: { id: string; name: string; key: string; isActive: boolean };
}) {
  const t = useTranslations("workspace");
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, validate, clearError } = useCustomFormValidation([
    { name: "name", message: t("validation.required") },
  ]);

  return (
    <form
      ref={formRef}
      action={updateLifecycleStageSettingsAction}
      className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-start"
      noValidate
      onSubmit={(event) => {
        if (!validate(new FormData(event.currentTarget))) {
          event.preventDefault();
          focusFirstInvalid(formRef.current);
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="stageId" value={stage.id} />
      <Field data-invalid={Boolean(errors.name)}>
        <Input
          name="name"
          defaultValue={stage.name}
          aria-label={t("settings.lifecycle.name")}
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={
            errors.name ? `stage-${stage.id}-name-error` : undefined
          }
          className="font-medium"
          onChange={() => clearError("name")}
        />
        {errors.name ? (
          <FieldError id={`stage-${stage.id}-name-error`}>
            {errors.name}
          </FieldError>
        ) : null}
      </Field>
      <code className="py-2">{stage.key}</code>
      <Select name="isActive" defaultValue={stage.isActive ? "true" : "false"}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">{t("settings.lifecycle.active")}</SelectItem>
          <SelectItem value="false">
            {t("settings.lifecycle.inactive")}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline">{t("settings.lifecycle.save")}</Button>
    </form>
  );
}
