import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { MarketingPage } from "@/components/marketing/marketing-page";
import { isLocale } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import {
  AuthenticationRequiredError,
  requireWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/access-context";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "marketing.metadata" });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(appUrl),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ar: "/ar" },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      title: t("title"),
      description: t("description"),
      url: `/${locale}`,
      siteName: "Waslix",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

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
    if (error instanceof WorkspaceAccessDeniedError) {
      redirect({ href: "/workspace", locale });
    }

    if (
      !(error instanceof AuthenticationRequiredError) &&
      !(error instanceof WorkspaceAccessDeniedError)
    ) {
      throw error;
    }
  }

  return <MarketingPage locale={locale} />;
}
