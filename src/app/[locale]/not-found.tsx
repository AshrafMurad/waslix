import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("common.notFound");

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-6 text-center">
      <section className="bg-surface border-border/80 w-full max-w-md rounded-lg border p-6 shadow-xs">
        <p className="waslix-eyebrow">{t("kicker")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-3">{t("description")}</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {t("home")}
        </Link>
      </section>
    </main>
  );
}
