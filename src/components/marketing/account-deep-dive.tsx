import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

type AccountDeepDiveProps = { locale: "en" | "ar" };

export async function AccountDeepDive({ locale }: AccountDeepDiveProps) {
  const t = await getTranslations({ locale, namespace: "marketing.deepDive" });

  return (
    <section
      className="marketing-section account-section"
      aria-labelledby="account-title"
    >
      <div className="marketing-container section-heading split-heading">
        <div>
          <span className="marketing-eyebrow">
            <i />
            {t("eyebrow")}
          </span>
          <h2 id="account-title">{t("title")}</h2>
        </div>
        <p>{t("description")}</p>
      </div>

      <div className="marketing-container account-frame-wrap">
        <div className="account-focus-line" aria-hidden="true">
          <span>{t("illustrative")} · Orbit Software</span>
          <i />
        </div>
        <div className="account-frame">
          <header className="account-header">
            <div className="account-identity">
              <span>O</span>
              <div>
                <strong>Orbit Software</strong>
                <small>B2B software · Growth</small>
              </div>
            </div>
            <div className="account-facts">
              <span>
                <small>{t("health")}</small>
                <strong className="risk-text">45</strong>
              </span>
              <span>
                <small>{t("arr")}</small>
                <strong>USD 36K</strong>
              </span>
              <span>
                <small>{t("renewal")}</small>
                <strong>{t("days")}</strong>
              </span>
              <span>
                <small>{t("owner")}</small>
                <strong>Maya K.</strong>
              </span>
            </div>
          </header>

          <div className="account-workspace">
            <div className="risk-signal-panel">
              <div className="product-panel-heading">
                <span>{t("riskSignals")}</span>
                <small>4</small>
              </div>
              {["signal1", "signal2", "signal3", "signal4"].map(
                (signal, index) => (
                  <div className="risk-signal-row" key={signal}>
                    <CircleAlert aria-hidden="true" />
                    <span>{t(signal)}</span>
                    <small>{index < 2 ? "High" : "Medium"}</small>
                  </div>
                ),
              )}
              <div className="next-action-card">
                <span>{t("next")}</span>
                <strong>{t("nextValue")}</strong>
                <button type="button">
                  {t("createTask")}
                  <ArrowUpRight aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="account-timeline">
              <div className="product-panel-heading">
                <span>{t("timeline")}</span>
                <small>Live</small>
              </div>
              {[
                ["event1", "event1Time", CheckCircle2, "human"],
                ["event2", "event2Time", UserRound, "human"],
                ["event3", "event3Time", Bot, "system"],
              ].map(([event, time, Icon, type]) => (
                <div
                  className="timeline-event"
                  key={event as string}
                  data-type={type}
                >
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{t(event as "event1")}</strong>
                    <small>{t(time as "event1Time")}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
