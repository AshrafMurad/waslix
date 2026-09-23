# 09 · Design system

## Direction from the conversation

Enterprise clarity with a distinct Waslix identity. Calm, clear, contextual and actionable. Use shadcn cards, tables and charts. Information density should support daily CS work without crowding.

The system supports English/LTR and Arabic/RTL as equal V1 surfaces. Components use logical start/end layout, locale-aware type/number behavior and expansion-safe labels. Direction changes placement, not business meaning, trend direction or chronological order; 17 owns the full contract.

The user's latest corrections are authoritative: neutral backgrounds behind the four summary cards; no intense priority backgrounds; stronger semantic text with a faint tint or no tint; one identity-colored initial/avatar background with white letters; identity color for task check circles; consistent padding, heights, gaps and typography. Health includes up/down direction and delta.

Do not use gradients, glow, blur, glass effects, oversized KPI tiles, rainbow cards, random icon colors or oversized corner radii. No generated mockup is included; written feedback is the source.

## Proposed tokens — pack defaults

These values are implementation starting points, not sampled from an approved image. Keep them as semantic CSS variables and validate contrast in the implemented components.

| Token             | Dark    | Light   |
| ----------------- | ------- | ------- |
| Background        | #0A0A0A | #FAFAFA |
| Surface           | #111111 | #FFFFFF |
| Raised surface    | #181818 | #F4F4F5 |
| Border            | #303030 | #D4D4D8 |
| Text              | #FAFAFA | #18181B |
| Muted text        | #A1A1AA | #52525B |
| Brand solid       | #0F766E | #0F766E |
| Brand text/accent | #5EEAD4 | #0F766E |
| Healthy text      | #86EFAC | #166534 |
| Attention text    | #FCD34D | #92400E |
| Risk text         | #FCA5A5 | #B91C1C |
| Information text  | #93C5FD | #1D4ED8 |

Brand is identity/interaction; semantic green means healthy. Do not conflate them. Use white initials on the solid brand color. Test actual color pairs, including opacity-composited badges, at normal/hover/focus/disabled states.

Spacing scale: 4/8/12/16/24/32 px. Card padding 16–24; section gap 24; table cell horizontal padding 12–16. Consistent rows 48–56 high. Controls generally 36–40 high; icon-only hit area at least 40 and touch layouts 44. Border 1 px; radius 6–8 px for panels/controls. Avoid per-screen token overrides.

Typography: one readable sans-serif family using available application font configuration. Body/table 14 px; supporting labels 12–13; section headings 16–18; page titles 24; metrics 28–32. Default weight 400, key values 500–600. Tabular numerals for scores, money and dates. Do not solve hierarchy by making every line bold.

## Signature components

| Component       | Contract                                                                        |
| --------------- | ------------------------------------------------------------------------------- |
| HealthIndicator | Score, status text/dot, direction/delta and time window; unknown state distinct |
| AttentionRow    | Customer, grouped reasons, priority, owner, contextual action                   |
| SignalStack     | Structured fact/source/age; concise positive and negative facts                 |
| CustomerHeader  | Same account identity, summary facts and primary actions on all tabs            |
| TimelineEntry   | Human avatar versus system icon; actor/time/details consistent                  |

Priority uses text/icon and at most a subtle tint. Always include a label; color alone is insufficient. Trend displays signed points with window, e.g. “↓ 14 points · 30 days.” Do not label score points as percentages.

## Page composition

Overview: compact title/context, four neutral summary cards, visually dominant Attention Queue, then My Tasks and Upcoming Renewals with restrained portfolio health. Keep metric-card heights and internal spacing equal. Customer placeholders and renewal avatars use the same brand treatment.

Customers/Tasks/Risks/Renewals: table first, shared toolbar, readable columns, subtle separators, predictable row action placement. Numeric columns align consistently. Do not replace portfolio tables with large card grids.

Customer 360: compact persistent account context; clearly selected tab; situation and next action precede secondary details. Health charts use one main identity line, semantic series only when meaningful, labeled axes/tooltips and a textual summary.

## Interaction and accessibility

Keyboard-accessible dialogs/drawers trap focus while open, close predictably, and return focus to the trigger. Inputs have labels and inline errors. Icon actions have accessible names. Use native or shadcn primitives rather than reimplementing focus behavior.

Show an explicit pending state; preserve user inputs on validation errors. Optimistic completion rolls back visibly if saving fails. Destructive/archive actions explain the record consequence. Disable unavailable mutations and keep the server authoritative.

Visible focus, WCAG 2.2 AA text/non-text contrast, keyboard table controls and reduced-motion support are required. Normal text targets at least 4.5:1, large text 3:1, and interactive/component boundaries 3:1 against adjacent colors. Tooltips supplement labels. Charts need readable text equivalents; live status changes should be announced without noisy repeated alerts.

Follow the operating-system theme on first visit and persist an explicit user choice. Both themes have identical semantics and component structure. Customer health uses a 30-day trend by default on Overview/list/header surfaces; the Health screen defaults to 90 days and offers 7/30/90 comparisons. Always print the active window next to a delta.

## Responsive behavior and visual checks

Desktop: persistent compact sidebar on the logical start side and medium-density tables. Narrow widths: collapsible sidebar, stacked secondary sections and controlled horizontal table scroll; no clipped primary actions. Verify English/LTR and Arabic/RTL at roughly 1440, 1024 and 390 px wide (pack QA sizes).

Review six priority screens: Overview, Customers, Customer Overview, Health, Timeline and Renewal. Inspect both locales/directions and themes, realistic long names, expanded Arabic labels, mixed-direction customer content, null data, empty/error states, high priority rows and populated charts. Reuse shared components before tuning pages individually.
