import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
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
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="bg-card flex w-full max-w-md flex-col gap-6 rounded-xl border p-8">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <SignInForm locale={locale} />
      </section>
    </main>
  );
}
