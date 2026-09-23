# Waslix agent entry point

1. Read [token-efficiency rules](docs/15-AGENT-TOKEN-EFFICIENCY.md) and the relevant milestone/task in [implementation plan](docs/11-IMPLEMENTATION-PLAN.md); load only task-relevant sections after that.
2. Use [business rules](docs/05-BUSINESS-RULES.md) for behavior, [schema](docs/07-DATABASE-SCHEMA.md) for persistence, [architecture](docs/08-SYSTEM-ARCHITECTURE.md) for boundaries, [design system](docs/09-DESIGN-SYSTEM.md) for UI, [code organization](docs/16-CODE-ORGANIZATION.md) for placement/Tailwind and [internationalization](docs/17-INTERNATIONALIZATION.md) for English/Arabic behavior.
3. Follow [coding standards](docs/12-CODING-STANDARDS.md) and [agent workflow](docs/13-AGENT-INSTRUCTIONS.md). Keep work within the assigned canonical M task.
4. Authenticate, verify ACTIVE workspace membership and authorize capability/object before every protected read or write. Scope persistence, search, jobs and related lookups by workspace.
5. Preserve unrelated changes. Do not implement deferred scope, weaken invariants, fabricate checks or claim unrun validation passed.
6. End with changed paths, checks actually run, decision changes, blockers and the next dependency.

## Efficiency default

- For a small/local task: one batched context read, one edit pass and one targeted verification pass. Do not create a task list or use a subagent.
- Do not reread unchanged files, repeat a passing audit or broaden the request to adjacent documentation/code unless new evidence requires it.
- Use subagents only for independent complex work that cannot be resolved efficiently with direct search/read tools. Never delegate a second review of work already verified.
- If investigation reveals materially larger scope, stop and ask before expanding. Otherwise finish the requested outcome and stop immediately when its acceptance checks pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
