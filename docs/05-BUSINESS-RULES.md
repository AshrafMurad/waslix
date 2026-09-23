# 05 · Business rules

This document owns behavior. The conversation fixes the core model and thresholds; sections marked **pack default** resolve implementation gaps. Keep rules in pure/testable services, not UI components.

## BR-01 · Workspace access and ownership

Authenticate → verify ACTIVE membership in the selected workspace → apply role → check record ownership. Scope reads, writes, search, exports/import results, jobs and related-record lookups by workspace. Client-provided owner/customer/workspace IDs are untrusted.

| Capability                       | Admin | CS Manager | CSM                        | Viewer |
| -------------------------------- | ----- | ---------- | -------------------------- | ------ |
| Read portfolio and analytics     | Yes   | Yes        | Yes                        | Yes    |
| Create customer                  | Yes   | Yes        | Self-owned only*           | No     |
| Edit account and its work        | Yes   | Yes        | Assigned account           | No     |
| Edit own work on another account | Yes   | Yes        | Limited object operations* | No     |
| Assign customer ownership        | Yes   | Yes        | No                         | No     |
| Manage roles/settings            | Yes   | No         | No                         | No     |
| Archive customer                 | Yes   | Yes*       | No*                        | No     |
| Import portfolio                 | Yes   | No*        | No                         | No     |

*Pack defaults. A CSM may complete/update status, description and due date of tasks, risks, milestones, renewals and playbook runs assigned to them on another customer. This does not grant account/contact/health editing, customer transfer or reassignment of those objects. The owning CSM can manage related work and assign eligible active operational members. Viewer members cannot own new operational work. Membership changes and deactivation are Admin-only; Managers may transfer customer/open-work ownership.

Each active customer has one owner. Deactivation is blocked until active customers and open work are reassigned, or transferred within the same operation. Historical authors remain unchanged. Never remove the last active Admin.

For transfer/deactivation, open work means OPEN/IN_PROGRESS tasks; OPEN/MONITORING risks; active onboarding and incomplete milestones; nonterminal renewals; non-cancelled/non-achieved goals; and ACTIVE playbook runs. Transfer only records currently owned by the departing/previous owner; preserve work intentionally assigned to another member. Customer, included open work and audit/outbox records change atomically. Completed, cancelled, resolved and terminal history never changes owner. A retry with the same operation key returns the first result.

## BR-02 · Dates, numbers and archive behavior — pack defaults

Store instants in UTC; store workspace time zone separately. Calendar dates (renewal and milestone/task due dates when entered without a time) use workspace-local dates. A date-only item is overdue starting the following local day. Timestamp due dates use `dueAt < now`. Inject a clock into engines; do not use uncontrolled current time in tests.

| Meaning                                                         | Persistence         | Boundary                                                                      |
| --------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| Customer-since, renewal and cycle start                         | PostgreSQL `date`   | Compare as workspace-local calendar dates; today is day 0                     |
| Task due date without time                                      | `dueDate date`      | Overdue when workspace-local today is later than the date                     |
| Task deadline with time                                         | `dueAt timestamptz` | Overdue when `dueAt < now`; exactly one of dueDate/dueAt may be set           |
| Goal target, risk target, onboarding target, milestone due date | PostgreSQL `date`   | Same local-date overdue rule; these are V1 calendar commitments, not instants |
| Activity, completion, calculation and audit times               | `timestamptz`       | UTC instant displayed in the viewer/workspace context                         |

Changing a workspace time zone changes display and future local-day scheduling, not stored calendar dates or past instants. CSV accepts ISO `YYYY-MM-DD` for dates and ISO-8601-with-offset for instants; ambiguous locale dates are invalid.

Contract values use nonnegative decimal amounts and an ISO currency code. Label them “Contract value”; do not imply ARR without a defined annual contract period. Aggregate only within currency.

Archived customers retain history and are excluded from active portfolio/attention/scheduled detection. Normal writes to their child records are disabled. Archiving expires active signals, dismisses attention and outstanding suggestions with reason “Customer archived”; it does not pretend to resolve risks or complete tasks. No normal customer deletion cascades.

Lifecycle stage keys `new`, `adoption` and `churned` are reserved default/behavior keys. Admin may rename labels and reorder stages but cannot rename keys, delete a stage, or deactivate a reserved stage. Other stages may be deactivated only when no active customer uses them; historical customers retain their stage reference. V1 does not create custom stage keys.

## BR-03 · Health

Dimensions: USAGE 35%, ENGAGEMENT 25%, SUPPORT 20%, GOALS 20%. Every supplied normalized dimension is in 0–100. Usage may mean service adoption.

For available dimensions A:
`raw = sum(score[d] * weight[d]) / sum(weight[d])`.

Missing values are absent, never zero. Example: usage 60, engagement 75, support 50, goals 80 → 65.75 → 66. Without support → 57.75 / 0.8 = 72.1875 → 72.

**Pack default:** round half up once to the displayed integer; classify that integer. Healthy 80–100, Needs Attention 60–79, At Risk 0–59. Reject out-of-range inputs. If all inputs are missing, score/status are null and confidence is LOW; show “Not enough data.” Null is not a fourth health status.

Record selected dimension inputs, raw/rounded result, effective weights, source identity, calculation time and rule version so explanations can reproduce the result.

### Source selection — pack default

V1 has one selected current input per customer/dimension. Input updates explicitly replace that selected source and preserve the previous value/source in the audit event. No hidden merging of manual and simulated values. Engagement/goals default to SYSTEM; explicit manual override persists until the user chooses “Use system value.” System refresh must not overwrite that override.

A meeting, call or email record marked meaningful and already occurred counts toward engagement; notes and system events do not. No recorded interaction gives missing engagement, not 100. For elapsed whole days since last meaningful interaction: 0–7 → 100; 8–14 → 85; 15–21 → 70; 22–30 → 50; 31–45 → 30; 46+ → 10. This resolves the overlapping 45-day example.

Goals score is the mean progress of non-cancelled goals, including achieved goals at 100. No eligible goals means missing. Usage/support are manual or explicitly simulated normalized values in V1; do not invent live ticket integrations.

### Freshness and confidence — pack default

Observed age: 0–6 days Fresh; 7–29 Aging; 30+ Stale. Recalculation never refreshes observedAt. For system engagement, observedAt is when Waslix last evaluated its native activity data, while last meaningful activity remains a separate fact. For goals, use the latest actual goal update.

Freshness factors: Fresh 1, Aging 0.5, Stale 0. Coverage confidence = sum(original dimension weight × factor) over available inputs. HIGH ≥0.8; MEDIUM ≥0.5 and <0.8; LOW <0.5. Stale values remain in the score with a visible warning and lower confidence; never silently drop them to improve health.

### History and comparison — pack default

Write a snapshot on a meaningful calculation change (scores, source/freshness/confidence) and once per workspace-local day for active customers. Retries with the same calculation key do not create another snapshot.

For 7/30/90-day comparisons choose the latest snapshot at or before the comparison date, within seven days before that date. If absent, show unavailable rather than zero change. Store the actual baseline date. Compare rounded scores for displayed deltas and decline rules. Weighted dimension contributions use the raw values; explain normalization/coverage changes separately rather than falsely attributing them to product usage.

## BR-04 · Signals and recommendations

Signals are detected facts, not automatically created tracked risks. Use structured source/rule/evidence data and stable deduplication keys. Preserve resolved/expired history.

`Signal.type` and `ruleKey` use the same canonical V1 key; there is no broader alias enum.

| Rule key/type       | Predicate                                                                  | Subject key       | Suggested action                          |
| ------------------- | -------------------------------------------------------------------------- | ----------------- | ----------------------------------------- |
| HEALTH_LOW          | Known overall <60                                                          | `customer`        | Review health drivers / recovery playbook |
| HEALTH_DECLINE      | 30-day delta ≤−10 with valid baseline                                      | `customer`        | Review health drivers                     |
| LOW_ENGAGEMENT      | Last meaningful interaction ≥21 days ago                                   | `customer`        | Schedule check-in                         |
| RENEWAL_PREPARATION | Nonterminal renewal ≤30 days away and UPCOMING                             | `renewal:{id}`    | Start renewal preparation                 |
| RENEWAL_DUE         | Any nonterminal renewal ≤14 days away, including overdue                   | `renewal:{id}`    | Confirm renewal next steps                |
| RENEWAL_RISK        | Nonterminal renewal ≤60 days away and health <60                           | `renewal:{id}`    | Review renewal risk                       |
| ONBOARDING_DELAY    | Critical incomplete milestone ≥5 days overdue, or onboarding target passed | `onboarding:{id}` | Follow up with owner                      |
| UNMANAGED_RISK      | HIGH/CRITICAL unresolved risk and no OPEN/IN_PROGRESS mitigation task      | `risk:{id}`       | Create mitigation task                    |
| RISK_UNRESOLVED     | Any HIGH/CRITICAL unresolved risk                                          | `risk:{id}`       | Start At-Risk Customer playbook           |
| TASK_OVERDUE        | HIGH/CRITICAL incomplete task overdue                                      | `task:{id}`       | Complete/replan task                      |
| SUPPORT_ESCALATION  | Selected support score ≤40*                                                | `customer`        | Review unresolved issues                  |
| USAGE_DECLINE       | Selected usage score falls ≥20 points in 30 days*                          | `customer`        | Review adoption                           |
| GOAL_STALLED        | IN_PROGRESS/AT_RISK goal unchanged ≥30 days*                               | `goal:{id}`       | Review success plan                       |

*Pack thresholds. Usage-score points are not a usage percentage. Claims such as “usage fell 24%” require stored raw evidence. No interaction ever recorded triggers LOW_ENGAGEMENT only when customerSince is at least 21 days old; unknown customerSince does not fabricate a duration (pack default). Date-driven predicates require open/incomplete objects; overdue renewals stay eligible until closed.

Create/refresh an ACTIVE signal while predicate holds; resolve it when false, expire it when data is unavailable or customer archived. An unchanged evaluation updates evidence, not a new alert. New episodes after resolution can create new historical signals.

An episode starts on the false/unknown → true transition and keeps a generated stable episode ID until the predicate becomes false/unknown. Evidence signature is a versioned canonical hash of sorted active `(ruleKey, subjectKey, episodeKey)` tuples plus facts that determine priority; display text and evaluation timestamps are excluded. Evidence changes at the same priority refresh the existing item without defeating dismissal. A new episode or higher computed priority can reopen dismissed attention.

## BR-05 · Attention — pack priority defaults

One OPEN or ACKNOWLEDGED item per customer groups all active actionable signals. Evaluate priority in this order:

1. CRITICAL: renewal ≤7 days and nonterminal; or unresolved CRITICAL risk; or known health <40.
2. HIGH: renewal ≤14 days; renewal ≤30 days still UPCOMING; health <60; decline ≥10 points; onboarding delay; unresolved HIGH risk; support escalation; or at least two distinct remaining active rule families.
3. MEDIUM: any remaining actionable rule.
4. LOW: reserved for future early warnings; do not fabricate entries simply to fill the queue.

Pack default: generate an unresolved-risk signal for every HIGH/CRITICAL risk even when mitigation exists. A mitigation task removes UNMANAGED_RISK but not the underlying risk signal.

Sort priority descending, then nearest implicated deadline (null last), then oldest item, then ID. Keep one concise reason per rule family with links to evidence. Accepting an action acknowledges the item, but does not resolve its underlying concern.

If no active signals remain, resolve the item. Dismissal records actor/reason and suppresses the same evidence episode; reopen on a new signal episode or increased priority. Store dismissed evidence signature and priority. Do not recreate the same dismissed item every job tick.

## BR-06 · Tasks and recommendations

Tasks: OPEN → IN_PROGRESS → COMPLETED, with CANCELLED available for abandoned work. Completion records completedAt/completedBy; reopening clears current completion fields but retains the event history.

Default task owner is creator; risk/renewal/onboarding/playbook owner defaults to customer owner. Linked risk/renewal/milestone/run must be in the same workspace and customer. A task may be standalone within the workspace (customerId null); then customer-specific links are null.

Recommendations: SUGGESTED → ACCEPTED → COMPLETED or DISMISSED. Accepting creates a task OR a playbook run transactionally and links the result; TASK_OVERDUE instead links its existing task and creates no duplicate. Double-clicks/retries return the same action. Complete the recommendation when its linked action completes. Cancellation/dismissal of the action dismisses the accepted recommendation with a reason (pack default). Suggestions whose facts disappear are dismissed as no longer applicable; accepted work is not deleted.

| Rule family                       | Recommendation type | Default action                                           | Default owner/due                                             |
| --------------------------------- | ------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| HEALTH_LOW, HEALTH_DECLINE        | REVIEW_HEALTH       | At-Risk Customer playbook for HEALTH_LOW; otherwise task | Customer owner; task due in 3 local days                      |
| LOW_ENGAGEMENT                    | SCHEDULE_CHECK_IN   | Task “Schedule customer check-in”                        | Customer owner; due in 3 local days                           |
| RENEWAL_PREPARATION, RENEWAL_RISK | START_PLAYBOOK      | Renewal Preparation playbook                             | Renewal owner; no separate due date                           |
| RENEWAL_DUE                       | FOLLOW_UP           | Task “Confirm renewal next steps”                        | Renewal owner; due on `max(today, min(today + 1, renewalAt))` |
| ONBOARDING_DELAY                  | START_PLAYBOOK      | Onboarding Recovery playbook                             | Onboarding owner; no separate due date                        |
| UNMANAGED_RISK                    | CREATE_MITIGATION   | Task linked to risk                                      | Risk owner; due in 3 local days                               |
| RISK_UNRESOLVED                   | START_PLAYBOOK      | At-Risk Customer playbook                                | Risk owner; no separate due date                              |
| TASK_OVERDUE                      | COMPLETE_TASK       | Existing task deep link; no new task                     | Existing owner/due date                                       |
| SUPPORT_ESCALATION                | REVIEW_SUPPORT      | Task “Review unresolved issues”                          | Customer owner; due in 2 local days                           |
| USAGE_DECLINE                     | REVIEW_HEALTH       | At-Risk Customer playbook                                | Customer owner; no separate due date                          |
| GOAL_STALLED                      | REVIEW_GOALS        | Task linked to goal context                              | Goal owner; due in 5 local days                               |

Generate at most one suggestion per `(customer, ruleKey, episodeKey)`. Facts changing within an episode refresh its reason/priority. A grouped attention item may expose several suggestions, ordered by attention priority then nearest deadline. The user may override an eligible owner and task due date before acceptance. If the default owner is inactive/ineligible, acceptance requires an explicit eligible owner. `TASK_OVERDUE` is navigation-only and acknowledgement does not create another task.

Task is authoritative for a linked playbook step. Complete/reopen/cancel updates task, step, derived run progress and linked recommendation in one transaction. Reopening a task reopens its step and a previously completed run; the recommendation returns to ACCEPTED. Cancelling a step task marks the step CANCELLED and prevents automatic run completion. Dismissing a run cancels unfinished tasks and dismisses its accepted recommendation atomically. Steps are not edited directly in V1.

## BR-07 · Risks and goals

Risk: OPEN → MONITORING → RESOLVED. Authorized users may reopen; preserve events. Resolving requires nonblank resolutionNote and resolvedAt. Mitigation completion does not auto-resolve the risk. Risks may link to signals and related tasks/playbook runs.

Goals: NOT_STARTED, IN_PROGRESS, AT_RISK, ACHIEVED, CANCELLED. Progress 0–100; achieving sets 100 and completedAt. Reopening requires an explicit new progress below 100 and clears current completion time. Cancellation excludes the goal from health but retains history (pack defaults).

## BR-08 · Onboarding

Default milestones: Kickoff, Configuration, Data setup, Training, First value, Complete. Statuses for onboarding/milestones: NOT_STARTED, IN_PROGRESS, COMPLETED. Delay is derived, not a persisted status.

Progress = completed milestone count / total ×100, rounded half up. Zero milestones gives 0%, never completion. Complete onboarding only when all milestones are complete. Target passed or critical milestone ≥5 days overdue gives Delayed. An individual overdue milestone is visibly overdue even before that threshold.

Completion emits an event and suggests Adoption. Lifecycle changes require a user decision. Reopening a milestone reopens onboarding and clears current completedAt while retaining completion history (pack default).

The Adoption suggestion is a persisted onboarding-completion callout, not a Recommendation. It is derived from completed onboarding while the customer is not already in the reserved `adoption` stage. “Move to Adoption” is an idempotent authorized action that updates lifecycle and audit/outbox state atomically; dismissal suppresses the callout for that onboarding completion episode. Reopening onboarding clears the dismissal and removes the callout until completion occurs again.

## BR-09 · Renewals

Each customer has historical renewal records. Stages: UPCOMING → PREPARING → DISCUSSION → NEGOTIATION → COMMITTED → RENEWED or CHURNED. User controls progression and outcome. Pack default: allow explicit forward/backward edits among nonterminal stages; require a note for backward moves. Terminal records are immutable in normal UI.

Windows: show upcoming within 90 days; assess readiness within 60; unprepared within 30 is High; within 14 is at least High; within 7 or overdue is Critical.

Compute `daysUntilRenewal = renewalAt - workspaceLocalToday` using calendar dates. Upcoming means 0–90 inclusive and excludes overdue cycles. Readiness and RENEWAL_RISK apply to any nonterminal cycle with `daysUntilRenewal <= 60`, including overdue. RENEWAL_PREPARATION is 0–30 inclusive and requires UPCOMING stage; RENEWAL_DUE is `<=14`, including overdue. “Unprepared” means stage UPCOMING. Attention’s 14/7-day rules include overdue cycles; exact 90/60/30/14/7 and day 0 boundaries are inclusive.

Readiness pack default: AT_RISK if health <60 or unresolved HIGH/CRITICAL risk or support ≤40. Otherwise NEEDS_ATTENTION if health missing/below 80, any unresolved risk, no meaningful engagement in ≥21 days/unknown, eligible goals missing/below 60, or onboarding delayed. Otherwise HEALTHY. Missing inputs and confidence remain visible. Readiness is deterministic, not a churn probability.

For cycles outside the 60-day window keep readiness null and show “Not assessed until 60 days”; this is not a pending calculation. On entering the window, recompute readiness after health, selected support input, meaningful activity, risk, goal, onboarding or renewal changes and on the workspace-local daily sweep. The renewal projection worker serializes by customer, recomputes current facts after locking and ignores stale payload values. Until the first in-window calculation, or while recalculation is pending after a relevant change, show readiness as pending with the last calculated time; do not present stale reasons as current. A new in-window cycle receives a synchronous initial calculation within its creation transaction when facts are available, otherwise a pending projection is enqueued.

Renewed requires explicit outcome and next cycle details; transaction closes current cycle and creates the next with a strictly later renewal date. Churned requires a reason and, within that confirmed outcome action, changes lifecycle to Churned. Neither event is inferred automatically. Customer remains unarchived after churn so history is accessible; do not create new cycles automatically. Customer renewalDate is a cache of the next nonterminal cycle, never an independent editable source.

## BR-10 · Playbooks

Four templates: At-Risk Customer, Renewal Preparation, Onboarding Recovery, Low Engagement. A recommendation suggests one; the user starts it.

Pack default: run statuses ACTIVE, COMPLETED, DISMISSED; suggestion status lives on Recommendation. Copy template version/steps into the run. Every run step has one linked task; step completion mirrors task completion, and run progress derives from step completion. Complete run when all steps complete. Dismissing cancels unfinished linked tasks. No second active run of the same template/customer unless the existing run is dismissed or completed.

## BR-11 · Audit, import and analytics

Important writes create an append-only SystemEvent with actor, type, entity reference, relevant before/after fields, timestamp and idempotency key in the same transaction. Manual health changes, ownership, risk/renewal/lifecycle changes and completions must be auditable. Do not store credentials or whole request bodies.

Canonical V1 event types are CUSTOMER_CREATED/UPDATED/ARCHIVED, OWNER_CHANGED, CONTACT_PRIMARY_CHANGED, HEALTH_INPUT_UPDATED, HEALTH_CHANGED, TASK_CREATED/COMPLETED/REOPENED/CANCELLED, RISK_CREATED/STATUS_CHANGED/RESOLVED/REOPENED, GOAL_CHANGED, MILESTONE_COMPLETED/REOPENED, ONBOARDING_STARTED/COMPLETED/REOPENED, LIFECYCLE_CHANGED, RENEWAL_STAGE_CHANGED/COMPLETED, RECOMMENDATION_ACCEPTED/DISMISSED, and PLAYBOOK_STARTED/COMPLETED/DISMISSED. Metadata uses a versioned schema with changed field names and safe scalar before/after values, related IDs and reason/note only where required. Titles are derived for display from type and metadata. No-op retries create no event; the operation idempotency key identifies the one successful event. Narrative fields are included only when the timeline requires them and are never copied to technical logs.

CSV pack default: validate all mapped rows before commit; users explicitly select “Import valid rows” if invalid rows remain. Resolve owner email to an active eligible workspace member. Never silently assign unknown owners. Create-only import uses optional external key; duplicate keys are skipped/reported. Without a key, normalized name+website collision is flagged for review, never auto-merged. Persist batch/row status so retries resume safely. Report actual success/failed/skipped counts.

V1 import columns are: required `customer_name`; optional `external_key`, `website`, `industry`, `company_size`, `owner_email`, `lifecycle_stage_key`, `contract_value`, `currency`, `customer_since`, `renewal_date`, `primary_contact_name`, `primary_contact_email`, `primary_contact_role`, and comma-separated `tags`. Missing owner defaults to the active importing Admin; missing lifecycle defaults to reserved `new`; missing currency defaults to workspace.defaultCurrency. Explicit owner/stage values must resolve in the same workspace. A row may atomically create one customer, optional primary contact, tags and an initial renewal. Initial renewal requires renewal date and contract value; it uses the row/customer currency and customer owner unless explicitly mapped. Partial renewal fields invalidate the row. It starts UPCOMING with readiness calculated or queued under BR-09. Mapping belongs to an immutable validation revision; remapping creates a new revision and row results before execution. Duplicate external keys within the file and workspace are reported per row. Retrying processes only nonterminal rows in the selected validation revision with the same batch/revision/row idempotency key.

Analytics use active unarchived customers by default; label inclusion of churned lifecycle explicitly. Unknown health is a separate count and excluded from averages. Health history uses the documented baseline rule and reports coverage. Upcoming value uses nonterminal cycles within an inclusive date window, grouped by currency. Renewal outcome rate = renewed / (renewed + churned) closed within the selected period; no closures means N/A. Never equate this with revenue retention.

Analytics default to the last 90 workspace-local calendar days; URL filters own period, owner and lifecycle selections. Health distribution is the latest current status per included customer. Portfolio trend is the average of customers with valid current and baseline snapshots and reports that coverage. Risk severity counts unresolved risks at period end. Onboarding completion reports completed onboardings divided by onboardings active at any point in the period, with median completion days shown separately when available. Owner workload is active customers plus counts of open/in-progress tasks and unresolved risks, never a synthetic score. Overview’s four metrics are open attention accounts, overdue assigned tasks, renewals due within 90 days grouped by currency, and customers with known At Risk health; unknown health is shown alongside the last metric. Never aggregate money across currencies.

## Required boundary tests

Cover 59/60/79/80 and rounding edges; missing/all-missing health; fresh/aging/stale edges; 21-day engagement and 30-day decline; 5-day onboarding delay; 90/60/30/14/7-day renewals; retry deduplication; simultaneous acceptance/primary contacts/attention; every role with same- and cross-workspace records; archive exclusions; outcome/history consistency.
