# 04 · Information architecture

## Navigation

Portfolio-level work belongs in the sidebar. Customer-specific work belongs in Customer 360.

| Label     | Route after locale prefix (pack convention) | Primary content                                         |
| --------- | ------------------------------------------- | ------------------------------------------------------- |
| Overview  | /overview                                   | Attention, My Tasks, upcoming renewals, compact metrics |
| Customers | /customers                                  | Portfolio table, filters, add/import                    |
| Tasks     | /tasks                                      | My/team/overdue/completed work                          |
| Risks     | /risks                                      | Portfolio risks and mitigation ownership                |
| Renewals  | /renewals                                   | Date windows, stages and readiness                      |
| Analytics | /analytics                                  | Portfolio and team reporting                            |
| Team      | /settings/team                              | Members, roles and customer assignment                  |
| Settings  | /settings                                   | Workspace profile and lifecycle configuration           |

Team and Settings sit below a quiet sidebar divider. Health, onboarding, notes and contacts do not add sidebar entries.

## Customer 360

Localized application routes use `/{locale}` with `en` or `ar`. Customer base route is `/{locale}/customers/[customerId]`. Tabs append Health (`/health`), Timeline (`/timeline`), Onboarding (`/onboarding`), Risks (`/risks`), Tasks (`/tasks`), Renewal (`/renewal`) and Contacts (`/contacts`); Overview is the base.

All tabs retain identity, health plus trend, lifecycle, contract value, upcoming renewal and owner. Header actions: Add activity, Create task, Add risk. Goals are managed from the overview success-goal section; no separate goals tab in V1.

## Screen contracts

| Screen            | Main question                    | Required content/actions                                                                          |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Overview          | What needs work today?           | Neutral summary cards, dominant Attention Queue, My Tasks, Upcoming Renewals, compact health view |
| Customers         | Which accounts match my needs?   | Data table; health/trend/stage/owner/value/renewal/risk; filters, search, sort, pagination        |
| Customer overview | What is happening now?           | Situation summary, next action, health, risks, goals, tasks, renewal, recent timeline             |
| Health            | Why did health change?           | Four dimensions, weights, sources, freshness, comparisons and chart                               |
| Timeline          | What happened?                   | Merged human/system history, type filters, add activity                                           |
| Onboarding        | What blocks first value?         | Progress, dates, owner, milestones and delay                                                      |
| Customer risks    | What threatens success?          | Active/resolved risks, mitigation tasks, resolution notes                                         |
| Customer tasks    | What work is committed?          | Task list, inline completion, contextual drawer                                                   |
| Renewal           | Are we ready?                    | Current cycle, readiness reasons, stakeholders, goals, preparation work, past cycles              |
| Contacts          | Who matters?                     | Roles, primary indicator, contact details, interaction recency                                    |
| Analytics         | Where is the portfolio changing? | Health distribution/trend, risk severity, renewal value/outcomes, onboarding, owner workload      |

## Interaction structure

Secondary records (task, risk, activity, contact) open in dialogs or side panels. Customer and portfolio areas use full pages. Preserve table filters and scroll position when returning from customer work.

Global search uses Ctrl+K / Cmd+K and a visible trigger. V1 searches customers, contacts and tasks within the authenticated workspace and links to their context. It is navigation, not a general action automation console.

The shell exposes an English/Arabic language switch. It preserves the equivalent authorized route, query state and workspace while applying the locale, direction and preference rules in 17. Navigation labels, search, dialogs, table controls, empty/error states and accessibility text are translated; customer-authored content remains unchanged.

## Query and access conventions — pack defaults

Store shareable search, filters, sort and page in URL parameters. Workspace context is session-derived and displayed in the shell; route IDs never authorize access. A workspace switch clears scoped cache/UI selections and returns to Overview.

CSM defaults: own attention/customers/tasks/renewals. Manager/Admin defaults: team portfolio. Viewer: read-only portfolio. Filters can reveal other workspace accounts; edit controls reflect server permissions.

Portfolio tables use cursor pagination when ordering is not uniquely stable otherwise; URL exposes an opaque cursor rather than a numeric page. Default page size is 25, with 50 and 100 options. Default orders are: Attention by BR-05 priority/deadline/age; Customers by name then ID; Tasks by incomplete first, due date null-last, priority then ID; Risks by unresolved first, severity then target date; Renewals by nonterminal first and renewal date. Search resets the cursor. Every order ends with ID for stable pagination.

Customer list critical columns are customer, health/trend, lifecycle and owner; Tasks are title/customer, status, due and owner; Risks are customer/risk, severity and status; Renewals are customer, renewal date, stage and readiness. Value and secondary context may move behind horizontal scroll but primary row navigation and permitted primary action remain available. Record panels use a URL query key where deep linking is useful; closing returns focus and preserves list URL/scroll state.

For an inaccessible record, return the same non-disclosing not-found surface whether it belongs to another workspace or does not exist. A known authenticated user lacking a workspace-level capability sees an authorized read-only surface when reading is allowed, otherwise the same not-found contract. Empty states offer the permitted primary creation/import action; filtered-empty states offer “Clear filters”; errors provide a retry without discarding URL state.

## State requirements

Every screen defines loading, empty, filtered-empty, error and unauthorized/not-found behavior. Missing health displays “Not enough data,” not a red zero. Archived accounts have a clear read-only banner. Background recalculation displays the last calculation time; it must not look like immediate live analysis.

On small screens collapse the sidebar, stack secondary blocks and allow table horizontal scrolling with the critical columns defined above first. Keep customer identity and primary actions usable.

Visual rules: [09](09-DESIGN-SYSTEM.md). Flow acceptance: [10](10-USER-FLOWS.md).
