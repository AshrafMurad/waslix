# Demo seed

Run `npm run db:seed` to rebuild customer-side demo data in `fixture-alpha`. Existing users and memberships are retained. `SEED_NOW` and `SEED_RANDOM_SEED` control the reproducible clock and distributions.

Customer identities and named scenarios live in `data/customer-names.ts`. Distribution logic lives in `profiles.ts`; persistence and reconciliation live in `portfolio.ts`. Add scenario assertions to `profiles.test.ts` whenever those contracts change.
