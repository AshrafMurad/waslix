import { ArrowRight, Building2, Check, UsersRound } from "lucide-react";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
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
  if (!isLocale(locale)) notFound();
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
    <main className="bg-background text-foreground min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <BrandLogo className="w-24" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {t("onboarding.progress")}
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="overflow-hidden">
            <div className="bg-brand h-1" aria-hidden="true" />
            <CardHeader className="pb-2">
              <div className="bg-brand/10 text-brand-accent mb-3 flex size-11 items-center justify-center rounded-md">
                <Building2 aria-hidden="true" className="size-5" />
              </div>
              <CardTitle className="text-3xl tracking-[-0.035em] text-balance">
                {t("onboarding.title")}
              </CardTitle>
              <CardDescription className="max-w-[60ch] text-base leading-6">
                {t("onboarding.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form action={createWorkspaceAction} className="grid gap-6">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="plan" value="FREE" />
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">{t("onboarding.name")}</Label>
                  <Input
                    id="workspace-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={200}
                    autoFocus
                    autoComplete="organization"
                    placeholder={t("onboarding.namePlaceholder")}
                    dir="auto"
                    className="h-11"
                  />
                  <p className="text-muted-foreground text-sm">
                    {t("onboarding.nameHint")}
                  </p>
                </div>
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
            </CardContent>
          </Card>

          <aside className="bg-raised/35 rounded-lg border p-5 lg:sticky lg:top-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="bg-brand/10 text-brand-accent flex size-9 items-center justify-center rounded-md">
                <UsersRound aria-hidden="true" className="size-4" />
              </span>
              <h2 className="font-semibold">{t("onboarding.nextTitle")}</h2>
            </div>
            <ol className="space-y-4">
              {(["workspace", "customer", "action"] as const).map(
                (step, index) => (
                  <li key={step} className="flex gap-3">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${index === 0 ? "bg-brand text-brand-foreground" : "bg-background text-muted-foreground border"}`}
                    >
                      {index === 0 ? (
                        <Check aria-hidden="true" className="size-3.5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {t(`onboarding.steps.${step}.title`)}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-sm leading-5">
                        {t(`onboarding.steps.${step}.description`)}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
