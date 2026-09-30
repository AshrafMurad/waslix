import {
  BookOpenText,
  Boxes,
  CheckSquare2,
  CircleDollarSign,
  FileSpreadsheet,
  Headphones,
  LineChart,
  MessagesSquare,
  UserRoundSearch,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

type DataFragmentationProps = { locale: "en" | "ar" };

export async function DataFragmentation({ locale }: DataFragmentationProps) {
  const t = await getTranslations({
    locale,
    namespace: "marketing.fragmented",
  });
  const sources = [
    ["crm", UserRoundSearch, "planned"],
    ["support", Headphones, "planned"],
    ["usage", LineChart, "planned"],
    ["spreadsheets", FileSpreadsheet, "available"],
    ["tasks", CheckSquare2, "available"],
    ["billing", CircleDollarSign, "planned"],
    ["meetings", MessagesSquare, "available"],
    ["notes", BookOpenText, "available"],
  ] as const;

  return (
    <section
      id="product"
      className="marketing-section fragmentation-section"
      aria-labelledby="fragmented-title"
    >
      <div className="marketing-container section-heading split-heading">
        <div>
          <span className="marketing-eyebrow">
            <i />
            {t("eyebrow")}
          </span>
          <h2 id="fragmented-title">
            {t("titleLine1")}
            <span>{t("titleLine2")}</span>
          </h2>
        </div>
        <p>{t("description")}</p>
      </div>

      <div className="marketing-container fragmentation-system">
        <div className="source-cloud">
          {sources.map(([label, Icon, availability], index) => (
            <div
              className="source-node"
              key={label}
              style={{ "--node-index": index } as React.CSSProperties}
            >
              <Icon aria-hidden="true" />
              <span>{t(label)}</span>
              <small data-available={availability === "available"}>
                {t(availability)}
              </small>
            </div>
          ))}
        </div>

        <div className="fragmentation-rail" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="waslix-processor">
          <div className="processor-core">
            <Boxes aria-hidden="true" />
            <span>W</span>
          </div>
          <small>{t("core")}</small>
          <div className="processor-output">
            {["profile", "health", "risk", "actions"].map((item, index) => (
              <span key={item}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                {t(item)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
