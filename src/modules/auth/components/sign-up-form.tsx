"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/auth-client";

type SignUpFormProps = {
  invitationToken?: string;
  defaultEmail?: string;
};

export function SignUpForm({ invitationToken, defaultEmail }: SignUpFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);

  function clearFieldError(field: keyof typeof fieldErrors) {
    setError(undefined);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function signUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const nextFieldErrors = {
      name: name ? undefined : t("validation.required"),
      email: !email
        ? t("validation.required")
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? t("validation.email")
          : undefined,
      password: !password
        ? t("validation.required")
        : password.length < 6
          ? t("passwordHint")
          : undefined,
    };

    setError(undefined);
    setFieldErrors(nextFieldErrors);
    if (
      nextFieldErrors.name ||
      nextFieldErrors.email ||
      nextFieldErrors.password
    )
      return;

    setIsPending(true);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(t("signUpFailed"));
        return;
      }

      router.replace(
        invitationToken ? `/invite/${invitationToken}` : "/workspace",
      );
      router.refresh();
    } catch {
      setError(t("signUpFailed"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={signUp}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <Field data-invalid={Boolean(fieldErrors.name)}>
        <FieldLabel htmlFor="sign-up-name">{t("name")}</FieldLabel>
        <Input
          id="sign-up-name"
          name="name"
          autoComplete="name"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "sign-up-name-error" : undefined}
          onChange={() => clearFieldError("name")}
          dir="auto"
        />
        <FieldError id="sign-up-name-error">{fieldErrors.name}</FieldError>
      </Field>
      <Field data-invalid={Boolean(fieldErrors.email)}>
        <FieldLabel htmlFor="sign-up-email">{t("email")}</FieldLabel>
        <Input
          id="sign-up-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "sign-up-email-error" : undefined
          }
          onChange={() => clearFieldError("email")}
          dir="ltr"
        />
        <FieldError id="sign-up-email-error">{fieldErrors.email}</FieldError>
      </Field>
      <Field data-invalid={Boolean(fieldErrors.password)}>
        <FieldLabel htmlFor="sign-up-password">{t("password")}</FieldLabel>
        <Input
          id="sign-up-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby="sign-up-password-error"
          onChange={() => clearFieldError("password")}
          dir="ltr"
        />
        <FieldError id="sign-up-password-error">
          {fieldErrors.password ?? t("passwordHint")}
        </FieldError>
      </Field>
      {error ? (
        <p className="text-risk text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? <Spinner aria-label={t("signingUp")} /> : null}
        {isPending ? t("signingUp") : t("signUp")}
      </Button>
    </form>
  );
}
