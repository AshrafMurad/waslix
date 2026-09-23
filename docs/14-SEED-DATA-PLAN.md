# 14 · Seed-data plan

## Purpose

Build a coherent fictional operating portfolio that demonstrates daily work, deterioration, recovery, onboarding and renewal success. Seed through the same calculation/service logic used by the application; do not handwrite conflicting dashboard totals.

Conversation baseline: Northstar Cloud, a B2B workflow/operations SaaS company, about 60 customers, four CSMs plus one manager, eight onboarding accounts, 10–15 upcoming renewals, 20–30 active risks, realistic health snapshots and rich timelines.

## Stable fixture plan — pack reconciliation

Public demo: exactly 60 customers and five visible personas. A sixth non-public fixture administrator is an ACTIVE Admin member so the workspace satisfies membership invariants; it owns no customers/work and has no published demo credential.

| User          | Role       | Customer ownership |
| ------------- | ---------- | -----------------: |
| Maya Chen     | CS_MANAGER |                  0 |
| Sarah Malik   | CSM        |                 14 |
| Omar Hassan   | CSM        |                 16 |
| Daniel Brooks | CSM        |                 13 |
| Lina Kareem   | CSM        |                 17 |

Use the non-public demo Admin only for provisioning/invariant checks. Use a separate test-only Admin/Viewer pair and a second workspace for complete role/isolation cases. Provision the demo workspace through the seed/bootstrap mechanism; do not give public demo credentials production administration. Test fixtures, not additional public personas, prove all four roles.

Health across all 60: 32 Healthy, 19 Needs Attention, 9 At Risk. Eight onboarding customers are a subset: 4 Healthy, 3 Needs Attention, 1 At Risk. Non-onboarding: 28/16/8. This preserves the original 52-account health split while avoiding treating onboarding as a health status.

Lifecycle totals: New 2, Onboarding 8, Adoption 6, Active 30, Renewal 12, Churned 2. These are independent of health. All are unarchived initially so the health totals above reconcile; analytics must label whether Churned is included.

Onboarding delivery state: 3 on time, 3 mildly delayed, 2 seriously delayed. Delivery delay and overall health need not match.

## Canonical customer stories

Scores and dates below replace varying illustrative values in the conversation. Derive detailed inputs to reproduce these scores.

| Customer     | Current story                                           | Required evidence/action                                                                                                                                                |
| ------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acme Systems | Health 48, down 14 in 30 days; renewal in 9 days        | HIGH risk, low adoption, late engagement; high attention and executive check-in suggestion                                                                              |
| Nova Labs    | Health 91; engaged champion                             | Strong usage/goals; positive growth context without invented forecast                                                                                                   |
| BrightPath   | Health 54; critical milestone 12 days overdue           | Delayed onboarding and recovery recommendation                                                                                                                          |
| Atlas Group  | Health 67, down 15 in 30 days; last meeting 28 days ago | Decline and engagement signals; grouped high attention                                                                                                                  |
| CloudForge   | Health 84; renewal in 75 days                           | OPEN MEDIUM commercial risk owned by its CSM; readiness is not yet assessed outside the 60-day window, concern remains visible in context, and no renewal signal exists |
| Vertex       | Health 73, recovered from 51                            | Resolved historical risk and improving chart                                                                                                                            |

Add a separate account renewing in exactly seven days to demonstrate CRITICAL. Acme at nine days is HIGH under the canonical rules, not CRITICAL merely because an earlier example called it so.

For each named story keep a fixture assertion object containing selected input revision values/observed dates, expected current score/confidence, baseline snapshot/date, relevant object statuses, expected signal keys, attention priority, readiness and recommendation type. These assertions, not hand-planted projections, drive engine verification. “Mildly delayed” means at least one overdue noncritical milestone but no BR-04 delay predicate; “seriously delayed” means the ONBOARDING_DELAY predicate is true.

Use fictional company/contact details and reserved example domains. Do not seed real personal data, live credentials or scraped logos. Brand-colored initials are sufficient.

## Related data targets — pack defaults

- 2–4 contacts per customer, at most one active primary; varied stakeholder roles.
- 1–3 goals per customer, including achieved/at-risk/cancelled histories.
- Twelve weekly health snapshots per account over about 90 days, plus snapshots exactly at 7/30-day comparison anchors for named stories.
- 24 active risks (OPEN/MONITORING) and at least 12 resolved historical risks.
- At least 90 tasks spanning overdue/today/future/completed/cancelled.
- Eight active onboarding records with six milestones each; additional completed onboarding on established accounts is allowed.
- Twelve nonterminal renewals within 90 days, including 7/14/30/60/90-day boundaries; later cycles for other customers and historical renewed/churned cycles.
- 15–30 timeline entries for each named account, shorter but meaningful histories for the remainder.
- Four built-in templates, active and completed example runs, suggestions and dismissed historical recommendations.

Ensure milestone tasks, playbook progress, renewal outcomes and events agree. “Simulated support escalation” is source context, not a working helpdesk integration.

## Determinism and seed sequence

Accept an explicit SEED_NOW date and deterministic random seed. Default demo date is supplied at seed invocation; pin it for screenshots/tests. Generate all relative dates from that anchor in the workspace time zone. Tests use a fixed clock. Public demo refreshes are deliberate rebuilds of the dedicated demo workspace, never daily mutation of arbitrary user work.

Order:

1. Auth-compatible identities, workspace and members.
2. Lifecycle stages, tags, built-in templates/steps.
3. Customers, contacts, goals, onboarding/milestones, renewals and risks.
4. Historical activities and normalized inputs; calculate snapshots chronologically.
5. Tasks/runs and their historical completion events.
6. Current health, signals, attention and recommendations through production engines.
7. Reconcile story assertions and portfolio counts.

Use stable fixture keys/UUID mappings. Upsert owned seed records only. Re-running the same seed does not duplicate snapshots/events/tasks or rewrite unrelated user records. Any reset targets only a verified dedicated fixture workspace and requires explicit reset mode.

## Separate edge-case fixture suite

Do not sacrifice the canonical demo totals to test unusual cases. A test workspace covers all-missing and partially missing health; stale input; null contact data; zero milestones; unknown baseline; inactive owner; archived customer; cross-tenant links; duplicate imports; exact threshold dates; retried jobs and concurrent action acceptance.

## Seed acceptance

Assert 60 customers, five visible personas plus one non-public Admin, ownership 14/16/13/17, 32/19/9 health split and eight onboarding subset; engine-calculated scores match named stories; chronology is plausible; no completion precedes creation; no terminal renewal lacks outcome; no customer has more than one active primary contact, open/acknowledged attention item or nonterminal renewal; expected aggregate counts are asserted separately; same seed twice produces no extra records; all source simulations are labeled.

Run key UI screens against these fixtures and inspect density, long names, empty optional fields and semantic colors. No KPI number should be manually planted to make a screenshot look better.
