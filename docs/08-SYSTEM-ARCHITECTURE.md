# 08 · System architecture

## Shape and stack

One modular Next.js repository, one PostgreSQL database, separate web and background-worker processes sharing domain code.

| Area                 | Conversation choice                                               |
| -------------------- | ----------------------------------------------------------------- |
| App                  | Next.js App Router, TypeScript                                    |
| UI                   | Tailwind, shadcn/ui                                               |
| Internationalization | next-intl; English/Arabic locale-prefixed routes and ICU catalogs |
| Tables/charts        | TanStack Table; shadcn Charts/Recharts                            |
| Persistence/auth     | PostgreSQL, Prisma, Better Auth                                   |
| Forms/validation     | React Hook Form, Zod                                              |
| UI state             | Zustand only when local/URL state is insufficient                 |
| Jobs                 | pg-boss                                                           |
| Files                | S3-compatible storage abstraction                                 |
| Tests                | Vitest, Playwright                                                |
| Deployment           | Docker, Coolify, VPS                                              |

Package versions must be resolved once against compatible stable official releases in milestone M1 and recorded in the lockfile. This pack does not assert the current release status of any package. Use existing repository choices when continuing an implementation; do not upgrade opportunistically.

## Repository layout

```text
waslix/
  AGENTS.md
  docs/
  prisma/{schema.prisma,migrations/,seed.ts}
  public/
  src/
    app/
      [locale]/
        (marketing)/
        (auth)/
        (workspace)/
          overview/
          customers/[customerId]/
          tasks/
          risks/
          renewals/
          analytics/
          settings/
      api/
    modules/
      customers/ contacts/ health/ signals/ attention/
      recommendations/ tasks/ risks/ onboarding/ renewals/
      activities/ goals/ playbooks/ analytics/ workspace/
    components/{ui/,layout/,shared/}
    lib/{auth/,db/,jobs/,permissions/,storage/,utils/}
    hooks/
    config/
    i18n/
    types/
    worker/
  messages/{en/,ar/}
  tests/
  docker/
  .env.example
  docker-compose.yml
```

Within a module use `actions/`, `components/`, `queries/`, `services/`, `validation/`, `types/`, `utils/` only when needed. Do not create empty scaffolding for every possible folder.

## Request path

Server Component → authenticate → verify ACTIVE membership → authorize capability/object → scoped query → projected data. Interactive controls are small Client Components. Protected queries accept a verified workspace/member access context and still scope every database operation; object-specific queries enforce readable ownership/capability before returning data and use the non-disclosing not-found contract.

Server Action → authenticate/member context → validate input → authorize object → application service → transaction → invalidate affected reads → return typed result.

Use Route Handlers for Better Auth callbacks and real HTTP requirements, including upload/import boundaries when needed. Do not duplicate every domain action as REST endpoints. Never expose database access or secrets in client modules.

## Synchronous vs asynchronous

| Synchronous transaction                                        | Asynchronous derived work              |
| -------------------------------------------------------------- | -------------------------------------- |
| Customer/workflow mutation                                     | Health recalculation                   |
| Ownership/status checks                                        | Signal evaluation                      |
| Task completion and linked step updates                        | Attention/recommendation refresh       |
| Risk resolution and note                                       | Scheduled deadline evaluation          |
| Renewal outcome and next cycle                                 | CSV row processing                     |
| Initial renewal-readiness calculation when facts are available | Subsequent readiness refresh           |
| Activity write and contact-recency projection                  | Cross-domain derived refresh           |
| SystemEvent and durable job intent                             | Larger aggregated reads when justified |

Optimistic task completion is allowed with rollback on error. Health panels show last calculation time while processing is pending.

## Intelligence pipeline

Load normalized inputs → calculate health → persist current state/snapshot → evaluate signals → group attention → derive recommendations → write meaningful system events.

Raw-condition rules (overdue work, unresolved risks) can evaluate without a health score. Avoid a cycle in which a derived signal recursively generates the same health update.

Pure engine functions accept facts, configuration version and clock; return results and reasons. Worker handlers load scoped data, call engines, and persist. The UI does not implement formulas.

## Derived-state trigger matrix

| Projection                              | Triggering facts                                                                                  | Timing and consistency                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Contact recency                         | Meaningful contact-linked activity create/correct/remove                                          | Same transaction as activity; recompute latest occurred activity                     |
| Health/current snapshot                 | Selected input revision, meaningful activity, goal progress/status, freshness/day boundary        | Queued; per-customer lock; current facts reloaded                                    |
| Renewal readiness                       | Health, support input, meaningful activity, risk, goal, onboarding, renewal or local-day boundary | Initial cycle calculation synchronous when possible; otherwise queued and serialized |
| Signals                                 | Health/readiness result, task/risk/onboarding/renewal/goal change, local-day boundary             | Queued after authoritative state; episode identity from 05                           |
| Attention                               | Active signal set or priority evidence changes                                                    | Same serialized intelligence chain after signals                                     |
| Recommendations                         | Active signal episode or attention-priority change                                                | Same chain after attention; accepted work is never replaced                          |
| Playbook step/run/recommendation status | Linked task complete/reopen/cancel or run dismissal                                               | One synchronous transaction                                                          |

Each asynchronous trigger writes an outbox intent in the source transaction. A pending marker/version lets UI distinguish stale from current derived state. A worker persists only results calculated from facts loaded after it acquires the customer lock.

## Reliability — pack defaults

Write JobOutbox in the same transaction as the business event. A dispatcher enqueues pg-boss jobs using stable event keys and marks intent dispatched only after enqueue succeeds. A crash between those steps can redeliver; consumers must deduplicate.

Serialize calculations per workspace/customer using a database transaction lock. Load current facts after acquiring the lock; stale jobs should recompute current state rather than overwrite newer calculations from an old payload. Unique calculation/event/action keys protect effects. Do not assume queue delivery is exactly once.

Snapshot calculation keys are deterministic by purpose: `change:{customerId}:{inputFingerprint}:{ruleVersion}` for a meaningful state change and `daily:{customerId}:{workspaceLocalDate}:{ruleVersion}` for the daily unchanged snapshot. The input fingerprint includes selected revision IDs and derived native-input facts, not execution time. This permits one unchanged daily snapshot while deduplicating retries. Current health records the key of the calculation that produced it.

Jobs carry workspaceId, entity IDs, event key and rule version; never auth sessions or secrets. Service authorization differs for trusted worker entry points, but tenant scoping never disappears.

Daily scheduled sweep covers active customers: engagement aging, deadlines, health freshness, snapshots, renewal readiness, signals, attention and recommendations. Pack default: run a dispatcher at least every five minutes and perform a workspace-local daily sweep, with catch-up after downtime. Immediate source changes also enqueue recalculation. Record last successful sweep.

Retry transient failures with bounded backoff (pack default five attempts), retain failed job details without sensitive payloads, and provide an operator replay path. Replays preserve idempotency keys. The web app can operate while workers recover; it must disclose stale calculations.

## Data loading and caches

Use indexed database projections and bounded pagination first. Cache only measured repeated derived reads. Cache keys include workspace and applicable access context; membership/workspace switches must not reuse old tenant data. Analytics derives from source records, not UI state or independently edited dashboard numbers.

Do not duplicate customers/tasks/health into global Zustand stores. Use local state for dialogs and URL state for shareable filters. Shared UI state may use Zustand when justified.

## Import/storage boundary

Validate file size/type, column mapping, dates and owner resolution before execution. Pack default upload cap: 5 MB / 5,000 rows; errors explain the limit. Store uploads under workspace-owned keys, authorized signed access where appropriate, and scoped retention. Never construct a trusted storage path from a client filename.

CSV import validates rows, then processes authorized valid rows asynchronously with persisted row status. Completion totals come from row results. A batch cannot escape its creating workspace.

## Deployment contract

Containers: web, worker, PostgreSQL; S3-compatible provider if files are enabled. One image may expose different web/worker commands. Provide separate web readiness, worker heartbeat and database readiness checks. Keep secrets in deployment configuration; .env.example contains names/placeholders only.

Run reviewed migrations as a release step, not concurrently from every container. Back up PostgreSQL and test restore before a public production release. Prefer additive migrations so preceding web/worker versions remain compatible during rollout. App rollback does not automatically roll back destructive data changes.

Log operation/job IDs and workspace context, durations and errors without credentials or customer narratives. Measure job failures, pending outbox age and last successful sweep.

## Explicit exclusions

No separate backend framework, microservices, Redis, Kafka, generic event bus, Kubernetes or speculative integration engine. Expand only when actual requirements justify it.
