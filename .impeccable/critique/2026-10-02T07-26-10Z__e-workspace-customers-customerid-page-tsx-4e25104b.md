---
target: dashboard client profiles
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\ashra\\OneDrive\\Desktop\\waslix\\src\\app\\[locale]\\(workspace)\\customers\\[customerId]\\page.tsx"
target_fingerprint: "sha256:16fb474584bee7f7495999b4a14eded0be7dae4a7c04f2f4c69c62a84d8de07e"
target_path: "C:\\Users\\ashra\\OneDrive\\Desktop\\waslix\\src\\app\\[locale]\\(workspace)\\customers\\[customerId]\\page.tsx"
timestamp: 2026-10-02T07-26-10Z
slug: e-workspace-customers-customerid-page-tsx-4e25104b
---
# Customer 360 Profile Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Health freshness/trend is absent; unavailable next actions can disappear. |
| 2 | Match System / Real World | 3 | CSM terminology is strong, but some copy describes implementation rather than account state. |
| 3 | User Control and Freedom | 2 | Quick actions are available, but administration competes with operational work. |
| 4 | Consistency and Standards | 3 | Shared patterns are consistent; the persistent shell is not compact enough. |
| 5 | Error Prevention | 2 | Archive consequences are explained, but not all safeguards are visible from this surface. |
| 6 | Recognition Rather Than Recall | 2 | Users must gather evidence across several tabs before deciding. |
| 7 | Flexibility and Efficiency | 1 | Eight-tab serial navigation has few visible expert accelerators. |
| 8 | Aesthetic and Minimalist Design | 2 | Repeated health and equal-weight cards dilute the primary decision. |
| 9 | Error Recovery | 2 | Recommendation failure copy does not provide actionable recovery. |
| 10 | Help and Documentation | 1 | Confidence, freshness, and recommendation behavior lack contextual explanation. |
| **Total** | | **20/40** | **Acceptable foundation; significant hierarchy and synthesis improvements needed.** |

## Design Specificity Verdict

The content is product-specific, but the composition is category-interchangeable. Account identity, health, evidence, goals, renewal, and ownership fit customer success, while the avatar, outline actions, five equal fact cards, eight tabs, and two-column card stack could belong to almost any enterprise CRM. The missing authored sequence is: what changed, why it matters, what should happen next, and who owns it.

The deterministic detector returned zero findings across the layout, overview, tabs, and header-action components. Browser evidence confirmed successful rendering at 1440x1000 and 390x844 with no document-level horizontal overflow. No visual overlay was injected because the scan produced no findings.

## Overall Impression

This is a stable, restrained foundation with strong localization and semantic discipline. Its biggest opportunity is to turn a customer record into a pre-call decision brief: the current page presents facts and destinations, but does not synthesize the account's situation.

## What's Working

- Persistent identity, owner, lifecycle, contract, renewal, primary contact, and health preserve account context across tabs.
- Health state uses text as well as semantic color, and unknown health remains explicit rather than becoming a misleading zero.
- Locale-aware formatting, bidi isolation, English/Arabic catalog parity, standard dialogs, and responsive rendering form a strong implementation baseline.

## Priority Issues

### P1: The overview does not answer “What is happening now?”

**Why it matters:** The dominant panel repeats health and links elsewhere instead of surfacing active risk, overdue work, renewal readiness, recent interaction, and their operational implication. A CSM must inspect multiple tabs before acting.

**Fix:** Replace the generic situation panel with a compact brief containing the two to four most consequential evidence items, source/age, implication, owner, and direct action.

**Suggested command:** `$impeccable shape`

### P1: Required 30-day health movement is missing

**Why it matters:** A score without direction, delta, window, or freshness cannot support rapid triage and violates the Customer 360 contract.

**Fix:** Use a shared health indicator showing score, labeled status, signed point delta, direction, “30 days,” calculation time, and explicit unknown/stale states.

**Suggested command:** `$impeccable clarify`

### P1: Evidence-to-action hierarchy is reversed

**Why it matters:** The generic situation card receives the dominant column while the actual next action shares a narrow rail with editing and archive administration.

**Fix:** Lead with a full-width situation-and-next-action band that visibly connects recommendation, evidence, owner, and due date. Move edit/archive into quiet account administration.

**Suggested command:** `$impeccable layout`

### P2: The persistent header creates too much context tax

**Why it matters:** Three actions, five cards, and eight tabs precede every tab's content. Horizontal tabs technically fit through scrolling, but lack an overflow cue and use 40px targets rather than the documented 44px mobile target.

**Fix:** Turn the five cards into a dense context rail, collapse creation actions behind one labeled control on narrow screens, add tab overflow affordance, and increase touch targets.

**Suggested command:** `$impeccable adapt`

### P2: Empty and failure states are ambiguous

**Why it matters:** A null next-action result can render nothing, while an empty list does not distinguish a healthy account from insufficient evidence or unavailable analysis. Implementation-oriented placeholder copy weakens trust.

**Fix:** Distinguish unavailable, insufficient evidence, no action needed, and no active recommendation. Give each state a reason, recovery path, or next step.

**Suggested command:** `$impeccable harden`

## Persona Red Flags

**Alex, power user:** Fast creation actions help, but eight-tab serial inspection prevents a complete account scan in under a minute. No visible account-level accelerator offsets the repeated navigation.

**Sam, accessibility-dependent user:** Semantic navigation and standard dialog primitives are good. Risks include a horizontally scrolling tab list without an overflow cue, 40px tab targets, truncated persistent values without an obvious reveal, and substantial vertical traversal at zoom.

**Maha, portfolio CSM preparing for a call:** Identity and static facts are visible, but health movement, active risk, recent interaction, and renewal readiness are not synthesized. The page forces tab-hopping when she needs a concise briefing.

## Minor Observations

- The account title is visually expensive for a persistent enterprise shell.
- Primary contact occupies persistent summary space while the contractually required health trend is absent.
- Explicit currency codes and localized Gregorian dates are correct and reduce ambiguity.
- Archive leaves a destructive emotional endpoint on an otherwise operational surface.

## Questions to Consider

- What if the first viewport read like a pre-call brief: “health fell 9 points, renewal in 42 days, one unmanaged risk, next owner action due tomorrow”?
- If a CSM had only 15 seconds, should the duplicated health summary or the evidence-backed next action earn the largest area?
- Should archive remain visually available beside daily work, or move into deliberately quiet account administration?
