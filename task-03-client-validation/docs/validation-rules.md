# Client-Side Validation Rules Specification

## Overview
This specification details the four core categories of client-side validation rules implemented across SchoolPass authentication forms. All rules are designed to optimize user experience, prevent frustrating submission round-trips, and comply with WCAG 2.1 AA accessibility standards.

---

## Category 1: Empty Field Feedback on Blur

### Rationale & Timing
Showing validation errors before a user has had an opportunity to finish typing creates severe user friction and anxiety ("premature validation error antipattern"). Conversely, waiting until form submission to notify users that the first field was left blank causes disruptive context switches.

SchoolPass implements strict **On-Blur Evaluation** for empty mandatory fields:
1. When a field receives focus (`onFocus`), error states remain suppressed.
2. While the user is actively typing, empty-field errors are not triggered.
3. When the user moves focus away from the field (`onBlur`), if the input is empty or contains only whitespace, the field is marked as "touched" and the error message immediately displays.

### Form Field Implementation Matrix:
| Field | Trigger | Error Message | Linked Evidence |
|---|---|---|---|
| Full Name | `onBlur` | `"Full name is required"` | `evidence/05-empty-field-error.png` |
| Email Address | `onBlur` | `"Enter a valid email address"` | `evidence/05-empty-field-error.png` |
| Student Number | `onBlur` | `"Enter your child's student number."` | `evidence/05-empty-field-error.png` |
| Password | `onBlur` | `"Enter a password."` | `evidence/05-empty-field-error.png` |
| Confirm Password | `onBlur` | `"Confirm your password."` | `evidence/05-empty-field-error.png` |

---

## Category 2: Length and Structural Validation

### 2.1 Full Name Structural Rule (`validateFullName`)
In school communication, records, and gate arrival confirmations, having only a single name (e.g. "Chinedu") leads to guardian ambiguity in administrative registries.

**Rule Definition**:
```typescript
export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Full name is required';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'Please enter your first and last name';
  }
  for (const part of parts) {
    if (part.length < 2) {
      return 'Each name must be at least 2 characters long';
    }
  }
  return null;
}
```
- **Rejects**: `"A"`, `"Chinedu"`, `"C. Okafor"`.
- **Accepts**: `"Chinedu Okafor"`, `"Mary-Jane Watson"`, `"Dr. Aliyu Mohammed"`.
- **Evidence**: `evidence/06-length-rule-blocking.png`.

### 2.2 Password Complexity and Breach Screening
Passwords must meet high entropy requirements to safeguard student academic and financial records:
- **Length**: Minimum 8 characters, maximum 128 characters.
- **Complexity**: Requires a combination of uppercase letters, lowercase letters, numbers, and symbols.
- **Pwned Password Verification**: Integrated with HaveIBeenPwned k-anonymity SHA-1 API. Passwords known to have been leaked in public breaches are rejected with:
  `"This password has appeared in a known data breach. Please choose a different, more secure password."`
- **Confirmation Match**: `confirmPassword` must match `password` identically.

---

## 3. Category 3: Email Validation Timing Divergence (Signup vs Login)

SchoolPass intentionally differentiates email validation timing between registration and sign-in:

### 3.1 Registration (Real-Time Feedback)
- **Timing**: `onChange` (real-time as the user types).
- **Purpose**: Registration creates an immutable identity record. Notifying the user of syntax errors (e.g., missing `@`, invalid domain, or trailing commas) while their focus is still in the field prevents downstream email verification failures.
- **Evidence**: `evidence/07-email-realtime-signup.png`.

### 3.2 Login (Validation on Submit)
- **Timing**: `onSubmit` (only when the user clicks "Sign In" or presses Enter).
- **Purpose**: On authentication, typing-time validation distracts returning users who are quickly autofilling or typing saved credentials. Deferring syntax validation until form submission allows browser password managers to autofill cleanly and avoids prematurely flagging legitimate credentials.
- **Evidence**: `evidence/08-email-on-submit-login.png`.

---

## 4. Category 4: Accessible Form Controls & WAI-ARIA Architecture

### 4.1 Focus Indicators (WCAG 2.4.7 & 1.4.11)
- Input elements display a high-contrast 2px solid outline with a 2px offset on `:focus`:
  - Normal state: `2px solid var(--color-roles-primary)` (#1e3a8a).
  - Error state: `2px solid var(--color-roles-error)` (#b91c1c).
- Complies with WCAG 1.4.11 Non-text Contrast (minimum 3:1 contrast ratio against adjacent surface backgrounds).

### 4.2 Semantic Screen Reader Linkages
- Every input has an explicit `<label htmlFor={id}>` containing readable text.
- When an error is active:
  - The `<input>` receives `aria-invalid="true"`.
  - The `<input>` receives `aria-describedby="{id}-error"`.
  - The error container has `id="{id}-error"` and `role="alert"`.
- Assistive technologies immediately announce the error upon blur without requiring manual navigation down the DOM.

### 4.3 Accessible Submit Action (`aria-disabled="true"`)
- The primary action button remains in the tab order (`tabIndex={0}`) with `aria-disabled="true"`.
- Prevents the dreaded "silent failure" where users press Tab, skip the submit button, and cannot discover why their registration is blocked.
- Evidence: `evidence/12-accessibility-tree-audit.txt` and `evidence/14-button-disabled-version.png`.
