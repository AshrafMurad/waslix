# 10 · User flows

Every mutation below requires the access checks in [business rules](05-BUSINESS-RULES.md). Feedback reflects saved state; background calculations expose freshness.

## UF-01 · Attention → investigation → action (critical)

1. CSM opens Overview in personal context.
2. Attention row shows Acme, grouped reasons, priority and owner.
3. Open Customer 360; inspect health, active risk and upcoming renewal.
4. Open explanation to see dimension changes, actual baseline and source freshness.
5. Accept a recommendation; choose task owner/due date or confirm a playbook.
6. Save creates exactly one linked action and audit event.
7. Task appears in My Tasks; recommendation becomes ACCEPTED; attention becomes ACKNOWLEDGED.

Pass: retry/double-click creates no duplicate; accepted work links back to evidence; creating a task alone does not clear the risk. Failure: changed permissions or archived customer prevents save and preserves entered data.

## UF-02 · Risk → mitigation → resolution (critical)

Open Add risk from Customer 360 → enter title/type/severity/owner/target → save → see risk on customer and portfolio views → for HIGH/CRITICAL risk inspect the At-Risk Customer playbook suggestion and unmanaged-risk mitigation-task suggestion → start one or both as appropriate → move to MONITORING → resolve with a note.

Pass: risk persists, audit events record actor and transitions, signals/attention update asynchronously, resolved history remains readable. Invalid resolution without a note is rejected. Completing mitigation never silently resolves risk.

## UF-03 · Onboarding → delay → completion (critical)

Create/select customer → Start onboarding → generate six default milestones once → assign dates/owners → complete milestones → scheduled clock crosses an overdue boundary → show delayed state and recommendation → complete all milestones → show completion and suggest Adoption → user confirms stage.

Pass: 4/6 displays 67%; repeat Start is harmless; zero milestones cannot complete; a critical milestone five days overdue produces the rule; lifecycle remains unchanged until confirmed. Reopening a completed milestone updates progress/onboarding consistently.

## UF-04 · Renewal → preparation → outcome (critical)

Open upcoming renewal → inspect readiness reasons, contacts, goals and risks → start Renewal Preparation → complete preparation work → explicitly progress stages → record Renewed or Churned.

Renewed: require outcome and next cycle date/value; atomically close current cycle, record event, create next cycle and update cached date. Churned: require reason; record terminal outcome and confirmed Churned lifecycle.

Pass: date windows and readiness match rules; only one nonterminal cycle; retries do not create another future renewal. Validation failure leaves existing cycle unchanged. No worker sets the commercial outcome.

## UF-05 · Input change → explanation → attention (critical)

Authorized CSM edits usage or simulated data changes → input saves with source/time/actor → UI reports recalculation pending → worker computes → current health and snapshot persist → rule evaluates → grouped attention/recommendation updates.

Pass: a ≥10-point 30-day decline with valid baseline is detected; smaller changes remain historical without a decline alert; missing data is not zero; replay produces no duplicate events. If worker fails, input remains saved and last successful health time stays visible.

## Supporting flows

| ID    | Flow                                  | Acceptance / failure case                                                                                                                                                                      |
| ----- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UF-06 | Complete task directly in My Tasks    | Save completion actor/time, timeline and playbook step together; rollback optimistic UI on error                                                                                               |
| UF-07 | Add customer in a compact staged form | Identity → owner/lifecycle/value/dates → optional primary contact; create initial renewal only when its required date/value/currency/owner set is complete; one transaction opens Customer 360 |
| UF-08 | Import CSV                            | Upload → map supported V1 columns → validate → resolve errors or explicitly import valid rows → progress → success/failed/skipped summary                                                      |
| UF-09 | Manager oversight                     | Team attention → owner filter → customer → atomically reassign selected customer and eligible previous-owner open work per BR-01; other assignees and historical authors preserved             |
| UF-10 | Global search                         | Ctrl/Cmd+K → customer/task/contact matches → correct account/tab/panel; no cross-workspace results                                                                                             |
| UF-11 | Workspace switch                      | Select another active membership → clear prior context → load new Overview; stale IDs fail securely                                                                                            |
| UF-12 | Archive customer                      | Confirm → archive/read-only history → remove from active attention and analytics; no historical deletion                                                                                       |
| UF-13 | Switch English/Arabic                 | Choose locale → preserve equivalent authorized route/query/workspace → persist preference → render correct translated copy and LTR/RTL direction without changing data                         |

## CSV detail

Show row numbers and concrete errors (unknown owner, invalid currency/date, missing name, duplicate external key). Never claim all rows succeeded when invalid rows were skipped. Batch retry resumes rows and retains results. Importing one row with related records is atomic. Test malformed data and tenant-mismatched owners.

Supported columns, defaults and related-record limits are exactly those in BR-11. Preconditions: authenticated Admin, active membership and a selected READY validation revision. A failed row creates no customer/contact/tags/renewal. A repeated execution uses the same batch/revision/row key and returns the persisted result. Mapping changes create a new validation revision rather than mutating validated or running rows.

## Supporting-flow mutation checks

- Customer create: partial renewal fields fail without creating any record; a complete optional contact/renewal set commits with the customer and audit/outbox state.
- Ownership transfer: preview lists the exact BR-01 records; concurrent changes produce a conflict and require refresh; retry does not transfer records assigned to somebody else.
- Archive: active signals expire and suggestions/attention dismiss in downstream processing; child history remains read-only and direct forged writes fail.
- Workspace switch: inactive membership or stale workspace/entity IDs return the non-disclosing forbidden/not-found contract and never reuse prior scoped cache.
- Search: workspace, permissions and archive filters match direct navigation; results are keyboard operable and contain no mutation shortcuts.
- Playbook status: completing, reopening or cancelling a linked task keeps task/step/run/recommendation state consistent in one transaction.

## Permission flows

Viewer sees details without mutation controls; direct forged writes fail. CSM can inspect another customer's profile but cannot edit it; an explicitly assigned task remains completable within BR-01 limits. An inactive member loses access even if a previous session remains. Admin cannot deactivate the last active Admin.

Locale never changes permissions, validation rules or persisted outcomes. Repeat a representative attention flow, customer creation and one lifecycle mutation in Arabic; results and audit events match English. Unsupported locales and forged locale-prefixed entity routes fail through the normal non-disclosing route/access contracts.

## End-to-end test strategy

Automate critical flows using stable semantic selectors and seeded fixtures with an injected/fixed clock. Selectors must not depend on translated visible text when a semantic role/name contract or stable test identifier is appropriate. For worker paths, use a test drain/run mechanism rather than long sleeps. Assert persisted business outcomes plus key UI state. Keep unit boundary tests in engines; avoid duplicating every boundary through browser tests. Follow 17 for locale parity and RTL checks.
