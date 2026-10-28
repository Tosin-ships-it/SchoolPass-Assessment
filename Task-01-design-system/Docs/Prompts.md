# AI Prompts and Attempts

This document records the AI prompts used during the development and refinement of the SchoolPass design system and its UI implementation. Historical prompts below were recovered from available Antigravity conversation records. The typography verification section records a prompt and response from a later inspection.

Prompts are preserved as originally written wherever available, including spelling and wording errors. The recovered history may not represent every prompt ever used.

## 1. JSON-to-CSS Token Conversion and Semantic Colour Roles

**Source conversation:** `70152678-b421-4025-b81b-9cad83e9b862`  
**Timestamp:** 30 September 2026, 00:29 local time

### Initial prompt

```text
Write a Javascript script that you will use to convert the design system in @[/Users/josephbrendan/Desktop/Spotter/design-tokens.tokens.json] to CSS variables

Take note of the primitive colors in the system and the color roles. using standard color system practice, remember that the color roles are what will be used direfctly on the UI and the primitives will not be used directly on the UI

Use CSS variables and ensure that this design system remains the source of truth for UI implementation
```

### Follow-up prompt

```text
yes, create this script file in your workspace directory (e.g., convert-tokens.js) and run it to produce the tokens.css file
```

## 2. Design Token System Scaffolding and Integration Rules

**Source conversation:** `bc3f6aac-333c-4e8d-b2bf-b21ce43954c0`  
**Timestamp:** 30 September 2026, 21:07 local time

### Initial setup prompt

```text
You are setting up SchoolPass from scratch. Work in two phases.

PHASE 1: READ AND CONFIRM (no code yet)
1. Find and read every context file and the design system in the workspace. This includes the PRD and all RULES_*.md files it references (AI, ARRIVAL, PAYMENTS, CONFIG, AUTH, ATTENDANCE, RETENTION, STAFF_UI, DATA_MODEL, ENV). If any referenced file is missing, tell me.
2. Summarize what you understood: what SchoolPass is, who it's for, the two interfaces (parent app, Staff & Admin), the tech stack, the design system's tokens and rules, and key constraints.
3. List the files you read.
4. Propose how design tokens will reach the code (CSS variables, Tailwind config, or theme file) and the folder structure. Wait for my approval.
5. List any conflicts, gaps or unset values you found.
6. Stop and wait for my go-ahead. Do not write code or create files until I say so.

SOURCE OF TRUTH
- The context files and design system are the source of truth.
- If two files disagree, or something is unclear, missing or marked configurable, ask me. Do not assume or guess.
- Do not invent environment variable names. Ask me for every one.

STYLING RULES
- Use only design system tokens for color, type, spacing, radius, shadow and motion. No hard-coded values.
- Follow the design system's rules, especially for how colors are applied (which token goes where and why).
- If a token you need doesn't exist, stop and ask. Do not invent one.
- The app is used mainly on small mobile screens over slow networks. Design mobile-first.

PHASE 2: BUILD (only after my go-ahead)
Build the foundation only:
- Project setup: Next.js, TypeScript, Prisma, PostgreSQL (Neon), deployable to Vercel. Set up the tooling and configuration only. Do not define models or run migrations.
- Folder structure that keeps the parent app and the Staff & Admin interface clearly separate, following the context files.
- Base layout, including a loading state and a retry state, as the PRD requires on all pages.
- A home screen that fits exactly 100vh (use 100dvh for mobile), with no scrolling, and stays minimal: the SchoolPass name, the tagline "The school's answers. Your child's records. One place.", and one primary "Sign in" action. The action is a placeholder with no auth logic.

Do not build features, auth, payments, AI, database models, extra pages or extra dependencies.

WHEN DONE
- Confirm it builds and runs without errors, and tell me how to start it.
- List every file you created.
- List every assumption you made.
- List anything you were unsure about.
```

### Follow-up prompt to proceed with Phase 2

```text
Proceed to Phase 2.

Use the approved CSS custom-property token integration and the proposed folder structure.

For this phase, build only the foundation specified in my original prompt:

* Next.js + TypeScript project setup
* Prisma + PostgreSQL/Neon tooling/configuration only
* Vercel-ready configuration
* Parent and Staff/Admin folder structure
* Base layout with loading and retry states
* Minimal 100dvh home screen with:

  * SchoolPass
  * “The school's answers. Your child's records. One place.”
  * one placeholder “Sign in” action

Do not build features, authentication logic, payments, AI, database models, migrations, or extra dependencies.

Do not invent environment variable names or values. Do not create or populate an .env.example with guessed variables.

Do not create new spacing, radius, or motion tokens. If the existing design system does not define them, use the existing rules/files as the source of truth and stop rather than inventing tokens.

When finished, report:

1. Build/run status
2. How to start the project
3. Every file created
4. Every assumption made
5. Anything still unresolved
```

## 3. Application of Colour Roles, Typography, and Shadows

**Source conversation:** `4b36601c-15fd-4715-a54b-b19d87f8f48e`  
**Timestamp:** 7 October 2026, 13:36 local time

### Implementation prompt

```text
# SchoolPass — Landing Page & Authentication

Proceed with implementation of the SchoolPass landing page and authentication system.

Authority

Follow this authority hierarchy:

1. docs/SchoolPass_PRD_v6.md — baseline product requirements
2. docs/PRD_ADDENDUM_v6.1.md — approved amendments and clarifications; it takes precedence where it explicitly changes the PRD
3. AGENTS.md, .agent/rules/*, and .agent/skills/* — supporting engineering guidance only

The PRD and Addendum are the source of truth for product behavior and scope.

Do not allow stale context files to override them.

Do not introduce product decisions, features, workflows, or requirements that are not defined by the PRD or Addendum.

If something required for this implementation is genuinely unspecified, stop and flag it rather than inventing a product decision.

Scope

For this phase, build only:

* the SchoolPass public landing page
* the authentication system required by the PRD/Addendum
* the routes, components, validation, states, and protection necessary to support those flows

Do not implement unrelated SchoolPass features yet.

Design system

Before implementing the UI, inspect the existing project and identify the existing SchoolPass design system and tokens.

Use the existing:

* color system and color roles
* typography system
* shadow/elevation system
* existing components and UI patterns

The implementation must use the defined design-system values rather than introducing arbitrary colors, typography, or shadows.

Do not invent missing design tokens or visual rules.

If a required design-system value is not defined, flag it rather than creating a new product/design decision.

The landing page and authentication experience should use the same established SchoolPass visual system.

Landing page

Implement the landing page based on the requirements and product language defined in the PRD/Addendum.

Do not invent additional product claims or features.

Keep the landing page minimal, clean, responsive, and fast.

Authentication system

Implement the authentication system following the PRD and Addendum rules:

* separate Parent and Staff/Admin authentication flows
* parent self-registration and email verification before first login
* secure session management via httpOnly cookies
* password reset flow
* rate limiting on authentication attempts
* generic error messages that avoid leaking account existence

Do not build unrequested authentication workflows that are not specified.

Ensure authorization boundaries are enforced server-side where required.

Existing implementation

Start from the current project structure and implementation.

Reuse existing architecture, components, utilities, tokens, and authentication infrastructure where applicable.

Preserve working functionality unless a change is required by the PRD/Addendum.

Do not rewrite unrelated parts of the application.

Accessibility

Implement the landing page and authentication flows with appropriate accessibility:

* semantic structure
* accessible form labels
* keyboard access
* visible focus states
* accessible validation and error feedback
* appropriate button and link semantics
* sufficient contrast

Validation

After implementation, run the project's available validation checks, including typecheck, lint, build, and relevant tests where available.

Also verify the landing page and authentication flows in the development environment.

Report:

* what was implemented
* important files changed
* how the existing design system was applied
* authentication flows implemented
* validation results
* any genuine blocker, missing dependency, or requirement conflict

Do not perform another broad product audit before implementation.

Start implementation now.
```

## 4. Typography Hierarchy, Spacing, and Shadow Refinements

**Source conversation:** `39033a25-541b-4830-b2bf-d93e09101ac2`  
**Date:** 8 October 2026

### Attempt 1 — 10:27 UTC

```text
In the header do the following
- Reduce the letter spacing in the logo SchoolPass so it is more compact
- Remove the bottom border of the header
```

### Attempt 2 — 10:36 UTC

```text
In the header do the following
- Reduce the letter spacing in the logo SchoolPass so it is more compact
- Remove the bottom border of the header
- Capitalize each word in the button "Get Started" and make it a 16px button in rem
- Set the corner radius of button to 12px in rem  
```

### Final refinement — 10:39 UTC

```text
In the header do the following
- Reduce the letter spacing in the logo SchoolPass so it is more compact
- Remove the bottom border of the header
- Capitalize the first letter in each word in the button "Get Started" and make it a 16px button in rem
- Set the corner radius of button to 12px in rem  
```

### Shadow prompt

```text
In the section called 'What SchoolPass Provides'
- cards should use the effect-soft-shadow: 1.5px 6px 30px 0px #087e8b1f;
```

### Card styling consistency prompt

```text
cards under How Parent Access Works should use the same color and style of the cards under What SchoolPass Provides
```

### Button font-weight prompt

```text
the staff portal button should match the font weight of the other buttons
```

### Text alignment prompt

```text
center align these : How Parent Access Works
Simple, secure registration verified by the school administration.
```

### Text style consistency prompt

```text
text  size and style in What SchoolPass Provides
Essential parent services defined by the school, built for simplicity and reliability  should match text size and size in How Parent Access Works
Simple, secure registration verified by the school administration.
```

### Hover state prompt

```text
using the design system, create appropraite hover states for buttons, cards and text links
```

## 5. Typography Style Verification

### Prompt used

```text
Inspect the current SchoolPass UI and its design tokens. Choose one specific text element on the screen and identify the exact typography style applied to it (e.g., Title Medium or Body Large). Explain briefly how you verified the style using the code and design tokens. Do not guess.
```

### Agent response

**Chosen element:** Hero subtitle paragraph  
**Location:** `src/app/page.tsx:953–966`  
**Text content:**

> SchoolPass gives registered parents and guardians one direct place to ask school questions, view verified student attendance and fee balances, confirm morning arrival, and reach the school office.

**Identified typography style:** Body Large

### How the agent verified the style

The agent inspected the paragraph's inline styles in `src/app/page.tsx:954–958` and found references to these CSS custom properties:

```tsx
fontFamily: 'var(--typography-body-large-fontfamily)',
fontSize: 'var(--typography-body-large-fontsize)',
fontWeight: 'var(--typography-body-large-fontweight)',
lineHeight: 'var(--typography-body-large-lineheight)',
```

The agent then cross-referenced `tokens.css:262–272`, reporting the following token values:

| Property | Reported value |
|---|---|
| Font family | `DM Sans` |
| Font size | `16px` |
| Font weight | `500` |
| Line height | `24px` |
| Letter-spacing token | `-0.136px` |

The reported line height is 1.5 times the font size.

### Implementation observation

The agent observed that the paragraph explicitly references the Body Large font-family, font-size, font-weight, and line-height tokens, but does not include `--typography-body-large-letterspacing` in the inline style declaration. It therefore does not explicitly apply that letter-spacing token through the inspected inline styles.

**Evidence source:** The Antigravity agent's response after inspecting `src/app/page.tsx` and `tokens.css`. The findings reflect that inspection and should be rechecked if the files change.

