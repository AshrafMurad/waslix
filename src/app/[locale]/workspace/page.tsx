import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  redirect({ href: "/overview", locale });
}
