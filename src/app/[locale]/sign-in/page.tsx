import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import {
  AuthenticationRequiredError,
  requireWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/access-context";
import { SignInForm } from "@/modules/auth/components/sign-in-form";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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

  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="bg-card flex w-full max-w-md flex-col gap-6 rounded-xl border p-8">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <SignInForm
          defaultEmail={
            process.env.NODE_ENV === "development"
              ? "admin@example.com"
              : undefined
          }
          defaultPassword={
            process.env.NODE_ENV === "development" ? "admin123" : undefined
          }
        />
      </section>
    </main>
  );
}
