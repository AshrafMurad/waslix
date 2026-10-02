import type { MutableRefObject } from "react";

export type CoreMotionState = {
  progress: number;
  pointerX: number;
  pointerY: number;
  reduced: boolean;
};

export type CoreQuality = "full" | "lite" | "minimal";

export type CoreMotionRef = MutableRefObject<CoreMotionState>;

export type LandingExperienceLabels = {
  health: string;
  renewal: string;
  owner: string;
  attention: string;
  healthy: string;
  risk: string;
  illustrative: string;
  healthScore: string;
  signals: string[];
  factors: Array<[string, string, "attention" | "healthy" | "risk"]>;
  evidence: [string, string];
  workflow: Array<[string, string, "risk" | "attention" | "brand" | "healthy"]>;
};
