# 01 · Product overview

## Product

Waslix is a Customer Success Workspace for small and medium B2B SaaS and service companies that need essential customer-success workflows without enterprise-platform complexity.

**Promise:** Know who needs attention. Understand why. Take action.

Customer data and follow-ups are commonly scattered across account records, spreadsheets, notes and support systems. Waslix brings the customer-success context together so a CSM can decide what to do and record the result.

## Users and jobs

| User       | Primary job                                  | Successful session                                                    |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------- |
| CSM        | Manage assigned relationships and follow-ups | Investigates priority accounts and commits to concrete actions        |
| CS Manager | Coordinate portfolio work and ownership      | Finds unmanaged risk and balances work                                |
| Admin      | Maintain workspace access and configuration  | Adds members and assigns roles without compromising tenant boundaries |
| Viewer     | Understand customer and portfolio status     | Reads reliable summaries without modifying data                       |

CSMs can read the whole workspace portfolio. Account and object ownership constrain changes; see [business rules](05-BUSINESS-RULES.md).

## Product layers

1. Core workflow: customers, contacts, goals, tasks, risks, onboarding, renewals and activities.
2. Intelligence: normalized health, history, explainable signals and grouped attention.
3. Action: deterministic recommendations and user-started built-in playbooks.
4. Management: portfolio analytics, team visibility and ownership.
5. Foundation: workspace access, CSV import, global search and usable demo/manual data.

## Signature experiences

| Experience         | Question answered                     |
| ------------------ | ------------------------------------- |
| Attention Queue    | Who needs attention today?            |
| Customer 360       | What is happening with this customer? |
| Explainable Health | Why did the assessment change?        |
| Timeline           | How did we get here?                  |
| Next Best Action   | What useful action can I take now?    |

A usage change can update health, produce a signal, raise account attention, suggest a check-in and lead to a task. The resulting activity remains in customer history. These must form a working sequence rather than disconnected dashboard widgets.

## Product principles

- Useful with manual/native data before integrations exist.
- Strong defaults and a small navigation surface.
- Explain every important score, priority and recommendation with traceable facts.
- Keep human judgment in control of commercial outcomes and relationship decisions.
- Preserve history, ownership and data-source identity.
- Support adoption metrics for both SaaS and services.
- Keep the workspace calm, readable and fast for daily use.

## V1 outcome

A team can create/import accounts, understand health, identify and manage risks, complete onboarding, prepare and record renewals, manage daily tasks and inspect portfolio performance in one tenant-isolated English/Arabic application with complete LTR/RTL behavior.

## Acceptance and product evidence

Release evidence should demonstrate all five critical flows in [user flows](10-USER-FLOWS.md), correct calculations, role enforcement, realistic history, English/Arabic catalog parity and consistent LTR/RTL UI states.

Suggested measurement, not previously agreed targets: time from opening attention to creating an action; proportion of actionable items with an owner and open work; customer import completion; explanation availability; completion of onboarding and renewal flows. Define numeric product targets only after observing actual usage. Do not report invented adoption or retention improvements.

Scope authority: [03](03-V1-SCOPE.md). Build sequence: [11](11-IMPLEMENTATION-PLAN.md).
