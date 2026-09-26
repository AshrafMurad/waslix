ALTER TABLE "customer_health"
  ADD CONSTRAINT "customer_health_raw_score_check" CHECK ("rawScore" IS NULL OR "rawScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "customer_health_usage_score_check" CHECK ("usageScore" IS NULL OR "usageScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "customer_health_engagement_score_check" CHECK ("engagementScore" IS NULL OR "engagementScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "customer_health_support_score_check" CHECK ("supportScore" IS NULL OR "supportScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "customer_health_goal_score_check" CHECK ("goalScore" IS NULL OR "goalScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "customer_health_confidence_value_check" CHECK ("confidenceValue" BETWEEN 0 AND 1);

ALTER TABLE "health_snapshot"
  ADD CONSTRAINT "health_snapshot_raw_score_check" CHECK ("rawScore" IS NULL OR "rawScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "health_snapshot_usage_score_check" CHECK ("usageScore" IS NULL OR "usageScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "health_snapshot_engagement_score_check" CHECK ("engagementScore" IS NULL OR "engagementScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "health_snapshot_support_score_check" CHECK ("supportScore" IS NULL OR "supportScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "health_snapshot_goal_score_check" CHECK ("goalScore" IS NULL OR "goalScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "health_snapshot_confidence_value_check" CHECK ("confidenceValue" BETWEEN 0 AND 1);
