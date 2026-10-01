import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
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
      <div className="bg-card mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-lg border shadow-[0_30px_80px_-55px_rgb(15_23_42_/_0.65)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#102522] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:linear-gradient(rgb(255_255_255_/_0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.12)_1px,transparent_1px)] [background-size:48px_48px] opacity-20"
          />
          <div className="relative flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-white text-lg font-black tracking-[-0.08em] text-[#0f766e]">
              W
            </span>
            <span className="text-xl font-black tracking-[-0.04em]">
              Waslix
            </span>
          </div>

          <div className="relative max-w-lg space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl leading-[1.08] font-bold tracking-[-0.04em] text-balance xl:text-5xl">
                {t("signUpValueTitle")}
              </h2>
              <p className="max-w-[56ch] text-base leading-7 text-teal-50/75">
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
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-teal-200/35 bg-teal-300/10 text-sm font-semibold text-teal-100 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-teal-50">
                      {t(`signUpJourney.${step}`)}
                    </span>
                    {index < 2 ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="ms-auto size-4 text-teal-200/60 rtl:rotate-180"
                      />
                    ) : (
                      <Check
                        aria-hidden="true"
                        className="ms-auto size-4 text-teal-200"
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          <p className="relative flex items-center gap-2 text-sm text-teal-50/70">
            <ShieldCheck aria-hidden="true" className="size-4 text-teal-200" />
            {t("signUpTrust")}
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="flex w-full max-w-md flex-col gap-7">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="bg-brand text-brand-foreground flex size-10 items-center justify-center rounded-md text-lg font-black tracking-[-0.08em]">
                W
              </span>
              <span className="text-xl font-black tracking-[-0.04em]">
                Waslix
              </span>
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
