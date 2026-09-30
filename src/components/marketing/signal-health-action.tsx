import {
  Activity,
  ArrowUpRight,
  Check,
  CircleDot,
  ListChecks,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

type SignalHealthActionProps = { locale: "en" | "ar" };

export async function SignalHealthAction({ locale }: SignalHealthActionProps) {
  const t = await getTranslations({ locale, namespace: "marketing.system" });

  return (
    <section
      id="how-it-works"
      className="marketing-section system-section"
      aria-labelledby="system-title"
    >
      <div className="marketing-container system-intro">
        <span className="marketing-eyebrow">
          <i />
          {t("eyebrow")}
        </span>
        <h2 id="system-title">{t("title")}</h2>
        <p>{t("description")}</p>
      </div>

      <div className="marketing-container system-story">
        <div className="system-index" aria-hidden="true">
          <span>01</span>
          <i />
          <span>02</span>
          <i />
          <span>03</span>
        </div>

        <article className="system-state signal-state">
          <div className="system-copy">
            <span>01</span>
            <Activity aria-hidden="true" />
            <h3>{t("signals")}</h3>
            <p>{t("signalsCopy")}</p>
          </div>
          <div className="signal-inbox">
            {["signal1", "signal2", "signal3", "signal4", "signal5"].map(
              (item, index) => (
                <div key={item}>
                  <CircleDot aria-hidden="true" />
                  <span>{t(item)}</span>
                  <small>{index + 2}m</small>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="system-state health-state">
          <div className="system-copy">
            <span>02</span>
            <CircleDot aria-hidden="true" />
            <h3>{t("health")}</h3>
            <p>{t("healthCopy")}</p>
          </div>
          <div className="health-model">
            <div className="health-orbit-display">
              <svg viewBox="0 0 180 180" aria-hidden="true">
                <circle cx="90" cy="90" r="72" />
                <circle
                  className="health-progress"
                  cx="90"
                  cy="90"
                  r="72"
                  pathLength="100"
                />
              </svg>
              <strong>72</strong>
              <span>{t("good")}</span>
            </div>
            <div className="health-model-factors">
              {["usage", "engagement", "support", "goals"].map(
                (factor, index) => (
                  <span key={factor}>
                    <i style={{ width: `${[64, 78, 52, 86][index]}%` }} />
                    {t(factor)}
                  </span>
                ),
              )}
            </div>
          </div>
        </article>

        <article className="system-state action-state">
          <div className="system-copy">
            <span>03</span>
            <ListChecks aria-hidden="true" />
            <h3>{t("action")}</h3>
            <p>{t("actionCopy")}</p>
          </div>
          <div className="action-queue">
            {["task1", "task2", "task3", "task4"].map((task, index) => (
              <div key={task}>
                <span className="action-check">
                  {index === 1 ? <Check aria-hidden="true" /> : null}
                </span>
                <span>{t(task)}</span>
                <small>{index === 0 ? "P1" : `P${index + 1}`}</small>
                <ArrowUpRight aria-hidden="true" />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
