"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import type { Locale } from "@/i18n/config";
import { authClient } from "@/lib/auth/auth-client";

export function SignOutButton({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace(`/${locale}/sign-in`);
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="rounded-md border px-4 py-2">
      {t("signOut")}
    </button>
  );
}
