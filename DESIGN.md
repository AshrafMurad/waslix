---
name: Waslix
description: Evidence-to-action customer success, rendered as a precision operating system.
colors:
  brand-solid: "#0f766e"
  brand-light: "#4fb7ac"
  marketing-ground: "#060807"
  marketing-surface: "#0d100f"
  marketing-raised: "#141816"
  marketing-text: "#f1f5f4"
  marketing-muted: "#9ba5a2"
  healthy: "#77c99a"
  attention: "#d6a94a"
  risk: "#e08b8b"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(3.6rem, 7.2vw, 6rem)"
    fontWeight: 650
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.67rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  control: "0.35rem"
  panel: "0.5rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  marketing-button-primary:
    backgroundColor: "{colors.brand-solid}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 1.15rem"
    height: "3rem"
  marketing-panel:
    backgroundColor: "{colors.marketing-surface}"
    textColor: "{colors.marketing-text}"
    rounded: "{rounded.panel}"
    padding: "1.2rem"
---

# Design System: Waslix

## Overview

**Creative North Star: "The Evidence Control Surface"**

Waslix has two related registers. The authenticated workspace is a calm, medium-density enterprise tool optimized for daily operation. Public marketing is a darker, more cinematic control surface where customer evidence moves through a visible system. Both registers share restrained geometry, compact operational data, Waslix teal, semantic status colors, and factual product language.

Marketing motion explains the durable product mechanism: disconnected signals converge, customer health becomes explainable, ownership appears, and work resolves toward renewal. It is not decorative spectacle and never substitutes for semantic content.

**Key Characteristics:**

- Precise neutral fields with restrained teal interaction color.
- Thin rules, compact ledgers, rails, and explicit evidence relationships.
- Large direct display type balanced by dense, truthful product UI.
- English/LTR and Arabic/RTL are equivalent compositions, not separate themes.

## Colors

The workspace follows the semantic tokens in `src/app/globals.css`; marketing uses the darker local palette recorded in the frontmatter.

### Primary

- **Waslix Teal:** Identity, actions, selected navigation, active paths, and network relationships. It never represents healthy status.

### Secondary

- **Signal Teal:** Fine network lines, interaction emphasis, and evidence markers on dark surfaces.

### Tertiary

- **Healthy Green, Attention Amber, Risk Red:** Reserved for their named business states. Always pair state color with a text label or icon.

### Neutral

- **Marketing Ground:** Near-black continuous field for the public narrative.
- **Marketing Surface and Raised:** Small tonal steps for product planes, navigation, and nested operational regions.
- **Marketing Text and Muted:** High-contrast primary copy and restrained supporting information.

**The Semantic Color Rule.** Brand teal means identity or interaction; green, amber, and red retain their business meaning everywhere.

## Typography

**Display Font:** Geist with Arial fallback; Tajawal is the Arabic equivalent.
**Body Font:** Geist with Arial fallback; Tajawal for Arabic.
**Label/Mono Font:** Geist Mono for coordinates, timestamps, and measured operational labels only.

**Character:** Display typography is large, tightly composed, and declarative. Product data returns to compact enterprise sizing with tabular numerals. Arabic loosens line height and tracking rather than mimicking Latin metrics.

### Hierarchy

- **Display** (590-650, fluid to 6rem, 0.92-0.98): First-view and story statements.
- **Headline** (590, fluid to 5.2rem, 0.98): Major narrative transitions.
- **Title** (580-650, 1.25-2.4rem): Product planes and capability treatments.
- **Body** (400, 0.95-1rem, 1.75): Supporting explanations, capped near 62 characters.
- **Label** (600, 0.62-0.72rem): Real measurements, times, sources, and state labels.

**The Weight Before Color Rule.** Establish emphasis through scale and weight before introducing an accent color.

## Layout

Marketing uses an 88rem maximum container with 3rem desktop gutters and 1.5rem mobile gutters. Full-viewport narrative sections alternate copy position around one persistent network. Product planes enter the same spatial field rather than forming a detached card stack. Conventional capability content appears only after the causal story is complete.

At 760px and below, the composition becomes a deliberate single-column sequence: fewer WebGL nodes, stacked product evidence, touch-sized controls, and no pointer parallax. Logical properties preserve the reading order in RTL. Product workspace surfaces retain their own compact sidebar, table-first layouts, and 4/8/12/16/24/32px spacing rhythm.

## Elevation & Depth

The system is flat by default. Depth comes from tonal layering, occlusion, WebGL camera position, and large soft black shadows under the two primary product planes. Colored halos and decorative blur are not part of the language.

**The Bounded Depth Rule.** Expensive or spatial depth belongs to the persistent network and major product transitions, never every card or control.

## Shapes

Corners stay precise: controls use approximately 6px rounding and major product planes use 8px. Borders are one pixel and low contrast until focus or state demands more. Circular geometry is reserved for network nodes, people, status dots, and sequential milestones.

## Components

### Buttons

- **Shape:** Compact 6px corners and a 3rem marketing height.
- **Primary:** Solid Waslix teal with white text; small upward movement and directional icon travel on hover.
- **Secondary:** Dark surface with a neutral rule that shifts to teal on hover.
- **Focus:** The shared visible ring remains mandatory in both registers.

### Cards / Containers

- **Corner Style:** 8px only for major product planes; many narrative groups use rules without an outer card.
- **Background:** Tonal graphite surfaces on marketing and semantic surface tokens in the workspace.
- **Shadow Strategy:** Flat at rest except major cinematic product planes.
- **Border:** One-pixel neutral rules structure evidence and ownership.

### Navigation

The public navigation is a fixed, translucent-black utility bar with no decorative blur. Desktop links use a fine teal active rail; mobile collapses to a bordered vertical menu. Language, sign-in, and workspace creation remain directly accessible.

### Customer Lifecycle Network

The signature marketing component uses instanced customer nodes, low-opacity relationship lines, and a small number of amber signal pulses. Scroll progress changes topology from dispersed evidence to connected accounts, a selected health state, flattened workspace rows, and a renewal path. The canvas is decorative; matching meaning always exists in HTML.

## Do's and Don'ts

### Do:

- **Do** show source, score impact, owner, timing, and next action together when demonstrating customer intelligence.
- **Do** use motion to explain causality, continuity, or state change.
- **Do** keep semantic content server-rendered and preserve the complete reduced-motion narrative.
- **Do** use compact, realistic Waslix product UI rather than futuristic HUD conventions.

### Don't:

- **Don't** use generic neon gradients, glowing blobs, decorative glass, or random 3D objects.
- **Don't** fabricate customer proof, integrations, AI claims, benchmarks, or renewal probabilities.
- **Don't** conflate brand teal with healthy green or rely on color alone.
- **Don't** turn the public page into a repeated grid of equal promotional cards.
