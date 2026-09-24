# 16 · Code organization and styling

This document owns code placement, module boundaries, imports, component organization and Tailwind usage. Use [12](12-CODING-STANDARDS.md) for general quality and [17](17-INTERNATIONALIZATION.md) for English/Arabic behavior.

## Placement principle

Keep code as close as possible to the domain or route that owns it. Move code outward only when its contract is stable and genuinely reused. Similar syntax is not sufficient reason to create shared code.

| Responsibility                                         | Location                                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Route layout/page/loading/error composition            | `src/app/[locale]/...`                                                                  |
| Better Auth callbacks and real HTTP endpoints          | `src/app/api/...`                                                                       |
| Domain validation                                      | `src/modules/<domain>/validation/`                                                      |
| Protected internal mutation entry points               | `src/modules/<domain>/actions/`                                                         |
| Domain behavior and transactions                       | `src/modules/<domain>/services/`                                                        |
| Scoped read projections                                | `src/modules/<domain>/queries/`                                                         |
| Pure domain calculations                               | `src/modules/<domain>/engine/` when the domain has a real engine; otherwise `services/` |
| Domain UI, forms and table columns                     | `src/modules/<domain>/components/`                                                      |
| Domain-owned types/constants                           | The owning module, near their consumers                                                 |
| Unstyled/low-level shadcn primitives                   | `src/components/ui/`                                                                    |
| Stable cross-domain application UI                     | `src/components/shared/`                                                                |
| Shell/navigation/theme/locale controls                 | `src/components/layout/`                                                                |
| Auth, DB, jobs, permissions and storage infrastructure | `src/lib/<concern>/`                                                                    |
| Worker process entry and handlers                      | `src/worker/`                                                                           |
| Locale configuration and message loading               | `src/i18n/`                                                                             |
| Translation catalogs                                   | `messages/en/` and `messages/ar/`                                                       |
| Unit tests                                             | Beside the owning pure code as `*.test.ts` when useful                                  |
| Database/browser suites and shared fixtures            | `tests/integration/`, `tests/e2e/`, `tests/fixtures/`                                   |

Do not create empty folders to mirror this table. A module starts with the files needed for its current task and adds a subfolder only when it contains real code.

## Placement decisions

Use this order when deciding where code belongs:

1. Does it implement a business rule or use domain vocabulary? Keep it in that domain module.
2. Does it compose a route without reusable behavior? Keep it in the route file.
3. Is it framework/infrastructure code with no domain policy? Put it under the matching `src/lib` concern.
4. Is it a low-level visual primitive independent of Waslix domains? Put it in `components/ui`.
5. Is it a stable application pattern used by multiple domains with the same semantics? Put it in `components/shared`.
6. Otherwise keep it beside its only caller until a real boundary emerges.

Never create generic dumping grounds such as `utils.ts`, `helpers.ts`, `common.ts`, `shared-types.ts` or `constants.ts` at repository root. A narrowly named local utility such as `format-health-delta.ts` is acceptable in its owning module; locale-sensitive formatting belongs to 17's formatting layer.

Before adding a low-level UI primitive, check the version-compatible shadcn registry and install the official item through the configured CLI. Do not manually recreate an available registry component in `components/ui`. Compose downloaded primitives for application behavior, such as a localized date picker built from Calendar and Popover, under `components/shared` only when the same contract has real cross-domain consumers. Keep one-off domain composition beside its owning feature.

## Module boundaries

- A module exposes deliberate actions, services or projections. Consumers do not reach into another module's persistence details.
- Cross-domain writes use the owning service. An onboarding service may request a lifecycle change through the customer/lifecycle service; it may not update that table directly.
- Queries are read-only, workspace-scoped and return selected view/domain projections rather than raw records by default.
- Services own business rules, authorization assumptions, transactions, audit events and outbox intent. A service must document whether it expects an authorized user context or trusted worker context.
- Actions own request authentication, active membership, input validation, object authorization and safe result translation. They remain thin.
- React components render supplied state and invoke actions. They do not calculate health/readiness, inspect role strings to replace server authorization or access Prisma.
- Worker handlers reload scoped current facts and call the same domain services/engines as web paths. They do not duplicate formulas.
- Avoid broad barrel files. Import from an explicit owning file unless a small public module entry point is necessary and preserves server/client boundaries.
- Mark server-only entry points appropriately. Never re-export server code through a module imported by a Client Component.

## File and API shape

- Use kebab-case filenames that state responsibility: `resolve-risk.ts`, `get-customer-overview.ts`, `risk-resolution-form.tsx`.
- Prefer one primary exported responsibility per file. Closely coupled local types/helpers may remain with it.
- Do not use a directory and `index.ts` for every component. Add a directory when a feature has multiple private files.
- Keep route `page.tsx`, `layout.tsx`, `loading.tsx` and `error.tsx` focused on route concerns and module composition.
- Next.js `error.tsx` and `global-error.tsx` use `"use client"` as required by the framework; this is a framework boundary, not permission to make the surrounding route tree client-rendered.
- Prefer named exports for module code. Next.js route conventions may use required default exports.
- Keep schemas with the boundary they validate. Reuse a domain schema only when create/edit/import truly share the same contract; do not make one permissive universal schema.
- Do not pass whole Prisma records through UI layers. Select and name the projection required by the surface.
- Avoid prop collections dominated by boolean switches. Split materially different variants or use an explicit discriminated variant.

## React composition

- Server Components are the default for data loading and composition.
- Add `"use client"` at the smallest component needing state, effects or browser APIs. Do not turn a page or large subtree into a Client Component for one button.
- Keep forms and interactive controls client-side only where required; pass serializable prepared data from the server.
- Domain table columns, filters and row actions stay in the domain module. Shared table primitives own mechanics, not customer/risk/renewal knowledge.
- Extract a component when it represents a named UI concept, isolates meaningful interaction or is reused with the same semantics. Do not extract every repeated `flex` row.
- Do not mirror server entities into global client state. Use URL state for shareable filters and local state for transient dialogs.
- Effects synchronize with external systems; they do not derive renderable values or orchestrate normal mutations. Follow the repository's React Compiler guidance and do not add memoization by habit.

## Tailwind and CSS

Semantic tokens in [09](09-DESIGN-SYSTEM.md) are the styling authority. Define token mappings centrally in `globals.css`; components consume semantic utilities rather than raw palette values.

### Required practices

- Use semantic classes such as background, surface, foreground, muted, border, brand, healthy, attention, risk and information tokens.
- Use the documented spacing, radius, typography, control-height and table-density scales before introducing a new value.
- Use logical direction utilities for layout: `ms`/`me`, `ps`/`pe`, `start`/`end`, logical text alignment and direction-aware positioning. Avoid `ml`/`mr`, `pl`/`pr`, `left`/`right` when direction matters.
- Group classes consistently: layout/display, position, size, spacing, typography, appearance, interaction/state, responsive/dark variants.
- Use the M1-pinned formatter and compatible Tailwind class-sorting plugin as the mechanical ordering authority. Do not hand-order against formatter output or reformat unrelated files.
- Use the existing `cn` helper for conditional composition and the existing component variant mechanism for stable visual variants.
- Put repeated keyframes, complex selectors, print behavior and browser-specific rules in a named CSS layer rather than duplicating arbitrary utilities.
- Keep focus, hover, disabled, pending, invalid and reduced-motion behavior with the owning component contract.

Class ordering is formatter-enforced. Semantic-token use, product-copy localization, arbitrary-value justification and direction-safe utilities are review-enforced in M1 unless a narrow compatible static check is adopted. Do not claim the formatter enforces those semantic rules.

### Arbitrary values

Arbitrary values are exceptions, not a design method. Do not use raw hex colors, arbitrary font sizes, spacing, radii or one-off widths when a token/standard utility expresses the design. An arbitrary value is allowed only for a measured external constraint, calculated layout, chart geometry or third-party integration that cannot use a token. Keep it local and add a short rationale when the reason is not obvious.

Avoid:

```tsx
<div className="gap-[13px] rounded-[11px] border-[#303030] bg-[#111111] p-[19px]" />
```

Prefer:

```tsx
<div className="bg-surface flex items-center gap-3 rounded-md border p-4" />
```

Do not move a long arbitrary class string into a variable merely to hide it. Fix the token/component contract.

## Reuse rules

Promote code to shared only when all are true:

- At least two real consumers need the same behavior or visual semantics.
- The API can be named without domain-specific exceptions or boolean switches.
- Ownership, accessibility, translation and responsive behavior are stable.
- Sharing reduces maintenance rather than coupling unrelated release tasks.

If behavior differs by domain, share the low-level primitive and keep domain composition separate. Never put business types or permission logic into `components/ui`.

## Dependency direction

Allowed direction is route/client entry → domain action/query/component → domain service/engine → infrastructure adapter. Infrastructure provides capabilities and must not import feature UI. Pure engines import no React, Next.js, auth, Prisma, translation or environment modules.

Circular module dependencies are not accepted. Resolve them by identifying the owning service, passing facts into a coordinator or extracting a small stable infrastructure/domain-neutral contract; do not create a generic `shared` module to conceal the cycle.

## Organization review

Before handoff verify:

- Every new file has an obvious owner and path consistent with this document.
- Route files compose; actions guard/delegate; services decide; queries read; components render.
- No domain rule is duplicated in UI, worker or translation code.
- No generic dumping ground, speculative abstraction, broad barrel or server/client leak was introduced.
- Tailwind uses semantic tokens, standard scales and RTL-safe logical layout.
- Shared code has real stable consumers and no domain-specific escape props.
- Imports do not create a cycle or bypass a module's public behavior.
