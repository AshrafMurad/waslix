export const signalRuleVersion = "signals-v1";

export type SignalRuleKey =
  | "HEALTH_LOW"
  | "HEALTH_DECLINE"
  | "LOW_ENGAGEMENT"
  | "UNMANAGED_RISK"
  | "RISK_UNRESOLVED"
  | "TASK_OVERDUE"
  | "SUPPORT_ESCALATION"
  | "USAGE_DECLINE"
  | "GOAL_STALLED";

export type SignalCandidate = {
  ruleKey: SignalRuleKey;
  subjectKey: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  currentValue: number | null;
  previousValue: number | null;
  sourceType: "HEALTH" | "ACTIVITY" | "RISK" | "TASK" | "GOAL";
  sourceRef: string;
  deadline: string | null;
  evidence: Record<string, string | number | boolean | null>;
};

export type SignalFacts = {
  now: Date;
  localToday: string;
  customerSince: string | null;
  health: {
    id: string;
    overallScore: number | null;
    supportScore: number | null;
    usageScore: number | null;
    isSimulated: boolean;
  } | null;
  baseline30: { overallScore: number | null; usageScore: number | null } | null;
  lastMeaningfulInteractionAt: Date | null;
  risks: Array<{
    id: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "OPEN" | "MONITORING" | "RESOLVED";
    targetResolutionDate: string | null;
    hasMitigation: boolean;
  }>;
  tasks: Array<{
    id: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    dueDate: string | null;
    dueAt: Date | null;
  }>;
  goals: Array<{
    id: string;
    status:
      "NOT_STARTED" | "IN_PROGRESS" | "AT_RISK" | "ACHIEVED" | "CANCELLED";
    progressObservedAt: Date;
    targetDate: string | null;
  }>;
};

const dayMs = 86_400_000;

function elapsedDays(now: Date, then: Date) {
  return Math.floor((now.getTime() - then.getTime()) / dayMs);
}

function calendarDays(today: string, then: string) {
  return Math.floor(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${then}T00:00:00Z`)) /
      dayMs,
  );
}

export function evaluateSignals(facts: SignalFacts): SignalCandidate[] {
  const candidates: SignalCandidate[] = [];
  const health = facts.health;
  if (health?.overallScore != null && health.overallScore < 60) {
    candidates.push({
      ruleKey: "HEALTH_LOW",
      subjectKey: "customer",
      severity: health.overallScore < 40 ? "CRITICAL" : "HIGH",
      currentValue: health.overallScore,
      previousValue: facts.baseline30?.overallScore ?? null,
      sourceType: "HEALTH",
      sourceRef: health.id,
      deadline: null,
      evidence: { score: health.overallScore },
    });
  }
  if (
    health?.overallScore != null &&
    facts.baseline30?.overallScore != null &&
    health.overallScore - facts.baseline30.overallScore <= -10
  ) {
    candidates.push({
      ruleKey: "HEALTH_DECLINE",
      subjectKey: "customer",
      severity: "HIGH",
      currentValue: health.overallScore,
      previousValue: facts.baseline30.overallScore,
      sourceType: "HEALTH",
      sourceRef: health.id,
      deadline: null,
      evidence: { delta: health.overallScore - facts.baseline30.overallScore },
    });
  }
  const engagementDays = facts.lastMeaningfulInteractionAt
    ? elapsedDays(facts.now, facts.lastMeaningfulInteractionAt)
    : facts.customerSince
      ? calendarDays(facts.localToday, facts.customerSince)
      : null;
  if (engagementDays != null && engagementDays >= 21) {
    candidates.push({
      ruleKey: "LOW_ENGAGEMENT",
      subjectKey: "customer",
      severity: "MEDIUM",
      currentValue: engagementDays,
      previousValue: null,
      sourceType: "ACTIVITY",
      sourceRef: "customer",
      deadline: null,
      evidence: { days: engagementDays },
    });
  }
  if (health?.supportScore != null && health.supportScore <= 40) {
    candidates.push({
      ruleKey: "SUPPORT_ESCALATION",
      subjectKey: "customer",
      severity: "HIGH",
      currentValue: health.supportScore,
      previousValue: null,
      sourceType: "HEALTH",
      sourceRef: health.id,
      deadline: null,
      evidence: { score: health.supportScore },
    });
  }
  if (
    health?.usageScore != null &&
    facts.baseline30?.usageScore != null &&
    health.usageScore - facts.baseline30.usageScore <= -20
  ) {
    candidates.push({
      ruleKey: "USAGE_DECLINE",
      subjectKey: "customer",
      severity: "HIGH",
      currentValue: health.usageScore,
      previousValue: facts.baseline30.usageScore,
      sourceType: "HEALTH",
      sourceRef: health.id,
      deadline: null,
      evidence: { delta: health.usageScore - facts.baseline30.usageScore },
    });
  }
  for (const risk of facts.risks) {
    if (
      risk.status === "RESOLVED" ||
      !["HIGH", "CRITICAL"].includes(risk.severity)
    )
      continue;
    const severity = risk.severity as "HIGH" | "CRITICAL";
    candidates.push({
      ruleKey: "RISK_UNRESOLVED",
      subjectKey: `risk:${risk.id}`,
      severity,
      currentValue: null,
      previousValue: null,
      sourceType: "RISK",
      sourceRef: risk.id,
      deadline: risk.targetResolutionDate,
      evidence: { severity: risk.severity },
    });
    if (!risk.hasMitigation) {
      candidates.push({
        ruleKey: "UNMANAGED_RISK",
        subjectKey: `risk:${risk.id}`,
        severity,
        currentValue: null,
        previousValue: null,
        sourceType: "RISK",
        sourceRef: risk.id,
        deadline: risk.targetResolutionDate,
        evidence: { severity: risk.severity, hasMitigation: false },
      });
    }
  }
  for (const task of facts.tasks) {
    const overdue =
      task.status !== "COMPLETED" &&
      task.status !== "CANCELLED" &&
      ((task.dueDate != null && task.dueDate < facts.localToday) ||
        (task.dueAt != null && task.dueAt < facts.now));
    if (overdue && (task.priority === "HIGH" || task.priority === "URGENT")) {
      candidates.push({
        ruleKey: "TASK_OVERDUE",
        subjectKey: `task:${task.id}`,
        severity: task.priority === "URGENT" ? "CRITICAL" : "HIGH",
        currentValue: null,
        previousValue: null,
        sourceType: "TASK",
        sourceRef: task.id,
        deadline: task.dueDate,
        evidence: {
          priority: task.priority,
          dueAt: task.dueAt?.toISOString() ?? null,
        },
      });
    }
  }
  for (const goal of facts.goals) {
    if (
      (goal.status === "IN_PROGRESS" || goal.status === "AT_RISK") &&
      elapsedDays(facts.now, goal.progressObservedAt) >= 30
    ) {
      candidates.push({
        ruleKey: "GOAL_STALLED",
        subjectKey: `goal:${goal.id}`,
        severity: "MEDIUM",
        currentValue: elapsedDays(facts.now, goal.progressObservedAt),
        previousValue: null,
        sourceType: "GOAL",
        sourceRef: goal.id,
        deadline: goal.targetDate,
        evidence: { days: elapsedDays(facts.now, goal.progressObservedAt) },
      });
    }
  }
  return candidates.sort((a, b) =>
    `${a.ruleKey}:${a.subjectKey}`.localeCompare(
      `${b.ruleKey}:${b.subjectKey}`,
    ),
  );
}
