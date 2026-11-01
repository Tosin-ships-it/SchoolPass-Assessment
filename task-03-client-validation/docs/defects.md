# Task 3 Defect & Remediation Log

## Executive Summary
This document catalogs the defects discovered, analyzed, and remediated during Task 3 of the SchoolPass assessment. Each defect is classified by severity, linked to relevant WCAG/CWE standards, and cross-referenced with verified test evidence.

---

## Defect Inventory

### Defect 1: Multi-Page Authentication Route Fragmentation
- **Classification**: Architectural / Usability
- **Severity**: Medium
- **Location**: `src/app/auth/*`
- **Symptom**: Authentication was split across six independent App Router routes (`/auth/login`, `/auth/register`, `/auth/staff`, etc.), resulting in a bloated 15-page application. Navigating between views caused full browser reloads, visual flash, and loss of transient form input.
- **Root Cause**: Early scaffold scaffolding created redundant wrapper routes around individual form components instead of utilizing a unified client-side view state.
- **Remediation**: Consolidated all authentication views into `/auth?view=<view-name>` wrapped with Next.js `Suspense` and `useSearchParams`. Configured `next.config.js` with non-breaking rewrites.
- **Evidence**: `evidence/01-page-count-before.txt` (15 pages) vs `evidence/02-page-count-after.txt` (9 pages).

---

### Defect 2: Native Disabled Submit Button Accessibility Barrier
- **Classification**: Accessibility (WCAG 2.1.1, 2.4.7, 4.1.2)
- **Severity**: High
- **Location**: `src/app/auth/components/AuthFormElements.tsx`, `ParentRegisterForm.tsx`
- **Symptom**: The primary registration button used native `disabled={!isFormValid}`. Keyboard users tabbing through the form skipped the submit button entirely. Users clicking the button received complete silence with zero explanation of what required fields were missing.
- **Root Cause**: Reliance on HTML native `disabled` attribute rather than WAI-ARIA accessible states.
- **Remediation**: Implemented `PrimaryButton` with `aria-disabled="true"` and `tabIndex={0}`. Clicking or activating with Space/Enter triggers a polite screen-reader announcement and programmatically shifts focus to the missing requirement.
- **Evidence**: `evidence/13-button-hidden-version.png`, `evidence/14-button-disabled-version.png`, and `evidence/11-announcement-transcripts.txt`.

---

### Defect 3: Sensitive Admission Format Leak in Placeholder
- **Classification**: Security / Information Disclosure (CWE-200)
- **Severity**: High
- **Location**: `src/app/auth/register/ParentRegisterForm.tsx`
- **Symptom**: The Student Number input contained `placeholder="e.g. SP-2026-0001"`. This exposed the exact two-letter prefix (`SP`), intake session year (`2026`), hyphen delimiter, and 4-digit zero-padding format (`0001`–`9999`), reducing the enumeration search space to just 9,999 records per session.
- **Root Cause**: Use of sensitive administrative formatting syntax as placeholder helper text.
- **Remediation**: Sanitized placeholder to neutral instructional text: `placeholder="Enter student number from admission letter"`.
- **Evidence**: Verified in DOM inspection (`inspect_register_dom.js`) and documented in `docs/enumeration.md`.

---

### Defect 4: Missing Screen Reader Error Announcements & Unlinked Password Rules
- **Classification**: Accessibility (WCAG 1.4.1, 3.3.1, 4.1.3)
- **Severity**: Medium
- **Location**: `src/app/auth/components/AuthFormElements.tsx`, `ParentRegisterForm.tsx`
- **Symptom**: Validation errors and password complexity requirements were rendered as unassociated visual spans beneath inputs. Sighted users saw red text, but screen reader users received zero auditory notification of errors or requirements upon focusing and blurring fields. Furthermore, error states relied solely on red hue without non-color indicators.
- **Root Cause**: Missing `role="alert"`, missing `aria-describedby` linkage on inputs, and lack of visual icon glyphs for color independence.
- **Remediation**: Linked every input to its error message container and helper guidance via composite `aria-describedby="{id}-error {id}-helper"`, added `role="alert" aria-live="polite"` to active errors, paired red error styling with an inline SVG caution icon, and applied `aria-invalid="true"`.
- **Evidence**: `evidence/05-empty-field-error.png`, `evidence/11-announcement-transcripts.txt`, and `evidence/12-accessibility-tree-audit.txt`.

---

### Defect 5: Terms Checkbox Omitted from Client State & Lacking aria-required
- **Classification**: Accessibility & Compliance (NDPA 2023, WCAG 3.3.2)
- **Severity**: Medium
- **Location**: `src/app/auth/register/ParentRegisterForm.tsx`
- **Symptom**: The Terms of Service and Privacy Policy checkbox was not integrated into `isFormValid` and lacked the `aria-required="true"` attribute, failing to indicate that consent was legally mandatory.
- **Root Cause**: Decoupled state management between legal consent checkbox and form submission logic.
- **Remediation**: Added `acceptedTerms` to `isFormValid`, added `aria-required="true"` to the input, and programmed `handleSubmit` to announce missing terms acceptance and focus the checkbox.
- **Evidence**: `evidence/14-button-disabled-version.png` and `docs/terms-note.md`.

---

### Defect 6: Inadequate Focus Outline Contrast & Missing Offset
- **Classification**: Accessibility (WCAG 1.4.11, 2.4.7)
- **Severity**: Medium
- **Location**: `src/app/auth/components/AuthFormElements.tsx`
- **Symptom**: Form input focus indicators relied on a subtle CSS glow that lacked sufficient 3:1 contrast against adjacent borders, rendering keyboard focus tracking nearly impossible for low-vision users.
- **Root Cause**: Reliance on aesthetic box-shadow styling instead of WCAG-compliant outline tokens.
- **Remediation**: Upgraded focus styling to `outline: 2px solid var(--color-roles-primary)` with `outline-offset: 2px` (and `var(--color-roles-error)` during error states).
- **Evidence**: `evidence/12-accessibility-tree-audit.txt`.
