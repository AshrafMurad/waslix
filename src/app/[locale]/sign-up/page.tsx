import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { AuthNavigation } from "@/modules/auth/components/auth-navigation";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";
import { getInvitationByToken } from "@/modules/workspace/services/workspace-invitations";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  params,
  searchParams,
}: SignUpPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const token = first((await searchParams).invite);
  const invitation = token ? await getInvitationByToken(token) : null;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <AuthNavigation />
      <div className="bg-card mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-6xl overflow-hidden rounded-lg border shadow-[0_30px_80px_-55px_rgb(15_23_42_/_0.65)] sm:min-h-[calc(100vh-6.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-primary text-primary-foreground relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:linear-gradient(rgb(255_255_255_/_0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.08)_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.18]"
          />
          <div className="relative flex items-center">
            <BrandLogo className="w-28" />
          </div>

          <div className="relative max-w-lg space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl leading-[1.08] font-bold tracking-[-0.04em] text-balance xl:text-5xl">
                {t("signUpValueTitle")}
              </h2>
              <p className="text-primary-foreground/78 max-w-[56ch] text-base leading-7">
                {t("signUpValueDescription")}
              </p>
            </div>
            <div className="space-y-3" aria-label={t("signUpJourneyLabel")}>
              {(["workspace", "customer", "action"] as const).map(
                (step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-md border border-white/15 bg-white/[0.06] px-4 py-3.5"
                  >
                    <span className="text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full border border-white/28 bg-white/10 text-sm font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-primary-foreground/92 text-sm font-medium">
                      {t(`signUpJourney.${step}`)}
                    </span>
                    {index < 2 ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="text-primary-foreground/58 ms-auto size-4 rtl:rotate-180"
                      />
                    ) : (
                      <Check
                        aria-hidden="true"
                        className="text-primary-foreground/78 ms-auto size-4"
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          <p className="text-primary-foreground/72 relative flex items-center gap-2 text-sm">
            <ShieldCheck
              aria-hidden="true"
              className="text-primary-foreground/78 size-4"
            />
            {t("signUpTrust")}
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="flex w-full max-w-md flex-col gap-7">
            <div className="flex items-center lg:hidden">
              <BrandLogo className="w-24" />
            </div>
            <div className="space-y-3">
              <p className="text-brand-accent text-sm font-medium">
                {t("accountStep")}
              </p>
              <h1 className="text-3xl leading-tight font-bold tracking-[-0.035em] text-balance">
                {t("signUpTitle")}
              </h1>
              <p className="text-muted-foreground max-w-[52ch] text-sm leading-6">
                {invitation
                  ? t("invitedSignUp", {
                      workspace: invitation.workspace.name,
                    })
                  : t("signUpDescription")}
              </p>
            </div>
            <SignUpForm
              invitationToken={token}
              defaultEmail={invitation?.email}
            />
            <p className="text-muted-foreground border-t pt-5 text-sm">
              {t("hasAccount")}{" "}
              <Link
                className="text-brand-accent font-semibold underline-offset-4 hover:underline"
                href={token ? `/sign-in?invite=${token}` : "/sign-in"}
              >
                {t("signIn")}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
