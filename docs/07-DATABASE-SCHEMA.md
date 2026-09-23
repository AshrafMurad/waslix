# 07 · Database schema specification

Status: logical PostgreSQL/Prisma contract, not generated or migrated code. **Pack defaults** supply types and constraints missing from the conversation. Validate the ORM mapping in milestone M1 before generating business tables. Behavior lives in [05](05-BUSINESS-RULES.md).

## Conventions

UUID primary IDs (pack choice); timestamps are timezone-aware UTC instants. `?` means nullable; other fields are required. Text is bounded by server validation; use 200 characters for names/titles, 10,000 for narrative text as pack defaults. Money is Decimal(18,2) with currency Char(3). Scores use Decimal(5,2) where raw values matter; displayed scores/progress are integers in 0–100.

Every business table has `id UUID, workspaceId UUID, createdAt timestamp, updatedAt timestamp` unless append-only, in which case omit updatedAt. Join tables may use a composite primary key instead of id. Workspace and global auth tables are exceptions to workspaceId. Membership is tenant-owned.

Tenant-owned referenced entities expose `UNIQUE(workspaceId,id)`. Customer child entities that are referenced alongside customer expose `UNIQUE(workspaceId,customerId,id)`. Use composite foreign keys so cross-tenant and cross-customer references fail in the database, in addition to service checks. Restrict business-parent deletion; only the workspace FK cascades tenant deletion.

Owner/actor IDs below reference WorkspaceMember IDs in the same tenant. A departed member is INACTIVE, not deleted. System actor IDs may be null.

## Identity and workspace

| Model           | Fields beyond common fields                                             | Constraints                                                              |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| User            | Auth-managed identity, email, name, image?, preferredLocale, timestamps | Global; use Better Auth's supported extension; locale EN/AR, default EN  |
| Workspace       | id, name, slug, timezone, defaultCurrency, createdAt, updatedAt         | Unique slug                                                              |
| WorkspaceMember | userId, role, status, joinedAt                                          | Unique workspaceId+userId                                                |
| LifecycleStage  | name, key, position, isActive                                           | Unique workspaceId+key; reserved new/adoption/churned keys remain active |
| Tag             | name, normalizedName                                                    | Unique workspaceId+normalizedName                                        |
| CustomerTag     | customerId, tagId, createdAt                                            | Composite PK workspaceId+customerId+tagId                                |

Roles ADMIN/CS_MANAGER/CSM/VIEWER; member statuses ACTIVE/INACTIVE. Default stages: new, onboarding, adoption, active, renewal, churned.

**Auth mapping pack default:** use Better Auth organization as the Workspace and its member as WorkspaceMember through the supported adapter/mapping, with one membership authority. Auth Session/Account/Verification/Invitation and required organization fields are generated for the selected pinned Better Auth version. Retain required provider fields; do not handwrite a competing credential schema. The M1.2 spike must record the canonical organization/member tables and stable member ID used by domain FKs; supported User extension for preferredLocale; role/status mutation owner; invitation lifecycle; inactive-member session invalidation; active-workspace selection; and exact adapter extension or one-to-one mapping. No business migration may reference membership until this decision passes integration tests. Never maintain two unsynchronized member lists.

### M1.2 auth and membership mapping decision

- Better Auth `1.7.5` with its Prisma adapter is the identity authority. Prisma `User` maps to `user`; Better Auth organization is mapped directly to Prisma `Workspace`/`workspace`; Better Auth member is mapped directly to Prisma `WorkspaceMember`/`workspace_member`. There is no separate organization or membership list. Core `Session`, `Account`, `Verification` and plugin `Invitation` map to `session`, `account`, `verification` and `invitation`.
- `WorkspaceMember.id` is a UUID and is the stable membership ID for future same-workspace domain foreign keys. `workspaceId+userId` is unique, departed members become `INACTIVE`, and member rows are not removed during normal membership administration.
- The organization plugin schema mapping owns workspace/member/invitation persistence. Waslix's ADMIN-only membership service owns role and status changes so last-active-ADMIN and deactivation rules are enforced; the Better Auth role-update/remove-member permissions are not granted. The four persisted roles are exactly `ADMIN`, `CS_MANAGER`, `CSM` and `VIEWER`, protected by a database check constraint.
- Better Auth owns invitations in `invitation`: ADMIN may create/cancel; the invited, email-verified user may accept or reject before expiry; acceptance creates the canonical member with `ACTIVE` status. Rejection, cancellation or expiry creates no membership.
- `Session.activeWorkspaceId` is the plugin's mapped `activeOrganizationId` selection. Session creation selects the user's oldest ACTIVE membership. Switching accepts a workspace UUID only as untrusted input, verifies an ACTIVE canonical membership for the session user, replaces the session selection and invalidates route data. Every protected request reloads that exact member row and role, so deactivation denies an existing session immediately and old tenant context is never reused.
- `User.preferredLocale` is a supported Better Auth `additionalFields` extension backed by Prisma enum `EN | AR`, default `EN`, and is server-owned. `src/i18n/preferred-locale.ts` is the only `EN`/`AR` to next-intl `en`/`ar` mapping.
- Tenant services receive only the verified `{userId, workspaceId, memberId, role}` context and include `workspaceId` in reads and writes. Inaccessible and cross-workspace IDs use the same non-disclosing not-found/access-denied result. Because Better Auth organization/member records are the Workspace/WorkspaceMember records themselves, no synchronization process or duplicate membership authority exists.

## Customer core

| Model       | Fields                                                                                                                                                                            | Constraints/notes                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Customer    | name, website?, logoKey?, industry?, companySize?, contractValue?, currency, customerSince date?, renewalDate date?, lifecycleStageId, ownerId, status, archivedAt?, externalKey? | Status ACTIVE/ARCHIVED; owner required; externalKey unique per workspace when non-null                |
| Contact     | customerId, name, email?, phone?, jobTitle?, accountRole, isPrimary, status, lastInteractionAt?                                                                                   | ACTIVE/INACTIVE; at most one ACTIVE primary per customer; interaction time is a maintained projection |
| SuccessGoal | customerId, title, description?, ownerId, progress, status, targetDate?, progressObservedAt, completedAt?                                                                         | Progress check 0–100; statuses in 05                                                                  |

Customer.renewalDate is a derived cache only. Customer.contractValue describes the current account value; renewal-cycle value remains separately historical. Website and company name are not global uniqueness keys.

Contact account roles CHAMPION/DECISION_MAKER/EXECUTIVE_SPONSOR/ADMIN/BILLING/USER/OTHER.

## Health and evidence

| Model               | Fields                                                                                                                                                                                         | Constraints                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| HealthInput         | customerId, dimension, isManualOverride                                                                                                                                                        | Unique workspaceId+customerId+dimension; parent for immutable revisions |
| HealthInputRevision | customerId, healthInputId, version, value, sourceType, sourceRef?, isSimulated, observedAt, createdById?, evidence? JSON, createdAt                                                            | Append-only; unique workspaceId+healthInputId+version; value 0–100      |
| CustomerHealth      | customerId, rawScore?, overallScore?, status?, usageScore?, engagementScore?, supportScore?, goalScore?, confidence, confidenceValue, calculatedAt, calculationKey, ruleVersion, evidence JSON | Unique workspaceId+customerId                                           |
| HealthSnapshot      | customerId, rawScore?, overallScore?, status?, usageScore?, engagementScore?, supportScore?, goalScore?, confidence, confidenceValue, snapshotAt, calculationKey, ruleVersion, evidence JSON   | Append-only; unique workspaceId+customerId+calculationKey               |

HealthDimension USAGE/ENGAGEMENT/SUPPORT/GOALS. HealthStatus HEALTHY/NEEDS_ATTENTION/AT_RISK; null means insufficient data. HealthSourceType MANUAL/SYSTEM/INTEGRATION; isSimulated labels fixtures. Confidence HIGH/MEDIUM/LOW.

Evidence JSON is a versioned, validated calculation payload: selected immutable revision IDs/versions, observation dates, original/effective weights and baseline references. It is not storage for editable core domain relationships. Snapshot evidence makes historical explanations reproducible after input edits. The largest committed revision version is the selected current value. Updating an input serializes by customer/dimension, inserts the next revision and updates override state in one transaction; revisions are never edited or deleted during normal operation.

## Signals, attention and actions

| Model           | Fields                                                                                                                                                                                                                             | Constraints                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Signal          | customerId, type, ruleKey, ruleVersion, subjectKey, episodeKey, severity, title, description?, currentValue?, previousValue?, sourceType, sourceRef?, isSimulated, evidence JSON, detectedAt, lastEvaluatedAt, status, resolvedAt? | ACTIVE/RESOLVED/EXPIRED; unique active ruleKey+subjectKey per customer            |
| AttentionItem   | customerId, priority, status, reasonSummary, evidenceSignature, dismissedSignature?, dismissedPriority?, dismissedReason?, actedById?, resolvedAt?                                                                                 | At most one OPEN/ACKNOWLEDGED per customer                                        |
| AttentionSignal | customerId, attentionItemId, signalId, createdAt                                                                                                                                                                                   | Composite PK workspaceId+attentionItemId+signalId; both references share customer |
| Recommendation  | customerId, signalId?, ruleKey, episodeKey, type, title, reason, priority, status, taskId?, playbookRunId?, completedAt?, dismissedReason?                                                                                         | Unique workspaceId+customerId+ruleKey+episodeKey; at most one action target       |

Signal type/rule keys: HEALTH_LOW, HEALTH_DECLINE, LOW_ENGAGEMENT, USAGE_DECLINE, SUPPORT_ESCALATION, ONBOARDING_DELAY, RENEWAL_PREPARATION, RENEWAL_DUE, RENEWAL_RISK, GOAL_STALLED, UNMANAGED_RISK, RISK_UNRESOLVED, TASK_OVERDUE. `type` equals `ruleKey` in V1; no RENEWAL_APPROACHING alias is persisted.

Priority/severity LOW/MEDIUM/HIGH/CRITICAL. Attention status OPEN/ACKNOWLEDGED/RESOLVED/DISMISSED. Recommendation status SUGGESTED/ACCEPTED/COMPLETED/DISMISSED. Recommendation type REVIEW_HEALTH/SCHEDULE_CHECK_IN/START_PLAYBOOK/FOLLOW_UP/CREATE_MITIGATION/REVIEW_SUPPORT/REVIEW_GOALS/COMPLETE_TASK (pack defaults).

## Work and lifecycle

| Model               | Fields                                                                                                                                                                                                                                        | Constraints                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Task                | customerId?, title, description?, ownerId, createdById, priority, status, dueDate date?, dueAt?, completedAt?, completedById?, riskId?, renewalId?, milestoneId?, playbookRunId?                                                              | OPEN/IN_PROGRESS/COMPLETED/CANCELLED; at most one due field; child links require customerId       |
| Risk                | customerId, title, description?, type, severity, ownerId, status, targetResolutionDate date?, resolvedAt?, resolutionNote?                                                                                                                    | OPEN/MONITORING/RESOLVED; resolved needs note/date                                                |
| RiskSignal          | customerId, riskId, signalId, createdAt                                                                                                                                                                                                       | Composite PK workspaceId+riskId+signalId; same customer                                           |
| Onboarding          | customerId, ownerId, status, startDate?, targetCompletionDate?, completedAt?, adoptionDismissedForCompletedAt?                                                                                                                                | Unique workspaceId+customerId                                                                     |
| OnboardingMilestone | customerId, onboardingId, title, description?, ownerId, position, isCritical, status, dueDate?, completedAt?                                                                                                                                  | Unique workspaceId+onboardingId+position                                                          |
| Renewal             | customerId, ownerId, contractValue, currency, startAt date?, renewalAt date, stage, readinessStatus?, readinessPending boolean, readinessReasons JSON, readinessCalculatedAt?, expectedOutcome?, outcome?, completedAt?, notes?, churnReason? | One nonterminal cycle per customer; outside window is null/false, queued calculation is null/true |
| Activity            | customerId, type, title, description?, contactId?, createdById, occurredAt, isMeaningful                                                                                                                                                      | MEETING/CALL/EMAIL/NOTE                                                                           |
| SystemEvent         | customerId?, type, title, entityType, entityId, actorId?, occurredAt, metadata JSON, idempotencyKey                                                                                                                                           | Append-only; unique workspaceId+idempotencyKey                                                    |

Risk type USAGE/ENGAGEMENT/SUPPORT/STAKEHOLDER/ONBOARDING/RENEWAL/COMMERCIAL/OTHER. Onboarding/milestone status NOT_STARTED/IN_PROGRESS/COMPLETED. Renewal stages per 05; readiness HEALTHY/NEEDS_ATTENTION/AT_RISK. Expected outcome UNKNOWN/RENEW/EXPAND/CONTRACT/CHURN; actual outcome RENEWED/EXPANDED/CONTRACTED/CHURNED (pack enums). RENEWED stage accepts the first three actual outcomes; CHURNED stage accepts only CHURNED.

SystemEvent.customerId may be null for workspace changes. entityType/entityId is a historical reference rather than a cascade FK; core joins use real FKs. Date/date-time fields follow the table in 05; date fields are never converted to midnight UTC. Activity NOTE cannot be meaningful. Maintain Contact.lastInteractionAt from the latest occurred meaningful activity linked to that contact whenever such activity is created, corrected or removed; it is never directly editable. Goal progressObservedAt changes only when progress/status meaningfully changes, not when title, description or owner changes.

## Playbooks — pack normalization additions

| Model                | Fields                                                                                                       | Constraints                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| PlaybookTemplate     | key, name, description, triggerType, version, isActive                                                       | Unique workspaceId+key+version                                   |
| PlaybookTemplateStep | templateId, title, description?, position, dueOffsetDays                                                     | Unique workspaceId+templateId+position                           |
| PlaybookRun          | customerId, templateId, templateVersion, ownerId, riskId?, status, startedAt, completedAt?, dismissedReason? | One ACTIVE template/customer                                     |
| PlaybookStep         | customerId, playbookRunId, title, description?, position, status, taskId, completedAt?                       | Unique workspaceId+playbookRunId+position and workspaceId+taskId |

Run ACTIVE/COMPLETED/DISMISSED; step OPEN/IN_PROGRESS/COMPLETED/CANCELLED. Templates are built-in and seeded per workspace. Template updates make a new version; running steps are copied and remain unchanged. Run/task/step insertion occurs in one transaction; task belongs to the same run referenced by its step.

## Operational support — pack additions

| Model            | Fields                                                                                                                           | Purpose                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| JobOutbox        | eventKey, jobType, customerId?, payload JSON, availableAt, dispatchedAt?, attempts, lastErrorCode?                               | Durable intent written in business transaction; unique workspaceId+eventKey                 |
| ImportBatch      | createdById, fileKey?, currentValidationId?, status, totalRows, succeededRows, failedRows, skippedRows, startedAt?, completedAt? | Track user-authorized import and selected validation                                        |
| ImportValidation | batchId, version, mapping JSON, status                                                                                           | Mapping immutable after creation; status may transition; unique workspaceId+batchId+version |
| ImportRow        | batchId, validationId, rowNumber, normalizedData JSON, status, errors JSON?, customerId?                                         | Unique workspaceId+validationId+rowNumber; batch/validation must agree                      |

Batch status VALIDATING/READY/RUNNING/COMPLETED/FAILED; validation status VALIDATING/READY/INVALID/SUPERSEDED; row PENDING/INVALID/IMPORTED/SKIPPED/FAILED. Only the selected READY validation may start; execution makes it immutable and remapping is forbidden after RUNNING. JSON normalizedData is temporary staging, not the customer database. Import payloads have a retention policy; pack default purge row payloads/files after seven days while retaining batch/validation result counts. Queue tables belong to pg-boss; do not duplicate queue internals.

## SQL-only constraints and migration requirements

Use reviewed SQL migrations for constraints not expressible in the chosen Prisma version. Illustrative predicates (use actual mapped identifiers):

- Unique contact `(workspaceId,customerId) WHERE isPrimary AND status='ACTIVE'`.
- Unique attention `(workspaceId,customerId) WHERE status IN ('OPEN','ACKNOWLEDGED')`.
- Unique renewal `(workspaceId,customerId) WHERE stage NOT IN ('RENEWED','CHURNED')`.
- Unique active signal `(workspaceId,customerId,ruleKey,subjectKey) WHERE status='ACTIVE'`.
- Unique active run `(workspaceId,customerId,templateId) WHERE status='ACTIVE'`. Service additionally prevents two active versions of the same template key.
- Composite HealthInputRevision FK ensures every revision belongs to the same workspace/customer as its parent input.
- CHECK score/progress ranges, money ≥0, task dueDate/dueAt exclusivity, completion/status consistency and recommendation target exclusivity.
- Composite child FKs enforce workspace/customer agreement even when a caller bypasses UI.
- Serialize per-customer engine writes and action acceptance; uniqueness alone does not order calculations.

## Query indexes

| Model          | Leading index keys                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Customer       | workspaceId,status; workspaceId,ownerId; workspaceId,lifecycleStageId                                    |
| Task           | workspaceId,ownerId,status; workspaceId,status,dueDate; workspaceId,status,dueAt; workspaceId,customerId |
| Risk           | workspaceId,status,severity; workspaceId,customerId                                                      |
| Renewal        | workspaceId,renewalAt; workspaceId,stage                                                                 |
| AttentionItem  | workspaceId,status,priority                                                                              |
| Signal         | workspaceId,customerId,detectedAt; workspaceId,status                                                    |
| HealthSnapshot | workspaceId,customerId,snapshotAt                                                                        |
| Activity       | workspaceId,customerId,occurredAt,id                                                                     |
| SystemEvent    | workspaceId,customerId,occurredAt,id                                                                     |
| Outbox/import  | dispatchedAt,availableAt; workspaceId,validationId,rowNumber                                             |

Add indexes from observed query plans, not every field. List endpoints select projections and paginate.

## Retention and deletion

Archive customers; inactivate members/contacts/stages/templates. Keep historical health, risks, renewals and events. Cancel tasks rather than delete completed work. Workspace purge is a separately authorized irreversible operation; its workspace-owned rows cascade, while global users remain. Associated object-storage keys require explicit scoped cleanup. No purge UI is needed for V1.

## Schema acceptance

Migration applies from empty database and upgrades preceding task fixtures; FK/unique/check tests fail invalid writes; two-tenant tests prove isolation; concurrent primary-contact/attention/action writes stay unique; seed is repeatable; auth adapter and EN/AR preferredLocale extension work against actual generated tables. This document is not a substitute for those checks.
