import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLocale } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import { AuthenticationRequiredError } from "@/lib/auth/access-context";
import { createWorkspaceAction } from "@/modules/workspace/actions/workspace-onboarding-actions";
import { getWorkspaceOnboardingState } from "@/modules/workspace/services/workspace-onboarding";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  let state: Awaited<ReturnType<typeof getWorkspaceOnboardingState>>;
  try {
    state = await getWorkspaceOnboardingState(await headers());
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect({ href: "/sign-in", locale });
    }
    throw error;
  }

  const activeWorkspace = state.memberships[0]?.workspace;
  if (activeWorkspace?.onboardingCompleted) {
    redirect({ href: "/overview", locale });
  }

  const t = await getTranslations({ locale, namespace: "workspace" });

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
            {t("onboarding.eyebrow")}
          </p>
          <CardTitle>{t("onboarding.title")}</CardTitle>
          <CardDescription>{t("onboarding.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createWorkspaceAction} className="grid gap-5">
            <input type="hidden" name="locale" value={locale} />
            <div className="space-y-2">
              <Label htmlFor="workspace-name">{t("onboarding.name")}</Label>
              <Input id="workspace-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-plan">{t("onboarding.plan")}</Label>
              <Select name="plan" defaultValue="FREE">
                <SelectTrigger id="workspace-plan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["FREE", "STARTER", "PRO", "BUSINESS"] as const).map(
                    (plan) => (
                      <SelectItem key={plan} value={plan}>
                        {t(`plans.${plan}`)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                {t("onboarding.planNote")}
              </p>
            </div>
            <Button className="w-full sm:w-auto">{t("onboarding.submit")}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
