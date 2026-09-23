# 11 · Implementation plan

Build in the eight agreed milestones, identified canonically as M1–M8. `WASLIX-SPRINT-PHASES.md` is the subordinate task breakdown and uses IDs such as M1.1; “Sprint 0” is scheduling language, not a second phase system. Each milestone is done only when its exit gate passes against persisted data.

## M1 · Foundation

Read: 07 identity/conventions; 08; 09 tokens; 12; 13; 16; 17.
Deliver: compatible pinned stack, required quality scripts from 12, PostgreSQL/Prisma baseline, Better Auth workspace/member mapping spike, fixed-role authorization, localized shell/sidebar/themes and reusable UI primitives. Establish next-intl English/Arabic routing/catalogs and parity check, persisted locale preference, formatter/Tailwind class ordering, web/worker commands and tenant-scoped service pattern.
Gate: sign-in/out, active membership selection, locale switching, English/LTR and Arabic/RTL shell, catalog parity, cross-tenant rejection and all four roles tested; app builds; auth mappings including preferredLocale proven; two-tenant fixture works. Record actual package versions, environment variables and the M1.2 membership-authority decision required by 07 before business migrations reference members.

## M2 · Customers

Depends: M1. Read: 04 customers/360; 05 BR-01/02; 07 customer core.
Deliver: customer create/edit/archive, tags, lifecycle records, contacts and primary selection; portfolio table/filters; Customer 360 shell.
Gate: persisted account/contact creation, primary-contact concurrency, ownership rules and archive exclusions pass. Unknown health renders correctly before health engine exists.

## M3 · Tasks and activities

Depends: M2. Read: 05 BR-06/11; 07 work/events; 10 UF-02/06.
Deliver: tasks and inline completion, human activities, append-only system events, merged timeline, quick actions; JobOutbox/dispatcher foundation for durable downstream work.
Gate: completion/history atomic, permissions including another account's assigned task correct, pagination stable, duplicate mutation safe. Worker replay proves no duplicate event.

## M4 · Health engine

Depends: M3. Read: 05 BR-03; 07 health; 08 pipeline.
Deliver: goals CRUD (required for GOALS dimension), selected manual/system inputs, pure health engine, current/snapshot persistence, freshness/confidence, comparisons and explanation UI; scheduled recalculation.
Gate: weighted/missing/rounding/time tests pass; snapshots reproducible; stale jobs cannot overwrite newer state; UF-05 works up to health history. Goals must not be left as an unimplemented dependency.

## M5 · Risks and attention

Depends: M4. Read: 05 BR-04/05/07; 07 signals; 10 UF-01/02.
Deliver: risk lifecycle, signal engine, grouped attention, dashboard integration and priority explanation. Introduce the recommendation interface and evidence contract; full action conversion ships in M7. Retrofit M2 archive/ownership behavior for signals, attention and risk work.
Gate: manual risk and mitigation flow complete; single active attention under concurrency; dismissal and resolution are stable; priority tests pass; archive and ownership invariants from M2 pass with the new records. No fake recommendation buttons; hide unfinished actions in previews.

## M6 · Onboarding and renewals

Depends: M5. Read: 05 BR-08/09; 07 lifecycle; 10 UF-03/04.
Deliver: milestones/progress/delay; historical renewal cycles, readiness, windows and explicit terminal outcomes; corresponding signal rules. Extend ownership transfer/archive behavior and signal evaluation for these new records.
Gate: UF-03/04 pass; no automatic lifecycle changes outside confirmed actions; next cycle is atomic/idempotent; readiness refreshes after every trigger in 08; daily sweeps detect deadlines without page visits; prior archive/transfer invariants still pass.

## M7 · Recommendations and playbooks

Depends: M6. Read: 05 BR-06/10; 07 action/playbook tables.
Deliver: deterministic next actions and smart summaries from the BR-06 mapping, four built-in templates, copied run steps/tasks, acceptance/completion/dismissal; finish UF-01 end-to-end. Extend archive/ownership transfer to suggestions and active runs.
Gate: evidence-backed text; accept retry creates one action; complete/reopen/cancel keeps task/step/run/recommendation status consistent; template changes do not alter existing runs; prior archive/transfer invariants still pass; no automatic external communication.

## M8 · Adoption, analytics and release

Depends: M7. Read by subtask: 03 release gate; 04 search/analytics; 05 BR-01/11; 08 import/deployment; 09; 10 supporting flows; 14.
Execute as bounded sub-gates; do not treat M8 as one implementation session:

1. M8.1 analytics against canonical story fixtures and the metric dictionary in BR-11.
2. M8.2 CSV import with persisted batch/row results and the fixed V1 column contract.
3. M8.3 global search with permission and workspace-isolation checks.
4. M8.4 full deterministic demo seed and reconciliation.
5. M8.5 critical-flow and role/isolation suite.
6. M8.6 responsive, WCAG 2.2 AA, English/Arabic, RTL and theme hardening with human Arabic copy review.
7. M8.7 performance/security/production validation.
8. M8.8 deployment, worker recovery and database-restore verification.

Gate: all five critical flows and supporting import/search/role checks pass; representative Arabic flows and English/Arabic catalog parity pass; human Arabic copy review is recorded; analytical counts reconcile; clean seed and seed rerun verified; web/worker deployment smoke and database restore check documented. Publish only within the deployment authorization for that task.

## Task sizing and handoff

One task should produce one reviewable outcome, such as “Implement risk resolution with note and timeline event.” Avoid asking a single session to implement all V1.

For each task record: canonical M task ID; outcome; required dependencies; relevant doc sections; likely files; acceptance checks. End with changed files, checks actually run, unresolved issues and next dependency. A new task session reads the short handoff, not the entire history.

## Checkpoints

- After M1: usable protected shell and tenancy foundation.
- After M3: real customer/work/history workflow.
- After M5: explainable portfolio attention.
- After M7: complete detect → understand → act loop.
- After M8: release candidate.

## Handling discoveries

A package incompatibility, unavailable auth mapping or uncovered rule ambiguity should be resolved in the smallest affected scope. Record the changed decision in its owning doc. Do not restart product planning or expand infrastructure for convenience. If a dependency task is incomplete, complete the missing prerequisite rather than faking the downstream UI.

Use [efficiency rules](15-AGENT-TOKEN-EFFICIENCY.md) to keep task context small without weakening these gates. Handoffs and requests use canonical M identifiers; legacy “Sprint N” names may appear only as grouping labels in the subordinate breakdown.
