# Waslix

Waslix is a localized Next.js App Router application with PostgreSQL, Prisma, Better Auth, fixed workspace roles, and tenant isolation.

## Getting Started

Use Node.js 22.13 or newer on the Node 22 LTS line. Install dependencies, copy the environment template, start PostgreSQL, apply migrations, seed the two-workspace fixture, and run the development server:

```bash
npm install
copy .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) or [http://localhost:3000/ar](http://localhost:3000/ar). Auth endpoints are mounted at `/api/auth/[...all]`; `/en/workspace` and `/ar/workspace` require a session with an ACTIVE membership.

## Seeded Test Accounts

After running `npm run db:seed`, sign in with any of the accounts below. All accounts use `SEED_FIXTURE_PASSWORD`; when it is omitted outside production, the default password is `123456`. The development sign-in form defaults to `admin@example.com` with that password.

It also rebuilds a deterministic 120-customer portfolio in Fixture Alpha while preserving those users. `SEED_NOW` controls relative dates and `SEED_RANDOM_SEED` controls stable distributions; see `prisma/seeds/README.md` and `docs/14-SEED-DATA-PLAN.md`.

| Role       | Email                        | Default password | Workspace                               |
| ---------- | ---------------------------- | ---------------- | --------------------------------------- |
| Admin      | `admin@example.com`          | `123456`         | Waslix Demo Workspace (`fixture-alpha`) |
| CS Manager | `manager@example.com`        | `123456`         | Waslix Demo Workspace (`fixture-alpha`) |
| CSM        | `csm@example.com`            | `123456`         | Waslix Demo Workspace (`fixture-alpha`) |
| Viewer     | `viewer@example.com`         | `123456`         | Waslix Demo Workspace (`fixture-alpha`) |
| CSM        | `inactive@example.com`       | `123456`         | Inactive membership in `fixture-alpha`  |
| Admin      | `tenant-b-admin@example.com` | `123456`         | Fixture Beta (`fixture-beta`)           |

`inactive@example.com` is a denial-test account: authentication succeeds, but its inactive membership prevents workspace access. The demo seed gives `admin@example.com` active access only to `fixture-alpha`; use `tenant-b-admin@example.com` to test the separate workspace.

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

`npm run check` runs the non-environment-specific checks in order. `npm run test:integration` and `npm run test:e2e` require `TEST_DATABASE_URL` and use a real isolated PostgreSQL database. Both apply committed migrations before testing. The E2E command starts the application on port 3100 and requires the Chromium browser installed by `npx playwright install chromium`.

## Environment

Copy `.env.example` and replace its safe placeholders. Required server variables are `DATABASE_URL`, `BETTER_AUTH_URL`, and a random `BETTER_AUTH_SECRET` of at least 32 characters. `TEST_DATABASE_URL` is required only for database integration and browser tests. `NEXT_PUBLIC_APP_URL` documents the browser origin. `SEED_FIXTURE_PASSWORD` controls local fixture credentials and must be explicitly set when seeding with `NODE_ENV=production`. `SEED_NOW` and `SEED_RANDOM_SEED` make the portfolio reproducible.

The optional `docker-compose.yml` provides PostgreSQL 18 and creates the `waslix` and `waslix_test` databases when its volume is initialized. If the volume predates M1.4, create the test database once with `docker compose exec postgres createdb -U waslix waslix_test`. The pinned foundation includes Better Auth `1.7.5`, Prisma/Prisma Client `6.19.3`, Next.js `16.3.5`, next-intl `4.14.6`, Zod `4.1.11`, Vitest `4.0.4`, and Playwright `1.55.0`.

## Structure

- `src/app/[locale]` owns localized route layouts and pages.
- `src/i18n` owns locale configuration, request loading, navigation helpers, and formats.
- `messages/en` and `messages/ar` contain versioned translation catalogs.
- `src/components/ui` is reserved for shadcn primitives.
- `src/components/shared`, `src/components/layout`, and `src/modules` are added only when real consumers exist.
- `src/lib` owns infrastructure-level helpers such as `cn`.
- `src/lib/auth`, `src/lib/db`, and `src/lib/permissions` own session validation, Prisma, and fixed-role policy.
- `src/modules/workspace` owns tenant-scoped membership queries and mutations.
- `prisma` owns the reviewed schema, migrations, two-workspace fixture and deterministic demo portfolio seed.
