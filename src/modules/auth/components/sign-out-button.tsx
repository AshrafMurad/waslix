"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/auth-client";

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      await authClient.signOut();
      router.replace("/sign-in");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={signOut}
      variant="ghost"
      disabled={pending}
      aria-busy={pending}
      className={cn("mt-1 w-full justify-start", className)}
    >
      {pending ? <Spinner aria-label={t("signingOut")} /> : null}
      {pending ? t("signingOut") : t("signOut")}
    </Button>
  );
}
