import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import "../globals.css";

import { ThemeInitializer } from "@/components/layout/theme-initializer";
import { getDirection, isLocale, locales } from "@/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    geistSans.variable,
    geistMono.variable,
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
