# Waslix — Sprint Phases Plan

> Purpose: split the canonical M1–M8 milestones in `11-IMPLEMENTATION-PLAN.md` into small, agent-friendly tasks. This document does not define a second roadmap; Sprint numbers are optional scheduling groups and M identifiers are authoritative in prompts and handoffs.

## How to use this plan

- Run **one canonical task per main agent session**.
- Start a new session when moving to a new phase or domain, when context becomes noisy, or when the agent begins repeating analysis/touching unrelated files.
- Continue the same session only for fixes introduced by the current task, test failures, or small directly related UI adjustments.
- If a phase is blocked, stop and fix the missing prerequisite instead of building a workaround.
- Every phase ends with: changed files, validation results, genuine unresolved issues, and confirmation that future-scope work was not implemented.

## Sprint → Phase map

| Sprint   | Canonical task | Name                                          |
| -------- | -------------- | --------------------------------------------- |
| Sprint 0 | M1.1           | Repository & Base Setup                       |
|          | M1.2           | Database, Auth & Workspace Foundation         |
|          | M1.3           | Design System & Application Shell             |
|          | M1.4           | Testing, Environment & Foundation Validation  |
| Sprint 1 | M2.1           | Customer Domain & Schema                      |
|          | M2.2           | Customer List, Search & Filters               |
|          | M2.3           | Customer CRUD, Contacts & Ownership           |
|          | M2.4           | Customer 360 Shell                            |
| Sprint 2 | M3.1           | Tasks Domain & Business Logic                 |
|          | M3.2           | Task Workspace & Quick Actions                |
|          | M3.3           | Activities Domain                             |
|          | M3.4           | Unified Customer Timeline                     |
| Sprint 3 | M4.1           | Health Domain & Scoring Engine                |
|          | M4.2           | Health Inputs & Current Health State          |
|          | M4.3           | Health Snapshots, Trends & History            |
|          | M4.4           | Explainable Health & Health UI                |
| Sprint 4 | M5.1           | Signal Engine                                 |
|          | M5.2           | Risk Management                               |
|          | M5.3           | Attention Engine & Priority Logic             |
|          | M5.4           | Attention Queue & Dashboard Integration       |
| Sprint 5 | M6.1           | Onboarding Domain                             |
|          | M6.2           | Onboarding UI & Delay Detection               |
|          | M6.3           | Renewal Domain                                |
|          | M6.4           | Renewal Readiness & Renewal Flow              |
| Sprint 6 | M7.1           | Recommendation Engine                         |
|          | M7.2           | Playbook Templates & Runs                     |
|          | M7.3           | Next Best Action UI                           |
|          | M7.4           | Playbook Workflow Integration                 |
| Sprint 7 | M8.1           | Portfolio Analytics                           |
|          | M8.2           | CSV Import                                    |
|          | M8.3           | Global Search                                 |
|          | M8.4           | Demo Dataset & Seed System                    |
| Sprint 8 | M8.5           | Critical Flow Testing                         |
|          | M8.6           | UX, Responsive & Accessibility Polish         |
|          | M8.7           | Performance, Security & Production Validation |
|          | M8.8           | Docker, Coolify & Deployment                  |

**Total: 8 canonical milestones / 9 optional sprint groups / 36 focused tasks.**

---

# Sprint 0 — Foundation

## M1.1 — Repository & Base Setup

**Objective:** Create a clean Waslix project foundation without business features.

**Scope:** Next.js App Router, TypeScript, Tailwind, shadcn/ui, next-intl English/Arabic route/catalog foundation plus official version-matched routing matcher/interception entry, package-manager consistency, lint/formatting, folder architecture, `AGENTS.md`, environment foundation.

**Prerequisites:** Repository and Waslix docs exist.

**Deliverables:** Running project, base structure, shadcn configured, lint/typecheck commands available.

**Definition of done:** Dev server starts; lint/typecheck pass; locale-prefixed route resolves with catalog parity; no unnecessary dependencies; no Customer Success features implemented.

**Agent boundary:** One dedicated foundation session.

## M1.2 — Database, Auth & Workspace Foundation

**Objective:** Establish identity and multi-tenancy.

**Scope:** PostgreSQL, Prisma, Better Auth, sessions, `Workspace`, `WorkspaceMember`, fixed roles (`ADMIN`, `CS_MANAGER`, `CSM`, `VIEWER`), server-side authorization helpers, workspace scoping, first migration.

**Prerequisites:** M1.1 complete.

**Deliverables:** Working auth, workspace membership, protected routes, reusable authorization helpers.

**Definition of done:** Sign-in/sign-out works; workspace isolation enforced; migrations succeed; the membership-authority output required by 07 records canonical IDs, role/status ownership, invitations, session invalidation and active workspace selection; no product-domain entities added.

**Agent boundary:** Fresh auth/multi-tenancy session.

## M1.3 — Design System & Application Shell

**Objective:** Create the reusable visual foundation.

**Scope:** Semantic tokens, dark/light foundations, near-black dark surfaces, typography, spacing, restrained semantic colors, identity accent, sidebar, header, language switch, responsive English/LTR and Arabic/RTL shell, user/workspace menu.

**Prerequisites:** M1.1–M1.2 complete.

**Deliverables:** Authenticated Waslix shell using shadcn consistently.

**Definition of done:** Responsive shell in both locales/directions; language switch persists and preserves route/workspace; no gradients/glow-heavy UI; no fake dashboard functionality; spacing and typography consistent.

**Agent boundary:** Fresh design-focused session.

## M1.4 — Testing, Environment & Foundation Validation

**Objective:** Finish Sprint 0 with a stable development baseline.

**Scope:** Unit test setup, Playwright setup, auth/workspace smoke tests, `.env.example`, local setup docs, Docker foundation if required, lint/typecheck/test/build validation.

**Prerequisites:** M1.1–M1.3 complete.

**Deliverables:** Working test commands, clean build, documented environment requirements.

**Definition of done:** Build, lint, typecheck and smoke tests pass; no Sprint 1 functionality implemented.

**Agent boundary:** Short validation session.

---

# Sprint 1 — Customers + Customer 360

## M2.1 — Customer Domain & Schema

**Objective:** Create the core account domain.

**Scope:** `Customer`, `Contact`, `LifecycleStage`, archive strategy, customer ownership, workspace indexes/constraints, validation, domain/query foundation.

**Prerequisites:** Sprint 0 complete.

**Deliverables:** Prisma models, migration, basic seed data, workspace-safe queries.

**Definition of done:** Schema/migration valid; no unnecessary UI.

**Agent boundary:** Fresh backend/domain session.

## M2.2 — Customer List, Search & Filters

**Objective:** Build the customer portfolio view.

**Scope:** Customers page, shadcn + TanStack table, search, lifecycle/owner/status filters, sorting/pagination where needed.

**Prerequisites:** M2.1.

**Deliverables:** Functional portfolio table with realistic data.

**Definition of done:** Queries are workspace-safe; no premature health/risk engine work.

**Agent boundary:** Dedicated table/UI session.

## M2.3 — Customer CRUD, Contacts & Ownership

**Objective:** Allow real customer management.

**Scope:** Create/edit/archive customer, primary contact, contacts management, CSM assignment, lifecycle assignment, validation, permission enforcement.

**Prerequisites:** M2.1–M2.2.

**Deliverables:** Fundamental Customer CRUD and contact flows.

**Definition of done:** Server-side permissions enforced; archive preserves history; forms validated.

**Agent boundary:** Fresh session.

## M2.4 — Customer 360 Shell

**Objective:** Create the central customer workspace structure.

**Scope:** Customer 360 route/header, identity avatar, owner/lifecycle/contract/renewal/primary-contact summary, tabs for Overview/Health/Timeline/Onboarding/Risks/Tasks/Renewal/Contacts.

**Prerequisites:** M2.3.

**Deliverables:** Polished Customer 360 shell and route architecture.

**Definition of done:** Customer context clear immediately; future-domain content remains placeholder-only.

**Agent boundary:** Fresh UI/architecture session.

---

# Sprint 2 — Tasks + Activities + Timeline

## M3.1 — Tasks Domain & Business Logic

**Objective:** Create Waslix task management at domain level.

**Scope:** Task model, status, priority, owner, due date, customer relation, created-by, create/update/complete/cancel flows, permission rules.

**Prerequisites:** Sprint 1.

**Deliverables:** Task schema, actions/services, lifecycle tests.

**Definition of done:** Tasks work safely and are workspace-scoped.

**Agent boundary:** Fresh domain session.

## M3.2 — Task Workspace & Quick Actions

**Objective:** Create the daily task experience.

**Scope:** Tasks page, My Tasks/team/overdue/completed filters, quick completion, create/edit drawer/dialog, Customer 360 Tasks tab, dashboard task foundation.

**Prerequisites:** M3.1.

**Deliverables:** Fast operational task workflow.

**Definition of done:** CSM can manage tasks without unnecessary navigation; UI stays compact.

**Agent boundary:** Fresh UI session.

## M3.3 — Activities Domain

**Objective:** Track human/customer interactions.

**Scope:** Activity model and types (meeting, call, email record, note), contact relation, occurred-at, created-by, create/query flows.

**Prerequisites:** Sprint 1.

**Deliverables:** Activity schema and working creation flows.

**Definition of done:** Human activity remains distinct from system events.

**Agent boundary:** Fresh focused session.

## M3.4 — Unified Customer Timeline

**Objective:** Give every customer a clear chronological history.

**Scope:** SystemEvent foundation, JobOutbox/dispatcher and web/worker command foundation, stable event-key enqueue/deduplication/replay, merge Activity + SystemEvent for presentation, Timeline tab, filters, task/customer ownership/lifecycle events where relevant, pagination/loading.

**Prerequisites:** M3.1–M3.3.

**Deliverables:** Unified timeline with visual distinction between human and system events.

**Definition of done:** Timeline tells the customer story without premature health/risk event implementation; worker replay dispatches one durable effect and web/worker commands run independently.

**Agent boundary:** Fresh integration session.

---

# Sprint 3 — Health Engine

## M4.1 — Health Domain & Scoring Engine

**Objective:** Implement deterministic Waslix health scoring.

**Scope:** SuccessGoal schema/CRUD/ownership/events/tests plus four health dimensions (usage/adoption, engagement, support/issues, goals/progress), weights, 0–100 score, statuses, missing-data normalization, pure calculation functions and unit tests.

**Prerequisites:** Sprint 2 sufficiently complete.

**Deliverables:** Working authorized goals workflow and tested health engine.

**Definition of done:** Goal persistence and permissions pass; deterministic calculations consume actual goal progress; missing data is not treated as zero; thresholds covered by tests.

**Agent boundary:** Dedicated business-logic session.

## M4.2 — Health Inputs & Current Health State

**Objective:** Persist normalized inputs and current health.

**Scope:** `HealthInput`, `CustomerHealth`, source type, freshness metadata, manual inputs, recalculation, current-health queries.

**Prerequisites:** M4.1.

**Deliverables:** Persistent health with source/freshness tracking.

**Definition of done:** Updates recalculate correctly; no unnecessary history features yet.

**Agent boundary:** Fresh backend session.

## M4.3 — Health Snapshots, Trends & History

**Objective:** Track health over time.

**Scope:** `HealthSnapshot`, snapshot creation, 7/30/90-day trend/delta calculations, historical queries, health-change system events.

**Prerequisites:** M4.2.

**Deliverables:** Health history and chart-ready trend data.

**Definition of done:** Old scores are preserved; trends reproducible.

**Agent boundary:** Fresh session.

## M4.4 — Explainable Health & Health UI

**Objective:** Make health understandable, not decorative.

**Scope:** Health tab, overall score, up/down/stable trend, dimension breakdown, reason generation, positive/negative signals, confidence, history chart, compact health indicator.

**Prerequisites:** M4.1–M4.3.

**Deliverables:** Polished explainable-health experience.

**Definition of done:** Important scores have context; semantic colors restrained; no AI dependency.

**Agent boundary:** Fresh UI/product session.

---

# Sprint 4 — Signals + Risks + Attention Queue

## M5.1 — Signal Engine

**Objective:** Detect important customer-state changes.

**Scope:** Canonical BR-04 signal registry, model/status/types, episode/evidence signatures, deterministic detection rules, signal creation/resolution, duplicate control, tests.

**Prerequisites:** Sprint 3.

**Deliverables:** Historical, explainable signal engine.

**Definition of done:** Signals represent facts/state changes; no notification spam.

**Agent boundary:** Dedicated logic session.

## M5.2 — Risk Management

**Objective:** Implement human-managed risk lifecycle.

**Scope:** Risk model/types/severity/owner/status, create/update/monitor/resolve, resolution note, Customer Risks tab, portfolio Risks page, and M2 ownership-transfer/archive integration for risk work.

**Prerequisites:** M5.1 recommended.

**Deliverables:** Complete risk lifecycle and UI.

**Definition of done:** Resolved risks retained; signals and risks remain separate concepts; transfer/archive regression cases pass for risk work.

**Agent boundary:** Fresh session.

## M5.3 — Attention Engine & Priority Logic

**Objective:** Turn many signals into one clear customer priority.

**Scope:** `AttentionItem`, signal relation, priority levels, customer-level grouping, open/acknowledged/resolved/dismissed, priority rules, deduplication, archive expiration/dismissal and ownership-context regression checks.

**Prerequisites:** M5.1–M5.2.

**Deliverables:** Tested attention aggregation engine.

**Definition of done:** One customer is not shown as duplicate alerts; reasons remain explainable.

**Agent boundary:** Fresh logic-heavy session.

## M5.4 — Attention Queue & Dashboard Integration

**Objective:** Create Waslix's main daily-work experience.

**Scope:** Attention Queue table, customer, health/trend, priority, reasons, owner, renewal context where available, quick actions/open customer, summary metrics, My Tasks, early portfolio-health block.

**Prerequisites:** M5.3.

**Deliverables:** Functional Overview dashboard focused on attention.

**Definition of done:** Dashboard answers “Who needs attention today?” while remaining calm and non-overwhelming.

**Agent boundary:** Fresh design/integration session.

---

# Sprint 5 — Onboarding + Renewals

## M6.1 — Onboarding Domain

**Objective:** Model customer onboarding and milestones.

**Scope:** Onboarding, milestones, owner, target dates, order, critical flag, status and progress rules.

**Prerequisites:** Sprint 4.

**Deliverables:** Schema, services/actions, progress tests.

**Definition of done:** Progress derived from milestones; delay derived correctly from dates/state.

**Agent boundary:** Fresh domain session.

## M6.2 — Onboarding UI & Delay Detection

**Objective:** Make onboarding operational.

**Scope:** Customer Onboarding tab, milestone list/completion, overdue detection, onboarding-delay signals, Attention integration, and ownership-transfer/archive integration for onboarding/milestones.

**Prerequisites:** M6.1 and Signal/Attention engines.

**Deliverables:** Complete onboarding workflow.

**Definition of done:** Overdue milestones create correct state; completing all milestones completes onboarding; transfer/archive regression cases pass.

**Agent boundary:** Fresh session.

## M6.3 — Renewal Domain

**Objective:** Create historical, repeatable renewals.

**Scope:** Renewal model/stages/owner/contract value/dates/outcome, multiple renewals per customer, renewal queries, approaching-renewal signals.

**Prerequisites:** Sprint 4.

**Deliverables:** Renewal schema and logic.

**Definition of done:** Renewals are historical objects, not only a date on Customer.

**Agent boundary:** Fresh domain session.

## M6.4 — Renewal Readiness & Renewal Flow

**Objective:** Create the complete renewal workflow.

**Scope:** Customer Renewal tab, portfolio Renewals page, readiness based on health/risks/engagement/goals/onboarding, time-window behavior, stages, renewed/churned outcomes, Attention integration, and ownership-transfer/archive integration for renewals.

**Prerequisites:** M6.3 plus Health/Risks/Activities.

**Deliverables:** Renewal pipeline and explainable readiness experience.

**Definition of done:** Readiness reasons visible; every trigger in the 08 derived-state matrix refreshes safely; stale/pending state is disclosed; unsafe automatic stage transitions avoided; transfer/archive regression cases pass.

**Agent boundary:** Fresh integration/product session.

---

# Sprint 6 — Recommendations + Playbooks

## M7.1 — Recommendation Engine

**Objective:** Convert business state into deterministic next actions.

**Scope:** Recommendation model/statuses and the complete BR-06 mapping for every canonical signal rule, including explanation, evidence identity and deduplication.

**Prerequisites:** Sprints 3–5.

**Deliverables:** Tested rule-based recommendation engine.

**Definition of done:** Every BR-06 rule maps to its specified task, existing-task link or playbook action and explains why; no AI dependency.

**Agent boundary:** Dedicated logic session.

## M7.2 — Playbook Templates & Runs

**Objective:** Implement the built-in execution targets required by recommendations.

**Scope:** `PlaybookTemplate`, `PlaybookRun`, `PlaybookStep`; built-in templates for At-Risk Recovery, Renewal Preparation, Onboarding Recovery, Low Engagement; copied versioned steps and status/progress.

**Prerequisites:** M7.1.

**Deliverables:** Reusable templates and per-customer runs.

**Definition of done:** V1 keeps predefined templates; no custom builder; running copies do not change with template updates.

**Agent boundary:** Fresh domain session.

## M7.3 — Next Best Action UI

**Objective:** Surface recommendations where they matter without dead ends.

**Scope:** Customer 360 next-action component, dashboard/attention integration, accept/dismiss/complete, and conversion to the BR-06 task, existing-task or now-available playbook target.

**Prerequisites:** M7.1–M7.2 and Tasks.

**Deliverables:** Usable Next Best Action experience.

**Definition of done:** Every visible suggestion has a working permitted target; no dead-end cards or hidden future actions.

**Agent boundary:** Fresh UI session.

## M7.4 — Playbook Workflow Integration

**Objective:** Connect playbooks to operational workflows.

**Scope:** Recommendation → playbook suggestion, start run, tasks linked to steps, timeline events, progress/completion, risk/renewal/onboarding context, plus ownership-transfer/archive integration for recommendations and active runs.

**Prerequisites:** M7.1–M7.3.

**Deliverables:** End-to-end playbook experience.

**Definition of done:** At least one scenario works from signal → playbook → action → completion; complete/reopen/cancel synchronization and transfer/archive regression cases pass.

**Agent boundary:** Fresh integration session.

---

# Sprint 7 — Analytics + Import + Demo Data

## M8.1 — Portfolio Analytics

**Objective:** Create useful managerial analytics without becoming BI software.

**Scope:** BR-11 metric dictionary: portfolio health, health trend/coverage, risks, currency-grouped upcoming renewal value, onboarding status, simple CSM workload, URL period/owner/lifecycle filters, shadcn/Recharts visuals.

**Prerequisites:** Core domains complete.

**Deliverables:** Analytics page with roughly 4–6 strong charts/metrics.

**Definition of done:** Analytics derive from operational source data; no chart clutter.

**Agent boundary:** Fresh analytics session.

## M8.2 — CSV Import

**Objective:** Make adoption from spreadsheets easy.

**Scope:** CSV upload, fixed BR-11 V1 columns, mapping/revalidation, preview, errors, atomic customer/primary-contact/tags/initial-renewal rows and asynchronous persisted row processing.

**Prerequisites:** Customer domain stable.

**Deliverables:** Complete CSV import flow.

**Definition of done:** Malformed rows handled safely; imports scoped to workspace; useful results shown.

**Agent boundary:** Fresh feature session.

## M8.3 — Global Search

**Objective:** Provide fast workspace navigation.

**Scope:** Command/search UI for customers, contacts and tasks; keyboard navigation; direct Customer 360 navigation.

**Prerequisites:** Relevant domains complete.

**Deliverables:** Focused global search.

**Definition of done:** Fast and useful without becoming a generic command framework.

**Agent boundary:** Fresh short UI/search session.

## M8.4 — Demo Dataset & Seed System

**Objective:** Make the public demo feel real.

**Scope:** Fictional B2B SaaS workspace, five visible personas plus one non-public Admin, exactly 60 customers, healthy/needs-attention/at-risk/onboarding mix, health history, tasks, risks, activities, renewals, attention scenarios, playbooks, timeline events.

**Prerequisites:** Major domains stable.

**Deliverables:** Deterministic, realistic demo seed.

**Definition of done:** Every major screen has meaningful data; dataset includes successful, recovering and troubled customers.

**Agent boundary:** Dedicated seed/data session.

---

# Sprint 8 — Testing + Polish + Deployment

## M8.5 — Critical Flow Testing

**Objective:** Validate Waslix end to end.

**Scope:** Playwright/integration coverage for auth/workspace, customer creation, Attention → Customer → Action, tasks, risks, onboarding, health change, renewal, recommendations/playbooks, workspace isolation.

**Prerequisites:** Sprint 7 complete.

**Deliverables:** Reliable critical-flow suite.

**Definition of done:** Critical V1 workflows pass consistently; no meaningless coverage-only tests.

**Agent boundary:** Dedicated testing session.

## M8.6 — UX, Responsive & Accessibility Polish

**Objective:** Bring Waslix to flagship portfolio quality.

**Scope:** Spacing, typography, table density, responsive behavior, empty/loading/error states, keyboard/focus behavior, WCAG 2.2 AA, English/Arabic catalog parity, RTL/mixed-direction behavior, human Arabic copy review, dark/light consistency, visual clutter removal.

**Prerequisites:** Functional V1.

**Deliverables:** Polished product experience.

**Definition of done:** No overwhelming pages; clear actions; consistent visual identity; primary screens portfolio-ready.

**Agent boundary:** Fresh design-review session.

## M8.7 — Performance, Security & Production Validation

**Objective:** Make the app production-ready.

**Scope:** Query review, N+1 prevention, indexes, Server/Client Component review, authorization audit, workspace isolation audit, environment validation, build optimization, dependency cleanup, error handling/logging foundation.

**Prerequisites:** M8.6.

**Deliverables:** Production validation report plus fixes.

**Definition of done:** No known cross-workspace access; clean build; no obvious performance regressions; no unnecessary major dependencies.

**Agent boundary:** Dedicated engineering-audit session.

## M8.8 — Docker, Coolify & Deployment

**Objective:** Publish Waslix successfully.

**Scope:** Production Docker, PostgreSQL production setup, migrations, environment variables, seed strategy, Coolify config, persistent storage where required, HTTPS/domain, production smoke tests, deployment docs.

**Prerequisites:** M8.7.

**Deliverables:** Deployed Waslix and repeatable deployment instructions.

**Definition of done:** Production app boots; auth and DB migrations work; demo strategy works; critical smoke tests pass.

**Agent boundary:** Final deployment session.

---

# Recommended Agent Workflow Per Task

1. **Start a fresh session.** Give the agent the canonical M task ID, relevant docs only, exact goal, and explicit out-of-scope items.
2. **Require repository inspection first.** Inspect relevant files and previous phase output, then give a short implementation plan.
3. **Implement only the task.** No “while I’m here” features, unrelated refactors, future-task schema, or dependency churn.
4. **Validate.** Run targeted typecheck/lint/tests/build appropriate to the phase.
5. **Review before moving on.** Check changed files, architecture, workspace scoping, migrations/tests, and UI quality where applicable.

# Token-Efficiency Rules

1. One canonical task = one main goal.
2. Read only docs relevant to the task.
3. Search for files before opening broad directories.
4. Do not repeatedly read unchanged files.
5. Do not ask the agent to explain Waslix back to you.
6. Do not paste previous phase prompts unless needed.
7. Use exact file paths when known.
8. Require concise plans and concise completion summaries.
9. Do not brainstorm future features during implementation.
10. Start a new session when context becomes noisy.
11. Fix root causes instead of trying several unrelated patches.
12. Avoid new dependencies unless existing tools cannot solve the problem cleanly.
13. Use targeted tests before running the full suite.
14. Update docs only when a real product/architecture decision changes.
15. Keep prompts focused on outcomes, constraints and definition of done.

# If a Task Is Blocked

1. Stop the current task.
2. Identify the missing prerequisite precisely.
3. Do not build an architectural workaround.
4. Return to the prerequisite task and fix it in a focused session.
5. Validate the fix.
6. Restart the blocked task in a fresh session if significant context changed.

# Combining Tasks

Default: **do not combine tasks**.

Combining is acceptable only when both tasks are small, touch the same files/domain, and remain easy to review. Never combine major domains such as Health + Risks, Customers + Health, Renewals + Playbooks, or Analytics + Deployment.

# Completion Rule

A sprint is complete only when **all canonical tasks in that sprint group are implemented and validated**.

Default implementation sequence:

**Foundation → Customers → Work & History → Health → Intelligence & Risk → Lifecycle → Recommendations → Analytics & Demo → Production**
