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

The local seed provisions the fixture users below as Better Auth credential accounts. They use `SEED_FIXTURE_PASSWORD`; when it is omitted outside production, the local-only fallback is `admin123`. The development sign-in form defaults to the admin credentials.

| Role                                           | Email                              |
| ---------------------------------------------- | ---------------------------------- |
| Admin in Fixture Alpha, Viewer in Fixture Beta | `admin@example.com`                |
| CS Manager                                     | `manager@fixture.waslix.test`      |
| CSM                                            | `csm@fixture.waslix.test`          |
| Viewer                                         | `viewer@fixture.waslix.test`       |
| Inactive-member denial fixture                 | `inactive@fixture.waslix.test`     |
| Fixture Beta Admin                             | `tenantBAdmin@fixture.waslix.test` |

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

Copy `.env.example` and replace its safe placeholders. Required server variables are `DATABASE_URL`, `BETTER_AUTH_URL`, and a random `BETTER_AUTH_SECRET` of at least 32 characters. `TEST_DATABASE_URL` is required only for database integration and browser tests. `NEXT_PUBLIC_APP_URL` documents the browser origin. `SEED_FIXTURE_PASSWORD` controls local fixture credentials and must be explicitly set when seeding with `NODE_ENV=production`.

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
- `prisma` owns the reviewed schema, migration, and two-workspace fixture seed.

Customers, contacts, tasks, health, risks, and all other product-domain models remain intentionally out of scope for M1.
