import {
  Braces,
  FileSpreadsheet,
  MessageSquareMore,
  PanelsTopLeft,
  PlugZap,
  Receipt,
  UsersRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

type IntegrationsProps = { locale: "en" | "ar" };

export async function Integrations({ locale }: IntegrationsProps) {
  const t = await getTranslations({
    locale,
    namespace: "marketing.integrations",
  });
  const current = [
    ["native", PanelsTopLeft],
    ["csv", FileSpreadsheet],
  ] as const;
  const planned = [
    ["hubspot", UsersRound],
    ["salesforce", PlugZap],
    ["intercom", MessageSquareMore],
    ["zendesk", MessageSquareMore],
    ["slack", MessageSquareMore],
    ["stripe", Receipt],
    ["api", Braces],
  ] as const;

  return (
    <section
      className="marketing-section integrations-section"
      aria-labelledby="integrations-title"
    >
      <div className="marketing-container integrations-layout">
        <div className="section-heading">
          <span className="marketing-eyebrow">
            <i />
            {t("eyebrow")}
          </span>
          <h2 id="integrations-title">{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <div className="integration-map">
          <div className="integration-group available-integrations">
            <span>{t("available")}</span>
            {current.map(([name, Icon]) => (
              <div key={name}>
                <Icon aria-hidden="true" />
                <strong>{t(name)}</strong>
                <i />
              </div>
            ))}
          </div>
          <div className="integration-hub" aria-hidden="true">
            <span>W</span>
            <i />
            <i />
            <i />
          </div>
          <div className="integration-group planned-integrations">
            <span>{t("planned")}</span>
            {planned.map(([name, Icon]) => (
              <div key={name}>
                <Icon aria-hidden="true" />
                <strong>{t(name)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
