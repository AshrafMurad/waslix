# Waslix

Waslix is a Next.js App Router project. M1.2 adds the PostgreSQL, Prisma, Better Auth, workspace-membership, fixed-role authorization, and tenant-isolation foundation.

## Getting Started

Install dependencies, start PostgreSQL, apply the migration, and run the development server:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) or [http://localhost:3000/ar](http://localhost:3000/ar). Auth endpoints are mounted at `/api/auth/[...all]`; `/en/workspace` and `/ar/workspace` require a session with an ACTIVE membership.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run i18n:check
npm run test
npm run test:integration
npm run build
```

`npm run check` runs the non-environment-specific checks in order. `npm run test:integration` requires `TEST_DATABASE_URL`, applies committed migrations to that database, then runs real Better Auth and two-tenant PostgreSQL tests. Browser e2e remains a later foundation task.

## Environment

Copy `.env.example` and replace its safe placeholders. Required variables are `DATABASE_URL`, `BETTER_AUTH_URL`, and a random `BETTER_AUTH_SECRET` of at least 32 characters. `TEST_DATABASE_URL` is required only for integration tests. `NEXT_PUBLIC_APP_URL` documents the browser origin.

The optional `docker-compose.yml` provides PostgreSQL 18 for local development. The pinned M1.2 boundary is Better Auth `1.7.5`, Prisma/Prisma Client `6.19.3`, Next.js `16.3.5`, next-intl `4.14.6`, Zod `4.1.11`, and Vitest `4.0.4`. Prisma 6 is intentional because the current repository runtime is Node `23.11.1`, which is outside Prisma 7's supported engine range.

## Structure

- `src/app/[locale]` owns localized route layouts and pages.
- `src/i18n` owns locale configuration, request loading, navigation helpers, and formats.
- `messages/en` and `messages/ar` contain versioned translation catalogs.
- `src/components/ui` is reserved for shadcn primitives.
- `src/components/shared`, `src/components/layout`, and `src/modules` are added only when real consumers exist.
- `src/lib` owns infrastructure-level helpers such as `cn`.
- `src/lib/auth`, `src/lib/db`, and `src/lib/permissions` own session validation, Prisma, and fixed-role policy.
- `src/modules/workspace` owns tenant-scoped membership queries and mutations.
- `prisma` owns the reviewed schema, migration, and two-workspace fixture seed.

Customers, contacts, tasks, health, risks, and all other product-domain models remain intentionally out of scope for M1.2.
