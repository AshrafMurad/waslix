"use client";

import { ArrowUpRight, Languages, Menu, Moon, Sun, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

import { BrandMark } from "./brand-mark";

type MarketingNavigationProps = {
  locale: "en" | "ar";
};

const navigationItems = [
  ["product", "#story"],
  ["resources", "#capabilities"],
] as const;

export function MarketingNavigation({ locale }: MarketingNavigationProps) {
  const t = useTranslations("marketing.nav");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const nextLocale = locale === "en" ? "ar" : "en";

  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";

    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("waslix-theme", nextTheme);
    document.cookie = `waslix-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  }

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 28);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="marketing-nav-wrap" data-scrolled={isScrolled || isOpen}>
      <nav className="marketing-nav" aria-label={t("label")}>
        <Link href="/" className="marketing-nav-logo">
          <BrandMark />
        </Link>

        <div className="marketing-nav-links">
          {navigationItems.map(([label, href]) => (
            <a key={label} href={href}>
              {t(label)}
            </a>
          ))}
        </div>

        <div className="marketing-nav-actions">
          <Link
            href="/"
            locale={nextLocale}
            className="marketing-language-switch"
            aria-label={t("languageLabel")}
            title={t("languageLabel")}
          >
            <Languages aria-hidden="true" />
            <span>{locale.toUpperCase()}</span>
            <i aria-hidden="true" />
            <span>{nextLocale.toUpperCase()}</span>
          </Link>
          <button
            type="button"
            className="marketing-theme-toggle"
            aria-label={t("theme")}
            title={t("theme")}
            onClick={toggleTheme}
          >
            <Sun aria-hidden="true" className="marketing-theme-sun" />
            <Moon aria-hidden="true" className="marketing-theme-moon" />
          </button>
          <Link href="/sign-in" className="marketing-signin-link">
            {t("signIn")}
          </Link>
          <Link
            href="/sign-up"
            className="marketing-button marketing-button-small"
          >
            {t("start")}
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="marketing-menu-button"
            aria-label={isOpen ? t("close") : t("menu")}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="marketing-mobile-menu">
          {navigationItems.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setIsOpen(false)}>
              {t(label)}
            </a>
          ))}
          <Link href="/sign-in" onClick={() => setIsOpen(false)}>
            {t("signIn")}
          </Link>
          <div className="marketing-mobile-controls">
            <Link
              href="/"
              locale={nextLocale}
              className="marketing-language-switch"
              aria-label={t("languageLabel")}
              onClick={() => setIsOpen(false)}
            >
              <Languages aria-hidden="true" />
              <span>{locale.toUpperCase()}</span>
              <i aria-hidden="true" />
              <span>{nextLocale.toUpperCase()}</span>
            </Link>
            <button
              type="button"
              className="marketing-theme-toggle"
              aria-label={t("theme")}
              onClick={toggleTheme}
            >
              <Sun aria-hidden="true" className="marketing-theme-sun" />
              <Moon aria-hidden="true" className="marketing-theme-moon" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
