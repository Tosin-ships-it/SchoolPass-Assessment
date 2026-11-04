# Task 5 Defects Register & Engineering Remediation Log

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5 & Deliverable `docs/defects.md`

---

## Defect Summary Index

| Defect ID | Severity | Category | Status | Summary |
|---|---|---|---|---|
| **DEF-05-01** | **Critical** | Session Lifecycle | **Resolved** | Logout network failure desynchronization leaves database session active |
| **DEF-05-02** | **High** | Authorization | **Resolved** | Edge Middleware non-authoritative boundary allows role-elevation attempt |
| **DEF-05-03** | **Critical** | Compliance / Schema | **Resolved** | Prisma `onDelete: Cascade` on `Payment` destroys financial ledgers on user deletion |
| **DEF-05-04** | **Medium** | State Management | **Resolved** | Failed login email lost across view transition, forcing manual retyping |
| **DEF-05-05** | **Medium** | Reliability | **Open / Documented** | Scheduled purge engine lacks persistent catch-up queue during server restarts |

---

## Detailed Defect Reports

### DEF-05-01: Logout Network Failure Desynchronization
- **Severity:** Critical (Session Hijacking Exposure)
- **Component:** [`src/app/api/auth/logout/route.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/api/auth/logout/route.ts)
- **Reproduction Steps:**
  1. User authenticates on a shared school workstation.
  2. User clicks "Sign Out".
  3. Client-side script dispatches an asynchronous `fetch('/api/auth/logout', { method: 'POST' })`.
  4. Network connection drops or throttles during packet transmission.
  5. UI transition script executes optimistically and redirects user to `/auth/login`.
- **Observed Behavior:** The user believes they are signed out. However, the server never received the request; the session record in PostgreSQL remains active for up to 7 days.
- **Root Cause:** Treating client-side asynchronous fetch as sufficient for security-critical state transitions.
- **Remediation Applied:** Replaced client-side AJAX logout with a native HTML `<form action="/api/auth/logout" method="POST">` responding with `HTTP 303 See Other`. The browser handles network retry semantics natively and unconditionally wipes cookie headers.

---

### DEF-05-02: Edge Middleware Sole Authorization Hole
- **Severity:** High (Broken Object-Level Authorization)
- **Component:** [`src/middleware.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/middleware.ts)
- **Reproduction Steps:**
  1. Parent logs into portal and receives valid cookie: `schoolpass_session=<cuid>.<hmac>`.
  2. Parent copies and pastes an administrative URL into the address bar: `/staff-accounts`.
  3. Naive middleware checks `if (isStaffRoute && !sessionCookie)`.
  4. Because `sessionCookie` is present and non-empty, middleware allows the request through.
- **Observed Behavior:** If the page component fails to perform an independent role check, an ordinary parent would see administrative account creation tools.
- **Root Cause:** Treating Edge Middleware cookie inspection as an authoritative authorization boundary rather than an optimistic routing fence.
- **Remediation Applied:** Enforced Tier 2 authorization in [`src/app/(staff)/layout.tsx`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/(staff)/layout.tsx) via `getSession()`. The layout queries PostgreSQL directly, verifies `session.role === 'staff' || session.role === 'admin'`, and throws an immediate `redirect('/auth/staff-login')` if a parent attempts access.

---

### DEF-05-03: Prisma Cascade Deletion Destroys Financial Ledgers
- **Severity:** Critical (Violation of CAMA 2020 §375(2))
- **Component:** [`prisma/schema.prisma`](file:///c:/Users/gbola/Desktop/SchoolPass/prisma/schema.prisma) (`Payment` relation)
- **Reproduction Steps:**
  1. A parent with historical tuition payment records requests account deletion.
  2. An engineer or naive endpoint executes `prisma.parent.delete({ where: { id: parentId } })`.
- **Observed Behavior:** Prisma's relational cascade (`parent Parent @relation(fields: [parentId], references: [id], onDelete: Cascade)`) drops all associated records in `payments`, permanently erasing corporate accounting records.
- **Root Cause:** Schema configured with `onDelete: Cascade` on financial ledger models.
- **Remediation Applied:** Replaced hard SQL delete with **Selective Identity Anonymisation**. The `Parent` record is retained with personal PII overwritten (`Anonymised Parent <hash>`), foreign keys remain valid, and financial ledgers are preserved intact down to the kobo.

---

### DEF-05-04: Failed Login State Loss Across Form Transitions
- **Severity:** Medium (Friction / Drop-off)
- **Component:** [`src/app/auth/login/ParentLoginForm.tsx`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/auth/login/ParentLoginForm.tsx)
- **Reproduction Steps:**
  1. User enters 30-character email: `babatunde.lawal@schoolpass.test`.
  2. Authentication fails (incorrect password).
  3. User clicks "Forgot your password?".
  4. The forgot password view mounts with an empty email input.
- **Observed Behavior:** User is forced to re-type their full email address on a mobile device.
- **Root Cause:** Disjointed component state across authentication sub-views.
- **Remediation Applied:** Enhanced the navigation link to pass current input via URL query parameter (`/auth?view=forgot-password&email=...`), enabling `ForgotPasswordForm` to mount with pre-filled state at zero backend cost.

---

### DEF-05-05: Purge Cron Missing Heartbeat Catch-Up on Server Offline
- **Severity:** Medium (Operational Latency)
- **Component:** [`task-05-sessions-and-defence/scripts/run-deletion-lifecycle.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/scripts/run-deletion-lifecycle.mjs)
- **Observed Behavior:** If the server hosting the daily purge cron experiences downtime during the exact execution window (e.g. 02:00 AM UTC), the scheduled job will not run until the following day.
- **Root Cause:** Reliance on stateless cron scheduling rather than a persistent, stateful job queue.
- **Status:** Open / Documented in [`docs/what-i-do-not-know.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/what-i-do-not-know.md). Planned for production deployment via BullMQ on Redis.
