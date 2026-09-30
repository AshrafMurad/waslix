# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Waslix is primarily for Customer Success Managers and CS leaders managing B2B customer portfolios day to day. They use it when they need to understand which accounts need attention, coordinate follow-up work, manage renewals, and preserve account context across a team.

## Product Purpose

Waslix is a localized customer success workspace for managing customers, health, onboarding, renewals, risks, tasks, recommendations, analytics, and team collaboration in tenant-scoped workspaces. Success means a CS team can move from portfolio signals to account understanding to accountable work without losing evidence, ownership, history, or workspace isolation.

## Positioning

Waslix's durable position is evidence-to-action customer success: deterministic signals connect customer evidence to explainable health, grouped attention, and next work. It should not present health, renewal risk, attention, or recommendations as opaque AI guesses or fabricated probability claims.

## Operating Context

Waslix supports workspace-scoped portfolios with fixed roles: Admin, CS Manager, CSM, and Viewer. Users manage customer records, contacts, lifecycle stages, tasks, activities, health inputs and history, risks, onboarding milestones, renewal cycles, recommendations, playbooks, imports, search, and analytics from localized English and Arabic routes.

The product treats account history, audit events, ownership, health evidence, renewal readiness, and action state as operational records. Customer success work remains explicit and user-controlled; lifecycle changes, renewal outcomes, risk resolution, action acceptance, and external communication are not silently inferred.

## Capabilities and Constraints

V1 scope is strict: deterministic customer health, attention, renewals, onboarding, tasks, workspace roles, recommendations, playbooks, import/search, analytics, English/Arabic localization, and tenant isolation. Future work should not add speculative live integrations, AI-authored claims, automatic external outreach, automatic lifecycle transitions, or unsupported revenue metrics without an explicit scope decision.

Protected reads and writes require authentication, ACTIVE workspace membership, role capability, and object/workspace authorization. Persistence, search, jobs, related lookups, imports, analytics, and history are scoped by workspace. Client-provided workspace, owner, and customer IDs are untrusted.

Health is explainable and deterministic. Missing inputs remain missing rather than zero. Health scores, freshness, confidence, readiness, recommendations, and attention must expose their evidence and limitations.

English and Arabic are first-class V1 product requirements. Routes are locale-prefixed with `en` and `ar`; Arabic uses RTL layout. Product UI copy lives in versioned catalogs with parity across locales.

## Brand Commitments

The confirmed product name is Waslix. The durable voice is clear, factual, operational, and evidence-backed. Future work must not fabricate customers, testimonials, benchmarks, pricing, integrations, press, or revenue claims.

## Evidence on Hand

Repository evidence includes:

- `README.md`: localized Next.js App Router application with PostgreSQL, Prisma, Better Auth, fixed workspace roles, and tenant isolation.
- `docs/05-BUSINESS-RULES.md`: workspace access, health, signals, attention, tasks, recommendations, renewals, onboarding, playbooks, audit, import, and analytics rules.
- `docs/11-IMPLEMENTATION-PLAN.md`: V1 milestone scope from foundation through release.
- `docs/17-INTERNATIONALIZATION.md`: English/Arabic locale, routing, copy, formatting, and RTL requirements.
- `messages/en/marketing.json`: public positioning around customer health, onboarding, risks, tasks, renewals, signals, and next action.

No real customer testimonials, case studies, production usage metrics, pricing, external integration contracts, press quotes, or certification claims are confirmed in the repository.

## Product Principles

1. Turn evidence into accountable work, not another dashboard to monitor.
2. Keep customer health, risk, attention, and renewal readiness explainable and reproducible.
3. Preserve workspace isolation, authorization, ownership, audit history, and idempotency before convenience.
4. Treat English and Arabic as equal product surfaces.
5. Stay within the confirmed V1 scope unless a future task explicitly expands it.

## Accessibility & Inclusion

Waslix must support English LTR and Arabic RTL users with equivalent functionality, catalog parity, accessible focus behavior, keyboard operation, readable data tables, explicit missing states, and WCAG 2.2 AA-oriented UI decisions.
