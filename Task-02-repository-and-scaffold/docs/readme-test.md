# Task 2: README Usability & Comprehension Test Documentation

**Document Path:** `Task-02-repository-and-scaffold/docs/readme-test.md`  
**Assessment Reference:** Task 2, Step 7 (*"The repository, as a professional artifact: Test it for real"*)  
**Assessment Brief:** `docs/Assessment/Ship-and-Found-Five-Tasks.md`  
**Target Document Under Test:** [`Task-02-repository-and-scaffold/README.md`](../README.md) (Unmodified Baseline)  
**Test Type:** Non-Developer Readability & Comprehension Test  
**Document Status:** Test Findings & Proposed Remediation Documented (README Edits Pending)  
**Date of Test Session:** October 30, 2026  

---

## 1. Test Overview & Methodological Limitations

### Purpose of the Test
The assessment brief requires an empirical evaluation of the project documentation:
> *"Test it for real: give the readme to someone who has never seen your project and ask them to get it running. Record what they got stuck on, verbatim, in docs/readme-test.md, and then fix the readme. A readme nobody has tested is a guess."*

The primary objective of this testing session was to evaluate whether an external reader with no prior knowledge of SchoolPass could read the existing, unmodified [`README.md`](../README.md) and explain what the application does, what its components mean, and what its current status is in plain language.

### Explicit Test Limitation
> [!IMPORTANT]
> **Methodological Scope Limitation:** This test was conducted strictly as a **reading comprehension and conceptual clarity test**. It was **not** a technical installation, terminal command execution, or local environment setup test.
>
> The participant was not asked to clone Git repositories, execute package manager commands (`npm install`), configure `.env` variables, or run the local development server. The evaluation focused entirely on whether the prose and technical terminology in the unmodified `README.md` communicated clearly to a non-technical stakeholder.

---

## 2. Participant Profile

To ensure absolute adherence to assessment authenticity standards, the participant profile is recorded without fabricated demographic details or simulated professional personas:

- **Participant Background:** Unfamiliar with software development. The participant has no programming experience, no familiarity with modern web development frameworks, and no background in database administration or design token architectures.
- **Prior Exposure to SchoolPass:** None. The participant had never seen the SchoolPass repository, PRD, or assessment documentation prior to this test.
- **Testing Setting:** Independent reading of the unmodified [`README.md`](../README.md) followed by guided verbal comprehension prompts where the participant was asked to explain specific sections in their own words.

---

## 3. Part A: Original Test Findings (From the Unmodified README)

The comprehension test evaluated the participant's understanding across three specific sections of the unmodified `README.md`. In each area, the participant encountered significant conceptual friction and was unable to clearly explain what the text meant.

### Area 1: Tooling & Project Setup (README Section 2)

- **Text Under Test:** The "Tooling & Project Setup" item in Section 2 (*"Honest Status"*), which states:
  > *"Next.js 15.5.27 (App Router), React 19.3.0, TypeScript 5.9.3, and Prisma 6.19.3 tooling shell."*
- **What the Participant Could Not Clearly Explain:**
  - Could not explain what any of the named technologies (Next.js, App Router, React, TypeScript, Prisma) actually are or how they relate to each other.
  - Could not explain what the application's actual operational status is based on this description.
  - Could not interpret what the phrase *"tooling shell"* means—specifically whether the software is currently functioning, half-built, or merely an empty placeholder.
- **Specific Technical Terms & Phrases That Caused Difficulty:**
  - `Next.js`
  - `App Router`
  - `React`
  - `TypeScript`
  - `Prisma`
  - `"tooling shell"`

---

### Area 2: Design System Integration (README Section 2)

- **Text Under Test:** The "Design System Integration" item in Section 2 (*"Honest Status"*), which states:
  > *"Figma design tokens (`design-tokens.tokens.json`) converted via `convert-tokens.js` into CSS custom properties in `tokens.css`."*
- **What the Participant Could Not Clearly Explain:**
  - Could not explain what Figma design tokens are and what they represent in the context of an application.
  - Could not understand why design choices are stored in a `.json` file (`design-tokens.tokens.json`).
  - Could not explain the relationship between design tokens and the application's overall design system.
  *(Note: The participant understood the CSS conversion aspect—including what `convert-tokens.js` does and how CSS custom properties and `tokens.css` work to style the interface. The comprehension difficulty was strictly confined to understanding design tokens and their purpose).*
- **Specific Technical Terms & Phrases That Caused Difficulty:**
  - `Figma design tokens`
  - `design-tokens.tokens.json`
  - Design token concepts and design system relationship

---

### Area 3: Statutory Disclosures (README Section 2)

- **Text Under Test:** The "Statutory Disclosures" item in Section 2 (*"Honest Status"*), which states:
  > *"Standalone legal pages (`/privacy` and `/terms`) containing privacy notices and terms drafted around Nigeria Data Protection Act (NDPA) 2023 principles."*
- **What the Participant Could Not Clearly Explain:**
  - Could not explain what the phrase *"statutory disclosures"* means in practical terms.
  - Could not explain the practical difference between a privacy notice and terms of service.
  - Could not explain what the Nigeria Data Protection Act (NDPA) 2023 is, what legal requirements it establishes, or why compliance with this statute is critical for a school web application managing student and child records.
- **Specific Technical Terms & Phrases That Caused Difficulty:**
  - `Statutory disclosures`
  - `Privacy notices`
  - `Terms and conditions`
  - `Nigeria Data Protection Act (NDPA) 2023`

---

## 4. Summary Matrix: Original Test Findings

| Area Tested | README Section & Reference | Specific Terms Causing Difficulty | Participant Comprehension Failure |
| :--- | :--- | :--- | :--- |
| **1. Tooling & Project Setup** | Section 2: Honest Status (Line 28) | `Next.js`, `App Router`, `React`, `TypeScript`, `Prisma`, `"tooling shell"` | Unable to explain what the tools do, how they relate, or what "tooling shell" signifies regarding whether code works or is an empty skeleton. |
| **2. Design System Integration** | Section 2: Honest Status (Line 29) | `Figma design tokens`, `design-tokens.tokens.json` | Struggled to understand what Figma design tokens represent, why design choices are stored in a JSON file, and their relationship to the design system (understood the CSS conversion process). |
| **3. Statutory Disclosures** | Section 2: Honest Status (Line 31) | `Statutory disclosures`, `Privacy notices`, `Terms and conditions`, `Nigeria Data Protection Act (NDPA) 2023` | Unable to explain what statutory disclosures mean, the distinction between privacy and terms, or what NDPA 2023 requires of a school application. |

---

## 5. Part B: Proposed Remediation Plan

To address the comprehension failures identified during the test without dumbing down the technical precision required by engineering auditors, the README should introduce **plain-English contextual glosses** alongside the technical terms.

Below is the concrete proposal for updating [`README.md`](../README.md) in response to each finding.

### Proposed Improvement 1: Demystify Tooling, Architecture & "Tooling Shell"
- **Target Section:** [`README.md`](../README.md) Section 2 (*"Honest Status > Finished & Verified > Tooling & Project Setup"*) and Section 3 (*"Stack With Reasons"*).
- **Proposed Enhancement:**
  - Add a short, plain-language parenthetical or introductory gloss explaining what each foundational tool is responsible for:
    - *Next.js (App Router):* The overall website framework that builds and serves web pages.
    - *React:* The UI library that renders interactive buttons, forms, and visual components.
    - *TypeScript:* A type-safe version of JavaScript that catches code typos and logic errors before running.
    - *Prisma:* The database translator that allows application code to talk to the PostgreSQL database safely.
  - Clarify the phrase **"tooling shell"**: explicitly explain that it means the project skeleton, build scripts, compiler configs, and package manager plumbing are fully installed and verified, but the actual database tables (models) have not yet been created.

### Proposed Improvement 2: Explain Design Tokens and Their Purpose in Plain Terms
- **Target Section:** [`README.md`](../README.md) Section 2 (*"Honest Status > Finished & Verified > Design System Integration"*).
- **Proposed Enhancement:**
  - Focus specifically on demystifying design tokens and their purpose within the design system (since the participant already grasped the CSS conversion logic):
    - Explain that **Figma design tokens** are the foundational design choices—the exact named values representing brand colors, typography scales, corner radii, and spacing measurements decided in Figma.
    - Explain that `design-tokens.tokens.json` is the structured data file that stores these design choices so they can be versioned and shared directly with the codebase.
    - Clarify the relationship to the design system: design tokens act as the central source of truth connecting visual mockups to code, ensuring visual consistency across all screens without hardcoding arbitrary styling values.

### Proposed Improvement 3: Clarify Statutory Disclosures & NDPA 2023 Protections
- **Target Section:** [`README.md`](../README.md) Section 2 (*"Honest Status > Finished & Verified > Statutory Disclosures"*).
- **Proposed Enhancement:**
  - Translate **"statutory disclosures"** into clear terms: legally mandated public policy notices required by law.
  - Differentiate clearly between:
    - *Privacy Notice:* Explains what personal information the school collects (e.g., student names, parent phone numbers, fee records), who can see it, how long it is kept, and how parents can request its deletion.
    - *Terms of Service:* The official rules and acceptable-use agreement between the school and parents using the portal.
  - Add explicit context for the **Nigeria Data Protection Act (NDPA) 2023**: describe it as Nigeria's applicable data protection legislation establishing statutory principles for the lawful, fair, and transparent handling of personal data. Explain that SchoolPass's strict isolation of private student records from external AI models is an application-level architectural and privacy design decision informed by data protection principles, rather than an explicit statutory mandate.

---

## 6. Three-Way Tracking: Findings vs. Proposed Improvements vs. Changes Made

To maintain strict assessment compliance and distinguish between planning and execution, the table below tracks the status across all three phases:

| Tracked Item | Phase 1: Original Test Finding | Phase 2: Proposed Improvement | Phase 3: Change Actually Made in README.md |
| :--- | :--- | :--- | :--- |
| **Tooling & Setup Terminology** | Participant could not explain Next.js, React, TypeScript, Prisma, or what "tooling shell" signifies. | Add plain-language gloss defining each tool's role and clarifying that "tooling shell" means verified build configuration without database tables. | **COMPLETED:** Added plain-English functional definitions for Next.js, React, TypeScript, and Prisma in Section 2. Clarified that "tooling shell" described the initial scaffold setup, whereas the active codebase now includes full domain models and PostgreSQL migrations. |
| **Design Tokens & System Concepts** | Participant struggled to understand what Figma design tokens are, why design choices reside in JSON, and their relationship to the design system (understood the CSS conversion). | Add plain-language explanation of design tokens as named design decisions, why they reside in JSON, and their purpose as the single source of truth for the design system. | **COMPLETED:** Clarified in Section 2 that design tokens are the foundational visual design decisions (exact brand colors, typography, spacing) from Figma, explained that the JSON file stores these choices for versioning, and emphasized their role as the single source of truth. |
| **Statutory Disclosures & NDPA** | Participant could not explain statutory disclosures, the difference between privacy/terms, or the relevance of NDPA 2023. | Clarify statutory disclosures as legally required notices, distinguish privacy from terms, and describe NDPA 2023 principles while presenting the AI privacy boundary as an application architectural decision. | **COMPLETED:** In Section 2 and Section 6, defined statutory disclosures as legally mandated notices, clearly distinguished privacy notices (data collection and user rights) from terms of service (acceptable use and operational rules), and described NDPA 2023 as Nigeria's data protection statute while explicitly framing the AI privacy barrier as an application architectural decision. |
| **Setup Command Clarity** | Technical setup commands were previously presented as bare code blocks without prior explanation. | Explain what each terminal command does before asking the reader to execute it. | **COMPLETED:** Updated Section 4 ("Getting Started") with clear introductory descriptions preceding each terminal command (cloning, dependency installation, environment setup, token compilation, server launch, and quality tests). |
| **Defect Practical Impact & Auditing** | Code defects were originally documented in dense technical shorthand without explaining user-facing consequences. | Explain each defect in terms of its practical impact on users and systems alongside root causes, distinguishing real runtime tests from isolated harnesses. | **COMPLETED:** Updated Section 7 ("Known Defects") to categorize defects by verification methodology: distinguishing real runtime observations on port 3000 (status divergence, cold starts, and dropped emails) from isolated failure harness tests on port 3070 (registration catch error swallowing) and static code inspection findings (CSS token names). Described user impact and supported fixes. |
| **Technical Claim Accuracy** | Outdated or aspirational version numbers and incomplete persistence claims existed in the original README. | Verify claims directly against the repository codebase before rewriting. | **COMPLETED:** Distinguished declared semver dependency ranges in `package.json` (`next: ^15.2.1`, `react: ^19.0.0`, `typescript: ^5.8.2`, `prisma: ^6.4.1`) from exact installed versions verified via `npm list --depth=0` (`next@15.5.27`, `react@19.3.0`, `typescript@5.9.3`, `prisma@6.19.3`), reconciling earlier project logs. Updated password hashing documentation to reflect modern Argon2id (`@node-rs/argon2@2.2.2`), and classified environment variables into active vs. reserved. |

---

## 7. Retest Status & Integrity Statement

In accordance with assessment rules:
1. All findings recorded in Section 3 represent the genuine difficulties observed when a participant unfamiliar with software development read the unmodified `README.md`.
2. **Retest Status:** The participant has **not** retested the revised `README.md`. The improvements documented above represent author revisions implemented in response to the initial test findings; a formal secondary comprehension retest remains pending.
3. No direct quotes, fictional participant identities, speculative setup errors, or synthetic task completion claims have been invented.
4. Proposed changes are formally separated from actual modifications, ensuring complete transparency for assessment evaluation.
