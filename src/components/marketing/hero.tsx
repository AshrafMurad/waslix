import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { PortfolioVisual } from "./portfolio-visual";

type HeroProps = { locale: "en" | "ar" };

export async function Hero({ locale }: HeroProps) {
  const t = await getTranslations({ locale, namespace: "marketing.hero" });

  return (
    <section className="marketing-hero" aria-labelledby="hero-title">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-rail hero-rail-one" aria-hidden="true" />
      <div className="hero-rail hero-rail-two" aria-hidden="true" />

      <div className="marketing-container hero-layout">
        <div className="hero-copy">
          <div className="hero-live-status">
            <b>{t("signalLabel")}</b>
            {t("signalValue")}
          </div>
          <h1 id="hero-title">
            {t("titleBefore")}
            <span>{t("titleAccent")}</span>
          </h1>
          <p>{t("description")}</p>
          <div className="hero-proof-row" aria-label={t("proofLabel")}>
            <span>{t("proofOne")}</span>
            <span>{t("proofTwo")}</span>
            <span>{t("proofThree")}</span>
          </div>
          <div className="hero-actions">
            <Link href="/sign-up" className="marketing-button">
              {t("primary")}
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <a href="#product" className="marketing-text-link">
              {t("secondary")}
              <ArrowDown aria-hidden="true" />
            </a>
          </div>
          <small className="hero-support">{t("support")}</small>
        </div>

        <div className="hero-product">
          <PortfolioVisual />
        </div>
      </div>
      <div className="hero-edge-fade" aria-hidden="true" />
    </section>
  );
}
