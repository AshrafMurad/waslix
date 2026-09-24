export const healthRuleVersion = "health-v1";

export const healthWeights = {
  USAGE: 0.35,
  ENGAGEMENT: 0.25,
  SUPPORT: 0.2,
  GOALS: 0.2,
} as const;

export type HealthDimension = keyof typeof healthWeights;
export type HealthFreshness = "FRESH" | "AGING" | "STALE";

export type HealthDimensionInput = {
  dimension: HealthDimension;
  score: number;
  observedAt: Date;
  source: "MANUAL" | "SYSTEM" | "INTEGRATION";
  sourceId: string;
  isSimulated: boolean;
};

export type CalculatedHealth = {
  rawScore: number | null;
  overallScore: number | null;
  status: "HEALTHY" | "NEEDS_ATTENTION" | "AT_RISK" | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceValue: number;
  dimensions: Partial<
    Record<
      HealthDimension,
      HealthDimensionInput & {
        freshness: HealthFreshness;
        originalWeight: number;
        effectiveWeight: number;
      }
    >
  >;
};

const dayMilliseconds = 24 * 60 * 60 * 1000;

export function freshnessAt(observedAt: Date, now: Date): HealthFreshness {
  const ageInDays = Math.max(
    0,
    Math.floor((now.getTime() - observedAt.getTime()) / dayMilliseconds),
  );
  if (ageInDays <= 6) return "FRESH";
  if (ageInDays <= 29) return "AGING";
  return "STALE";
}

function freshnessFactor(freshness: HealthFreshness) {
  if (freshness === "FRESH") return 1;
  if (freshness === "AGING") return 0.5;
  return 0;
}

export function calculateHealth(
  inputs: HealthDimensionInput[],
  now: Date,
): CalculatedHealth {
  const dimensions: CalculatedHealth["dimensions"] = {};
  let weightedScore = 0;
  let availableWeight = 0;
  let confidenceValue = 0;

  for (const input of inputs) {
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) {
      throw new RangeError(`Invalid ${input.dimension} health score`);
    }
    if (dimensions[input.dimension]) {
      throw new RangeError(`Duplicate ${input.dimension} health score`);
    }
    const originalWeight = healthWeights[input.dimension];
    const freshness = freshnessAt(input.observedAt, now);
    const effectiveWeight = originalWeight / healthWeightsFor(inputs);
    dimensions[input.dimension] = {
      ...input,
      freshness,
      originalWeight,
      effectiveWeight,
    };
    weightedScore += input.score * originalWeight;
    availableWeight += originalWeight;
    confidenceValue += originalWeight * freshnessFactor(freshness);
  }

  if (availableWeight === 0) {
    return {
      rawScore: null,
      overallScore: null,
      status: null,
      confidence: "LOW",
      confidenceValue: 0,
      dimensions,
    };
  }

  const rawScore = weightedScore / availableWeight;
  const overallScore = Math.floor(rawScore + 0.5);
  return {
    rawScore,
    overallScore,
    status:
      overallScore >= 80
        ? "HEALTHY"
        : overallScore >= 60
          ? "NEEDS_ATTENTION"
          : "AT_RISK",
    confidence:
      confidenceValue >= 0.8
        ? "HIGH"
        : confidenceValue >= 0.5
          ? "MEDIUM"
          : "LOW",
    confidenceValue,
    dimensions,
  };
}

function healthWeightsFor(inputs: HealthDimensionInput[]) {
  return inputs.reduce(
    (total, input) => total + healthWeights[input.dimension],
    0,
  );
}

export function engagementScoreForDays(daysSinceInteraction: number) {
  if (!Number.isInteger(daysSinceInteraction) || daysSinceInteraction < 0) {
    throw new RangeError("Interaction age must be a nonnegative whole day");
  }
  if (daysSinceInteraction <= 7) return 100;
  if (daysSinceInteraction <= 14) return 85;
  if (daysSinceInteraction <= 21) return 70;
  if (daysSinceInteraction <= 30) return 50;
  if (daysSinceInteraction <= 45) return 30;
  return 10;
}

export function goalProgressScore(
  goals: Array<{ progress: number; status: string }>,
) {
  const eligible = goals.filter((goal) => goal.status !== "CANCELLED");
  if (!eligible.length) return null;
  const mean =
    eligible.reduce((total, goal) => total + goal.progress, 0) /
    eligible.length;
  return Math.floor(mean + 0.5);
}
