import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { Link, redirect } from "@/i18n/navigation";
import {
  AuthenticationRequiredError,
  requireWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/access-context";
import { AuthNavigation } from "@/modules/auth/components/auth-navigation";
import { SignInForm } from "@/modules/auth/components/sign-in-form";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  try {
    await requireWorkspaceAccess();
    redirect({ href: "/overview", locale });
  } catch (error) {
    if (
      !(error instanceof AuthenticationRequiredError) &&
      !(error instanceof WorkspaceAccessDeniedError)
    ) {
      throw error;
    }
  }

  const t = await getTranslations({ locale, namespace: "auth" });
  const rawSearchParams = await searchParams;
  const invite = Array.isArray(rawSearchParams.invite)
    ? rawSearchParams.invite[0]
    : rawSearchParams.invite;
  const redirectTo = invite ? `/invite/${invite}` : "/workspace";

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <AuthNavigation />
      <div className="bg-card mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-6xl overflow-hidden rounded-lg border shadow-[0_30px_80px_-55px_rgb(15_23_42_/_0.65)] sm:min-h-[calc(100vh-6.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
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
                {t("signInValueTitle")}
              </h2>
              <p className="max-w-[56ch] text-base leading-7 text-teal-50/75">
                {t("signInValueDescription")}
              </p>
            </div>
            <div className="space-y-3">
              {(["evidence", "ownership", "action"] as const).map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-md border border-white/15 bg-white/[0.06] px-4 py-3.5"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-teal-200/35 bg-teal-300/10 text-sm font-semibold text-teal-100 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-teal-50">
                      {t(`signInBenefits.${item}`)}
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
              <h1 className="text-3xl leading-tight font-bold tracking-[-0.035em] text-balance">
                {t("title")}
              </h1>
              <p className="text-muted-foreground max-w-[52ch] text-sm leading-6">
                {invite ? t("signInInviteDescription") : t("signInDescription")}
              </p>
            </div>
            <SignInForm
              redirectTo={redirectTo}
              defaultEmail={
                process.env.NODE_ENV === "development"
                  ? "admin@example.com"
                  : undefined
              }
              defaultPassword={
                process.env.NODE_ENV === "development" ? "123456" : undefined
              }
            />
            <p className="text-muted-foreground border-t pt-5 text-sm">
              {t("noAccount")}{" "}
              <Link
                href={invite ? `/sign-up?invite=${invite}` : "/sign-up"}
                className="text-brand-accent font-semibold underline-offset-4 hover:underline"
              >
                {t("createAccount")}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
