"use client";

import {
  Activity,
  ArrowUpRight,
  CircleAlert,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const demoSignals = [
  { key: "usage", delta: -14 },
  { key: "tickets", delta: -12 },
  { key: "inactive", delta: -8 },
  { key: "qbr", delta: 8 },
] as const;

export function IntelligenceDemo() {
  const intelligence = useTranslations("marketing.intelligence");
  const demo = useTranslations("marketing.demo");
  const [activeSignals, setActiveSignals] = useState<string[]>([]);
  const score = demoSignals.reduce(
    (total, signal) =>
      activeSignals.includes(signal.key) ? total + signal.delta : total,
    82,
  );
  const status = score >= 80 ? "healthy" : score >= 60 ? "attention" : "risk";

  function toggleSignal(key: string) {
    setActiveSignals((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  return (
    <section
      className="marketing-section intelligence-section"
      aria-labelledby="intelligence-title"
    >
      <div className="marketing-container section-heading split-heading">
        <div>
          <span className="marketing-eyebrow">
            <i />
            {intelligence("eyebrow")}
          </span>
          <h2 id="intelligence-title">{intelligence("title")}</h2>
        </div>
        <p>{intelligence("description")}</p>
      </div>

      <div className="marketing-container insight-cards">
        {[
          [
            "highRisk",
            "highRiskBody",
            "action1",
            CircleAlert,
            "risk",
            "Umbrella Corp",
          ],
          [
            "expansion",
            "expansionBody",
            "action2",
            TrendingUp,
            "healthy",
            "Northstar",
          ],
          [
            "reengage",
            "reengageBody",
            "action3",
            UserRoundCheck,
            "attention",
            "Acme",
          ],
        ].map(([label, body, action, Icon, tone, account], index) => (
          <article
            className="insight-card"
            key={label as string}
            data-tone={tone}
            style={{ "--card-index": index } as React.CSSProperties}
          >
            <header>
              <span>
                <Icon aria-hidden="true" />
                {intelligence(label as "highRisk")}
              </span>
              <small>0{index + 1}</small>
            </header>
            <h3>{account as string}</h3>
            <p>{intelligence(body as "highRiskBody")}</p>
            <footer>
              <span>{intelligence("nextAction")}</span>
              <strong>{intelligence(action as "action1")}</strong>
              <ArrowUpRight aria-hidden="true" />
            </footer>
          </article>
        ))}
      </div>

      <div
        className="marketing-container demo-shell"
        aria-labelledby="demo-title"
      >
        <div className="demo-copy">
          <span className="marketing-eyebrow">
            <i />
            {demo("eyebrow")}
          </span>
          <h2 id="demo-title">{demo("title")}</h2>
          <p>{demo("description")}</p>
        </div>
        <div className="demo-panel" aria-label={demo("label")}>
          <div className="demo-controls">
            <span>
              {demo("baseline")} <strong>82</strong>
            </span>
            {demoSignals.map((signal) => (
              <button
                type="button"
                key={signal.key}
                data-active={activeSignals.includes(signal.key)}
                onClick={() => toggleSignal(signal.key)}
                aria-pressed={activeSignals.includes(signal.key)}
              >
                <i />
                {demo(signal.key)}
                <strong>
                  {signal.delta > 0 ? "+" : ""}
                  {signal.delta}
                </strong>
              </button>
            ))}
            <button
              type="button"
              className="demo-reset"
              onClick={() => setActiveSignals([])}
              disabled={activeSignals.length === 0}
            >
              <RefreshCcw aria-hidden="true" />
              {demo("reset")}
            </button>
          </div>
          <div className="demo-result" data-tone={status}>
            <div className="demo-score">
              <svg viewBox="0 0 180 180" aria-hidden="true">
                <circle cx="90" cy="90" r="72" />
                <circle
                  cx="90"
                  cy="90"
                  r="72"
                  pathLength="100"
                  style={{ strokeDasharray: `${score} 100` }}
                />
              </svg>
              <div>
                <small>{demo("current")}</small>
                <strong>{score}</strong>
                <span>{demo(status)}</span>
              </div>
            </div>
            <div className="demo-suggestion">
              <Sparkles aria-hidden="true" />
              <span>{demo("suggestion")}</span>
              <strong>
                {demo(
                  `suggestion${status.charAt(0).toUpperCase()}${status.slice(1)}` as "suggestionHealthy",
                )}
              </strong>
              <small>
                <Activity aria-hidden="true" />
                {activeSignals.length} active signals
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
