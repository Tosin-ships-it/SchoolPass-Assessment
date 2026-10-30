# Task 2: Scaffolding Prompts & Evolution Analysis

## Overview

This document records the exact prompts supplied to the LLM agent during the initial scaffolding of the SchoolPass application, retrieved from the historical conversation transcript (`bc3f6aac-333c-4e8d-b2bf-b21ce43954c0`, September 30, 2026). It documents the original scaffolding prompt, the intermediate context clarification prompt, the final refined prompt, and provides a comparative analysis of the key changes between them.

---

## 1. Original Scaffolding Prompt (Verbatim)

*Delivered at Step 0 (2026-09-30T20:07:22Z)*

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

---

## 2. Context Clarification & Planning Prompt (Verbatim)

*Delivered at Step 59 (2026-09-30T20:24:55Z)*

Following the agent's Phase 1 audit—which identified missing design tokens for spacing, radius, and motion, an empty `RULES_ENV.md` file, and unresolved configuration items—the user issued this instruction before authorizing Phase 2:

```text
Create an implementation that will resolve all fixes in the existing context structure without breaking the .agent/rules and /agent/skills structure.

Then draw up an implementation plan for scaffolding the app based on all you now know
```

---

## 3. Final Refined Scaffolding Prompt (Verbatim)

*Delivered at Step 115 (2026-09-30T20:46:09Z)*

Following the agent's implementation of the context fixes and presentation of the Phase 2 plan (Step 114), the user provided the final refined go-ahead:

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

---

## 4. Analysis of Changes Between Prompts

The progression from the original prompt (Step 0) through the intermediate clarification (Step 59) to the final refined prompt (Step 115) reveals a disciplined, iterative scaffolding process. Below are the key substantive differences and their rationales:

### 1. Phased Execution Transition
* **Original Prompt:** Structured the engagement as a two-phase process: Phase 1 (exploratory read-and-confirm with zero file creation) and Phase 2 (foundation build only after explicit go-ahead).
* **Refined Prompt:** Formally approved the findings and proposals from Phase 1 and explicitly triggered Phase 2 execution (*"Proceed to Phase 2"*).

### 2. Resolution of Design Token Delivery Mechanism
* **Original Prompt:** Left the mechanism open-ended, asking the agent to propose how tokens would reach the code (*"CSS variables, Tailwind config, or theme file"*).
* **Refined Prompt:** Formally resolved and locked the approach based on the Phase 1 proposal: *"Use the approved CSS custom-property token integration and the proposed folder structure."*

### 3. Tightened Environment Variable Safeguards
* **Original Prompt:** Included a general warning: *"Do not invent environment variable names. Ask me for every one."*
* **Refined Prompt:** Made the negative constraint concrete and actionable based on Phase 1 discoveries: *"Do not invent environment variable names or values. Do not create or populate an .env.example with guessed variables."* This prevented hallucinated configuration keys.

### 4. Prohibition on Ad-Hoc Token Invention
* **Original Prompt:** Specified: *"If a token you need doesn't exist, stop and ask. Do not invent one."*
* **Refined Prompt:** Strengthened this constraint specifically around the gaps uncovered during the Phase 1 audit: *"Do not create new spacing, radius, or motion tokens. If the existing design system does not define them, use the existing rules/files as the source of truth and stop rather than inventing tokens."*

### 5. Reiteration of Minimal Foundation Boundaries
* **Both Prompts:** Strictly barred feature development, authentication logic, payment endpoints, AI pipelines, database models, and migrations.
* **Refined Prompt:** Re-summarized the exact foundation deliverables as a checklist to ensure the agent did not expand scope during generation.

### 6. Standardized Post-Build Reporting Structure
* **Original Prompt:** Requested confirmation that it builds and runs, startup instructions, created files list, assumptions, and uncertainties.
* **Refined Prompt:** Formalized this into a 5-point reporting structure:
  1. Build/run status
  2. How to start the project
  3. Every file created
  4. Every assumption made
  5. Anything still unresolved
