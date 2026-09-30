import { ArrowRight, Check, CircleDot, Rocket, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

type LifecycleProps = { locale: "en" | "ar" };

export async function Lifecycle({ locale }: LifecycleProps) {
  const t = await getTranslations({ locale, namespace: "marketing.lifecycle" });
  const stages = [
    "onboarding",
    "adoption",
    "healthy",
    "expansion",
    "renewal",
  ] as const;

  return (
    <section
      className="marketing-section lifecycle-section"
      aria-labelledby="lifecycle-title"
    >
      <div className="marketing-container section-heading centered-heading">
        <span className="marketing-eyebrow">
          <i />
          {t("eyebrow")}
        </span>
        <h2 id="lifecycle-title">{t("title")}</h2>
        <p>{t("description")}</p>
      </div>
      <div
        className="marketing-container lifecycle-track"
        role="list"
        aria-label={t("progress")}
      >
        <div className="lifecycle-line" aria-hidden="true">
          <i />
        </div>
        {stages.map((stage, index) => (
          <article
            className="lifecycle-stage"
            key={stage}
            role="listitem"
            data-stage={stage}
          >
            <div className="lifecycle-marker">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
            </div>
            <h3>{t(stage)}</h3>
            <p>{t(`${stage}Copy`)}</p>
            {index < stages.length - 1 && (
              <ArrowRight className="lifecycle-arrow" aria-hidden="true" />
            )}
            {stage === "onboarding" && (
              <div className="lifecycle-preview onboarding-preview">
                {["milestone1", "milestone2", "milestone3", "milestone4"].map(
                  (item, itemIndex) => (
                    <span key={item}>
                      <i>
                        {itemIndex < 3 ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <CircleDot aria-hidden="true" />
                        )}
                      </i>
                      {t(item)}
                    </span>
                  ),
                )}
                <small>{t("complete")}</small>
              </div>
            )}
            {stage === "renewal" && (
              <div className="lifecycle-preview renewal-preview">
                <Rocket aria-hidden="true" />
                <strong>USD 48K</strong>
                <span>21 days</span>
                <small>
                  <Sparkles aria-hidden="true" />
                  Preparing
                </small>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
