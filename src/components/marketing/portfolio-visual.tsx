"use client";

import {
  Activity,
  ArrowDownRight,
  CalendarClock,
  CircleAlert,
  Search,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const accounts = [
  {
    name: "Northstar",
    score: 92,
    owner: "MK",
    renewal: "Jun 18",
    tone: "healthy",
  },
  { name: "Acme", score: 81, owner: "SL", renewal: "Jul 02", tone: "healthy" },
  { name: "Orbit", score: 45, owner: "MK", renewal: "May 31", tone: "risk" },
  {
    name: "Vertex",
    score: 68,
    owner: "JA",
    renewal: "Aug 14",
    tone: "attention",
  },
] as const;

export function PortfolioVisual() {
  const t = useTranslations("marketing.portfolio");
  const frame = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    frame.current?.style.setProperty("--hero-rx", `${y * -2.2}deg`);
    frame.current?.style.setProperty("--hero-ry", `${x * 3.2}deg`);
  }

  function resetPerspective() {
    frame.current?.style.setProperty("--hero-rx", "0deg");
    frame.current?.style.setProperty("--hero-ry", "0deg");
  }

  return (
    <div
      className="portfolio-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPerspective}
    >
      <div className="signal-field" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i
            key={index}
            style={{ "--signal-index": index } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="portfolio-frame" ref={frame}>
        <div className="portfolio-window-bar">
          <div className="portfolio-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>{t("window")}</span>
          <div className="portfolio-search">
            <Search aria-hidden="true" />
            <span>{t("search")}</span>
          </div>
        </div>

        <div className="portfolio-body">
          <div className="portfolio-metrics">
            {[
              ["totalArr", "arrValue"],
              ["customers", "customerValue"],
              ["atRisk", "riskValue"],
              ["renewals", "renewalValue"],
            ].map(([label, value], index) => (
              <div className="portfolio-metric" key={label}>
                <span>{t(label)}</span>
                <strong>{t(value)}</strong>
                <i data-tone={index === 2 ? "risk" : "brand"} />
              </div>
            ))}
          </div>

          <div className="portfolio-grid">
            <div className="portfolio-chart-panel">
              <div className="product-panel-heading">
                <span>{t("health")}</span>
                <span className="mono-label">30D</span>
              </div>
              <div className="portfolio-chart">
                <svg viewBox="0 0 420 128" role="img" aria-label={t("health")}>
                  <path
                    className="chart-grid-line"
                    d="M0 30H420M0 67H420M0 104H420"
                  />
                  <path
                    className="chart-area"
                    d="M0 111L45 96L87 101L130 72L174 80L216 53L260 64L304 39L348 45L390 20L420 30V128H0Z"
                  />
                  <path
                    className="chart-line"
                    d="M0 111L45 96L87 101L130 72L174 80L216 53L260 64L304 39L348 45L390 20L420 30"
                  />
                </svg>
              </div>
              <div className="health-distribution">
                <span>
                  <i data-tone="healthy" />
                  {t("healthy")} <b>24</b>
                </span>
                <span>
                  <i data-tone="attention" />
                  {t("attention")} <b>14</b>
                </span>
                <span>
                  <i data-tone="risk" />
                  {t("risk")} <b>4</b>
                </span>
              </div>
            </div>

            <div className="portfolio-list-panel">
              <div className="product-panel-heading">
                <span>{t("accounts")}</span>
                <span className="mono-label">42</span>
              </div>
              <div className="portfolio-table-header">
                <span>{t("account")}</span>
                <span>{t("score")}</span>
                <span>{t("owner")}</span>
                <span>{t("renewal")}</span>
              </div>
              {accounts.map((account) => (
                <div className="portfolio-account-row" key={account.name}>
                  <span className="portfolio-account-name">
                    <i>{account.name.charAt(0)}</i>
                    {account.name}
                  </span>
                  <span className="health-score" data-tone={account.tone}>
                    <i /> {account.score}
                  </span>
                  <span className="owner-avatar">{account.owner}</span>
                  <span>{account.renewal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="intelligence-card risk-card">
        <span className="card-icon" data-tone="risk">
          <CircleAlert aria-hidden="true" />
        </span>
        <div>
          <small>{t("riskDetected")}</small>
          <strong>Orbit Software</strong>
          <span>
            <ArrowDownRight aria-hidden="true" />
            {t("usageDrop")}
          </span>
        </div>
      </div>
      <div className="intelligence-card renewal-card">
        <span className="card-icon">
          <CalendarClock aria-hidden="true" />
        </span>
        <div>
          <small>{t("renewalCard")}</small>
          <strong>Acme · {t("days")}</strong>
          <span>USD 48,000 ARR</span>
        </div>
      </div>
      <div className="intelligence-card health-card">
        <span className="card-icon" data-tone="healthy">
          <Activity aria-hidden="true" />
        </span>
        <div>
          <small>{t("healthCard")}</small>
          <strong>Northstar · 92</strong>
          <span>{t("healthyStatus")}</span>
        </div>
      </div>
      <div className="intelligence-card stakeholder-card">
        <span className="card-icon">
          <UserRound aria-hidden="true" />
        </span>
        <div>
          <small>{t("stakeholder")}</small>
          <strong>ClearNest</strong>
          <span>{t("stakeholderDetail")}</span>
        </div>
      </div>
    </div>
  );
}
