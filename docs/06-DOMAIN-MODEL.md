# 06 · Domain model

## Vocabulary and separation

| Concept          | Meaning                                         | Must not be confused with      |
| ---------------- | ----------------------------------------------- | ------------------------------ |
| Customer         | B2B account managed by a workspace              | An individual contact          |
| HealthInput      | Normalized selected dimension input with source | Overall customer assessment    |
| CustomerHealth   | Current calculated assessment                   | Historical snapshot            |
| HealthSnapshot   | Immutable assessment at a time                  | Editable current input         |
| Signal           | Detected condition backed by facts              | Human-owned tracked risk       |
| Risk             | Tracked issue with mitigation and resolution    | Every negative signal          |
| AttentionItem    | Grouped account-level need for action           | One row per signal             |
| Recommendation   | Suggested action                                | Committed task                 |
| Task             | Owned work with status and due date             | Automation suggestion          |
| Activity         | Human/business interaction                      | Machine-generated history      |
| SystemEvent      | Auditable important business change             | Application debug log          |
| Renewal          | One commercial renewal cycle                    | A single mutable customer date |
| PlaybookTemplate | Reusable built-in workflow definition           | Customer execution             |
| PlaybookRun      | Versioned instance for one customer             | Generic workflow engine        |

## Aggregate and ownership map

Workspace owns all business entities and member access. User identity is global; WorkspaceMember links a user to a workspace. One user may join several workspaces.

Customer is the central aggregate reference. It has many contacts, goals, tasks, risks, signals, historical attention items, recommendations, renewals, activities, system events, health inputs and snapshots. It has at most one current CustomerHealth and, for V1, one Onboarding.

Onboarding owns ordered milestones. PlaybookTemplate owns ordered template-step definitions (pack normalization addition); PlaybookRun owns copied execution steps. CustomerTag and AttentionSignal are explicit relational joins. RiskSignal links tracked issues to evidence (pack addition).

## Cardinalities and invariants

- User M:N Workspace through unique membership.
- Workspace 1:N LifecycleStage; Customer N:1 stage in the same workspace.
- Customer N:1 primary owner via WorkspaceMember, not a bare user ID.
- Customer 1:N Contact; at most one active primary.
- Customer 1:0..1 current health; 1:N snapshots.
- Customer 1:N renewals; at most one nonterminal renewal in V1.
- Customer 1:N attention episodes; at most one OPEN/ACKNOWLEDGED.
- AttentionItem M:N Signal, both for the same customer.
- Recommendation optionally references a signal and exactly one task or run after acceptance.
- Task can be workspace-only; every non-null domain link must share its customer.
- One run step links to one task; both are in the same run/customer.
- Ownership assignment never changes historical authorship.

## Source of truth

| Data                                    | Authority                                                         |
| --------------------------------------- | ----------------------------------------------------------------- |
| Membership/access                       | Auth adapter + Waslix fixed-role policy                           |
| User locale preference                  | Auth User extension; URL locale remains authoritative per request |
| Customer profile, contacts, goals, work | Waslix relational records                                         |
| Input score and observed source data    | HealthInput and audited revisions                                 |
| Health                                  | Health engine projection; reproducible from evidence              |
| Attention/readiness/recommendation      | Deterministic derived state                                       |
| Renewal date/outcome                    | Renewal cycle records                                             |
| Timeline                                | Activity + append-only SystemEvent                                |
| Analytics                               | Queries over operational data and snapshots                       |

Simulated source identity is explicit. “Integration” in a source type does not imply a working external connection.

## Module boundaries

Each module owns its validation, queries, services and UI. Cross-module writes use application services, not direct mutations from another module's React components. Application services can coordinate a transaction across related aggregates.

Pure engines calculate health, signals, attention and readiness. Persistence adapters load scoped evidence and save results. Jobs reuse services rather than implementing duplicate domain logic.

## Domain events

CustomerCreated/Archived, OwnerChanged, HealthInputUpdated, HealthChanged, RiskCreated/Resolved, TaskCompleted, MilestoneCompleted, OnboardingCompleted, RenewalStageChanged/Completed, PlaybookStarted/Completed.

A successful operation records its audit event synchronously. Recalculation and downstream derived state may follow asynchronously. Durable job intent prevents a saved business write from losing its processing request.

## Deliberately absent

No custom objects, workflow graph, AI memory, external integration configuration model, billing subscriptions for Waslix, enterprise permission matrix or generic event bus schema.

See [schema](07-DATABASE-SCHEMA.md) for persistence and [architecture](08-SYSTEM-ARCHITECTURE.md) for execution.
