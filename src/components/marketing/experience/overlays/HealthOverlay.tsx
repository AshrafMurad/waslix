import type { CSSProperties } from "react";

import type { LandingExperienceLabels } from "../types";

export function HealthOverlay({ labels }: { labels: LandingExperienceLabels }) {
  return (
    <div className="signal-overlays">
      {labels.signals.map((signal, index) => (
        <span key={signal} style={{ "--signal-index": index } as CSSProperties}>
          <i />
          {signal}
        </span>
      ))}
      <article className="scene-health-panel">
        <header>
          <div>
            <small>{labels.illustrative}</small>
            <strong>Northstar Analytics</strong>
          </div>
          <span>{labels.attention}</span>
        </header>
        <div className="scene-health-score">
          <strong>64</strong>
          <span>
            {labels.healthScore} <small>78 → 64</small>
          </span>
        </div>
        <div className="scene-health-factors">
          {labels.factors.map(([label, value, tone]) => (
            <div key={label} data-tone={tone}>
              <span>{label}</span>
              <i>
                <b style={{ width: `${value}%` }} />
              </i>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <footer>
          <span>{labels.evidence[0]}</span>
          <span>{labels.evidence[1]}</span>
        </footer>
      </article>
    </div>
  );
}
