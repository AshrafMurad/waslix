"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import type { Locale } from "@/i18n/config";
import { authClient } from "@/lib/auth/auth-client";

export function SignInForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function signIn(formData: FormData) {
    setError(undefined);
    setIsPending(true);

    const result = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (result.error) {
      setError(t("invalidCredentials"));
      setIsPending(false);
      return;
    }

    router.replace(`/${locale}/workspace`);
    router.refresh();
  }

  return (
    <form action={signIn} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span>{t("email")}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span>{t("password")}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border px-3 py-2"
        />
      </label>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:opacity-50"
      >
        {isPending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}
