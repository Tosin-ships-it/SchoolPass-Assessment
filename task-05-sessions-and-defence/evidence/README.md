# Task 5 Evidence Index & Verification Catalog

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5 & Deliverable Directory `evidence/`  
**Primary Application Repository:** `C:\Users\gbola\Desktop\SchoolPass`  
**Assessment Repository:** `C:\Users\gbola\Desktop\SchoolPass-Assessment`

---

## 1. Master Evidence Inventory

| Item ID | Item Name | Artifact File(s) | Verification Method | Status & Scope |
|---|---|---|---|---|
| **01** | Distinct Session Identifiers Across Logins | [`01-two-session-ids.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/01-two-session-ids.txt) | Automated Test (`test-real-auth.mjs`) | **Verified in Real Application** (`crypto.ts`) |
| **02** | Session Cookie Security Attributes | [`02-cookie-flags.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/02-cookie-flags.png) | Browser CDP Capture & Code Audit | **Captured in Browser** (`HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=7d`) |
| **03** | Soft Gating Flow Trace | [`03-soft-gating-flow.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/03-soft-gating-flow.txt) | Automated Test (`test-soft-gating.mjs`) | **Implemented on `feat/soft-gating`** |
| **04** | Hard Gating Registration Interface | [`04-hard-gating-flow.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/04-hard-gating-flow.png) | Browser CDP Capture on `/auth?view=register` | **Captured in Browser** (Shipped Registration Flow) |
| **05** | Generic Auth Error Parity | [`05-generic-errors-both-cases.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/05-generic-errors-both-cases.png) | Browser CDP Capture on `/auth?view=login` | **Captured in Browser** (Anti-Enumeration "Invalid email or password.") |
| **06** | Two Users Sharing One Browser | [`06-two-users-one-browser.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/06-two-users-one-browser.txt) | Cookie Jar Overwrite Test (`test-real-auth.mjs`) | **Verified in Real Application** (`setSessionCookie`) |
| **07 & 08** | Server-Side Logout Database Row Deletion | [`07-08-session-row-present-deleted.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/07-08-session-row-present-deleted.txt) | SQL Session Inspection (`stage5-logout.test.mjs`) | **Verified in Real Application** (`deleteSessionRecord`) |
| **09** | Logout Network Failure Desynchronization | [`09-logout-network-failure.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/09-logout-network-failure.txt) | Defect Simulation & Reproduction | **Disclosed Architectural Defect** (DEF-05-01) |
| **10** | Logout Network Failure Fixed | [`10-logout-edge-case-fixed.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/10-logout-edge-case-fixed.txt) | Resilient Form Logout (HTTP 303) | **Verified in Real Application** (`records/page.tsx`) |
| **11** | Password Reset Revokes All Active Sessions | [`11-reset-kills-other-session.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/11-reset-kills-other-session.txt) | Multi-Device Invalidation Audit | **Verified in Real Application** (`deleteAllUserSessions`) |
| **12** | Deletion Request Immediately Locks Account | [`12-deletion-request-locks-account.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/12-deletion-request-locks-account.txt) | Automated Test (`test-deletion-lifecycle.mjs`) | **Implemented in Code; Awaiting Neon Migration Approval** |
| **13** | Scheduled Purge Job Run 1 (Counts) | [`13-scheduled-job-run-one.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/13-scheduled-job-run-one.txt) | Batch Purge & CAMA Ledger Retention | **Implemented in `run-deletion-purge.mjs`; Awaiting Migration Approval** |
| **14** | Scheduled Purge Job Run 2 (Idempotency) | [`14-scheduled-job-run-two.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/14-scheduled-job-run-two.txt) | Second Run Proving Zero Changes | **Verified in Code & Tested Locally** |
| **15** | State Management Email Pre-fill | [`15-state-management-working.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/15-state-management-working.png)<br>[`15-state-management-1-login-input.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/15-state-management-1-login-input.png)<br>[`15-state-management-2-prefilled.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/15-state-management-2-prefilled.png) | Browser CDP Sequence on Local Dev Server | **Captured in Browser** (Login input $\rightarrow$ Forgot password prefill) |
| **16** | Copied-Link Administrative Refusal | [`16-admin-route-refused.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/16-admin-route-refused.png) | Browser CDP Capture on `/staff-accounts` | **Captured in Browser** (RBAC middleware redirection gate) |
| **17** | Published Article Verification | [`17-published-article-screenshot.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/17-published-article-screenshot.png) | Live Public Platform Publication | **Captured & Verified** (LinkedIn Articles) |
| **18** | Walkthrough Video Recording | `18-walkthrough.mp4` | 10-Minute Technical Defense | Optional (Bonus Marks) |

---

## 2. Browser Verification Summary & Execution Environment

Browser evidence was captured using native Chrome/Edge DevTools Protocol (CDP) connected to the local development server running on `http://localhost:3000`:

1. **Evidence 15: Client-Side State Transfer & Prefill:**
   - [`15-state-management-1-login-input.png`](15-state-management-1-login-input.png): Shows parent typing email address (`aisha.bello@example.com`) on `/auth?view=login`.
   - [`15-state-management-2-prefilled.png`](15-state-management-2-prefilled.png): Shows clicking "Forgot password?" navigating to `/auth?view=forgot-password&email=aisha.bello%40example.com` and the email field automatically prefilled.
   - [`15-state-management-working.png`](15-state-management-working.png): Primary artifact verifying state propagation between authentication components.
2. **Evidence 16: Administrative Route RBAC Refusal:**
   - [`16-admin-route-refused.png`](16-admin-route-refused.png): Shows an unauthenticated user attempting to navigate to `/staff-accounts`, being intercepted by the server-side RBAC boundary, and redirected to `/auth/staff-login?returnUrl=/staff-accounts`.
3. **Evidence 04: Hard Gating Registration View:**
   - [`04-hard-gating-flow.png`](04-hard-gating-flow.png): Shows the parent registration form on `/auth?view=register` requiring child student number, terms consent, and email verification notice.
4. **Evidence 05: Generic Auth Error Parity:**
   - [`05-generic-errors-both-cases.png`](05-generic-errors-both-cases.png): Shows generic error banner `Invalid email or password.` on `/auth?view=login`, preventing account enumeration.
5. **Evidence 02: OWASP Session Cookie Attributes:**
   - [`02-cookie-flags.png`](02-cookie-flags.png): Demonstrates session cookie configuration (`schoolpass_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=604800s`).

---

## 3. Blocked Browser Flows & Minimum Safe Next Step

Per the assessment safeguards ("*If a flow cannot be demonstrated because the local database schema or environment is not ready, do not fake it, bypass it, or substitute a text trace for a screenshot. Record the exact blocker and identify the minimum safe next step.*"), the following flows remain paused before live browser recording:

| Flow | Exact Blocker | Minimum Safe Next Step |
|---|---|---|
| **Soft-gating persistent banner & link barrier on `/records`** | Requires an active database session for an unverified parent account (`emailVerifiedAt = null`). Navigating to `/records` without a valid database session redirects to `/auth/login`. Writing test parents directly to the production Neon database is prohibited by the explicit safety boundary. | User approves configuring a local PostgreSQL container or dedicated isolated test branch in Neon to seed an unverified test parent and record the banner and 403 barrier. |
| **Account deletion request & 7-day grace-period notice in UI** | The deletion lifecycle requires the new database columns: `isLocked`, `scheduledDeletionAt`, and `anonymizedAt`. The SQL migration `20261102_account_deletion_lifecycle_and_restrict_payments` has been prepared locally but cannot be executed against Neon without explicit user sign-off. | User reviews and approves the migration plan presented in `docs/production-deletion-proposal.md`, allowing the schema to be migrated on the database before UI execution. |
| **Antigravity Browser Subagent Video Recording** | The internal Antigravity Browser manager encountered a 404 error attempting to download Playwright driver binaries from AzureEdge (`playwright-1.57.0-win32_x64.zip`) in the restricted offline sandbox environment. | Use native CDP headless Chromium/Edge capture (which executed successfully and captured all `.png` artifacts above) or provide external network access to the Playwright driver bucket. |
