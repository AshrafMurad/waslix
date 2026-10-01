import {
  ArrowDown,
  ArrowUpRight,
  Check,
  CircleDot,
  Clock3,
  FileSearch,
  Languages,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { BrandMark } from "./brand-mark";
import { MarketingNavigation } from "./marketing-navigation";
import { OperationsWorkspace } from "./operations-workspace";
import { SignalRailCanvas } from "./signal-rail-canvas";

type MarketingPageProps = { locale: "en" | "ar" };

export async function MarketingPage({ locale }: MarketingPageProps) {
  const hero = await getTranslations({ locale, namespace: "marketing.hero" });
  const system = await getTranslations({
    locale,
    namespace: "marketing.system",
  });
  const health = await getTranslations({
    locale,
    namespace: "marketing.health",
  });
  const deepDive = await getTranslations({
    locale,
    namespace: "marketing.deepDive",
  });
  const lifecycle = await getTranslations({
    locale,
    namespace: "marketing.lifecycle",
  });
  const collaboration = await getTranslations({
    locale,
    namespace: "marketing.collaboration",
  });
  const integrations = await getTranslations({
    locale,
    namespace: "marketing.integrations",
  });
  const final = await getTranslations({ locale, namespace: "marketing.final" });

  const loop = [
    {
      title: system("signals"),
      copy: system("signalsCopy"),
      detail: system("signal1"),
      tone: "brand",
    },
    {
      title: system("health"),
      copy: system("healthCopy"),
      detail: system("good"),
      tone: "attention",
    },
    {
      title: system("action"),
      copy: system("actionCopy"),
      detail: system("task1"),
      tone: "healthy",
    },
  ] as const;

  return (
    <main className="marketing-shell">
      <MarketingNavigation locale={locale} />

      <section className="marketing-hero" aria-labelledby="hero-title">
        <SignalRailCanvas />
        <div className="marketing-container hero-layout">
          <div className="hero-copy">
            <div className="hero-status-line">
              <CircleDot aria-hidden="true" />
              <span>{hero("signalValue")}</span>
            </div>
            <h1 id="hero-title">
              {hero("titleBefore")} <strong>{hero("titleAccent")}</strong>
            </h1>
            <p>{hero("description")}</p>
            <div className="hero-actions">
              <a href="#product" className="marketing-button">
                {hero("secondary")}
                <ArrowDown aria-hidden="true" />
              </a>
              <Link href="/sign-up" className="marketing-text-link">
                {hero("primary")}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-proof-row" aria-label={hero("proofLabel")}>
              <span>
                <Check aria-hidden="true" />
                {hero("proofOne")}
              </span>
              <span>
                <Check aria-hidden="true" />
                {hero("proofTwo")}
              </span>
              <span>
                <Check aria-hidden="true" />
                {hero("proofThree")}
              </span>
            </div>
          </div>
          <OperationsWorkspace />
        </div>
      </section>

      <section
        id="how-it-works"
        className="operations-loop"
        aria-labelledby="loop-title"
      >
        <div className="marketing-container">
          <div className="section-heading">
            <h2 id="loop-title">{system("title")}</h2>
            <p>{system("description")}</p>
          </div>
          <div className="loop-rail">
            {loop.map((item, index) => (
              <article
                key={item.title}
                className="loop-stage"
                data-tone={item.tone}
              >
                <div className="loop-stage-header">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.copy}</p>
                <div className="loop-stage-event">
                  <span aria-hidden="true" />
                  {item.detail}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="product"
        className="account-section"
        aria-labelledby="account-title"
      >
        <div className="marketing-container account-layout">
          <div className="account-copy">
            <h2 id="account-title">{deepDive("title")}</h2>
            <p>{deepDive("description")}</p>
            <div className="account-facts">
              <div>
                <FileSearch aria-hidden="true" />
                <span>{deepDive("riskSignals")}</span>
              </div>
              <div>
                <Clock3 aria-hidden="true" />
                <span>{deepDive("timeline")}</span>
              </div>
              <div>
                <Users aria-hidden="true" />
                <span>{deepDive("owner")}</span>
              </div>
            </div>
          </div>
          <div className="account-ledger">
            <header>
              <div className="account-identity">
                <span>NP</span>
                <div>
                  <strong>Northstar Products</strong>
                  <small>{deepDive("illustrative")}</small>
                </div>
              </div>
              <span className="status-badge attention">{health("status")}</span>
            </header>
            <div className="ledger-summary">
              <div>
                <small>{deepDive("health")}</small>
                <strong>64</strong>
                <span>{health("trend")}</span>
              </div>
              <div>
                <small>{deepDive("renewal")}</small>
                <strong>{deepDive("days")}</strong>
                <span>{lifecycle("renewal")}</span>
              </div>
              <div>
                <small>{deepDive("owner")}</small>
                <strong>Maya Chen</strong>
                <span>CSM</span>
              </div>
            </div>
            <div className="ledger-body">
              <div>
                <h3>{deepDive("riskSignals")}</h3>
                {[
                  deepDive("signal1"),
                  deepDive("signal2"),
                  deepDive("signal3"),
                ].map((signal) => (
                  <p key={signal}>
                    <span aria-hidden="true" />
                    {signal}
                  </p>
                ))}
              </div>
              <div className="ledger-action">
                <small>{deepDive("next")}</small>
                <strong>{deepDive("nextValue")}</strong>
                <div className="ledger-action-control">
                  {deepDive("createTask")}
                  <ArrowUpRight aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="solutions"
        className="evidence-section"
        aria-labelledby="evidence-title"
      >
        <div className="marketing-container evidence-layout">
          <div className="evidence-board">
            <header>
              <span>{health("label")}</span>
              <strong>64</strong>
              <span className="status-badge attention">{health("status")}</span>
            </header>
            <div className="evidence-scale" aria-hidden="true">
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="evidence-columns">
              <div>
                <h3>{health("positive")}</h3>
                <p>
                  <Check aria-hidden="true" />
                  {health("usage")}
                </p>
                <p>
                  <Check aria-hidden="true" />
                  {health("executive")}
                </p>
              </div>
              <div>
                <h3>{health("negative")}</h3>
                <p>
                  <CircleDot aria-hidden="true" />
                  {health("tickets")}
                </p>
                <p>
                  <CircleDot aria-hidden="true" />
                  {health("champion")}
                </p>
              </div>
            </div>
            <footer>
              <FileSearch aria-hidden="true" />
              <span>{health("source")}</span>
              <strong>{health("confidence")}</strong>
            </footer>
          </div>
          <div className="evidence-copy">
            <h2 id="evidence-title">{health("title")}</h2>
            <p>{health("description")}</p>
            <div className="governance-list">
              <div>
                <ShieldCheck aria-hidden="true" />
                <span>{hero("proofOne")}</span>
              </div>
              <div>
                <FileSearch aria-hidden="true" />
                <span>{hero("proofTwo")}</span>
              </div>
              <div>
                <Languages aria-hidden="true" />
                <span>{collaboration("title")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lifecycle-section" aria-labelledby="lifecycle-title">
        <div className="marketing-container">
          <div className="section-heading lifecycle-heading">
            <h2 id="lifecycle-title">{lifecycle("title")}</h2>
            <p>{lifecycle("description")}</p>
          </div>
          <div className="lifecycle-track">
            {[
              [lifecycle("onboarding"), lifecycle("onboardingCopy")],
              [lifecycle("adoption"), lifecycle("adoptionCopy")],
              [lifecycle("healthy"), lifecycle("healthyCopy")],
              [lifecycle("renewal"), lifecycle("renewalCopy")],
            ].map(([title, copy], index) => (
              <article key={title} data-active={index === 2}>
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="closing-section"
        aria-labelledby="closing-title"
      >
        <div className="marketing-container closing-grid">
          <div>
            <h2 id="closing-title">{final("title")}</h2>
            <p>{final("description")}</p>
          </div>
          <div className="closing-action">
            <Link href="/sign-up" className="marketing-button">
              {final("cta")}
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <small>{final("support")}</small>
          </div>
        </div>
        <footer className="marketing-container marketing-footer">
          <BrandMark />
          <p>{final("copyright")}</p>
          <p>
            {integrations("available")}: {integrations("native")} ·{" "}
            {integrations("csv")}
          </p>
        </footer>
      </section>
    </main>
  );
}
