# Task 1: Design System Assessment

## Overview

This directory contains the complete design system documentation, token exports, implementation assets, and verification evidence for Task 1 of the SchoolPass assessment.

The deliverable set covers business context, typography, color architecture, elevation shadows, deliberate design divergences, prompt engineering transcripts, defect documentation, interview defence answers, token conversion tooling, UI implementation, and regression testing.

---

## Deliverables Index

### 1. Design System Documentation (`Docs/`)

- [`Docs/Business-brief.md`](Docs/Business-brief.md) — Business context and design requirements grounded in SchoolPass PRD v6.0 and Addendum v6.1. Details target demographics, mobile-first and low-bandwidth constraints (mid-range Android, 3G/unstable connectivity per PRD v6.0 §15), three recurring parent operational questions, and the institutional visual direction.
- [`Docs/Type-scale.md`](Docs/Type-scale.md) — Complete 15-style typography scale based on Material Design 3 and configured for DM Sans. Documents font sizes, weights, line heights (1.5× multiplier), and letter-spacing specifications.
- [`Docs/Colour-roles.md`](Docs/Colour-roles.md) — Color architecture documentation detailing the selection and historical origin of primary teal `#087E8B`, full 14-step tonal palettes, semantic color role mappings, Primary 40 pinning before-and-after analysis, and WCAG AA contrast verification tables.
- [`Docs/Shadows.md`](Docs/Shadows.md) — Elevation shadow system defining soft, medium, and hard shadows tinted with the primary brand color (`#087E8B`) rather than neutral black, including psychological and depth rationales.
- [`Docs/Divergences.md`](Docs/Divergences.md) — Documented deliberate divergences from Material baseline defaults (Display Large style, brand-tinted shadows, and the addition of tone 5), specifying the default, chosen value, rationale, and failure scenarios.
- [`Docs/Prompts.md`](Docs/Prompts.md) — Verbatim LLM prompts, conversation IDs, and iterative refinements used to generate the token conversion script and token structures, including failed attempts and adjustments.
- [`Docs/defects.md`](Docs/defects.md) — Discovered design system and codebase defects, including the missing `--color-roles-outline` border fallback defect in student management components.
- [`Docs/interview-answers.md`](Docs/interview-answers.md) — Evidence-backed answers to all 12 assessment defence interview questions, each strictly constrained to 200 words or fewer.

### 2. Design Tokens & Conversion Scripts (`Tokens/`)

- [`Tokens/design-tokens.tokens.json`](Tokens/design-tokens.tokens.json) — Complete design tokens export containing internal color primitives, semantic color roles, typography styles, and elevation shadow effects.
- [`Tokens/tokens.css`](Tokens/tokens.css) — Generated CSS custom properties formatted into internal primitives, UI color roles, shadow effects, and typography styles.
- [`Tokens/convert-tokens.js`](Tokens/convert-tokens.js) — Node.js script that converts `design-tokens.tokens.json` into CSS custom properties (`tokens.css`).

### 3. Token Export & Diff Evidence (`Evidence/`)

- [`Evidence/05-tokens-incomplete.json`](Evidence/05-tokens-incomplete.json) — Initial Figma token export demonstrating the omission of color variables (styles-only export, 750 lines).
- [`Evidence/06-tokens-complete.json`](Evidence/06-tokens-complete.json) — Complete Figma token export including color variables and primitives (3,037 lines).
- [`Evidence/17-tokens-diff.txt`](Evidence/17-tokens-diff.txt) — Documented one-line diff statement and structural boundary diff explaining the omission and detection method.

### 4. Visual & Verification Evidence (`Evidence/`)

- [`Evidence/01-palette-before-pin.png`](Evidence/01-palette-before-pin.png) — Tonal palette capture before pinning `#087E8B` at tone 40 (Spec item 01).
- [`Evidence/02-palette-after-pin.png`](Evidence/02-palette-after-pin.png) — Tonal palette capture after pinning `#087E8B` at tone 40 (Spec item 02).
- [`Evidence/03-spacing-default.png`](Evidence/03-spacing-default.png) — Display Large typography specimen at default spacing (-0.25px) (Spec item 03).
- [`Evidence/04-spacing-chosen.png`](Evidence/04-spacing-chosen.png) — Display Large typography specimen at chosen compact spacing (-1.0px) (Spec item 04).
- [`Evidence/07-raw-value-search.txt`](Evidence/07-raw-value-search.txt) — Terminal search command and full output verifying raw hex color usage across codebase (Spec item 07).
- [`Evidence/08-agent-typography-answer.txt`](Evidence/08-agent-typography-answer.txt) — Agent transcript verifying typography style selection and admitted divergence (Spec item 08).
- [`Evidence/10-screen-with-system.png`](Evidence/10-screen-with-system.png) — Full-viewport landing page screenshot (1280 × 800) built with active token integration (Spec item 10).
- [`Evidence/11-broken-referencing.png`](Evidence/11-broken-referencing.png) — Deliberate regression screenshot (1280 × 800) showing broken `--color-roles-primary` frozen in teal while the brand palette updated to purple (Spec item 11).
- [`Evidence/12-git-log-branch-unmerged.txt`](Evidence/12-git-log-branch-unmerged.txt) — Genuine Git terminal log proving regression branch deletion without merging, accompanied by three sentences on why this demonstrates the core argument for token referencing (Spec item 12).
- [`Evidence/13-primary-palette-overview.png`](Evidence/13-primary-palette-overview.png) — Supplementary overview screenshot of the initial primary tonal palette in Figma.
- [`Evidence/14-primary40-variable-assignment.png`](Evidence/14-primary40-variable-assignment.png) — Supplementary screenshot of Primary 40 variable assignment in Figma.
- [`Evidence/15-display-large-default-settings.png`](Evidence/15-display-large-default-settings.png) — Supplementary screenshot of Display Large style properties and default settings in Figma.
- [`Evidence/16-shadow-styles-in-figma.png`](Evidence/16-shadow-styles-in-figma.png) — Supplementary screenshot of soft, medium, and hard brand-tinted shadow styles defined in Figma.

---

## Status of Special Deliverables

### Unavailable Deliverable
- **`Evidence/09-screen-without-system.png` — UNAVAILABLE**
  - An authentic pre-design-system version of the SchoolPass landing page could not be captured because the initial Git commit (`cebb045`) already included design tokens and the token-integrated landing page. No earlier or alternative branch without tokens exists in the project history.
  - [`Evidence/09-screen-without-system-NOTE.txt`](Evidence/09-screen-without-system-NOTE.txt) documents the historical investigation and explains why an authentic before-state screenshot cannot be produced from Git history.
  - *Note: This document explains the repository circumstance and does not replace the missing screenshot.*

### Optional Deliverable
- **`Evidence/13-walkthrough.mp4` — OPTIONAL / NOT YET COMPLETED**
  - Video walkthrough is designated as optional for bonus marks and has not yet been recorded.