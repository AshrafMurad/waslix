import { Check, Clock3, FileText, RefreshCcw, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

type CollaborationRenewalsProps = { locale: "en" | "ar" };

export async function CollaborationRenewals({
  locale,
}: CollaborationRenewalsProps) {
  const collaboration = await getTranslations({
    locale,
    namespace: "marketing.collaboration",
  });
  const renewals = await getTranslations({
    locale,
    namespace: "marketing.renewals",
  });
  const team = [
    ["MK", "Maya Khan", "csm"],
    ["SL", "Sam Lee", "manager"],
    ["JR", "Jon Reed", "ae"],
    ["AN", "Ari Noor", "support"],
  ] as const;

  return (
    <section className="marketing-section operations-section">
      <div className="marketing-container operations-grid">
        <article
          className="collaboration-block"
          aria-labelledby="collaboration-title"
        >
          <span className="marketing-eyebrow">
            <i />
            {collaboration("eyebrow")}
          </span>
          <h2 id="collaboration-title">{collaboration("title")}</h2>
          <p>{collaboration("description")}</p>
          <div className="collaboration-ui">
            <div className="account-team">
              <h3>{collaboration("team")}</h3>
              {team.map(([initials, name, role]) => (
                <div key={name}>
                  <span>{initials}</span>
                  <div>
                    <strong>{name}</strong>
                    <small>{collaboration(role)}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="operations-feed">
              <h3>{collaboration("activity")}</h3>
              {[
                ["activity1", UserRound],
                ["activity2", Check],
                ["activity3", FileText],
                ["activity4", RefreshCcw],
              ].map(([activity, Icon], index) => (
                <div key={activity as string}>
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <p>{collaboration(activity as "activity1")}</p>
                  <small>{index + 2}m</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="renewals-block" aria-labelledby="renewals-title">
          <span className="marketing-eyebrow">
            <i />
            {renewals("eyebrow")}
          </span>
          <h2 id="renewals-title">{renewals("title")}</h2>
          <p>{renewals("description")}</p>
          <div className="renewal-ui">
            <div className="renewal-forecast">
              <span>
                <Clock3 aria-hidden="true" />
                {renewals("forecast")}
              </span>
              <strong>{renewals("forecastValue")}</strong>
              <small>{renewals("window")}</small>
            </div>
            <div className="renewal-table">
              <div>
                <span>{renewals("account")}</span>
                <span>{renewals("value")}</span>
                <span>{renewals("readiness")}</span>
                <span>{renewals("date")}</span>
              </div>
              {[
                ["Acme", "USD 48K", "healthy", "May 21"],
                ["Orbit", "USD 36K", "risk", "May 31"],
                ["Vertex", "USD 12K", "attention", "Jun 14"],
              ].map(([account, value, readiness, date]) => (
                <div key={account}>
                  <span>
                    <i>{account.charAt(0)}</i>
                    {account}
                  </span>
                  <span>{value}</span>
                  <span data-tone={readiness}>
                    {renewals(readiness as "healthy")}
                  </span>
                  <span>{date}</span>
                </div>
              ))}
            </div>
            <div className="renewal-axis" aria-hidden="true">
              <span>{renewals("preparing")}</span>
              <i />
              <span>{renewals("discussion")}</span>
              <i />
              <span>{renewals("upcoming")}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
