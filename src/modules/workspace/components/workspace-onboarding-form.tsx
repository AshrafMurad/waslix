"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCustomFormValidation } from "@/components/shared/use-custom-form-validation";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { createWorkspaceAction } from "../actions/workspace-onboarding-actions";

export function WorkspaceOnboardingForm({ locale }: { locale: string }) {
  const t = useTranslations("workspace");
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, validate, clearError } = useCustomFormValidation([
    {
      name: "name",
      minLength: 2,
      message: t("validation.workspaceName"),
    },
  ]);

  return (
    <form
      ref={formRef}
      action={createWorkspaceAction}
      className="grid gap-6"
      noValidate
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        if (!validate(formData)) {
          event.preventDefault();
          formRef.current
            ?.querySelector<HTMLElement>('[aria-invalid="true"]')
            ?.focus();
          return;
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="plan" value="FREE" />
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="workspace-name">{t("onboarding.name")}</FieldLabel>
        <Input
          id="workspace-name"
          name="name"
          minLength={2}
          maxLength={200}
          autoFocus
          autoComplete="organization"
          placeholder={t("onboarding.namePlaceholder")}
          dir="auto"
          className="h-11"
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={
            errors.name
              ? "workspace-name-error workspace-name-hint"
              : "workspace-name-hint"
          }
          onChange={() => clearError("name")}
        />
        {errors.name ? (
          <FieldError id="workspace-name-error">{errors.name}</FieldError>
        ) : null}
        <p id="workspace-name-hint" className="text-muted-foreground text-sm">
          {t("onboarding.nameHint")}
        </p>
      </Field>
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {t("onboarding.freeNote")}
        </p>
        <Button size="lg" className="group w-full sm:w-auto">
          {t("onboarding.submit")}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          />
        </Button>
      </div>
    </form>
  );
}
