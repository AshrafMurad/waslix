"use client";

import {
  ArrowDownRight,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Database,
  RadioTower,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const strips = [
  {
    code: "NX-184",
    account: "Orbit Software",
    source: "usageDrop",
    health: "45",
    owner: "MK",
    action: "execCall",
    tone: "risk",
    eta: "today",
  },
  {
    code: "RN-071",
    account: "Acme Health",
    source: "renewalWindow",
    health: "81",
    owner: "SL",
    action: "renewalPlan",
    tone: "healthy",
    eta: "days21",
  },
  {
    code: "ST-229",
    account: "ClearNest",
    source: "stakeholderQuiet",
    health: "68",
    owner: "JA",
    action: "sponsorReview",
    tone: "attention",
    eta: "days3",
  },
] as const;

const signalNodes = [
  { label: "signals", icon: RadioTower },
  { label: "health", icon: CircleDot },
  { label: "owner", icon: ClipboardCheck },
  { label: "action", icon: CheckCircle2 },
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
        {Array.from({ length: 22 }, (_, index) => (
          <i
            key={index}
            style={{ "--signal-index": index } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="dispatch-frame" ref={frame}>
        <div className="dispatch-topbar">
          <span className="dispatch-kicker">
            {t("window")} · {t("illustrative")}
          </span>
          <span className="dispatch-time">09:42 UTC</span>
          <span className="dispatch-state">
            <i /> {t("signalValue")}
          </span>
        </div>

        <div className="dispatch-columns" aria-label={t("boardLabel")}>
          {signalNodes.map(({ label, icon: Icon }) => (
            <div className="dispatch-column-label" key={label}>
              <Icon aria-hidden="true" />
              <span>{t(label)}</span>
            </div>
          ))}
        </div>

        <div className="dispatch-rail" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="dispatch-strips">
          {strips.map((strip, index) => (
            <article
              className="dispatch-strip"
              data-tone={strip.tone}
              data-active={index === 0}
              key={strip.code}
            >
              <div className="strip-code">
                <span>{strip.code}</span>
                <b>{t(strip.eta)}</b>
              </div>
              <div className="strip-account">
                <strong>{strip.account}</strong>
                <span>
                  <Database aria-hidden="true" />
                  {t(strip.source)}
                </span>
              </div>
              <div className="strip-health">
                <small>{t("score")}</small>
                <b>{strip.health}</b>
              </div>
              <div className="strip-owner">
                <small>{t("owner")}</small>
                <b>{strip.owner}</b>
              </div>
              <div className="strip-action">
                <small>{t("nextAction")}</small>
                <span>{t(strip.action)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="dispatch-ledger">
          <div>
            <ShieldAlert aria-hidden="true" />
            <span>{t("riskDetected")}</span>
            <strong>Orbit Software</strong>
          </div>
          <div>
            <ArrowDownRight aria-hidden="true" />
            <span>{t("usageDrop")}</span>
            <strong>{t("evidenceFresh")}</strong>
          </div>
          <div>
            <Clock3 aria-hidden="true" />
            <span>{t("handoff")}</span>
            <strong>{t("ownerAssigned")}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
