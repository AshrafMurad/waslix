import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { Link, redirect } from "@/i18n/navigation";
import {
  AuthenticationRequiredError,
  requireWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/access-context";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

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

  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-16">
      <section className="bg-card mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border p-8 text-start shadow-sm">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {t("home.kicker")}
        </p>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("home.title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-7">
            {t("home.description")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/sign-in">{t("home.signIn")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workspace">{t("home.openWorkspace")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
