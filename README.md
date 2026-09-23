# Waslix

Waslix is a Next.js App Router project. M1.1 establishes the repository foundation only: locale-prefixed routing, English/Arabic message catalogs, Tailwind, shadcn configuration, linting, formatting, and baseline checks.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) or [http://localhost:3000/ar](http://localhost:3000/ar). Requests without a locale prefix redirect to the default locale.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run i18n:check
npm run test
npm run build
```

`npm run check` runs the non-environment-specific foundation checks in order. Integration and e2e scripts exist as explicit placeholders until the later Sprint 0 testing task configures those suites.

## Environment

Copy `.env.example` only when local overrides are needed. M1.1 has no required secrets.

## Structure

- `src/app/[locale]` owns localized route layouts and pages.
- `src/i18n` owns locale configuration, request loading, navigation helpers, and formats.
- `messages/en` and `messages/ar` contain versioned translation catalogs.
- `src/components/ui` is reserved for shadcn primitives.
- `src/components/shared`, `src/components/layout`, and `src/modules` are added only when real consumers exist.
- `src/lib` owns infrastructure-level helpers such as `cn`.

Authentication, database models, workspace behavior, and customer success features are intentionally out of scope for M1.1.
