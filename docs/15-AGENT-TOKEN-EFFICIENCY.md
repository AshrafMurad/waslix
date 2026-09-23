# 15 · Agent/token-efficiency rules

Use less context and fewer redundant operations while preserving correctness.

## Default execution budget

Classify the request before using tools:

| Task size                                | Default workflow                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Small/local documentation or code change | One batched read/search → one edit pass → one targeted verification; no todo list or subagent                                        |
| Standard feature within one module       | Short plan, progressive context, focused edits and relevant checks; at most one independent subagent only when it clearly saves work |
| Broad cross-domain/repository task       | Structured task list and explicitly separated investigations; ask before expanding beyond the requested outcome                      |

These are defaults, not permission to skip correctness. Exceed them only when a concrete failure, conflict or invariant requires more work. State the reason once; do not silently turn a local request into a repository audit.

1. **Bound the task.** State one outcome, affected module and acceptance checks. Complete that scope; do not expand into adjacent features.
2. **Load context progressively.** Read root AGENTS.md, current canonical M task and only relevant rule/schema/UI sections. Use the routing table in 13. Do not preload all docs or conversation history.
3. **Search before reading.** Find filenames/symbols with scoped search, then inspect bounded ranges and direct callers/tests. Avoid recursive dumps, whole-repository reads and repeated unchanged files.
4. **Reuse known evidence.** Keep a short working note of decisions and paths. Re-read only after edits, conflicting evidence or a concrete missing dependency.
5. **Batch independent reads.** Combine related searches/status checks. Keep dependent edits, migrations and verification sequential. Limit output to what supports the next decision.
6. **Use targeted tools.** Prefer direct file/API tools over screenshots or browser exploration when appropriate. Avoid polling unchanged jobs; wait for meaningful state changes.
7. **Keep dependencies stable.** Inspect manifest/lockfile first. Reuse the existing stack. Add a package only for a concrete unmet need with justification; avoid speculative installs, upgrades and lockfile churn.
8. **Edit narrowly.** Preserve unrelated changes. No broad formatting, renaming, abstraction or architecture rewrite for a local feature.
9. **Validate proportionately.** Run focused business/permission/retry tests plus required checks. Broaden when failures or shared-boundary changes justify it. Do not rerun passing suites without new evidence.
10. **Never economize on invariants.** Workspace isolation, authorization, history, transactions, idempotency and truthful verification remain mandatory. Token savings cannot justify skipped required checks.
11. **Use bounded sessions.** One major feature or canonical task per session; finish a coherent slice. Handoff outcome, paths, actual checks, decisions and next dependency instead of repeating the full plan.
12. **Communicate once per finding.** Short updates for meaningful discoveries/blockers; concise final outcome and validation. Do not repeat explanations, paste entire files or narrate routine commands.
13. **Consult external docs selectively.** Only for an unresolved API/version detail; use official version-matched sources. Do not repeatedly research choices already established in the repository.
14. **Avoid redundant agents.** Use parallel agents only when authorized and independent work justifies them; assign distinct scopes and avoid duplicated context/reviews.
15. **One verification cycle by default.** After editing, run the smallest check that can disprove the change. If it passes and no conflicting evidence remains, stop. Do not request another general review “for confidence.”
16. **Do not convert fixes into audits.** Correct directly observed adjacent inconsistencies only when they block the requested outcome. Record unrelated discoveries for the handoff instead of investigating or fixing them.
17. **Prefer decisive edits.** Resolve the owning contract once, update only required references and verify stale terms with a scoped search. Avoid repeated edit/search loops for wording polish.
18. **Limit status overhead.** Use no progress update for trivial work and at most one meaningful update before a small edit. Do not narrate reads, searches or routine checks.

**Stop condition:** requested outcome and necessary checks complete, changed files reviewed once, and relevant decision documentation updated. Return the concise handoff immediately; do not continue polishing, auditing or seeking extra confirmation.

**If blocked:** name the exact missing fact or failure, retain completed work, and request only the information needed. Never guess approval, claim unrun checks passed, or silently reduce scope.
