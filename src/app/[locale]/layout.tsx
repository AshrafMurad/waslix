import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import "../globals.css";
import "../../components/marketing/marketing.css";

import { ThemeInitializer } from "@/components/layout/theme-initializer";
import { getDirection, isLocale, locales } from "@/i18n/config";

const manrope = localFont({
  variable: "--font-english",
  src: [
    {
      path: "../../../public/fonts/english/Manrope-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../../public/fonts/english/Manrope-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../public/fonts/english/Manrope-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/english/Manrope-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/english/Manrope-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/english/Manrope-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/fonts/english/Manrope-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  display: "swap",
});

const ibmPlexSansArabic = localFont({
  variable: "--font-arabic",
  src: [
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/IBMPlexSansArabic-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "shell.metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const savedTheme = (await cookies()).get("waslix-theme")?.value;
  const isDarkTheme = savedTheme === "dark";
  const className = [
    manrope.variable,
    ibmPlexSansArabic.variable,
    isDarkTheme ? "dark" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={className}
      suppressHydrationWarning
    >
      <body>
        <ThemeInitializer />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
