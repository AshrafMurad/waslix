import type { LandingExperienceLabels } from "../types";

export function CustomerOverlay({
  labels,
}: {
  labels: LandingExperienceLabels;
}) {
  return (
    <div className="portfolio-overlays">
      <article
        className="scene-account-card"
        data-customer="0"
        data-tone="attention"
      >
        <header>
          <strong>Northstar Analytics</strong>
          <span>64</span>
        </header>
        <p>
          {labels.health} · {labels.renewal} 31
        </p>
        <footer>
          <i />
          {labels.attention} <span>{labels.owner} · Maya Chen</span>
        </footer>
      </article>
      <article
        className="scene-account-card"
        data-customer="1"
        data-tone="healthy"
      >
        <header>
          <strong>NovaLedger</strong>
          <span>87</span>
        </header>
        <p>
          {labels.health} · {labels.renewal} 142
        </p>
        <footer>
          <i />
          {labels.healthy}
        </footer>
      </article>
      <article
        className="scene-account-card"
        data-customer="3"
        data-tone="risk"
      >
        <header>
          <strong>Summit Forge</strong>
          <span>48</span>
        </header>
        <p>
          {labels.health} · {labels.renewal} 45
        </p>
        <footer>
          <i />
          {labels.risk}
        </footer>
      </article>
    </div>
  );
}
