import { describe, expect, it } from "vitest";

import {
  calculateHealth,
  engagementScoreForDays,
  freshnessAt,
  goalProgressScore,
  type HealthDimensionInput,
} from "./calculate-health";
import { compareHealth, selectHealthBaseline } from "./compare-health";

const now = new Date("2026-09-24T12:00:00.000Z");

function input(
  dimension: HealthDimensionInput["dimension"],
  score: number,
  observedAt = now,
): HealthDimensionInput {
  return {
    dimension,
    score,
    observedAt,
    source: "SYSTEM",
    sourceId: dimension,
    isSimulated: false,
  };
}

describe("health engine", () => {
  it("weights all dimensions and rounds half up once", () => {
    expect(
      calculateHealth(
        [
          input("USAGE", 60),
          input("ENGAGEMENT", 75),
          input("SUPPORT", 50),
          input("GOALS", 80),
        ],
        now,
      ),
    ).toMatchObject({ rawScore: 65.75, overallScore: 66 });
    expect(calculateHealth([input("USAGE", 59.5)], now).overallScore).toBe(60);
  });

  it("normalizes missing dimensions instead of treating them as zero", () => {
    expect(
      calculateHealth(
        [input("USAGE", 60), input("ENGAGEMENT", 75), input("GOALS", 90)],
        now,
      ).overallScore,
    ).toBe(72);
    expect(calculateHealth([], now)).toMatchObject({
      overallScore: null,
      status: null,
      confidence: "LOW",
    });
  });

  it("rejects normalized scores outside zero to one hundred", () => {
    expect(() => calculateHealth([input("USAGE", -1)], now)).toThrow(
      RangeError,
    );
    expect(() => calculateHealth([input("SUPPORT", 101)], now)).toThrow(
      RangeError,
    );
  });

  it.each([
    [59, "AT_RISK"],
    [60, "NEEDS_ATTENTION"],
    [79, "NEEDS_ATTENTION"],
    [80, "HEALTHY"],
  ] as const)("classifies %i as %s", (score, status) => {
    expect(calculateHealth([input("USAGE", score)], now).status).toBe(status);
  });

  it("uses freshness boundaries for confidence without dropping stale values", () => {
    expect(freshnessAt(new Date("2026-09-18T12:00:00Z"), now)).toBe("FRESH");
    expect(freshnessAt(new Date("2026-09-17T12:00:00Z"), now)).toBe("AGING");
    expect(freshnessAt(new Date("2026-08-25T12:00:00Z"), now)).toBe("STALE");
    const result = calculateHealth(
      [
        input("USAGE", 90),
        input("ENGAGEMENT", 80),
        input("SUPPORT", 70, new Date("2026-08-01T00:00:00Z")),
        input("GOALS", 60),
      ],
      now,
    );
    expect(result.overallScore).toBe(78);
    expect(result.confidence).toBe("HIGH");
    expect(result.confidenceValue).toBeCloseTo(0.8);
  });

  it("derives native engagement and goal scores", () => {
    expect(
      [7, 8, 14, 15, 21, 22, 30, 31, 45, 46].map(engagementScoreForDays),
    ).toEqual([100, 85, 85, 70, 70, 50, 50, 30, 30, 10]);
    expect(
      goalProgressScore([
        { progress: 40, status: "IN_PROGRESS" },
        { progress: 100, status: "ACHIEVED" },
        { progress: 0, status: "CANCELLED" },
      ]),
    ).toBe(70);
    expect(goalProgressScore([])).toBeNull();
  });

  it("selects the latest valid baseline and compares rounded points", () => {
    const baseline = selectHealthBaseline(
      [
        { snapshotAt: new Date("2026-08-24T12:00:00Z"), overallScore: 80 },
        { snapshotAt: new Date("2026-08-25T12:00:00Z"), overallScore: 78 },
      ],
      now,
      30,
    );
    expect(compareHealth(67, baseline)).toMatchObject({
      delta: -11,
      direction: "DOWN",
    });
    expect(selectHealthBaseline([], now, 90)).toBeNull();
  });
});
