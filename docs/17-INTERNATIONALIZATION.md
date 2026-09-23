# 17 · Internationalization

English and Arabic are V1 product requirements. This document owns locale routing, message organization, formatting, translation behavior, bidirectional layout and locale tests. Waslix uses `next-intl` with the Next.js App Router; pin the compatible version in M1.

## Locale contract

| Concern                 | V1 contract                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Supported locales       | `en`, `ar`                                                                            |
| Default/fallback locale | `en`                                                                                  |
| URL strategy            | Locale-prefixed application routes: `/en/...` and `/ar/...`                           |
| Direction               | `en` is `ltr`; `ar` is `rtl`                                                          |
| Translation engine      | `next-intl`, ICU message syntax                                                       |
| Message source          | Versioned repository catalogs, never database-authored UI copy                        |
| User preference         | Auth User `preferredLocale`; locale cookie supports signed-out/initial navigation     |
| Internal data           | Enum values, IDs, rule keys and persisted user/customer content remain locale-neutral |

API routes, Better Auth callbacks, static assets and worker entry points are not locale-prefixed. Route authorization never trusts a locale or workspace value from the client.

Persist preference as Prisma enum `EN | AR` and map it centrally to next-intl strings `en | ar`; application modules do not repeat casing conversions.

## Locale resolution and switching

The locale segment is authoritative for a localized request. When a request has no locale segment, choose the initial redirect in this order:

1. Authenticated user's supported `preferredLocale`.
2. Supported locale cookie.
3. Supported `Accept-Language` match.
4. `en`.

Switching language preserves the equivalent route, safe query parameters and current workspace context, updates the locale cookie, and updates `preferredLocale` for an authenticated user. It must not preserve an inaccessible entity ID after a workspace/auth change. Unsupported locale segments return the normal not-found behavior rather than silently rendering mixed-language content.

Set `<html lang>` and `<html dir>` from the validated locale on every localized route. Server-render the correct locale to avoid an LTR/RTL or language flash during hydration.

## Repository layout

```text
src/
  app/
    [locale]/
      (auth)/
      (workspace)/
  i18n/
    config.ts
    navigation.ts
    request.ts
    formats.ts
    routing-entry.ts (conceptual; actual official Next.js filename is version-matched)
messages/
  en/
    common.json
    validation.json
    customers.json
    health.json
  ar/
    common.json
    validation.json
    customers.json
    health.json
```

Add domain catalogs only when the domain is implemented. Catalog filenames/namespaces mirror domain ownership; do not create one enormous global file. `common` contains only genuinely shared actions/states such as save, cancel and loading. A domain owns its screen labels, explanations, empty states and domain-specific errors.

Load only the namespaces needed by a route/layout when supported by the selected `next-intl` version. Do not send every V1 message to every Client Component.

M1 creates the official version-matched next-intl routing interception entry and matcher. It performs no-locale redirects and excludes `/api`, Better Auth callbacks, static assets and worker/health endpoints. Use the filename required by the pinned Next.js/next-intl versions rather than copying a stale `middleware.ts` or `proxy.ts` convention.

## Message keys and copy

- Use semantic stable keys such as `risks.resolve.success`, not English text or screen coordinates such as `button2`.
- English and Arabic catalogs have exact key and parameter parity. CI fails on missing keys, extra stale keys or placeholder/type mismatches.
- Keep complete thoughts in one ICU message. Never concatenate translated fragments or construct grammar from several keys.
- Use ICU plural/select syntax for counts, gender/select behavior where needed and rich text placeholders for intentional markup.
- Do not embed JSX/HTML in JSON. Rich text placeholders map to approved components at the call site.
- Variables contain facts, not prebuilt English phrases. Give translators enough context through clear namespace/key names and concise translator notes only when ambiguity remains.
- Buttons use action labels, not sentence fragments reused out of context. Titles, descriptions, aria labels, tooltips, validation, empty/error states, toasts and confirmation copy are all translatable.
- Product names, user-entered customer/contact content, imported values and audit narrative entered by users are displayed as stored and are not machine-translated.
- Internal enums, event types, error codes, log text and rule keys remain stable English-like identifiers; map them to translated display messages at the presentation boundary.

Product copy must not be written directly in `.tsx` product surfaces or returned as final localized prose by domain services. Domain services return stable codes and structured facts. The UI/action boundary selects the message in the active locale. Seed stories may contain fictional user content but interface labels still come from catalogs.

## Server and client usage

Use server translation APIs in Server Components, actions and metadata where supported. Use client translation hooks only inside the smallest necessary Client Component. Do not pass a translator through domain services or pure engines.

Domain errors use stable codes with structured safe parameters:

```ts
type DomainError = {
  code: "RISK_RESOLUTION_NOTE_REQUIRED";
  field?: "resolutionNote";
  values?: Record<string, string | number>;
};
```

Actions return codes/field associations, not hard-coded English or Arabic. Presentation maps known codes to catalog keys. Unknown errors use one localized safe fallback and preserve technical details only in server logs.

## Dates, numbers and money

Use `next-intl`/`Intl` formatters with the active locale and explicit options. Do not manually assemble date, number, percentage, relative-time or currency strings.

- Persist UTC instants and ISO calendar dates according to 05/07; never persist formatted localized values.
- Display calendar dates in the workspace/user context while preserving their date-only meaning.
- Use the Gregorian calendar consistently in V1 and locale-appropriate digit presentation.
- Parse server-bound values into locale-neutral validated domain values. Never pass formatted numbers into Prisma.
- Money formatting always includes the explicit ISO currency. Never aggregate currencies or infer currency from locale.
- Health deltas are score points, not percentages, in both languages.
- Relative time has an absolute date/time available where precision matters.
- Tests use fixed locale, timezone and clock; they do not depend on the developer machine locale.

## RTL and bidirectional layout

Arabic is a first-class RTL experience, not a mirrored screenshot after feature completion.

- Use CSS logical properties and Tailwind logical utilities: inline start/end and `ms`/`me`, `ps`/`pe`. Avoid directional left/right spacing and positioning unless the concept is physically directional.
- Text aligns to inline start by default. Numeric table columns may use consistent locale-aware alignment when readability requires it.
- Flex/grid order follows semantic DOM order. Do not reverse DOM order solely to imitate RTL when it harms keyboard or screen-reader order.
- Mirror directional navigation icons such as back/forward, chevrons and progression arrows. Do not mirror nondirectional icons, logos, checkmarks, media controls or data trend direction.
- Trend up/down meaning, positive/negative semantics and timeline chronology do not reverse in RTL.
- Mixed user content, emails, URLs, IDs, currency codes and phone numbers must use safe bidirectional isolation (`dir="auto"`, `<bdi>` or equivalent) where needed.
- Tables keep the critical columns and row action accessible in both directions. Drawers, dialogs, popovers, charts and tooltips must anchor correctly from logical sides.
- Focus and screen-reader order follow semantic DOM/read order in both locales. Direction-aware arrow/swipe behavior follows the component's documented keyboard contract without reversing DOM order or business semantics.
- Avoid text in images and fixed widths that fail when Arabic copy expands. Truncation cannot hide the only explanation or action label.

## Navigation and metadata

Use the locale-aware navigation helpers from `src/i18n/navigation.ts`; do not hand-build locale prefixes. Internal links preserve locale automatically. External links are not prefixed.

Page titles, descriptions and accessible metadata are translated. Canonical/hreflang behavior should identify English and Arabic equivalents when public indexable pages exist. Authenticated workspace pages may remain non-indexable; do not add SEO complexity where it has no product value.

## Validation and content fallback

Both locale catalogs are required for a feature to be complete. Development and CI treat missing keys as errors. Production may fall back to English only as a last-resort safety mechanism and must log the missing key without customer data. Never show the raw key to a user.

When a domain record lacks optional data, use the translated explicit missing/unknown state from 09 rather than an English dash with ambiguous meaning. Server validation codes and Zod issue paths remain stable across locales; only presentation text changes.

## Tests and completion gate

For every changed user-facing feature:

- Catalog key/parameter parity passes for `en` and `ar`.
- At least one focused render or browser path runs in each locale.
- Arabic verifies `lang="ar"`, `dir="rtl"`, logical alignment, dialog/drawer anchoring and keyboard order.
- Dates, numbers, currencies, plurals and interpolated variables are asserted in both locales where changed.
- Locale switching preserves the equivalent safe route and persists the preference.
- Missing/unknown/error/validation states contain no untranslated product literals or raw message keys.
- Critical flows run in English; representative UF-01, customer creation and one lifecycle flow run in Arabic. Authorization and persisted outcomes must be identical across locales.

A UI task is not complete when only the English catalog or LTR layout works. Machine-generated translation may be a draft, but release copy requires human Arabic review for meaning, terminology, grammar, truncation and cultural clarity.

## Explicit limits

V1 supports only English and Arabic. It does not include user-authored translation management, per-workspace custom terminology, machine translation, translation of customer-authored content or additional locales. Add another locale only through an explicit scope decision with full catalog, formatting and layout validation.
