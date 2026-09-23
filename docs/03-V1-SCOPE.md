# 03 · V1 scope

## Must ship

| Area                | V1 boundary                                                                                    | Acceptance                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Workspace           | Authentication, membership, four fixed roles, ownership                                        | Cross-workspace access denied; all role cases tested                                         |
| Customers           | Create/edit/archive, tags, owner, filters, search                                              | Every row opens correct Customer 360                                                         |
| Contacts            | Stakeholders, role, primary contact                                                            | At most one active primary contact                                                           |
| Goals               | Progress, owner, dates, lifecycle                                                              | Goals feed the health dimension                                                              |
| Customer 360        | Shared account header and eight tabs                                                           | Context preserved across tabs                                                                |
| Health              | Four weighted dimensions, current state, snapshots, trends, explanations, freshness/confidence | Missing data is not zero                                                                     |
| Attention           | Grouped active concerns and deterministic priority                                             | One active item per account; repeat jobs do not duplicate it                                 |
| Tasks               | Assignee, priority, due date, completion                                                       | Inline completion saves actor/date and history                                               |
| Risks               | Manual tracked issues, mitigation and resolution                                               | Resolution requires a note; history retained                                                 |
| Onboarding          | Default milestones, progress, derived delay                                                    | Completion suggests lifecycle change                                                         |
| Renewals            | Historical cycles, stages, readiness, outcomes                                                 | Terminal outcomes explicit and auditable                                                     |
| Activities/timeline | Meetings, calls, email records, notes plus system events                                       | One filtered, ordered customer history                                                       |
| Recommendations     | Rule-based reasons and action conversion                                                       | Acceptance is idempotent                                                                     |
| Playbooks           | Four built-in templates and user-started runs                                                  | Step/task state and progress agree                                                           |
| Analytics           | Health, risks, renewals, onboarding and ownership                                              | Counts reconcile with operational data                                                       |
| Adoption            | CSV mapping/validation/import, global search                                                   | Errors explicit; retries do not duplicate rows                                               |
| Languages           | English and Arabic through next-intl, persisted preference and complete RTL behavior           | Catalog parity; equivalent authorized outcomes and representative flows pass in both locales |
| Demo                | Northstar Cloud dataset and isolated role fixtures                                             | Key screens have consistent customer stories                                                 |

Smart customer summaries use structured facts and deterministic text. They do not require an AI provider.

## Supporting release work

Loading/empty/error states, accessible keyboard use, dark/light theme consistency, responsive LTR/RTL layouts, English/Arabic catalog completeness, pagination, migration discipline, worker recovery, deployment configuration and checks for the critical flows are part of completion.

Pack default: make dark mode the first visual implementation because the user's latest detailed feedback concerned that surface. Ship equivalent semantic behavior in light mode; do not maintain separate component systems.

## Deferred

Real CRM/support/billing/calendar integrations; outbound customer email; Slack integration; public API/webhooks; customer portal; native mobile app; locales beyond English/Arabic; user-managed translations; custom permission/health/rule/dashboard builders; advanced segmentation; complex contracts/forecasting; generic workflow engine; autonomous AI.

Built-in playbooks are V1. Custom playbook authoring is deferred. Workspace lifecycle records exist in V1; editing their display name/order/active state is a simple admin operation, not an automation builder.

## Deliberate limits — pack defaults

- One primary customer owner and one active renewal cycle per customer.
- One onboarding record per customer for V1; completed history remains accessible.
- CSV imports customers plus optional primary contact and initial renewal, not arbitrary nested workflows.
- Notifications are in-app attention and timeline surfaces for V1. A delivery inbox, email notifications and external actions are deferred.
- Basic currency-aware contract totals; no currency conversion or revenue forecasting.
- Customer logos/avatars may use initials; attachments are deferred.

## Release gate

All eight milestones in [implementation plan](11-IMPLEMENTATION-PLAN.md) complete; critical user flows work against persisted data; authorization and engine boundary tests pass; worker retries are safe; realistic demo can be rebuilt; UI behavior matches [design system](09-DESIGN-SYSTEM.md).

A partial build can be a milestone preview, but should not be labeled complete V1.
