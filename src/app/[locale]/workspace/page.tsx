import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";

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
  const access = await requireProtectedPage(locale);
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="bg-card flex w-full max-w-xl flex-col gap-5 rounded-xl border p-8">
        <h1 className="text-3xl font-semibold">{t("protectedTitle")}</h1>
        <p>{t("role", { role: access.role })}</p>
        <SignOutButton locale={locale} />
      </section>
    </main>
  );
}
