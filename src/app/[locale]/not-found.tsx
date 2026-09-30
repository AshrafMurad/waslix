import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("common.notFound");

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-6 text-center">
      <section className="bg-surface border-border/80 w-full max-w-md rounded-lg border p-6 shadow-xs">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-3">{t("description")}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t("home")}</Link>
        </Button>
      </section>
    </main>
  );
}
