import { getTranslations, setRequestLocale } from "next-intl/server";

import { isLocale } from "@/i18n/config";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (isLocale(locale)) {
    setRequestLocale(locale);
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
      </section>
    </main>
  );
}
