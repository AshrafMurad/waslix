# V1 Remaining Work · Three-Phase Application Plan

This document captures V1 requirements that are planned but not fully applied yet, grouped into three reviewable phases. It is based on the V1 scope, information architecture, business rules and implementation plan.

## Phase 1 · Workspace, Team and Settings

Goal: make the disabled workspace administration surfaces real and enforce the V1 ownership rules from the UI down to services.

### Apply

- Add `/settings` for workspace profile and lifecycle configuration.
- Add `/settings/team` for members, roles, status, customer assignment and ownership visibility.
- Enable the Team and Settings sidebar items for authorized users instead of rendering them as unavailable.
- Keep Settings admin-only for role/settings management.
- Allow CS Managers to transfer customer ownership and open work where BR-01 permits it.
- Add ownership-transfer preview before applying changes.
- Block member deactivation until all BR-01 active customers and open work are reassigned, or perform the reassignment atomically in the same operation.
- Preserve the last active Admin invariant.
- Scope all reads and writes by verified active workspace membership.
- Add localized English/Arabic copy for all settings and team screens.

### Acceptance

- Admin can update allowed workspace settings and manage member role/status safely.
- CS Manager can transfer customer/open-work ownership without changing roles/settings.
- CSM and Viewer cannot manage roles/settings.
- Deactivation checks customers, tasks, risks, onboarding, milestones, renewals, goals and active playbook runs.
- Team and Settings routes return the normal non-disclosing not-found/unauthorized behavior when access is invalid.
- English/LTR and Arabic/RTL layouts render correctly on desktop and mobile.

## Phase 2 · Customer Operations Completion

Goal: finish the remaining operational UX and workflow gaps around Customer 360, import and release-critical behavior.

### Apply

- Add Customer 360 header quick actions: Add activity, Create task and Add risk.
- Keep the actions permission-aware and hidden/disabled for archived or unauthorized records.
- Complete CSV import mapping UX instead of only fixed-header upload.
- Persist immutable import validation revisions and row results.
- Support retry of nonterminal import rows without duplicating already imported records.
- Show import row errors with row numbers and concrete messages.
- Confirm readiness refresh behavior for imported initial renewals.
- Add complete empty, filtered-empty, loading, error and unauthorized states for all V1 screens.
- Strengthen tests around import, search, role checks and Customer 360 actions.

### Acceptance

- Header quick actions create persisted activity/task/risk records in the correct customer workspace.
- Import validates all rows before commit unless the user explicitly imports valid rows.
- Import retry is idempotent and reports actual success, failed and skipped counts.
- Customer-authored content remains unchanged when switching locale.
- Representative Arabic customer creation and lifecycle flows persist the same outcomes as English.

## Phase 3 · Release Candidate Hardening

Goal: complete M8 release-readiness work so the app can be labeled V1, not a milestone preview.

### Apply

- Complete responsive QA for Overview, Customers, Customer Overview, Health, Timeline and Renewal at desktop, tablet and mobile widths.
- Complete WCAG 2.2 AA checks for keyboard navigation, focus states, labels, dialogs and tables.
- Complete English/Arabic catalog parity checks.
- Record human Arabic copy review for release-critical screens.
- Verify analytics counts against deterministic story fixtures.
- Verify global search workspace isolation for customers, contacts and tasks.
- Verify worker recovery and retry behavior.
- Document web/worker deployment smoke checks.
- Document database backup and restore verification.
- Rebuild and reconcile the deterministic demo seed.

### Acceptance

- All five critical flows pass against persisted data.
- Import, search, role and workspace-isolation checks pass.
- Analytics reconcile with seeded operational data.
- Worker replay does not duplicate events or actions.
- Web readiness, worker heartbeat and database readiness checks are documented.
- V1 release evidence includes Arabic/RTL validation and human copy-review status.

## Professional Demo Seed Data

Use this seed as the target story dataset for Phase 3 reconciliation. It should be deterministic, workspace-isolated and realistic enough for sales demos, QA and analytics validation.

### Workspaces

| Workspace       | Purpose                         | Locale Default | Currency |
| --------------- | ------------------------------- | -------------- | -------- |
| Northstar Cloud | Main English demo workspace     | English        | USD      |
| Waslix MENA     | Arabic/RTL validation workspace | Arabic         | SAR      |

### Members

| Name                  | Email                    | Role       | Workspace       | Story Use                                   |
| --------------------- | ------------------------ | ---------- | --------------- | ------------------------------------------- |
| Khaled Hassan         | amina.admin@waslix.demo  | Admin      | Northstar Cloud | Workspace settings, import, role management |
| Omar Saleh            | omar.manager@waslix.demo | CS Manager | Northstar Cloud | Team oversight and ownership transfer       |
| Lina Haddad           | lina.csm@waslix.demo     | CSM        | Northstar Cloud | Owns healthy and onboarding accounts        |
| Sami Khan             | sami.csm@waslix.demo     | CSM        | Northstar Cloud | Owns risk and renewal accounts              |
| Noor Viewer           | noor.viewer@waslix.demo  | Viewer     | Northstar Cloud | Read-only permission checks                 |
| اشرف مراد     | ashraf.admin@waslix.demo | Admin      | Waslix MENA     | Arabic admin validation                     |
| خالد الراشد | khalid.csm@waslix.demo   | CSM        | Waslix MENA     | Arabic operational validation               |

### Lifecycle Stages

| Key        | English Name   | Arabic Name           | Reserved |
| ---------- | -------------- | --------------------- | -------- |
| new        | New            | جديد              | Yes      |
| onboarding | Onboarding     | التهيئة        | Yes      |
| adoption   | Adoption       | التبني          | Yes      |
| value      | Value Realized | تحقق القيمة | No       |
| growth     | Growth         | نمو                | No       |
| renewal    | Renewal        | تجديد            | No       |
| churned    | Churned        | منسحب            | Yes      |

### Customers

| Customer            | Owner                 | Stage                 | Health Story                             | Renewal Story                                | Contract    |
| ------------------- | --------------------- | --------------------- | ---------------------------------------- | -------------------------------------------- | ----------- |
| Atlas Fintech       | Lina Haddad           | Value Realized        | Healthy, strong usage and goals          | Renewal in 120 days, healthy readiness       | USD 96,000  |
| Northstar Logistics | Sami Khan             | Renewal               | Needs attention, renewal preparation     | Renewal in 35 days, risk from low engagement | USD 180,000 |
| Cedar Health Group  | Sami Khan             | Value Realized        | At risk from support and unresolved risk | Renewal in 70 days, at-risk readiness        | USD 72,000  |
| Bayt Retail         | Lina Haddad           | Onboarding            | Unknown/early health                     | Active onboarding, delayed milestone         | USD 42,000  |
| Noura Education     | Lina Haddad           | Adoption              | Improving after completed onboarding     | Renewal outside 180 days                     | USD 54,000  |
| Sahab Energy        | Omar Saleh            | Growth                | Healthy but usage decline signal         | Expansion discussion                         | USD 240,000 |
| GulfPay             | Sami Khan             | New                   | Not enough data                          | Initial renewal from import                  | USD 30,000  |
| Palm Insurance      | Lina Haddad           | Churned               | Historical terminal account              | Churned with explicit reason                 | USD 65,000  |
| منصة وصل     | خالد الراشد | التهيئة        | Arabic onboarding validation             | Arabic renewal validation                    | SAR 210,000 |
| شركة نمو     | خالد الراشد | تحقق القيمة | Arabic healthy account                   | Stable renewal                               | SAR 380,000 |

### Contacts

Each active customer should have at least two contacts:

- One primary Champion or Decision Maker.
- One Executive Sponsor or Admin stakeholder.
- Mixed English and Arabic names for bidi testing.
- Recent interaction dates on at least half of contacts.

### Activities And Timeline

Seed a realistic timeline for each major customer:

- Meetings: kickoff, QBR, renewal review and escalation calls.
- Calls: check-ins and risk follow-ups.
- Emails: renewal preparation, support escalation and onboarding reminders.
- Notes: internal context and handoff notes.
- System events: customer created, owner changed, task completed, risk resolved, health recalculated, renewal outcome recorded and playbook started.

### Goals

| Customer            | Goal                                        | Owner       | Progress | Status      |
| ------------------- | ------------------------------------------- | ----------- | -------- | ----------- |
| Atlas Fintech       | Increase active finance users to 80 percent | Lina Haddad | 86       | Achieved    |
| Northstar Logistics | Launch executive dashboard before renewal   | Sami Khan   | 45       | At Risk     |
| Cedar Health Group  | Reduce unresolved support escalations       | Sami Khan   | 30       | At Risk     |
| Bayt Retail         | Complete first-value onboarding milestone   | Lina Haddad | 60       | In Progress |
| Sahab Energy        | Expand usage to regional operations team    | Omar Saleh  | 70       | In Progress |

### Tasks

Seed at least 24 tasks:

- My Tasks for each operational member.
- Team tasks assigned across owners.
- Overdue open tasks.
- Completed tasks with completed actor/date.
- Tasks linked to risks, renewals, onboarding milestones and playbook runs.
- One standalone workspace task with no customer.

### Risks

Seed at least 10 risks:

- Cedar Health Group: critical support escalation, open.
- Northstar Logistics: high renewal risk, monitoring.
- Bayt Retail: onboarding delay, open.
- Sahab Energy: usage decline, open.
- One resolved risk with resolution note and retained history.
- Mix of LOW, MEDIUM, HIGH and CRITICAL severity.

### Onboarding

Seed onboarding records for Bayt Retail, Noura Education and منصة وصل:

- Six default milestones per active onboarding.
- Bayt Retail has one critical milestone at least five days overdue.
- Noura Education has completed onboarding and shows the adoption story.
- منصة وصل validates Arabic milestone labels and RTL layout.

### Renewals

Seed renewal cycles with varied stages and outcomes:

- Upcoming healthy renewal.
- Renewal due within 90 days.
- Renewal at risk because of health and unresolved risk.
- Completed renewed outcome with next cycle created.
- Completed churned outcome with churn reason and lifecycle update.
- Currency-aware values in USD and SAR without cross-currency aggregation.

### Health, Signals And Attention

Seed health data that produces:

- Healthy, Needs Attention, At Risk and Unknown health states.
- Four health dimensions: usage, engagement, support and goals.
- Freshness/confidence variation.
- Active signals for health decline, low engagement, renewal due, onboarding delay, unmanaged risk, unresolved risk, overdue task, usage decline and stalled goal.
- One grouped attention item per affected account.
- Priority ordering that is visually obvious on Overview.

### Recommendations And Playbooks

Seed or trigger recommendations for:

- Health review.
- Schedule check-in.
- Renewal preparation playbook.
- Onboarding recovery playbook.
- At-risk customer playbook.
- Create mitigation task.

Seed at least two active playbook runs and one completed run. Copied playbook tasks and step status must agree.

### Analytics Reconciliation Targets

Record deterministic expected counts after seed:

- Active customers by lifecycle.
- Health distribution including Unknown.
- Open attention accounts.
- Overdue assigned tasks.
- Renewals due within 90 days grouped by currency.
- Risk severity counts for unresolved risks.
- Onboarding completion rate and median completion days.
- Owner workload: active customers, open/in-progress tasks and unresolved risks.

### Demo Quality Rules

- Use realistic but fictional names only.
- Keep emails under `waslix.demo`.
- Make dates relative to a fixed seed clock so tests remain stable.
- Seed data must be idempotent and safe to rerun.
- Preserve tenant isolation: no records should cross workspace boundaries.
- Include enough Arabic data to validate text direction, expansion and mixed-direction content.
