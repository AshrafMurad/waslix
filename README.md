<div align="center">
  <img src="public/logo.png" alt="Waslix logo" width="96" />

# Waslix

**Know which customers need you before they tell you.**

An evidence-to-action workspace for modern Customer Success teams.

English and Arabic · LTR and RTL · Light and dark mode
</div>

![Waslix customer success workspace](public/images/hero-section-image-light.png)

## About

Waslix brings customer health, onboarding, renewals, risks, tasks, and team context into one workspace. It turns account evidence into explainable priorities and owned next actions, without relying on opaque scores or disconnected dashboards.

Built for both English and Arabic teams, Waslix provides first-class LTR and RTL experiences with strict workspace isolation and role-based access.

## Highlights

- **Unified customer view** with contacts, lifecycle, goals, timeline, tasks, risks, and renewal context
- **Explainable health scoring** based on weighted evidence, freshness, confidence, and historical snapshots
- **Attention queue** that groups meaningful signals and shows why an account needs action
- **Onboarding and renewals** with milestones, readiness, windows, and explicit outcomes
- **Recommendations and playbooks** that convert evidence into accountable work
- **Portfolio analytics, search, and CSV import** for day-to-day operations at scale
- **Team workspaces** with Admin, CS Manager, CSM, and Viewer roles
- **English and Arabic localization** with locale-prefixed routes and complete RTL support

## Tech Stack

| Area            | Technology                         |
| --------------- | ---------------------------------- |
| Application     | Next.js 16, React 19, TypeScript   |
| UI              | Tailwind CSS 4, Radix UI, Recharts |
| Data            | PostgreSQL, Prisma                 |
| Authentication  | Better Auth                        |
| Localization    | next-intl                          |
| Background jobs | pg-boss                            |
| Testing         | Vitest, Playwright                 |
| Deployment      | Docker                             |

## Getting Started

### Prerequisites

- Node.js 22.13 or newer on the Node 22 LTS line
- Docker with Docker Compose
- npm

### Local setup

```bash
git clone https://github.com/AshrafMurad/waslix.git
cd waslix
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Open [http://localhost:3000/en](http://localhost:3000/en) for English or [http://localhost:3000/ar](http://localhost:3000/ar) for Arabic. The seed command creates a deterministic demo workspace; its local credentials are configured through `SEED_FIXTURE_PASSWORD` in `.env`.

## Environment

Start from `.env.example` and replace its development placeholders before deploying.

| Variable                | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `DATABASE_URL`          | PostgreSQL connection used by the application          |
| `BETTER_AUTH_URL`       | Canonical authentication origin                        |
| `BETTER_AUTH_SECRET`    | Random authentication secret of at least 32 characters |
| `NEXT_PUBLIC_APP_URL`   | Public browser origin                                  |
| `TEST_DATABASE_URL`     | Isolated database for integration and E2E tests        |
| `SEED_FIXTURE_PASSWORD` | Password assigned to local seeded accounts             |

## Commands

| Command                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `npm run dev`              | Start the development server                         |
| `npm run build`            | Create a production build                            |
| `npm run db:migrate`       | Apply committed database migrations                  |
| `npm run db:seed`          | Rebuild deterministic demo data                      |
| `npm run worker:start`     | Start the background health worker                   |
| `npm run check`            | Run formatting, linting, types, i18n, and unit tests |
| `npm run test:integration` | Run PostgreSQL integration tests                     |
| `npm run test:e2e`         | Run Playwright browser tests                         |

Integration and browser tests require `TEST_DATABASE_URL`. Install the Playwright browser once with `npx playwright install chromium` before running E2E tests.

## Project Structure

```text
src/app/[locale]   Localized public and workspace routes
src/components     Shared UI, layout, and marketing components
src/modules        Domain features, services, queries, and actions
src/lib            Authentication, database, jobs, and permissions
src/worker         Background job entry points
messages           English and Arabic translation catalogs
prisma             Schema, migrations, and deterministic seed data
tests              Unit, integration, and browser tests
```

## Security Model

Every protected operation requires an authenticated user, an active workspace membership, the appropriate role capability, and access to the requested object. Database queries, jobs, search, imports, analytics, and history are scoped to the active workspace.

## Production

The repository includes `Dockerfile` and `docker-compose.production.yml` for running the web application, worker, and PostgreSQL services. Set production secrets outside source control, apply migrations before serving traffic, and run the deployment smoke check with `npm run smoke:deployment`.
