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
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="bg-card flex w-full max-w-md flex-col gap-6 rounded-xl border p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{t("signUpTitle")}</h1>
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
            className="text-brand-accent"
            href={token ? `/sign-in?invite=${token}` : "/sign-in"}
          >
            {t("signIn")}
          </Link>
        </p>
      </section>
    </main>
  );
}
