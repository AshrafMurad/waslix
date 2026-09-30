"use client";

import { Activity, ArrowDownRight, Database, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const factors = [
  { key: "usage", value: 20, tone: "positive" },
  { key: "stakeholders", value: 10, tone: "positive" },
  { key: "executive", value: 8, tone: "positive" },
  { key: "tickets", value: -12, tone: "negative" },
  { key: "decline", value: -8, tone: "negative" },
  { key: "champion", value: -6, tone: "negative" },
] as const;

export function HealthExplainer() {
  const t = useTranslations("marketing.health");
  const [selected, setSelected] =
    useState<(typeof factors)[number]["key"]>("tickets");
  const selectedFactor =
    factors.find((factor) => factor.key === selected) ?? factors[0];

  return (
    <section
      id="solutions"
      className="marketing-section health-explainer-section"
      aria-labelledby="health-title"
    >
      <div className="marketing-container section-heading centered-heading">
        <span className="marketing-eyebrow">
          <i />
          {t("eyebrow")}
        </span>
        <h2 id="health-title">{t("title")}</h2>
        <p>{t("description")}</p>
      </div>

      <div className="marketing-container health-explainer-grid">
        <div className="explainable-score">
          <div
            className="score-rings"
            aria-label={`${t("label")} 72, ${t("status")}`}
          >
            <svg viewBox="0 0 260 260" aria-hidden="true">
              <circle className="score-ring-track" cx="130" cy="130" r="105" />
              <circle
                className="score-ring-secondary"
                cx="130"
                cy="130"
                r="87"
                pathLength="100"
              />
              <circle
                className="score-ring-value"
                cx="130"
                cy="130"
                r="105"
                pathLength="100"
              />
            </svg>
            <div>
              <small>{t("label")}</small>
              <strong>72</strong>
              <span>{t("status")}</span>
            </div>
          </div>
          <div className="score-meta">
            <span>
              <ArrowDownRight aria-hidden="true" />
              {t("trend")}
            </span>
            <span>
              <ShieldCheck aria-hidden="true" />
              {t("confidence")}
            </span>
          </div>
        </div>

        <div className="health-factor-panel">
          <div className="factor-groups">
            {(["positive", "negative"] as const).map((tone) => (
              <div key={tone}>
                <h3>{t(tone)}</h3>
                {factors
                  .filter((factor) => factor.tone === tone)
                  .map((factor) => (
                    <button
                      type="button"
                      key={factor.key}
                      data-active={selected === factor.key}
                      data-tone={tone}
                      onMouseEnter={() => setSelected(factor.key)}
                      onFocus={() => setSelected(factor.key)}
                      onClick={() => setSelected(factor.key)}
                    >
                      <span>
                        <i />
                        {t(factor.key)}
                      </span>
                      <strong>
                        {factor.value > 0 ? "+" : ""}
                        {factor.value}
                      </strong>
                    </button>
                  ))}
              </div>
            ))}
          </div>
          <div className="factor-evidence" aria-live="polite">
            <span>
              <Database aria-hidden="true" />
              {t("source")}
            </span>
            <strong>{t(selectedFactor.key)}</strong>
            <p>{t(`${selectedFactor.key}Detail`)}</p>
            <small>
              <Activity aria-hidden="true" />
              {t("selectFactor")}
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
