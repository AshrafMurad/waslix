"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/auth-client";

type SignInFormProps = {
  defaultEmail?: string;
  defaultPassword?: string;
};

export function SignInForm({ defaultEmail, defaultPassword }: SignInFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const nextFieldErrors = {
      email: !email
        ? t("validation.required")
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? t("validation.email")
          : undefined,
      password: password ? undefined : t("validation.required"),
    };

    setFieldErrors(nextFieldErrors);
    setError(undefined);
    if (nextFieldErrors.email || nextFieldErrors.password) return;
    setIsPending(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(t("invalidCredentials"));
        return;
      }

      router.replace("/overview");
      router.refresh();
    } catch {
      setError(t("signInFailed"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={signIn}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <Field data-invalid={Boolean(fieldErrors.email)}>
        <FieldLabel htmlFor="sign-in-email">{t("email")}</FieldLabel>
        <Input
          id="sign-in-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "sign-in-email-error" : undefined
          }
          dir="ltr"
        />
        <FieldError id="sign-in-email-error">{fieldErrors.email}</FieldError>
      </Field>
      <Field data-invalid={Boolean(fieldErrors.password)}>
        <FieldLabel htmlFor="sign-in-password">{t("password")}</FieldLabel>
        <Input
          id="sign-in-password"
          name="password"
          type="password"
          defaultValue={defaultPassword}
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "sign-in-password-error" : undefined
          }
          dir="ltr"
        />
        <FieldError id="sign-in-password-error">
          {fieldErrors.password}
        </FieldError>
      </Field>
      {error ? (
        <p className="text-risk text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? <Spinner aria-label={t("signingIn")} /> : null}
        {isPending ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}
