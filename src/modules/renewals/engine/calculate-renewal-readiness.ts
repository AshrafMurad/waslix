export const renewalRuleVersion = "renewal-v1";

export type RenewalReadinessReason =
  | "HEALTH_AT_RISK"
  | "HEALTH_NEEDS_ATTENTION"
  | "HEALTH_MISSING"
  | "HIGH_RISK_OPEN"
  | "RISK_OPEN"
  | "SUPPORT_ESCALATION"
  | "ENGAGEMENT_MISSING"
  | "ENGAGEMENT_STALE"
  | "GOALS_MISSING"
  | "GOALS_LOW"
  | "ONBOARDING_DELAYED";

export type RenewalReadinessFacts = {
  localToday: string;
  renewalAt: string;
  healthScore: number | null;
  supportScore: number | null;
  lastMeaningfulInteractionAt: string | null;
  unresolvedRisks: Array<{ severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }>;
  goals: Array<{ progress: number; status: string }>;
  onboardingDelayed: boolean;
};

const dayMs = 86_400_000;

export function daysUntilRenewal(localToday: string, renewalAt: string) {
  return Math.floor(
    (Date.parse(`${renewalAt}T00:00:00Z`) -
      Date.parse(`${localToday}T00:00:00Z`)) /
      dayMs,
  );
}

function daysSince(localToday: string, date: string) {
  return Math.floor(
    (Date.parse(`${localToday}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) /
      dayMs,
  );
}

export function calculateRenewalReadiness(facts: RenewalReadinessFacts) {
  const daysUntil = daysUntilRenewal(facts.localToday, facts.renewalAt);
  if (daysUntil > 60) {
    return {
      status: null,
      pending: false,
      daysUntil,
      reasons: [] as RenewalReadinessReason[],
    };
  }

  const reasons: RenewalReadinessReason[] = [];
  if (facts.healthScore == null) reasons.push("HEALTH_MISSING");
  else if (facts.healthScore < 60) reasons.push("HEALTH_AT_RISK");
  else if (facts.healthScore < 80) reasons.push("HEALTH_NEEDS_ATTENTION");
  if (facts.supportScore != null && facts.supportScore <= 40) {
    reasons.push("SUPPORT_ESCALATION");
  }

  const hasHighRisk = facts.unresolvedRisks.some((risk) =>
    ["HIGH", "CRITICAL"].includes(risk.severity),
  );
  if (hasHighRisk) reasons.push("HIGH_RISK_OPEN");
  else if (facts.unresolvedRisks.length) reasons.push("RISK_OPEN");

  if (!facts.lastMeaningfulInteractionAt) reasons.push("ENGAGEMENT_MISSING");
  else if (
    daysSince(facts.localToday, facts.lastMeaningfulInteractionAt) >= 21
  ) {
    reasons.push("ENGAGEMENT_STALE");
  }

  const eligibleGoals = facts.goals.filter(
    (goal) => goal.status !== "CANCELLED",
  );
  if (!eligibleGoals.length) reasons.push("GOALS_MISSING");
  else if (
    eligibleGoals.reduce((sum, goal) => sum + goal.progress, 0) /
      eligibleGoals.length <
    60
  ) {
    reasons.push("GOALS_LOW");
  }
  if (facts.onboardingDelayed) reasons.push("ONBOARDING_DELAYED");

  const status = reasons.some((reason) =>
    ["HEALTH_AT_RISK", "HIGH_RISK_OPEN", "SUPPORT_ESCALATION"].includes(reason),
  )
    ? "AT_RISK"
    : reasons.length
      ? "NEEDS_ATTENTION"
      : "HEALTHY";
  return { status, pending: false, daysUntil, reasons };
}
