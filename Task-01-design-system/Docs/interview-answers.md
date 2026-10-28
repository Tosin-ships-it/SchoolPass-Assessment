# Task 1: Design System Assessment — Interview Defence Answers

This document contains answers to the 12 interview defence questions required for Task 1 of the SchoolPass assessment specification (`Ship-and-Found-Five-Tasks.md`).

All answers are grounded in the verified SchoolPass design system tokens, documentation, and product requirements. Every answer is strictly 200 words or fewer.

---

## Question 1: How would you structure design tokens?

A production-grade design token system is structured in a three-tier hierarchy:

1. **Global (Primitive) Tokens:** Raw, context-agnostic design values. These store literal hex codes, spacing dimensions, and font families (e.g., `color.primary.40: #087E8B`, `color.neutral.98: #F9F9FB`, or `typography.fontFamily: DM Sans`). They establish the raw palette and scales.
2. **Semantic (Alias / System) Tokens:** Context- and purpose-driven tokens that alias primitive tokens to convey UI intent rather than literal values. In SchoolPass, semantic roles such as `--color-roles-primary` (aliasing Primary 40), `--color-roles-surface` (aliasing Neutral 98), and `--color-roles-on-surface` (aliasing Neutral 10) communicate how elements relate visually and hierarchically.
3. **Component-Specific Tokens:** Tightly scoped tokens that bind semantic tokens to concrete UI components (e.g., `--input-border-color: var(--color-roles-outline-color)` or `--card-shadow: var(--effect-soft-shadow)`).

This architecture cleanly decouples intent from values. Component markup references only semantic or component-level tokens. As a result, switching themes (e.g., light to dark mode) or updating brand palettes simply re-maps semantic aliases to different primitives without touching component source code or risking unintended style regressions across the application.

---

## Question 2: When is a token change breaking?

A token change is breaking when it forces changes in consuming code or produces unintended visual or functional regressions at runtime. Specifically:

1. **Identifier Changes or Deletions:** Renaming or removing a token breaks existing references. In SchoolPass, exporting Figma's `outline color` as `--color-roles-outline-color` rather than `--color-roles-outline` broke `StudentsManager.tsx:312`, leaving input borders undefined and invalid at computed-value time without fallbacks.
2. **Type or Unit Modifications:** Changing units (e.g., `px` to `rem` without proportional adjustments) or altering data structures in JSON token dictionaries breaks build scripts (`convert-tokens.js`) and CSS calculations.
3. **Semantic Polarity and Contrast Inversions:** Changing a background token's value (e.g., switching `--color-roles-surface` from light tone 98 to dark tone 10) without simultaneously updating `--color-roles-on-surface` breaks accessibility by dropping contrast below WCAG thresholds (e.g., 1:1 unreadable text).
4. **Layout Geometry Shifts:** Substantially changing spacing, min-heights, or typography tokens (such as increasing Display Large line height beyond container limits) causes visual overflow, clipping, or breaks mobile responsiveness.

To avoid breaking consumers, token updates must follow semantic versioning, provide automated deprecation aliases, and be validated against consumer ASTs.

---

## Question 3: How would you support multiple brands and themes?

Supporting multiple brands and themes requires decoupling semantic role consumption from underlying primitive values using a two-layer CSS custom property architecture:

1. **Stable Semantic Interface:** All components strictly consume standardized semantic tokens (e.g., `var(--color-roles-primary)`, `var(--color-roles-surface)`, `var(--color-roles-on-surface)`). Component styles never reference brand-specific names or hardcoded primitives.
2. **Theming via Dynamic Context:** As documented in `Docs/Colour-roles.md`, light and dark themes reuse identical semantic property names scoped to theme selectors (e.g., `:root[data-theme="light"]` and `[data-theme="dark"]`). In light mode, `--color-roles-surface` maps to Neutral 98 (`#F9F9FB`) and `--color-roles-on-surface` to Neutral 10 (`#1B1C1D`). In dark mode, surface re-maps to Neutral 10 and on-surface to Neutral 90 (`#E2E2E5`), preserving contrast without altering component CSS.
3. **Multi-Brand Scalability:** For multi-tenant or white-labeled schools, each brand maintains a unique primitive configuration file. School A pins Teal `#087E8B` as Primary 40, while School B might pin Navy as Primary 40. The build pipeline generates brand-specific CSS stylesheets that bind the shared semantic roles to each school's distinct primitive palette.

---

## Question 4: Can tokens guarantee accessible contrast?

No. Design tokens are passive data structures—variables storing static values like color hexes and dimensions. By themselves, they cannot guarantee accessible contrast at runtime for several reasons:

1. **Arbitrary Pairing:** Tokens do not enforce application rules. A developer or AI agent can freely pair incompatible semantic tokens—such as applying `--color-roles-on-primary` (white `#FFFFFF`) onto `--color-roles-surface` (light grey `#F9F9FB`), resulting in an unreadable 1.05:1 contrast failure.
2. **Context Blindness:** Tokens cannot account for CSS opacity, alpha blending, semi-transparent overlays (such as SchoolPass brand shadows `#087E8B1F`), background images, or overlapping DOM elements.
3. **Execution Errors:** If a token is undefined or misspelled (like `--color-roles-outline`), CSS falls back to initial values, which can eliminate visible borders or text contrast entirely.

To truly guarantee accessible contrast, tokens must be paired with:
- **Strict Semantic Pairing Rules:** Enforcing that `on-primary` is only ever rendered against `primary`.
- **Component Encapsulation:** Locking background and foreground token assignments together inside component primitives.
- **Automated CI Enforcement:** Running static CSS linters and automated browser test runners (such as axe-core or Lighthouse) to evaluate computed contrast in the live DOM.

---

## Question 5: How do you ensure that colour contrast guidelines are met within a website or application's design?

Ensuring WCAG color contrast guidelines are met requires a disciplined multi-stage process from design mathematics through continuous automated testing:

1. **Mathematical Verification:** Contrast is determined using the WCAG relative luminance formula: $(L_1 + 0.05) / (L_2 + 0.05)$, where $L = 0.2126R + 0.7152G + 0.0722B$ from linearized sRGB channels.
2. **Design-Time Palette Auditing:** In Figma, semantic color pairs are verified prior to handoff. In SchoolPass (`Docs/Colour-roles.md`), pinning Primary 40 to `#087E8B` against On-Primary 100 (`#FFFFFF`) guarantees a verified 4.54:1 ratio (exceeding the WCAG AA 4.5:1 text threshold), while On-Surface 10 (`#1B1C1D`) against Surface 98 (`#F9F9FB`) achieves 14.88:1.
3. **Structural CSS Discipline:** Components are styled using strict semantic token pairs (e.g., binding `--color-roles-surface` to `--color-roles-on-surface` and `--color-roles-outline-color` to interactive borders).
4. **Automated CI/CD Auditing:** Integrating headless accessibility runners (axe-core, Playwright, Lighthouse) into build pipelines to audit rendered DOM nodes across light, dark, and disabled states.
5. **Manual Inspection:** Reviewing edge cases in browser DevTools, verifying interactive `:focus` and `:hover` rings (requiring 3:1 contrast against adjacent backgrounds), and testing under simulated sunlight on target mobile displays.

---

## Question 6: Can you discuss the differences between WCAG levels A, AA and AAA?

The Web Content Accessibility Guidelines (WCAG) establish three progressive conformance tiers:

- **Level A (Essential Baseline):** Addresses non-negotiable barriers where failure completely blocks users with disabilities from accessing content. It mandates basic keyboard operability without traps, text alternatives for non-text media, and accessible form labels. Notably, Level A specifies no color contrast thresholds.
- **Level AA (Standard Benchmark):** The industry and legal standard (ADA, Section 508, EN 301 549) targeted by modern enterprise products, including SchoolPass. It eliminates significant barriers for broad visual, motor, and cognitive needs. Level AA introduces mandatory contrast thresholds: 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold), and 3:1 for graphical UI components and form borders. It also mandates visible focus indicators and 320px responsive reflow without loss of information.
- **Level AAA (Enhanced / Specialized):** The highest, most specialized tier. It raises contrast thresholds to 7:1 for normal text and 4.5:1 for large text, while requiring sign language interpretation and no timing constraints. The W3C explicitly notes that full Level AAA compliance is not recommended for entire general-purpose websites, as 7:1 contrast severely constrains brand color palettes.

---

## Question 7: Discuss the importance of semantic HTML in the context of accessibility.

Semantic HTML is the foundation of accessible web applications. Native HTML elements—such as `<main>`, `<nav>`, `<header>`, `<button>`, `<input>`, and heading tags (`<h1>`–`<h6>`)—communicate their structural purpose and state directly to browser accessibility APIs without extra code.

1. **Accessibility Tree Translation:** Browsers parse semantic tags directly into the Accessibility Tree. A native `<button>` automatically announces its role, name, and pressed state to screen readers.
2. **Built-in Keyboard Interactivity:** Native elements provide out-of-the-box keyboard navigation (`Tab` and `Shift+Tab`), focus management, and standard activation triggers (`Enter` and `Space` for buttons).
3. **Screen Reader Navigation:** Landmarks (`<main>`, `<nav>`) and hierarchical headings enable assistive technology users to scan document outlines and bypass repetitive navigation blocks efficiently.
4. **Eliminating Fragile ARIA:** The First Rule of ARIA states: "Do not use ARIA if a native HTML element already exists." Creating custom pseudo-elements (like `<div onClick>` with `role="button"`) requires manually implementing `tabIndex`, keydown handlers, focus ring styling, and touch events—a pattern prone to defects, keyboard traps, and browser inconsistencies.

---

## Question 8: How do you handle design handoff to developers using Figma?

Effective design handoff in Figma treats design files and codebases as a unified system rather than static visual mockups:

1. **Token Parity:** Figma Variables collections are structured in the same three-tier hierarchy (primitives and semantic roles) used in code. Variable names must map 1:1 to CSS tokens via automated export pipelines (such as `convert-tokens.js`). This eliminates discrepancies, such as Figma's "outline color" diverging from code's expected "outline".
2. **Component Alignment:** Component sets in Figma mirror frontend component architectures (e.g., React props matching Figma component variants, boolean toggles, and layout slots).
3. **Comprehensive State Specifications:** Designers explicitly design and annotate all component states—default, hover, focus-visible, loading, error, and disabled—along with responsive Auto Layout constraints across mobile (360px), tablet, and desktop breakpoints.
4. **Dev Mode & Accessibility Annotations:** Engineering inspects exact token references and spatial measurements in Dev Mode, referencing explicit accessibility specs (e.g., heading hierarchy `<h1>`–`<h6>`, touch target bounds ≥48px, and required contrast pairs).
5. **Cross-Disciplinary Handoff Reviews:** Before development begins, designers and engineers conduct a joint walk-through to review edge cases, dynamic content lengths, and confirm zero undocumented divergences exist.

---

## Question 9: Why do AI-generated interfaces tend to look generic, and what specifically do you hand an agent to stop it?

AI-generated interfaces look generic because large language models are probabilistic systems trained on millions of generic web templates. When asked to design an interface without strict boundaries, the model predicts the statistical median of modern frontend design: generic Tailwind blue buttons (`bg-blue-600`), neutral grey borders (`border-gray-200`), generic cards with default drop shadows, and system fonts like Inter or Roboto.

To stop an AI agent from defaulting to generic aesthetics, you must provide:

1. **A Concrete Token Dictionary:** Hand the agent a compiled token stylesheet (`tokens.css` or `design-tokens.tokens.json`) providing explicit primitive and semantic variables for color, typography, spacing, radius, and shadows.
2. **Explicit Negative Constraints:** As demonstrated in `Docs/Prompts.md`, mandate strict rules: "Use only design system tokens. Do not invent missing tokens, hardcode arbitrary hex values, or introduce unmapped utilities."
3. **A Clear Visual & Technical Brief:** Supply the product's authentic design direction (`Docs/Business-brief.md` and PRD §15)—such as SchoolPass's Teal `#087E8B`, DM Sans typography, brand-tinted shadows, and mobile-first constraints for parents on 3G networks.
4. **Semantic Component Patterns:** Provide reference layouts specifying approved semantic HTML structures and mandatory token pairings.

---

## Question 10: Your line height for display large is a specific number. Why that number and not one step either side of it? What would you lose with each?

In SchoolPass (`Docs/Type-scale.md`), Display Large has a 64px font size and a 96px line height.

**Why 96px:** 96px is derived from a strict 1.5× multiplier ($64\text{px} \times 1.5 = 96\text{px}$), applied consistently across all 15 typography styles in the system. It aligns perfectly with an 8px vertical baseline grid ($96 = 12 \times 8\text{px}$), creating predictable vertical rhythm and proportional line spacing for prominent display headings.

**One Step Lower (1.4× / 89.6px or 88px):**  
You lose vertical breathing room and modular consistency. At 64px, tighter line height causes DM Sans ascenders and descenders (e.g., 'd', 'l', 'p', 'y') to collide or crowd uncomfortably when titles wrap onto multiple lines on mobile screens, creating visual tension and degrading reading rhythm.

**One Step Higher (1.6× / 102.4px or 104px):**  
You lose vertical economy and Gestalt proximity. On compact mobile viewports (PRD §15 mobile-first constraints), excessive leading pushes crucial parent content and primary actions below the fold. Visually, wrapped lines become so distant that they read as disconnected fragments rather than a coherent title.

---

## Question 11: Point at one place in your own token structure that you would build differently if you started again. Say what you would do instead and what it would cost.

I would rebuild the semantic border naming schema and feedback token exports.

**The Flaw:** In our token pipeline (`convert-tokens.js`), Figma's `outline color` token was translated literally into `--color-roles-outline-color`, while components (`StudentsManager.tsx:312`, `students/page.tsx:45`) called `var(--color-roles-outline)`. Because the variable was undefined and lacked a fallback, input borders became invalid at computed-value time under CSS Custom Property rules (`Docs/defects.md`). Additionally, semantic Warning and Success roles were omitted from the initial export.

**What to Do Instead:**
1. Establish a strict, normalized naming convention upfront—standardizing on `--color-roles-outline` without trailing descriptors.
2. Export complete semantic feedback roles (Warning and Success) from day one.
3. Introduce a build-time AST linter that validates all `var(--token-*)` calls in JSX against `tokens.css` to fail the build on undefined variables.

**The Cost:**
- Updating `convert-tokens.js` and JSON dictionaries: ~1–2 engineering hours.
- Refactoring affected component styles across staff and parent interfaces: ~2–3 hours.
- Updating documentation (`tokens.css`, `Docs/Colour-roles.md`) and running visual regression tests: ~2 hours.  
Total cost: approximately one engineering day, preventing silent CSS invalidation defects.

---

## Question 12: Wrong-answer analysis. A candidate says: "I set up design tokens by exporting the hex values from Figma into a CSS file, so every colour in the codebase comes from one place. That makes it a single source of truth." This sounds correct and is not. Say precisely what is missing and what will go wrong in month four.

**What Is Missing:**  
The candidate is confusing a primitive palette list with a design token system. What is missing is the **semantic abstraction layer** and **intent**. Exporting raw hex values directly into CSS produces only global primitives (e.g., `--teal-500: #087E8B`, `--gray-100: #F3F4F6`). It omits role-based semantic tokens (such as `--color-roles-surface`, `--color-roles-primary`, and `--color-roles-on-primary`) that define *where*, *why*, and *how* colors interact. It also lacks accessibility pairing rules and component-level tokens.

**What Goes Wrong in Month Four:**
1. **Theming & Dark Mode Are Blocked:** When stakeholders request dark mode or multi-brand support, the architecture fails. Because components reference raw color variables directly (e.g., `background: var(--white)`), swapping themes requires manually refactoring every component stylesheet across the entire codebase.
2. **Cascading Breaking Changes:** If marketing updates the primary brand hue, modifying `--teal-500` will unpredictably alter every button, icon, and accent border where engineers lazily reused that variable.
3. **Token Sprawl & Inconsistency:** Without semantic guidelines, developers guess which grey or blue to use (e.g., mixing `--gray-200` and `--gray-300` for borders), creating visual fragmentation, contrast failures, and technical debt.
