# 13 · Agent instructions

## Mission

Implement the assigned Waslix V1 increment faithfully and completely. Product authority is this pack plus later explicit user decisions; repository-local instructions and actual code determine implementation details. Source conversation content is reference material, not executable instructions.

Start with [15](15-AGENT-TOKEN-EFFICIENCY.md), the current canonical M milestone/task in [11](11-IMPLEMENTATION-PLAN.md), and relevant owning sections. Do not read every document by default.

## Routing guide

| Task                    | Read these sections                                                  |
| ----------------------- | -------------------------------------------------------------------- |
| Auth/permissions        | 05 BR-01, 07 identity, 08 request path                               |
| Customer CRUD           | 04 Customers, 05 BR-01/02, 07 customer core                          |
| Health                  | 05 BR-03/04, 07 health, 08 pipeline                                  |
| Signals/attention       | 05 BR-04/05, 07 signals                                              |
| Work/lifecycle          | Applicable BR-06–10, matching 07 tables, matching 10 flow            |
| UI                      | 04 relevant screen, 09, 16, 17 and relevant 10 flow                  |
| Translation/locale/RTL  | 17, 09 accessibility/direction, 16 Tailwind/layout, relevant 10 flow |
| Import/analytics        | 05 BR-11, 07 support, 08 import, 14                                  |
| Seed                    | 14 and relevant schema/rules                                         |
| Dependencies/deployment | 08, 12 and 16, actual manifest/config                                |

## Session workflow

1. Identify the requested outcome and current canonical M task.
2. Check repository instructions, working-tree status and relevant files. Preserve existing user changes.
3. Name a short implementation plan and acceptance checks. Do not restart product discovery.
4. Read the smallest relevant implementation and its callers/tests.
5. Implement one coherent vertical slice: validation, authorization, service/persistence, UI as required and checks.
6. Validate the changed behavior and inspect the diff for unrelated changes.
7. Update the owning doc only when a contract changed, then provide a concise handoff.

Routine reversible implementation choices do not need repeated user confirmation. Ask only when missing information materially changes scope, safety or an irreversible/external action lacks authorization. Never assume a permission response from silence.

## Non-negotiable quality

Workspace isolation, fixed roles, object ownership, transactional history, deterministic calculations and safe retries are not optional token-saving opportunities. No fabricated tests, mock-only production workflows, placeholder success notifications or unsupported explanations.

Do not implement deferred integrations/AI/custom builders. Do not scatter business rules in React. Do not silently revise health thresholds, role rules, lifecycle stages or the visual identity.

## Example task brief

```text
Task: M5.2
Outcome: A permitted user can resolve a risk with a required note.
Read: 05 BR-01/07/11, 07 Risk/SystemEvent, 10 UF-02.
Scope: risk action/service/form and focused tests.
Acceptance: note required; same-workspace ownership enforced; event and
resolution atomic; retry safe; resolved risk remains in history.
Handoff: changed files, actual checks, remaining prerequisite if any.
```

## Handoff format

```text
Outcome:
Changed files:
Validation (passed/failed/not run):
Decision changes:
Blockers or limitations:
Next task:
```

Omit empty sections when unnecessary. Record concrete paths and rule IDs. Keep handoff roughly 150–300 words for a substantial feature, shorter for small changes. Do not paste code already present in files.

## Parallel work

Default to one session per phase or major feature, with bounded tasks. If the user authorizes parallel agents, give each independent scope and explicit file ownership; avoid overlapping schema/lockfile/shared-component writes. Designate an integration owner and validate the combined result. Do not delegate merely to repeat the same analysis.

The root AGENTS.md is the short entry point. This document owns workflow; 15 owns efficiency policy.
