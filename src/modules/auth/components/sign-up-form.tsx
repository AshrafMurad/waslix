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
  const [isPending, setIsPending] = useState(false);

  async function signUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    setError(undefined);
    if (!name || !email || !password || password.length < 6) {
      setError(t("validation.required"));
      return;
    }

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
      <Field>
        <FieldLabel htmlFor="sign-up-name">{t("name")}</FieldLabel>
        <Input id="sign-up-name" name="name" autoComplete="name" required />
      </Field>
      <Field>
        <FieldLabel htmlFor="sign-up-email">{t("email")}</FieldLabel>
        <Input
          id="sign-up-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          required
          dir="ltr"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="sign-up-password">{t("password")}</FieldLabel>
        <Input
          id="sign-up-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          dir="ltr"
        />
        <FieldError>{t("passwordHint")}</FieldError>
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
