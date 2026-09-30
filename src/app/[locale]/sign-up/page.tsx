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
    <main className="bg-background flex min-h-screen items-center justify-center px-6 py-16">
      <section className="bg-card border-border/80 flex w-full max-w-md flex-col gap-6 rounded-lg border p-6 shadow-xs sm:p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-brand text-brand-foreground flex size-9 items-center justify-center rounded-md text-base font-semibold shadow-xs">
              W
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("signUpTitle")}
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {invitation
              ? t("invitedSignUp", { workspace: invitation.workspace.name })
              : t("signUpDescription")}
          </p>
        </div>
        <SignUpForm invitationToken={token} defaultEmail={invitation?.email} />
        <p className="text-muted-foreground text-sm">
          {t("hasAccount")}{" "}
          <Link
            className="text-brand-accent font-medium hover:underline"
            href={token ? `/sign-in?invite=${token}` : "/sign-in"}
          >
            {t("signIn")}
          </Link>
        </p>
      </section>
    </main>
  );
}
