import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
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
                {t("signInValueTitle")}
              </h2>
              <p className="text-primary-foreground/78 max-w-[56ch] text-base leading-7">
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
                    <span className="text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full border border-white/28 bg-white/10 text-sm font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-primary-foreground/92 text-sm font-medium">
                      {t(`signInBenefits.${item}`)}
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
