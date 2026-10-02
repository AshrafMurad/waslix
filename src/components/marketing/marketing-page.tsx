import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  RadioTower,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { BrandMark } from "./brand-mark";
import { LandingExperience } from "./motion/landing-experience";
import { MarketingNavigation } from "./marketing-navigation";

type MarketingPageProps = { locale: "en" | "ar" };

export async function MarketingPage({ locale }: MarketingPageProps) {
  const [
    hero,
    fragmented,
    system,
    health,
    deepDive,
    lifecycle,
    collaboration,
    renewals,
    integrations,
    final,
    portfolio,
  ] = await Promise.all([
    getTranslations({ locale, namespace: "marketing.hero" }),
    getTranslations({ locale, namespace: "marketing.fragmented" }),
    getTranslations({ locale, namespace: "marketing.system" }),
    getTranslations({ locale, namespace: "marketing.health" }),
    getTranslations({ locale, namespace: "marketing.deepDive" }),
    getTranslations({ locale, namespace: "marketing.lifecycle" }),
    getTranslations({ locale, namespace: "marketing.collaboration" }),
    getTranslations({ locale, namespace: "marketing.renewals" }),
    getTranslations({ locale, namespace: "marketing.integrations" }),
    getTranslations({ locale, namespace: "marketing.final" }),
    getTranslations({ locale, namespace: "marketing.portfolio" }),
  ]);

  const sources = [
    fragmented("crm"),
    fragmented("support"),
    fragmented("usage"),
    fragmented("meetings"),
    fragmented("tasks"),
    fragmented("notes"),
  ];
  const healthFactors = [
    [system("usage"), "64", "attention"],
    [system("engagement"), "78", "healthy"],
    [system("support"), "52", "risk"],
    [system("goals"), "86", "healthy"],
  ] as const;
  const capabilities = [
    [deepDive("title"), deepDive("description"), "360"],
    [health("title"), health("description"), "64"],
    [lifecycle("onboarding"), lifecycle("onboardingCopy"), "4/6"],
    [collaboration("title"), collaboration("description"), "04"],
  ] as const;

  return (
    <main className="marketing-shell">
      <MarketingNavigation locale={locale} />
      <div id="story" className="signal-core-story" data-core-story>
        <LandingExperience
          labels={{
            health: portfolio("score"),
            renewal: portfolio("renewal"),
            owner: portfolio("owner"),
            attention: portfolio("attention"),
            healthy: portfolio("healthy"),
            risk: portfolio("risk"),
            illustrative: deepDive("illustrative"),
            healthScore: health("label"),
            signals: sources,
            factors: [
              [health("usage"), "64", "attention"],
              [system("engagement").split(" · ")[0], "78", "healthy"],
              [fragmented("support"), "52", "risk"],
              [system("goals").split(" · ")[0], "86", "healthy"],
            ],
            evidence: [deepDive("signal1"), deepDive("signal2")],
            workflow: [
              [portfolio("riskDetected"), portfolio("usageDrop"), "risk"],
              [system("health"), health("status"), "attention"],
              [deepDive("next"), deepDive("nextValue"), "brand"],
              [deepDive("createTask"), "Maya Chen", "brand"],
              [renewals("preparing"), portfolio("renewalPlan"), "healthy"],
            ],
          }}
        />
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-coordinate" aria-hidden="true">
            <span>WSX / 01</span>
            <span>34.0522 N</span>
          </div>
          <div className="marketing-container hero-composition">
            <div className="hero-copy" data-reveal>
              <h1 id="hero-title">
                {hero("titleBefore")} <strong>{hero("titleAccent")}</strong>
              </h1>
              <p className="hero-description">{hero("description")}</p>
              <p className="hero-status">
                <span aria-hidden="true" />
                {hero("signalValue")}
              </p>
              <div className="hero-actions">
                <Link
                  href="/sign-up"
                  className="marketing-button marketing-button-primary"
                >
                  {hero("primary")}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
                <a
                  href="#product-evidence"
                  className="marketing-button marketing-button-secondary"
                >
                  {hero("secondary")}
                </a>
              </div>
            </div>

            <div className="hero-core-labels" aria-hidden="true">
              <span>{system("signals")}</span>
              <span>{system("health")}</span>
              <span>{system("action")}</span>
            </div>

            <div className="hero-proof" aria-label={hero("proofLabel")}>
              {[hero("proofOne"), hero("proofTwo"), hero("proofThree")].map(
                (item) => (
                  <span key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
          <a className="hero-scroll-cue" href="#core-open">
            <span>{system("eyebrow")}</span>
            <i aria-hidden="true" />
          </a>
        </section>

        <section
          id="core-open"
          className="story-panel story-panel-open"
          data-story-stage="0"
          aria-labelledby="chaos-title"
        >
          <div className="marketing-container story-panel-layout story-panel-layout-end">
            <div className="story-copy" data-story-copy>
              <h2 id="chaos-title">{fragmented("titleLine1")}</h2>
              <p>{fragmented("description")}</p>
              <div className="source-stream" aria-label={fragmented("eyebrow")}>
                {sources.map((source, index) => (
                  <span
                    key={source}
                    style={{ "--source-index": index } as React.CSSProperties}
                  >
                    <i aria-hidden="true" />
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="story-panel story-panel-resolve"
          data-story-stage="1"
          aria-labelledby="connect-title"
        >
          <div className="marketing-container story-panel-layout">
            <div className="story-copy" data-story-copy>
              <h2 id="connect-title">{fragmented("titleLine2")}</h2>
              <p>{system("description")}</p>
              <div className="operation-path" aria-label={system("title")}>
                {[system("signals"), system("health"), system("action")].map(
                  (label, index) => (
                    <div key={label}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{label}</strong>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="product-story">
        <section
          id="product-evidence"
          className="story-panel story-panel-health"
          data-story-stage="2"
          aria-labelledby="health-title"
        >
          <div className="marketing-container health-composition">
            <div className="story-copy" data-story-copy>
              <h2 id="health-title">{health("title")}</h2>
              <p>{health("description")}</p>
            </div>
            <div className="health-readout" data-product-plane>
              <header>
                <div>
                  <small>{deepDive("illustrative")}</small>
                  <strong>Northstar Products</strong>
                </div>
                <span>{health("confidence")}</span>
              </header>
              <div className="health-score-line">
                <strong>64</strong>
                <div>
                  <span>{health("status")}</span>
                  <small>{health("trend")}</small>
                </div>
              </div>
              <div className="health-factor-list">
                {healthFactors.map(([label, value, tone]) => (
                  <div key={label} data-tone={tone}>
                    <span>{label}</span>
                    <i>
                      <b style={{ "--factor": value } as React.CSSProperties} />
                    </i>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <footer>
                <CircleDot aria-hidden="true" />
                <span>{health("source")}</span>
                <strong>{portfolio("evidenceFresh")}</strong>
              </footer>
            </div>
          </div>
        </section>

        <section
          className="story-panel story-panel-workspace"
          data-story-stage="3"
          aria-labelledby="workspace-title"
        >
          <div className="marketing-container workspace-composition">
            <div className="story-copy story-copy-compact" data-story-copy>
              <h2 id="workspace-title">{deepDive("title")}</h2>
              <p>{deepDive("description")}</p>
            </div>
            <div className="workspace-window" data-product-plane>
              <header className="workspace-window-bar">
                <div>
                  <BrandMark />
                </div>
                <span>{portfolio("window")}</span>
                <small>{portfolio("illustrative")}</small>
              </header>
              <div className="workspace-window-body">
                <aside aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <i key={item} data-active={item === 1} />
                  ))}
                </aside>
                <div className="workspace-ledger">
                  <div className="workspace-ledger-heading">
                    <div>
                      <small>{deepDive("eyebrow")}</small>
                      <h3>Northstar Products</h3>
                    </div>
                    <span>{health("status")}</span>
                  </div>
                  <div className="workspace-metrics">
                    <div>
                      <small>{deepDive("health")}</small>
                      <strong>64</strong>
                      <span>{health("trend")}</span>
                    </div>
                    <div>
                      <small>{deepDive("renewal")}</small>
                      <strong>{deepDive("days")}</strong>
                      <span>{renewals("preparing")}</span>
                    </div>
                    <div>
                      <small>{deepDive("owner")}</small>
                      <strong>Maya Chen</strong>
                      <span>CSM</span>
                    </div>
                  </div>
                  <div className="attention-strip">
                    <ShieldAlert aria-hidden="true" />
                    <div>
                      <small>{deepDive("riskSignals")}</small>
                      <strong>{deepDive("signal1")}</strong>
                    </div>
                    <span>{deepDive("event1Time")}</span>
                  </div>
                  <div className="next-action-strip">
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <small>{deepDive("next")}</small>
                      <strong>{deepDive("nextValue")}</strong>
                    </div>
                    <span>{deepDive("createTask")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="story-panel story-panel-team"
          data-story-stage="4"
          aria-labelledby="team-title"
        >
          <div className="marketing-container team-composition">
            <div className="story-copy" data-story-copy>
              <h2 id="team-title">{collaboration("title")}</h2>
              <p>{collaboration("description")}</p>
            </div>
            <div className="coordination-rail" data-product-plane>
              {[
                [collaboration("activity1"), collaboration("manager"), "09:42"],
                [collaboration("activity2"), collaboration("csm"), "10:18"],
                [collaboration("activity3"), collaboration("support"), "11:03"],
                [collaboration("activity4"), collaboration("ae"), "11:27"],
              ].map(([activity, owner, time], index) => (
                <article key={activity}>
                  <span>
                    {index === 0 ? (
                      <UserRoundCheck aria-hidden="true" />
                    ) : (
                      <CheckCircle2 aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <strong>{activity}</strong>
                    <small>{owner}</small>
                  </div>
                  <time>{time}</time>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="story-panel story-panel-renewal"
          data-story-stage="5"
          aria-labelledby="renewal-title"
        >
          <div className="marketing-container renewal-composition">
            <div className="story-copy" data-story-copy>
              <h2 id="renewal-title">{renewals("title")}</h2>
              <p>{renewals("description")}</p>
            </div>
            <div className="renewal-path" data-product-plane>
              {[
                [system("signals"), deepDive("signal1")],
                [system("health"), health("status")],
                [system("action"), deepDive("nextValue")],
                [lifecycle("renewal"), renewals("preparing")],
              ].map(([label, value], index) => (
                <div key={label} data-complete={index < 3}>
                  <span>{index + 1}</span>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section
        id="capabilities"
        className="capabilities-section"
        aria-labelledby="capabilities-title"
      >
        <div className="marketing-container">
          <div className="capabilities-heading" data-reveal>
            <h2 id="capabilities-title">{system("title")}</h2>
            <p>{system("actionCopy")}</p>
          </div>
          <div className="capability-grid">
            {capabilities.map(([title, description, datum], index) => (
              <article key={title} data-feature={index} data-reveal>
                <span>{datum}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                {index === 0 ? (
                  <RadioTower aria-hidden="true" />
                ) : index === 1 ? (
                  <CircleDot aria-hidden="true" />
                ) : index === 2 ? (
                  <Clock3 aria-hidden="true" />
                ) : (
                  <UserRoundCheck aria-hidden="true" />
                )}
              </article>
            ))}
          </div>
          <div className="availability-note" data-reveal>
            <span>
              {integrations("available")}: {integrations("native")} ·{" "}
              {integrations("csv")}
            </span>
            <span>
              {integrations("planned")}: {integrations("hubspot")} ·{" "}
              {integrations("salesforce")} · {integrations("intercom")}
            </span>
          </div>
        </div>
      </section>

      <section className="final-section" aria-labelledby="final-title">
        <div className="marketing-container final-composition" data-reveal>
          <BrandMark />
          <h2 id="final-title">{final("title")}</h2>
          <p>{final("description")}</p>
          <div className="hero-actions">
            <Link
              href="/sign-up"
              className="marketing-button marketing-button-primary"
            >
              {final("cta")}
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <a
              href="#story"
              className="marketing-button marketing-button-secondary"
            >
              {hero("secondary")}
            </a>
          </div>
        </div>
        <footer className="marketing-container marketing-footer">
          <span>{final("copyright")}</span>
          <span>© {new Date().getFullYear()} Waslix</span>
        </footer>
      </section>
    </main>
  );
}
