import type { CSSProperties } from "react";

import type { LandingExperienceLabels } from "../types";

export function WorkflowOverlay({
  labels,
}: {
  labels: LandingExperienceLabels;
}) {
  return (
    <div className="workflow-overlays">
      {labels.workflow.map(([title, detail, tone], index) => (
        <article
          key={title}
          data-tone={tone}
          style={{ "--workflow-index": index } as CSSProperties}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{title}</strong>
            <small>{detail}</small>
          </div>
        </article>
      ))}
    </div>
  );
}
