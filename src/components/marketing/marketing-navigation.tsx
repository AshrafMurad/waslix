"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";

import { BrandMark } from "./brand-mark";

const navigationItems = [
  ["product", "#story"],
  ["resources", "#capabilities"],
] as const;

export function MarketingNavigation() {
  const t = useTranslations("marketing.nav");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
          <LocaleSwitcher variant="marketing" persistPreference={false} />
          <ThemeToggle variant="marketing" />
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
            <LocaleSwitcher
              variant="marketing"
              persistPreference={false}
              onSwitched={() => setIsOpen(false)}
            />
            <ThemeToggle variant="marketing" />
          </div>
        </div>
      )}
    </header>
  );
}
