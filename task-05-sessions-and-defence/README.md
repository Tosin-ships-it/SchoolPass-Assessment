# Task 5: Sessions, Compliance, and the Defence

**Assessment Component:** Task 5 of 5  
**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Target Submission Link:** [task-05-sessions-and-defence](https://github.com/Tosin-ships-it/SchoolPass-Assessment/tree/main/task-05-sessions-and-defence)  
**Primary Application Repository:** `C:\Users\gbola\Desktop\SchoolPass`  
**Assessment Repository:** `C:\Users\gbola\Desktop\SchoolPass-Assessment`

---

## 1. Assessment Objectives

Task 5 tests the production-grade boundary between application security, session lifecycle, legal compliance, and technical defense:
1. **Server-Side Session Management:** Implement secure, distinct session identifiers across logins, OWASP-compliant cookie flags (`HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=7d`), and complete two-user browser isolation.
2. **Server-Side Logout & Edge Cases:** Ensure logout irrevocably deletes the session row on the server rather than performing a cosmetic client-only redirect; reproduce and remediate the network failure logout desynchronization edge case.
3. **Session Revocation on Password Reset:** Invalidate all active sessions and cookies across devices immediately upon password reset.
4. **Lawful Account Deletion:** Implement a 4-stage lifecycle (Soft delete, 7-day Grace period, Hard purge & anonymisation, Scheduled background job) with guaranteed idempotency and start/finish transaction counts, strictly adhering to Nigeria Data Protection Act (NDPA 2023 §34) and Companies and Allied Matters Act (CAMA 2020 §375).
5. **Multi-Tier Authorization Boundary:** Enforce role-based access control (RBAC) across protected administrative routes, ensuring Edge Middleware is treated strictly as an optimistic routing fence while authoritative authorization is enforced in Server Component Layouts and Server Actions.
6. **Data Retention & Privacy Architecture:** Formulate the school's comprehensive retention matrix, resolve the legal conflict between right to erasure and financial retention, and articulate unkept promises in plain language.
7. **The Defence & Viva:** Defend all architectural decisions, citing verified cross-task metrics and personal engineering mistakes.

---

## 2. Implementation Reality Matrix

To maintain rigorous engineering honesty, this assessment clearly separates what is implemented directly in the production SchoolPass application from what is demonstrated in the isolated sandbox:

| Architectural Component | Production App (`SchoolPass`) | Sandbox / Demonstration (`task-05...`) | Status & Rationale |
|---|---|---|---|
| **Client-Side Email Pre-fill** | **Fully Implemented** (`ParentLoginForm.tsx`, `ForgotPasswordForm.tsx`, `auth/page.tsx`) | Unit test suite (`test-prefill.mjs`) | Verified: 4/4 passing tests, 0 typecheck errors. |
| **Session Token Cryptography** | **Fully Implemented** (`src/lib/auth/crypto.ts`) | Verified via `test-real-auth.mjs` | Verified: HMAC-SHA256, constant-time equality, tamper rejection. |
| **OWASP Session Cookie Flags** | **Fully Implemented** (`src/lib/auth/index.ts#L109`) | Verified via `test-real-auth.mjs` | Verified: `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=7d`. |
| **Multi-Tier Route Authorization** | **Fully Implemented** (`StaffLayout.tsx`, `middleware.ts`, `staff-rbac.test.mjs`) | Verified via `test-real-auth.mjs` | Verified: 28/28 tests passing in `staff-rbac.test.mjs`. |
| **Logout & Edge Case Fix** | **Fully Implemented** (`records/page.tsx`, `logout/route.ts`) | Verified via `stage5-logout.test.mjs` | Verified: 9/9 tests passing in `stage5-logout.test.mjs`. |
| **Password Reset Invalidation** | **Fully Implemented** (`resetPassword` calls `deleteAllUserSessions`) | Contract verified in `test-real-auth.mjs` | Verified in application source code. |
| **Hard Gating Shipped Flow** | **Fully Implemented** (`ParentRegisterForm.tsx`, `auth/page.tsx`) | Documented in `docs/gating.md` | Verified in application source code. |
| **Lawful Account Deletion** | **Fully Implemented in Application Code** (`store.ts`, `index.ts`, `api/auth/delete-account`, `api/auth/cancel-deletion`, `scripts/run-deletion-purge.mjs`) | Verified via real test suite (`test-deletion-lifecycle.mjs`) & SQLite sandbox | **Implemented in Code & Tested Locally:** 11/11 tests pass, 0 typecheck errors. Local migration prepared; paused before modifying live Neon database. |

---

## 3. Deliverables Checklist

| Deliverable | Location | Status | Description |
|---|---|---|---|
| **Task 5 README** | [`README.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/README.md) | Completed | Master specification, checklist, and reality matrix |
| **Privacy Policy** | [`privacy.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/privacy.md) | Completed | Plain-language privacy terms, 7-day grace period, purge/retention terms |
| **Privacy Broken Promise Draft** | [`privacy-draft-with-broken-promise.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/privacy-draft-with-broken-promise.md) | Completed | Draft containing the unfulfillable front-desk promise and removal rationale |
| **Session Architecture** | [`docs/sessions.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/sessions.md) | Completed | Security attributes, cookie flags, multi-tier boundaries, and logout edge cases |
| **Gating Architecture** | [`docs/gating.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/gating.md) | Completed | Tradeoff analysis: Soft gating (warning banner) vs. Hard gating (strict block) |
| **Retention Matrix** | [`docs/retention-matrix.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/retention-matrix.md) | Completed | Table-by-table retention, legal basis, backup sync, and NDPA vs CAMA conflict |
| **Production Deletion Proposal** | [`docs/production-deletion-proposal.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/production-deletion-proposal.md) | Completed | Safe migration specification protecting CAMA payments and Neon integrity |
| **State Management** | [`docs/state-management.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/state-management.md) | Completed | Local state vs library justification, forgot-password email pre-fill |
| **Primary Research Interview** | [`docs/interview-with-owner.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/interview-with-owner.md) | Blocked (Human Input) | 20-minute structured interview protocol with school proprietor |
| **Engineering Handbook** | [`docs/handbook.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/handbook.md) | Completed | Seven sections covering real engineering mistakes encountered across tasks |
| **What I Do Not Know** | [`docs/what-i-do-not-know.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/what-i-do-not-know.md) | Completed | 8 explicit technical uncertainties and limits of current architecture |
| **Defects Register** | [`docs/defects.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/defects.md) | Completed | Disclosed defects (DEF-05-01 through DEF-05-05) with remediations |
| **Viva Interview Defence** | [`docs/interview-answers.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/interview-answers.md) | Completed | 22 comprehensive viva question answers (~200 words each) with cross-task numbers |
| **Technical Article Draft** | [`docs/technical-article-draft.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/technical-article-draft.md) | Completed (Ready to Publish) | ~1,500-word architectural decision story ("The Cascade Drop Trap") |
| **Published Article Live URL** | [The Cascade Drop Trap: How Implementing the "Right to be Forgotten" Almost Destroyed Six Years of Tuition Records](https://www.linkedin.com/pulse/cascade-drop-trap-how-implementing-right-forgotten-almost-tosin-liasu-2os6e) | Completed | Published live on LinkedIn Articles (Task 5, Step 13) |

---

## 4. Evidence Catalog & Verification Commands

All 16 evidence artifacts have been produced and verified:

```bash
# 1. Real Application: Forgot-Password Email Pre-fill Test (Node Native Runner)
node --test task-05-sessions-and-defence/scripts/test-prefill.mjs
# -> 4/4 passing tests in 8.4ms

# 2. Real Application: Session & Auth Verification Suite
cd C:\Users\gbola\Desktop\SchoolPass
node --import ./src/lib/auth/test-loader.mjs --conditions=react-server --test ../SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-real-auth.mjs
# -> 17/17 passing tests in 755ms

# 3. Real Application: Soft-Gating Alternative Verification Suite
cd C:\Users\gbola\Desktop\SchoolPass
node --import ./src/lib/auth/test-loader.mjs --conditions=react-server --test ../SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-soft-gating.mjs
# -> 12/12 passing tests in 935ms

# 4. Real Application: Staff RBAC & Multi-Tier Layout Suite
cd C:\Users\gbola\Desktop\SchoolPass
node --import ./src/lib/auth/test-loader.mjs --conditions=react-server --test "src/lib/auth/staff-rbac.test.mjs"
# -> 28/28 passing tests in 21.4s

# 5. Real Application: 4-Stage Account Deletion Lifecycle Suite
cd C:\Users\gbola\Desktop\SchoolPass
node --import ./src/lib/auth/test-loader.mjs --conditions=react-server --test ../SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-deletion-lifecycle.mjs
# -> 11/11 passing tests in 1.89s

# 6. Sandbox: 4-Stage Account Deletion Lifecycle & Idempotent Purge Engine (Reference Proof)
cd C:\Users\gbola\Desktop\SchoolPass-Assessment
node task-05-sessions-and-defence/scripts/run-deletion-lifecycle.mjs
# -> Run 1: Purges candidate, preserves CAMA financial ledgers
# -> Run 2: Confirms 0 records modified, proving idempotency
```

---

## 5. Candidate Action Items (Human Fieldwork & Publication)

To maintain absolute academic integrity, two requirements strictly require real candidate participation and must not be simulated:

1. **Conduct School Proprietor Interview:**
   - **Fieldwork Guide:** [`docs/interview-with-owner.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/interview-with-owner.md)
   - Conduct the 20-minute field interview with a real nursery, primary, or secondary school owner in Nigeria.
   - Record their authentic answers to the 5 mandatory questions, the mandatory operational contradiction, and the Task 1 brief reflection.

2. **Publish the Technical Article:**
   - **Article Draft:** [`docs/technical-article-draft.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/docs/technical-article-draft.md)
   - Copy and publish this ~1,500-word piece to Substack, Medium, or LinkedIn Articles.
   - Capture a full-page browser screenshot of the published article as [`evidence/17-published-article-screenshot.png`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/17-published-article-screenshot.png).
   - Paste the live public link below:
   - **Published Article Live URL:** [The Cascade Drop Trap: How Implementing the "Right to be Forgotten" Almost Destroyed Six Years of Tuition Records](https://www.linkedin.com/pulse/cascade-drop-trap-how-implementing-right-forgotten-almost-tosin-liasu-2os6e)

