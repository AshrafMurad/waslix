import { describe, expect, it } from "vitest";

import { mapSignalToRecommendation } from "./map-signal-to-recommendation";

const expected = {
  HEALTH_LOW: ["REVIEW_HEALTH", "PLAYBOOK"],
  HEALTH_DECLINE: ["REVIEW_HEALTH", "TASK"],
  LOW_ENGAGEMENT: ["SCHEDULE_CHECK_IN", "TASK"],
  RENEWAL_PREPARATION: ["START_PLAYBOOK", "PLAYBOOK"],
  RENEWAL_DUE: ["FOLLOW_UP", "TASK"],
  RENEWAL_RISK: ["START_PLAYBOOK", "PLAYBOOK"],
  ONBOARDING_DELAY: ["START_PLAYBOOK", "PLAYBOOK"],
  UNMANAGED_RISK: ["CREATE_MITIGATION", "TASK"],
  RISK_UNRESOLVED: ["START_PLAYBOOK", "PLAYBOOK"],
  TASK_OVERDUE: ["COMPLETE_TASK", "EXISTING_TASK"],
  SUPPORT_ESCALATION: ["REVIEW_SUPPORT", "TASK"],
  USAGE_DECLINE: ["REVIEW_HEALTH", "PLAYBOOK"],
  GOAL_STALLED: ["REVIEW_GOALS", "TASK"],
} as const;

describe("mapSignalToRecommendation", () => {
  it("maps every canonical signal rule to the BR-06 action target", () => {
    for (const [ruleKey, [type, targetKind]] of Object.entries(expected)) {
      expect(mapSignalToRecommendation(ruleKey as never)).toMatchObject({
        type,
        targetKind,
      });
    }
  });
});
