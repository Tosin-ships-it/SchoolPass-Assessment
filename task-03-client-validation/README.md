# Task 3: The Form, Attacked from Both Sides

**Assessment Deliverables Directory:** `SchoolPass-Assessment/task-03-client-validation`  
**Application Code Repository:** `SchoolPass` (`C:\Users\gbola\Desktop\SchoolPass`)  
**Status:** Completed & Fully Verified (All 214 tests passing, 10 documentation deliverables, 17 evidence records)

---

## Executive Overview
Task 3 evaluates the design, accessibility, ergonomics, and security boundaries of web forms by attacking them from both directions:
1. **The Human / Assistive Direction**: Ensuring that form validation assists legitimate human users and assistive technology users (screen readers, keyboard navigators) without creating cognitive traps, silent failures, or confusing UX roadblocks.
2. **The Adversarial Direction**: Attacking the form from the browser (DOM manipulation, console script execution) and from the network (direct API requests via `curl` bypassing the client entirely), rigorously proving that client-side validation is solely an ergonomic affordance and never a security control.

---

## Directory Structure

```
task-03-client-validation/
├── README.md                               # This master deliverables index
├── demo/
│   └── number-input-demo.html              # Isolated evaluation harness: type="number" vs controlled type="text"
├── docs/
│   ├── spa-rationale.md                    # Architecture rationale: 15 multi-page routes consolidated into 9
│   ├── field-justification.md              # Input type evaluation & required two-sentence justification
│   ├── validation-rules.md                 # 4 validation categories (blur, length/structure, email, accessibility)
│   ├── terms-note.md                       # Terms acceptance ergonomics & accessible aria-disabled button pattern
│   ├── enumeration.md                      # Security vulnerability analysis: format leak in placeholder (SP-2026-0001)
│   ├── accessibility-audit.md              # Complete WCAG 2.1 AA audit & compliance matrix
│   ├── client-side-is-not-security.md      # Security architectural proof & direct curl bypass analysis
│   ├── rollback.md                         # Git rollback strategies: git revert vs git reset in production
│   ├── defects.md                          # Comprehensive defect and remediation log (6 major defects)
│   └── interview-answers.md                # Written answers to all 14 interview defense questions (~200 words each)
└── evidence/
    ├── 01-page-count-before.txt             # Baseline page count: 15 pages (7 auth pages)
    ├── 02-page-count-after.txt              # Consolidated page count: 9 pages (1 auth SPA route)
    ├── 03-url-states.png                   # Visual evidence of instant URL query state switching
    ├── 04-form-switch-logs.txt             # Dev server request log verifying zero HTTP round-trips
    ├── 05-empty-field-error.png            # Visual evidence of on-blur error evaluation
    ├── 06-length-rule-blocking.png         # Visual evidence of full name two-word structural rule blocking
    ├── 07-email-realtime-signup.png        # Visual evidence of real-time email validation on signup
    ├── 08-email-on-submit-login.png        # Visual evidence of submit-time email validation on login
    ├── 09-number-input-annoying.png        # Demonstration of 0400 leading-zero loss and stepper arrow flaw
    ├── 10-text-input-working.png           # Demonstration of controlled text input accepting clean values
    ├── 11-announcement-transcripts.txt     # Human manual Windows Narrator audit & WAI-ARIA reference transcripts
    ├── 12-accessibility-tree-audit.txt     # Serialized browser accessibility tree snapshot
    ├── 13-button-hidden-version.png        # Visual evidence of rejected hidden submit button anti-pattern
    ├── 14-button-disabled-version.png      # Visual evidence of accessible aria-disabled button with live guidance
    ├── 15-form-attack-results.txt          # Browser UI and DOM manipulation attack results
    ├── 16-direct-request-command-and-response.txt # Raw curl command and HTTP 200 response bypassing frontend
    └── 17-commit-list-and-rollback.txt     # Sandbox Git commit history and non-destructive revert demonstration
```

---

## Core Engineering Achievements

### 1. Single-Route SPA Authentication Consolidation
- Consolidated six fragmented page routes (`/auth/login`, `/auth/register`, `/auth/staff`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`) into a unified, high-performance query-driven view:
  ```
  /auth?view={login | register | staff | forgot-password | reset-password | verify-email}
  ```
- Reduced total application pages from 15 to 9 without breaking legacy links, deep-link cryptographic tokens, or role session boundaries (configured via declarative rewrites in `next.config.js`).

### 2. Four Client Validation Categories
- **Empty Fields on Blur**: Suppressed while typing; triggered immediately upon blur (`evidence/05-empty-field-error.png`).
- **Length & Structure**: Enforced two-word requirement (`validateFullName`) with each word >= 2 characters, blocking single names like "Alice" (`evidence/06-length-rule-blocking.png`).
- **Email Timing Divergence**: Live real-time feedback on registration (`evidence/07-email-realtime-signup.png`) vs submit-time feedback on login (`evidence/08-email-on-submit-login.png`).
- **Accessibility & ARIA**: 2px high-contrast focus rings (`outline-offset: 2px`), semantic `<label>` associations, `aria-invalid="true"`, `aria-describedby` error linkages, and `role="alert"` announcements.

### 3. Accessible Submit Pattern (`aria-disabled="true"`)
- Neutralized the pervasive anti-pattern of native disabled buttons (`<button disabled>`) which drop out of keyboard tab order and fail silently.
- Maintained the submit button in natural tab order (`tabIndex={0}`) with `aria-disabled="true"`.
- Wired premature clicks and Enter key submissions to announce explanatory guidance via an accessible live region (`role="status" aria-live="polite"`) and programmatically shift focus directly to the unaccepted terms checkbox.

### 4. Input Type Evaluation (Isolated Assessment Harness)
- Tested and demonstrated why native `<input type="number">` is flawed for non-quantitative identifiers (causes leading zero truncation `0400` -> `400`, stepper buttons, scroll mutation).
- Implemented controlled `<input type="text" inputmode="numeric">` in an isolated test harness hosted strictly within the assessment workspace (`demo/number-input-demo.html`).
- Authored the required two-sentence justification in `docs/field-justification.md`.

### 5. Sensitive Format Leak Elimination
- Eliminated `placeholder="e.g. SP-2026-0001"` which collapsed the attacker's search space to only 9,999 records per session.
- Replaced with neutral instructional placeholder: `placeholder="Enter student number from admission letter"`.

### 6. Empirical Proof: "Client-Side is Not Security"
- Transmitted a direct HTTP request via `curl` to `/api/auth/register` with a single-word name (`"BypassUser"`), omitting terms acceptance and password confirmation.
- Received HTTP 200 OK with a signed verification token, proving that client validation provides zero security against adversaries.

### 7. Safety Constraints & Non-Destructive Rollback
- In strict adherence to user instructions, zero destructive git operations (`git reset`, `git revert`, `git commit`) were executed against `SchoolPass`.
- Rollback was demonstrated inside an isolated temporary Git sandbox in `task-03-client-validation/rollback-demo`.
- All 214 unit and integration tests in `SchoolPass` pass with 100% success (`ℹ pass 214, ℹ fail 0`).
