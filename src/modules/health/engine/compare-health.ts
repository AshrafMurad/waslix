export type HealthBaseline = {
  snapshotAt: Date;
  overallScore: number | null;
};

const dayMilliseconds = 24 * 60 * 60 * 1000;

export function selectHealthBaseline(
  snapshots: HealthBaseline[],
  now: Date,
  windowDays: 7 | 30 | 90,
) {
  const comparisonAt = new Date(now.getTime() - windowDays * dayMilliseconds);
  const earliest = new Date(comparisonAt.getTime() - 7 * dayMilliseconds);
  return (
    snapshots
      .filter(
        (snapshot) =>
          snapshot.snapshotAt <= comparisonAt &&
          snapshot.snapshotAt >= earliest &&
          snapshot.overallScore !== null,
      )
      .sort(
        (left, right) => right.snapshotAt.getTime() - left.snapshotAt.getTime(),
      )[0] ?? null
  );
}

export function compareHealth(
  currentScore: number | null,
  baseline: HealthBaseline | null,
) {
  if (currentScore === null || !baseline || baseline.overallScore === null) {
    return null;
  }
  const delta = currentScore - baseline.overallScore;
  return {
    delta,
    direction: delta > 0 ? "UP" : delta < 0 ? "DOWN" : "STABLE",
    baselineAt: baseline.snapshotAt,
  } as const;
}
