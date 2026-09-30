import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { BrandMark } from "./brand-mark";

type FinalCtaFooterProps = { locale: "en" | "ar" };

export async function FinalCtaFooter({ locale }: FinalCtaFooterProps) {
  const t = await getTranslations({ locale, namespace: "marketing.final" });

  return (
    <>
      <section
        id="pricing"
        className="marketing-section final-cta-section"
        aria-labelledby="final-title"
      >
        <div className="final-signal-line" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="marketing-container final-cta-content">
          <span className="marketing-eyebrow">
            <i />
            {t("eyebrow")}
          </span>
          <h2 id="final-title">{t("title")}</h2>
          <p>{t("description")}</p>
          <Link href="/sign-up" className="marketing-button">
            {t("cta")}
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <small>{t("support")}</small>
        </div>
      </section>
      <footer className="marketing-footer">
        <div className="marketing-container footer-layout">
          <div className="footer-brand">
            <BrandMark />
            <p>{t("copyright")}</p>
          </div>
          <div className="footer-column">
            <strong>{t("product")}</strong>
            <a href="#product">{t("product")}</a>
            <a href="#solutions">{t("solutions")}</a>
            <a href="#how-it-works">{t("resources")}</a>
          </div>
          <div className="footer-column">
            <strong>{t("company")}</strong>
            <span title={t("routePending")}>{t("about")}</span>
            <span title={t("routePending")}>{t("contact")}</span>
          </div>
          <div className="footer-column">
            <strong>{t("legal")}</strong>
            <span title={t("routePending")}>{t("privacy")}</span>
            <span title={t("routePending")}>{t("terms")}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
