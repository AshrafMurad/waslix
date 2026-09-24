# 12 · Coding standards

## Quality priorities

Clean code is code whose behavior, owner and failure modes are easy to understand and change safely. Apply these priorities in order:

1. Correctness, tenant isolation and authorization.
2. Business invariants, transactions and retry safety.
3. Clear domain ownership and server/client boundaries.
4. Readability, testability and consistent user behavior.
5. Reuse and optimization only when evidence justifies them.

Do not trade a higher priority for fewer lines, a clever abstraction or a visual shortcut. Follow [code organization](16-CODE-ORGANIZATION.md) for placement and Tailwind rules and [internationalization](17-INTERNATIONALIZATION.md) for all user-facing copy and locale behavior.

## Clean-code rules

- Name code by business intent: `resolveRisk`, `calculateRenewalReadiness`, `getCustomerOverview`. Avoid vague names such as `processData`, `handleItem`, `CommonCard`, `helpers` and `misc`.
- One function owns one coherent operation. Keep straightforward code together; extract only a named rule, reusable contract, side-effect boundary or independently testable calculation.
- Make inputs, outputs and side effects explicit. Pure engines receive facts, rule version and clock; they do not read sessions, environment variables or the database.
- Prefer early validation and guard clauses over deeply nested branches. Do not hide authorization, database writes or job dispatch inside surprising getters/utilities.
- Avoid boolean-parameter behavior switches. Use an options object or distinct named operation when modes have different invariants.
- Remove dead code, commented-out implementations, temporary logging and unused exports. TODOs require a concrete reason and owning task; they cannot stand in for required V1 behavior.
- Comments explain rationale, invariants, concurrency or an external constraint. They do not narrate syntax or compensate for unclear naming.
- Do not create abstractions for hypothetical reuse. Duplication of a few simple presentation lines is preferable to coupling unrelated domains; duplicated business rules are not.
- No file-length quota is authoritative. Split a file when it mixes responsibilities or requires unrelated knowledge to change; do not create one-line wrapper files to satisfy a metric.

## Structure and types

Use TypeScript strict mode. Validate untrusted boundaries with Zod and infer types where appropriate. Do not use unchecked casts or any to bypass domain constraints.

Prefer discriminated unions and domain enums when they prevent invalid state. Use `unknown` at untrusted boundaries and narrow it. A type assertion requires evidence the runtime contract already established; assertions cannot replace validation. Do not duplicate Prisma/framework types unless a narrower domain or UI projection is intentional.

Domain modules own business behavior. Components render data and dispatch actions. Actions handle authentication, validation and delegation; services implement domain operations; queries return narrowly selected projections. Share small stable primitives, not speculative universal abstractions.

Naming: PascalCase components/types; camelCase functions/variables; explicit verb actions (resolveRisk, completeTask). Follow existing repository filename conventions. Comment rationale and invariants rather than narrating obvious code.

Use kebab-case filenames. Components and exported types use PascalCase; functions, variables and file-local schemas use camelCase; constants use descriptive camelCase unless they are true protocol-style constants. Boolean names start with `is`, `has`, `can`, `should` or another predicate. Avoid abbreviations except stable domain terms such as `id`, `csv` and `url`.

## Server and client

Server Components by default. Small Client Components for forms, dialogs, interactive charts, tables and optimistic controls. Mark server-only modules and avoid exports that leak database/auth code into client bundles.

Server Actions are protected endpoints, not inherently authorized. Derive workspace context server-side and recheck each mutation. Route Handlers use the same services for actual HTTP needs. Never trust hidden inputs or a UI-disabled control for security.

Server Actions authenticate, derive context, validate, authorize and delegate. They do not contain multi-step domain behavior or direct cross-domain writes. React components never import Prisma, worker code or server-only infrastructure. Add `"use client"` only at the smallest interactive boundary.

## Persistence

All domain access includes workspace scope. Validate same-customer relationships. Use composite keys/constraints from 07. Transactions cover related writes and audit/outbox intent. Avoid read-then-write races; use locks/uniqueness/idempotent operations as required.

Use decimal money, explicit time semantics, selected fields and bounded pagination. Never expose raw database errors to users. Never mutate historical snapshots/events. Migrations are reviewed and committed; do not use destructive schema reset against user data.

Query functions are reads and never mutate. Command/service names state their effect. Cross-module writes call the owning module's service, and related state changes share one transaction. Do not use a generic repository layer that merely renames Prisma methods.

## Error contracts — pack convention

Return a typed success/error result with stable code, safe message and optional field errors. Distinguish validation, forbidden/not-found, conflict and retryable failure. In inaccessible-record cases avoid revealing another tenant's existence. Log technical details with correlation IDs, not secrets.

Preserve form values after failed saves. Optimistic UI must roll back. A queued calculation is not a completed calculation.

Never swallow an error or convert failure into success. Domain services return or throw documented domain failures; actions translate them to the stable public result. Log operation/correlation IDs and safe technical context, not secrets, raw requests, translation messages or customer narratives.

## UI consistency

Reuse shadcn primitives and shared Waslix components. Domain table columns remain domain-owned. Keep sorting/filter semantics consistent server/client. Display missing values explicitly. Use semantic tokens and labels from 09.

For a standard interaction available in the compatible shadcn registry, install the official component with the shadcn CLI and use its documented API instead of hand-authoring a lookalike. This includes styled selects, dialogs, sheets, dropdown menus, tabs, popovers, calendars, fields and data-table primitives. Use a native browser control only when platform rendering is an intentional product decision, not as a shortcut for a designed shadcn surface.

Keep downloaded primitives in `components/ui` recognizable as registry components. Apply domain composition, translated copy, pending behavior and Waslix-specific layout at the caller or in a genuinely reused `components/shared` composition; do not label custom primitives as shadcn components.

Dialog forms must use the shared shadcn form primitives consistently: `Dialog`, `Field`, `FieldLabel`, `Input`, `Textarea`, `Select`, `Checkbox`, and shared Calendar/Popover date compositions. Labels, entered text, placeholders and descriptions use logical `text-start`; controls use shared heights and focus/invalid states; dialog close/action placement uses logical start/end so Arabic RTL and English LTR render as mirrored equivalents.

Use local/URL state first; do not replicate server entities in Zustand. Do not add another form, table, chart, date, HTTP or state package when the stack already solves the need.

All user-facing text follows 17. Do not place English or Arabic literals directly in product components, actions or validation schemas. Stable internal codes, enum values, test fixture data and operator logs are not translated.

## Dependencies and configuration

Use the repository's package manager and lockfile; choose one in M1 if absent. Before adding a dependency, inspect existing APIs and explain the concrete need. Install the smallest relevant package; commit intentional lock changes. No unrelated upgrades, duplicate libraries or broad formatting churn.

Keep secrets out of source, fixtures, screenshots and logs. .env.example documents names and safe placeholders. Validate required environment configuration at startup. Do not print local environment files into agent context.

## Required project checks

M1 establishes stable package scripts for `format:check`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `i18n:check` and `build`. A `check` script runs the non-environment-specific required checks in a documented order; database and browser suites may remain explicit when they require services. Agents run the smallest relevant checks first and the required aggregate checks for the touched boundary before handoff. Never report a check as passed when it was not run.

Lint/format suppressions are exceptional. Keep a suppression on the narrowest line, state the concrete reason and do not disable a rule repository-wide to make one change pass. Generated/auth-adapter code may be excluded through explicit configuration rather than reformatted manually.

## Testing

Unit tests: health, confidence, trends, signal predicates, priority and readiness using an injected clock.
Database integration tests: tenancy, ownership, composite FKs, uniqueness, transactions, import retries and job replay.
Browser tests: five critical flows plus representative auth/import/search behavior.

For a change, run targeted meaningful tests, then required type/lint/build checks appropriate to touched boundaries. Do not add snapshot tests merely mirroring markup or rerun the full suite without a changed reason. Never remove an assertion just to make a test pass.

Tests follow Arrange/Act/Assert without comments when the structure is obvious. Name the behavior and expected outcome. Mock external boundaries, clocks and delivery adapters, not the domain service under test. Database invariants use PostgreSQL integration tests rather than an in-memory substitute.

## Review checklist

- The code is in the owning module and does not introduce a dumping-ground file.
- Protected operations authenticate, verify active membership, authorize the object and scope every query by workspace.
- Business rules live in services/engines and related writes are transactional/idempotent where required.
- Names describe business intent; types and errors express the real contract without unchecked escapes.
- Server/client, query/command and module boundaries are preserved.
- UI uses semantic tokens, approved Tailwind scales, translated messages and logical RTL-safe layout.
- Tests cover changed rules, permissions, transactions, retries and locale/RTL behavior at the appropriate layer.
- No unrelated dependency, abstraction, formatting churn, dead code or unreported validation gap was introduced.

## Definition of done

Requested behavior implemented; server authorization and persistence consistent; relevant tests pass; required checks complete; UI states/accessibility reviewed for UI work; relevant docs updated only if decisions changed; no unrelated files or temporary debug code. Report unrun checks and remaining limitations explicitly.
