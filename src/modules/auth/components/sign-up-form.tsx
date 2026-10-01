"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/auth-client";

type SignUpFormProps = {
  invitationToken?: string;
  defaultEmail?: string;
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

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
  const [showPassword, setShowPassword] = useState(false);

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
        : password.length < MIN_PASSWORD_LENGTH
          ? t("validation.passwordMin", { count: MIN_PASSWORD_LENGTH })
          : password.length > MAX_PASSWORD_LENGTH
            ? t("validation.passwordMax", { count: MAX_PASSWORD_LENGTH })
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
        switch (result.error.code) {
          case "PASSWORD_TOO_SHORT":
            setFieldErrors((current) => ({
              ...current,
              password: t("validation.passwordMin", {
                count: MIN_PASSWORD_LENGTH,
              }),
            }));
            break;
          case "PASSWORD_TOO_LONG":
            setFieldErrors((current) => ({
              ...current,
              password: t("validation.passwordMax", {
                count: MAX_PASSWORD_LENGTH,
              }),
            }));
            break;
          case "INVALID_EMAIL":
            setFieldErrors((current) => ({
              ...current,
              email: t("validation.email"),
            }));
            break;
          case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
          case "USER_ALREADY_EXISTS":
            setFieldErrors((current) => ({
              ...current,
              email: t("validation.emailInUse"),
            }));
            break;
          default:
            setError(t("signUpFailed"));
        }
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
    <form onSubmit={signUp} className="flex w-full flex-col gap-5" noValidate>
      <Field data-invalid={Boolean(fieldErrors.name)}>
        <FieldLabel htmlFor="sign-up-name">{t("name")}</FieldLabel>
        <Input
          id="sign-up-name"
          name="name"
          autoComplete="name"
          maxLength={200}
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
        <div className="relative">
          <Input
            id="sign-up-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password
                ? "sign-up-password-error sign-up-password-hint"
                : "sign-up-password-hint"
            }
            onChange={() => clearFieldError("password")}
            className="pe-10"
            dir="ltr"
          />
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-1 end-1 inline-flex w-8 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-[3px]"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <FieldDescription id="sign-up-password-hint">
          {t("passwordHint", { count: MIN_PASSWORD_LENGTH })}
        </FieldDescription>
        <FieldError id="sign-up-password-error">
          {fieldErrors.password}
        </FieldError>
      </Field>
      {error ? (
        <p className="text-risk text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <Spinner aria-label={t("signingUp")} /> : null}
        {isPending ? t("signingUp") : t("signUp")}
      </Button>
    </form>
  );
}
