"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/auth-client";

export function SignOutButton() {
  const t = useTranslations("auth");
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={signOut}
      variant="ghost"
      className="mt-1 w-full justify-start"
    >
      {t("signOut")}
    </Button>
  );
}
