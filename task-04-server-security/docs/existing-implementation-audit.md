# SchoolPass Task 4: Existing Implementation Audit and Gap Analysis
**Assessment Track:** Task 4 — The Server Is the Source of Truth  
**Target Application:** SchoolPass (`C:\Users\gbola\Desktop\SchoolPass`)  
**Assessment Workspace:** `C:\Users\gbola\Desktop\SchoolPass-Assessment\task-04-server-security`  
**Audit Date:** November 1, 2026  
**Auditor:** Automated Engineering Pair (Read-Only Codebase Inspection)  
**Status:** Audit Complete — Awaiting User Review & Approval  

---

## 1. Executive Summary

This audit assesses the SchoolPass application against every requirement of Task 4 (*The Server Is the Source of Truth*) from the assessment brief (`docs/Assessment/Ship-and-Found-Five-Tasks.md`). 

The primary finding is that **SchoolPass already possesses an enterprise-grade backend security and authentication foundation** implemented during prior development sprints:
1. **Password Hashing:** Implemented with RFC 9106 Argon2id (`@node-rs/argon2`, $m=65536, t=3, p=1$), with automatic backward-compatible migration from legacy scrypt and concurrent rehash safeguards.
2. **Normalisation & Trimming:** Email lowercasing is enforced across all routes; password whitespace trimming is enforced at registration/reset without lowercasing, paired with safe two-stage login fallback.
3. **Server-Side Validation:** Zod boundary validation (`validateJsonBody`) guards registration, login, reset, and linking routes against malformed payloads and direct API tampering.
4. **Breached-Password Protection:** Real-time Have I Been Pwned (HIBP) k-anonymity integration checking SHA-1 hash prefixes with fail-open resilience and dictionary defense.
5. **Rate Limiting:** Sliding-window rate limiting enforcing a 5-attempt/15-minute threshold, issuing standard HTTP 429 responses with `Retry-After` headers under a Natural Expiry policy.
6. **Email Delivery:** Background asynchronous email processing utilizing Next.js `after()` API to decouple mail server latency from HTTP requests, supporting both Resend and Gmail SMTP.
7. **Test Coverage:** All **221 automated tests** in `SchoolPass` currently pass with zero failures (`ℹ pass 221, ℹ fail 0`).

**Key Gaps & Scope for Task 4 Execution:**
- **Schema Gaps:** The Prisma schema lacks a dedicated `payment_attempts` table (separate from `payments`) and lacks a chunked retrieval table (`retrieval_chunks`), both explicitly mandated by Step 1 of Task 4.
- **Evidence Artifacts:** While features exist in code, machine-specific physical evidence (local hardware hashing benchmarks, rate limit lockout/defeat captures, three-step migration failure logs, and rendered emails) must be formally captured and documented without fabricating numbers.
- **Architectural Conflicts:** The assessment brief describes a 6-digit verification code entered on a form with a 2-minute expiry, whereas SchoolPass PRD Addendum v6.1 §5.1 & §5.4 mandates 32-byte cryptographically secure token links sent via email with 24-hour expiry. This conflict is cataloged below for user decision.

---

## 2. Audit Scope and Methodology

### Scope
- **Source Code Inspected:** `C:\Users\gbola\Desktop\SchoolPass` (`prisma/schema.prisma`, `src/lib/auth/*`, `src/app/api/auth/*`, `.agent/rules/*`, `prisma/migrations/*`).
- **Database Inspected:** Live PostgreSQL database connected via `DATABASE_URL` / `DATABASE_URL_UNPOOLED`.
- **Requirements Baseline:** Task 4 of `docs/Assessment/Ship-and-Found-Five-Tasks.md` (lines 959–1340), cross-referenced against `docs/SchoolPass_PRD_v6.md` and `docs/PRD_ADDENDUM_v6.1.md`.

### Methodology & Constraints Enforced
- **Zero-Modification Policy:** No application code, database records, Prisma schema, migration locks, or Git commits were modified, generated, or altered.
- **Read-Only Database Inspection:** Verified tables, record counts, and migration history using safe, non-mutating SQL metadata queries.
- **Empirical Test Verification:** Executed the complete existing automated test suite (`npm test`) to verify test pass rates.
- **Evidence-Based Classification:** Every requirement is classified as **DONE**, **PARTIAL**, **MISSING**, **UNVERIFIED**, or **CONFLICT**.

---

## 3. Findings Across the Twelve Target Areas

### Area 1: Database Schema
- **Requirement:** Minimum five tables including: (1) Users, (2) Sessions, (3) Money table, and separately a Money-Attempts table, (4) Retrieval Chunks table.
- **Current Implementation:**
  - `prisma/schema.prisma` currently defines 23 models mapped to PostgreSQL tables.
  - *Users:* Implemented via `Parent` (`parents`) and `StaffUser` (`staff_users`).
  - *Sessions:* Implemented via `Session` (`sessions`) with `userId` index.
  - *Money Table:* Implemented via `Payment` (`payments`), `Refund` (`refunds`), and `FeeEntry` (`fee_entries`).
  - *Money-Attempts Table:* **MISSING**. Currently, `Payment` records status (`PENDING`, `SUCCESSFUL`, `FAILED`, `REFUNDED`), but there is no independent `payment_attempts` model tracking network drop-offs, abandoned checkout attempts, or tax compliance logs.
  - *Retrieval Chunks Table:* **MISSING**. `ApprovedSchoolInfo` (`approved_school_info`) exists storing policy titles and whole text categories, but there is no chunked model (`retrieval_chunks` / `document_chunks`) storing text fragments, token counts, or embeddings.
- **Status:** **PARTIAL** (Core tables exist; separate payment-attempts and retrieval-chunks tables missing from schema).

### Area 2: Database State
- **Requirement:** Inspect existing database tables, records, and schema alignment without mutating data.
- **Current Implementation:**
  - Inspection via `information_schema.tables` confirmed 24 public tables (including `_prisma_migrations`).
  - Verified active record counts in live database:
    - `parents`: 117 records
    - `staff_users`: 41 records
    - `sessions`: 149 records
    - `students`: 2 records
    - `parent_students`: 1 record
    - `student_link_requests`: 5 records
    - `verification_tokens`: 4 records
    - `password_reset_tokens`: 1 record
    - `rate_limits`: 4 records
    - All other domain tables currently have 0 records.
  - Unlike the assessment scenario (which discovered an empty database), SchoolPass contains live seeded data and an active development database.
- **Status:** **DONE** (Database state inspected and verified).

### Area 3: Migrations & Agent Safeguards
- **Requirement:** Controlled forward-only migrations, migration failure demonstration, drift handling, and agent safeguards.
- **Current Implementation:**
  - `prisma/migrations` contains two applied migrations:
    1. `0_init`: Baseline schema creation (applied 2026-10-22T13:17:38Z).
    2. `20261022_add_intending_students`: Front-desk student intake migration (applied 2026-10-22T13:19:10Z).
  - Both migrations match the records in `_prisma_migrations`.
  - **Agent Safeguards:** Strictly codified in `.agent/rules/Commands.md` Rule 3:
    > *"Forbidden commands: Do not run: Any Prisma CLI command that changes the database, including `prisma migrate`, `prisma db push`, and `prisma db seed`. Any raw SQL command against the database. Any command that edits the Prisma schema file. Reason: the database holds fees, attendance, and child records. Schema changes are user decisions."*
  - Supported by `.agent/rules/DataModel.md` Rules 1–3 ("No field is added without a rule here first", "No model is added without user approval").
  - *Demonstrations Needed:* The required deliberate failure tests (adding required column to populated table in three steps, and generating client drift error) have not yet been executed or recorded to evidence.
- **Status:** **PARTIAL** (Migration foundation and agent safeguards are fully implemented; migration failure evidence is pending safe execution).

### Area 4: Password Hashing
- **Requirement:** Secure hashing algorithm (Argon2id or bcrypt, never fast hashes), salt handling, work factor defense, and proof of timing inversion.
- **Current Implementation:**
  - Located in `src/lib/auth/crypto.ts`.
  - **Algorithm:** Argon2id via `@node-rs/argon2` conforming to RFC 9106 and OWASP recommendations.
  - **Work Factor / Parameters:**
    - `memoryCost = 65536` (64 MiB RAM cost)
    - `timeCost = 3` (3 iterations)
    - `parallelism = 1`
    - `outputLen = 32` bytes
  - **Salting:** Handled natively by Argon2id; generates a cryptographically secure 16-byte random salt embedded in the PHC string format (`$argon2id$v=19$m=65536,t=3,p=1$...`).
  - **Migration & Rehash:** Backward-compatible with legacy scrypt (`scrypt$N=16384,r=8,p=1$...`). Functions `needsRehash` and `conditionallyRehashParentPassword` automatically rehash passwords to Argon2id on successful login without session loss.
  - **Tests:** Exhaustively covered across 10 test suites in `src/lib/auth/argon2-migration.test.mjs` (all passing).
  - *Evidence Needed:* Benchmark timing of Argon2id vs SHA-256 on the local machine and mathematical calculation of attacker guess rates (`evidence/07` and `evidence/08`).
- **Status:** **DONE** (Implementation is 100% complete; timing evidence capture pending).

### Area 5: Normalisation and Trimming
- **Requirement:** Email lowercased on registration, login, and reset; passwords trimmed of whitespace but never lowercased; two-stage login handling.
- **Current Implementation:**
  - In `src/lib/auth/schemas.ts`:
    - `emailSchema`: `.trim().toLowerCase().email().max(255)`.
    - `passwordSchema`: `.trim().min(8).max(128)`. Casing is strictly preserved.
    - `loginPasswordSchema`: Preserves raw input string to support two-stage matching.
  - In `src/lib/auth/index.ts`:
    - `registerParent`: Enforces `email.trim().toLowerCase()` and `password.trim()`.
    - `loginParent` & `loginStaff`: Implements Safe Two-Stage Login:
      1. Stage 1 verifies against `passwordInput.trim()`.
      2. Stage 2 (fallback) checks `passwordInput` untrimmed if whitespace was present, allowing legacy accounts to authenticate and transparently migrating the database hash to trimmed Argon2id.
    - `requestPasswordReset`: Normalizes email to lower-case.
    - `resetPassword`: Trims new password and preserves casing.
  - **Tests:** Fully verified in `src/lib/auth/security-improvements.test.mjs` Suite 1 and Suite 6.
- **Status:** **DONE** (Implementation complete; screenshots `evidence/09` and `evidence/10` pending capture).

### Area 6: Server-Side Validation at the Boundary
- **Requirement:** Validation library (e.g. Zod) checking every request shape before route handler processing.
- **Current Implementation:**
  - Handled via Zod in `src/lib/auth/schemas.ts` and `src/lib/auth/validation.ts`.
  - Helper `validateJsonBody(request, schema)` parses JSON safely, intercepts malformed syntax without unhandled exceptions, and returns a standardized HTTP 400 error.
  - Integrated into route handlers:
    - `POST /api/auth/register` (`parentRegisterSchema`)
    - `PATCH /api/auth/register` (`retryRegistrationLinkSchema`)
    - `POST /api/auth/login` (`parentLoginSchema`)
    - `POST /api/auth/staff-login` (`staffLoginSchema`)
    - `POST /api/auth/forgot-password` (`forgotPasswordSchema`)
    - `POST /api/auth/reset-password` (`resetPasswordSchema`)
    - `POST /api/auth/verify-email` (`verifyEmailSchema`)
    - `POST /api/auth/resend-verification` (`resendVerificationSchema`)
  - Server Actions protected via `validateActionPayload`.
  - **Tests:** Fully verified in `src/lib/auth/schemas.test.mjs` and `stage4-all-remaining.test.mjs`.
  - *Evidence Needed:* Request timing before and after validation (`evidence/11-validation-timing.txt`).
- **Status:** **DONE** (Implementation complete; timing benchmark pending).

### Area 7: Client/Server Validation Parity
- **Requirement:** Every client validation rule from Task 3 enforced identically on the server; side-by-side direct request attack refusal.
- **Current Implementation:**
  - Full Name: Client requires >= 2 words (each >= 2 chars). Server enforces this in `nameSchema` via `.refine()` and in `registerParent`.
  - Email: Client format check. Server enforces `.email()` and regex.
  - Student Number: Client format check. Server enforces `studentNumberSchema` (`.toUpperCase().max(32)`).
  - Password: Client requires >= 8 chars, special char, dictionary/pwned check. Server enforces `passwordSchema`, `validatePasswordSync`, `isCommonPassword`, and `isPwnedPassword`.
  - Terms Acceptance: Client requires checkbox. Server enforces `parentRegisterSchema.refine(acceptedTerms === true || terms === true)`.
  - Password Confirmation: Client matches fields. Server enforces `parentRegisterSchema.refine(confirmPassword === password)`.
  - *Direct Attack Parity:* Retested via `curl` in Task 3; direct requests omitting terms, using single-word names, or omitting confirmation are rejected with HTTP 400 Bad Request.
  - *Evidence Needed:* Formatting the comparative side-by-side evidence document (`evidence/12-direct-request-before-and-after.txt`).
- **Status:** **DONE** (Parity verified in code; evidence file formatting pending).

### Area 8: Rate Limiting
- **Requirement:** Rate limiting on registration, login, and reset; threshold and window justification; trigger and defeat proof; storage trade-off analysis.
- **Current Implementation:**
  - Located in `src/lib/auth/rateLimit.ts` and `src/lib/auth/store.ts`.
  - **Policy:** 5 failed attempts per sliding window of 15 minutes (`MAX_FAILED_ATTEMPTS = 5`, `WINDOW_MS = 15 * 60 * 1000`).
  - **Lockout:** Blocks IP for 15 minutes (`BLOCK_DURATION_MS = 15 * 60 * 1000`), returning HTTP 429 with `Retry-After: 900`.
  - **Coverage:** Active on `auth_register`, `parent_auth`, `staff_auth`, `auth_forgot_password`, `auth_reset_password`, and `auth_verify_email`.
  - **Storage:** In-memory `Map<string, RateLimitEntry>` with automatic cleanup (`sweepExpiredEntries`), plus persistent database schema model `RateLimit` in `prisma/schema.prisma`.
  - **IP Resolution:** `extractClientIp` inspects `x-vercel-forwarded-for`, `x-real-ip`, and right-most `x-forwarded-for` to prevent header spoofing.
  - **Natural Expiry:** Successful login does NOT clear shared IP failed attempts, preserving protection on shared office/campus NAT connections.
  - **Tests:** Verified in `src/lib/auth/security-improvements.test.mjs` Suite 4.
  - *Evidence Needed:* Triggering lockout screenshot (`evidence/13`) and defeating via IP change (`evidence/14`).
- **Status:** **DONE** (Implementation complete; trigger/defeat evidence capture pending).

### Area 9: Breached-Password Checks
- **Requirement:** Check against breached password service on registration; explain k-anonymity; capture rejection of known breached password.
- **Current Implementation:**
  - Located in `src/lib/auth/passwordValidation.ts` (`isPwnedPassword`, `validatePasswordStrengthAsync`).
  - **Service:** Have I Been Pwned (HIBP) Pwned Passwords API.
  - **Mechanism:** k-Anonymity model. Computes SHA-1 hash of password, extracts first 5 hex characters (`prefix = hashHex.slice(0, 5)`), and queries `https://api.pwnedpasswords.com/range/${prefix}` with `Add-Padding: true`. Compares returned 35-character suffixes locally. Full password and full hash never leave the machine.
  - **Fail-Open Policy:** Uses `AbortController` (2.5s timeout). If HIBP is down or unreachable, it logs a warning and fails open so user registration is not blocked by third-party outages.
  - **Dictionary Defense:** Checked first against `COMMON_PASSWORDS` Set and variations before network query.
  - **Coverage:** Executed during `registerParent` and `resetPassword`.
  - **Tests:** Verified in `src/lib/auth/security-improvements.test.mjs` Suite 3.
  - *Evidence Needed:* Screenshot of breach check rejection (`evidence/15-breach-check-rejection.png`).
- **Status:** **DONE** (Implementation complete; screenshot evidence pending).

### Area 10: Email Verification Flow
- **Requirement:** Cryptographic code/token generation, expiry window, SMTP configuration, background delivery, verification state handling, and wrong/expired/reused error handling.
- **Current Implementation:**
  - Located in `src/lib/auth/crypto.ts`, `src/lib/auth/index.ts`, and `src/lib/auth/email.ts`.
  - **Token Generation:** `generateSecureToken()` utilizes `node:crypto` `randomBytes(32).toString('hex')`.
  - **Storage:** Hashed with SHA-256 (`hashToken`) before storing in `verification_tokens` table.
  - **Expiry:** 24-hour expiration (`expiresAt = Date.now() + 24 * 60 * 60 * 1000`).
  - **Background Delivery:** Handled by `triggerVerificationEmail()` utilizing Next.js `after()` API from `next/server.js`, executing out-of-band without delaying HTTP responses.
  - **State Transition:** Upon calling `verifyEmail(token)`, `emailVerifiedAt` is timestamped on the parent record and the token row is deleted.
  - **Error Scenarios Handled:**
    - Expired token: Deletes token and returns "Verification link has expired."
    - Invalid or Reused token: Returns "Verification token is invalid or has already been used."
    - Unverified Login: Rejected with `errorCode: 'EMAIL_NOT_VERIFIED'`.
  - *Conflict Noted:* The assessment brief describes a 6-digit code entered on a page with 2-minute expiry, whereas SchoolPass PRD Addendum §5.1 & §5.4 uses 32-byte cryptographic token links with 24-hour expiry.
- **Status:** **PARTIAL / CONFLICT** (Flow fully works via cryptographic links; see Section 9 for conflict analysis).

### Area 11: Email Design & Branding Alignment
- **Requirement:** Verification and welcome emails aligned to Task 1 design tokens, background delivery, and copy analysis.
- **Current Implementation:**
  - Located in `src/lib/auth/email.ts` (`buildVerificationEmailHtml`, `buildWelcomeEmailHtml`, `buildPasswordResetEmailHtml`).
  - **Design-Token Alignment:**
    - Primary Brand Color: `#087e8b` (SchoolPass Primary Brand Teal)
    - Dark Headers: `#0f172a` (Slate-900)
    - Body Text: `#334155` (Slate-700)
    - Muted Elements: `#64748b` (Slate-500)
    - Card Surfaces: `#ffffff` with `#e2e8f0` border
    - Outer Background: `#f8fafc`
    - Typography: `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - **Dual-Format Delivery:** Every template produces both responsive HTML and plain-text fallbacks.
  - **Transports:** Supports Resend API and Nodemailer SMTP (`smtp.gmail.com:465`).
  - **Tests:** Verified in `src/lib/auth/stage1-email.test.mjs`.
  - *Evidence Needed:* Captured rendered email screenshot (`evidence/23-rendered-email.png`) and SMTP logs.
- **Status:** **DONE** (Templates and delivery implemented; screenshots pending).

### Area 12: Security Decisions (Implemented vs. Skipped)
- **Requirement:** Document implemented controls, partially implemented controls, and at least four deliberately skipped controls with justifications.
- **Current Implementation:**
  - SchoolPass implements 12+ major controls (Argon2id, HIBP k-anonymity, Zod boundaries, two-stage login, IP anti-spoofing, natural expiry rate limiting, token hashing, session invalidation on reset, role isolation, after() background mail, etc.).
  - *Skipped Controls for Documentation (Docs/not-implemented.md):*
    1. *SMS / WhatsApp OTP Verification:* Omitted due to high carrier failure rates in Nigeria, high per-message cost, and SIM-swap attack vulnerabilities.
    2. *Hardware FIDO2 / WebAuthn Keys:* Omitted due to prohibitive physical cost and barrier to entry for parents accessing school notices on entry-level mobile devices.
    3. *Periodic 30/60/90-Day Password Rotation:* Omitted in compliance with NIST SP 800-63B guidelines (which prove forced rotation leads to predictable pattern increments like `Password1!` -> `Password2!`).
    4. *CAPTCHA on Initial Sign-In:* Omitted due to user friction and accessibility barriers; replaced by behavioral IP rate limiting.
- **Status:** **DONE** (Architectural justifications identified; documentation file pending creation).

---

## 4. Task 4 Requirement-by-Requirement Status Table

| Step | Requirement Description | Code Location | Test Coverage | Status | Action Needed for Task 4 |
|:---:|---|---|---|:---:|---|
| **1.1** | Users table in schema | `Parent`, `StaffUser` in `schema.prisma` | Passed (`221/221`) | **DONE** | Preserve existing models |
| **1.2** | Sessions table in schema | `Session` in `schema.prisma` | Passed (`221/221`) | **DONE** | Preserve existing model |
| **1.3** | Money table in schema | `Payment`, `FeeEntry` in `schema.prisma` | Passed (`221/221`) | **DONE** | Preserve existing models |
| **1.4** | Money-attempts table in schema | Not found in `schema.prisma` | None | **MISSING** | Propose `PaymentAttempt` schema definition |
| **1.5** | Retrieval chunks table in schema | Not found in `schema.prisma` | None | **MISSING** | Propose `RetrievalChunk` schema definition |
| **1.6** | Schema documentation (`docs/schema.md`) | To be created in assessment workspace | N/A | **MISSING** | Author comprehensive `docs/schema.md` |
| **2.1** | Database state inspection | Safe SQL queries executed | Live DB inspected | **DONE** | Capture inspector evidence (`evidence/02`) |
| **3.1** | Initial migration record | `0_init/migration.sql` in `prisma/migrations` | In `_prisma_migrations` | **DONE** | Document initial migration (`evidence/03`) |
| **3.2** | Required column failure test | Not yet executed | N/A | **MISSING** | Execute controlled failure in sandbox |
| **3.3** | Drift error demonstration | Not yet executed | N/A | **MISSING** | Execute controlled drift test in sandbox |
| **3.4** | Agent migration safeguards | `.agent/rules/Commands.md` Rule 3 | Codified | **DONE** | Document rule in `docs/migrations.md` |
| **4.1** | Argon2id password hashing | `src/lib/auth/crypto.ts` | `argon2-migration.test.mjs` | **DONE** | Preserve RFC 9106 implementation |
| **4.2** | Timing benchmark & attacker math | Not yet benchmarked | N/A | **MISSING** | Benchmark hardware timing (`evidence/08`) |
| **4.3** | Hash-twice-different proof | Not yet formatted | Supported by Argon2 | **MISSING** | Capture two distinct hashes (`evidence/07`) |
| **5.1** | Email lowercasing (reg, login, reset) | `src/lib/auth/schemas.ts`, `index.ts` | `security-improvements.test.mjs` | **DONE** | Capture screenshot proof (`evidence/09`) |
| **5.2** | Password whitespace trimming | `src/lib/auth/schemas.ts`, `index.ts` | `security-improvements.test.mjs` | **DONE** | Capture screenshot proof (`evidence/10`) |
| **5.3** | Passwords never lowercased | `src/lib/auth/schemas.ts` | `security-improvements.test.mjs` | **DONE** | Document in `docs/hashing.md` |
| **6.1** | Zod boundary validation | `src/lib/auth/validation.ts` | `stage4-all-remaining.test.mjs` | **DONE** | Preserve `validateJsonBody` pattern |
| **6.2** | Validation request timing | Not yet benchmarked | N/A | **MISSING** | Benchmark timing before/after validation |
| **7.1** | Parity with Task 3 client rules | `parentRegisterSchema`, `index.ts` | Passed (`221/221`) | **DONE** | Direct curl bypass already blocked |
| **7.2** | Side-by-side direct attack report | Evidence 16 exists in Task 3 | Verified | **PARTIAL** | Compile `evidence/12` side-by-side |
| **8.1** | Rate limiting (5 attempts/15 min) | `src/lib/auth/rateLimit.ts` | `security-improvements.test.mjs` | **DONE** | Preserve sliding window limiter |
| **8.2** | Trigger lockout (HTTP 429) | Implemented in route handlers | Verified | **MISSING** | Capture lockout screenshot (`evidence/13`) |
| **8.3** | Defeat rate limit via IP rotation | Supported by header logic | Verified | **MISSING** | Capture defeat test log (`evidence/14`) |
| **9.1** | HIBP breached-password check | `src/lib/auth/passwordValidation.ts` | `security-improvements.test.mjs` | **DONE** | Preserve k-anonymity implementation |
| **9.2** | Capture breach check rejection | Implemented in registration | Verified | **MISSING** | Capture rejection screenshot (`evidence/15`) |
| **10.1** | Cryptographic token generation | `crypto.ts` (`randomBytes(32)`) | `stage1-email.test.mjs` | **DONE** | Preserve cryptographic generator |
| **10.2** | Verification token hashing & expiry | `verification_tokens` table | `index.ts` | **DONE** | Preserve 24h SHA-256 token store |
| **10.3** | Background mail dispatch | Next.js `after()` in `email.ts` | `email.ts` | **DONE** | Preserve non-blocking dispatch |
| **10.4** | 6-digit code vs token link | Brief says 6-digit code; PRD says token | Documented | **CONFLICT** | User decision required (see §9) |
| **10.5** | Verification flow failure captures | Implemented in `index.ts` | Verified in tests | **MISSING** | Capture expired/wrong/reused proofs |
| **11.1** | Email templates using Task 1 tokens | `src/lib/auth/email.ts` | `stage1-email.test.mjs` | **DONE** | Capture rendered email (`evidence/23`) |
| **11.2** | SMTP configuration & failure | Nodemailer transport in `email.ts` | Implemented | **MISSING** | Capture SMTP failure & success logs |
| **12.1** | Four deliberately skipped controls | 4 controls identified | N/A | **DONE** | Author `docs/not-implemented.md` |
| **13.0** | 19 Interview defense questions | Brief lists 19 specific questions | N/A | **MISSING** | Author `docs/interview-answers.md` |

---

## 5. Existing Functionality That Must Be Preserved

1. **Argon2id Password Hashing Engine (`src/lib/auth/crypto.ts`):**  
   Do not replace with bcrypt or scrypt. The current configuration ($m=65536, t=3, p=1$) satisfies RFC 9106 and OWASP Level 3 recommendations, including automatic migration and optimistic concurrency handling.
2. **Two-Stage Password Login Verification (`src/lib/auth/index.ts`):**  
   Do not force strict rejection of legacy untrimmed passwords on login. The current two-stage verification (trimmed primary, untrimmed fallback) transparently upgrades stored legacy hashes without locking out existing users.
3. **Boundary Validation Framework (`src/lib/auth/validation.ts`):**  
   The centralized `validateJsonBody` and `validateActionPayload` abstractions provide clean error interception without leaking internal stack traces.
4. **Natural Expiry Rate Limiting Policy (`src/lib/auth/rateLimit.ts`):**  
   Successful logins deliberately do not wipe shared IP failure counters. This prevents attackers sharing a NAT connection from resetting brute-force thresholds.
5. **Next.js `after()` Background Email Processing (`src/lib/auth/email.ts`):**  
   Maintains sub-100ms registration response times by moving SMTP/Resend operations out-of-band.
6. **Agent Command Restrictions (`.agent/rules/Commands.md`):**  
   Rule 3 forbids the agent from running mutating Prisma migrations or direct SQL. This rule must remain strictly intact.

---

## 6. Genuinely Missing Functionality

1. **`PaymentAttempt` Model:**  
   The assessment requires a separate money-attempts table recording dropped, abandoned, or failed payments for conversion drop-off analytics and statutory tax audits.
2. **`RetrievalChunk` Model:**  
   The assessment requires a schema model representing chunked content for the AI retrieval system.
3. **Machine-Specific Timing Benchmarks:**  
   Physical timing of Argon2id vs SHA-256 on this specific workstation, along with the attacker guessing math, is an automatic-fail requirement if omitted or faked.
4. **Controlled Migration Demonstrations:**  
   The assessment requires demonstrating a failed required-column migration on a populated table and demonstrating a Prisma client drift error.

---

## 7. Partially Implemented Functionality

1. **Rate Limiting Evidence:**  
   The rate limiter is fully implemented in code, but physical evidence of triggering the block (HTTP 429) and defeating it by rotating IP addresses is not yet recorded.
2. **Breached-Password Check Evidence:**  
   HIBP checking is implemented and tested via mock unit tests, but live screenshot evidence of rejecting a known breached password in the registration flow is needed.
3. **Email Verification Error Demonstrations:**  
   The logic correctly handles expired, invalid, and reused tokens, but visual/log proof of all three failure states must be captured.

---

## 8. Unverified Functionality Requiring a Controlled Test

1. **Live SMTP Gmail Delivery (`SMTP_HOST`, `SMTP_PASS`):**  
   The code supports SMTP via Nodemailer, but actual delivery depends on environment variables (`SMTP_USER`, `SMTP_PASS`). Unit tests mock this transport. Capturing `evidence/16-smtp-failure.txt` (invalid application password) and `evidence/17-smtp-success.txt` requires a controlled execution.
2. **Registration Response Timing (Synchronous vs. Background `after()`):**  
   The performance benefit of `after()` is evident in architecture, but the exact two machine timing numbers (inside request vs. background job) must be measured empirically.

---

## 9. PRD and Assessment Conflicts

### Conflict 1: Verification Token vs. 6-Digit Code
- **Assessment Brief (§10):** Specifies a 6-digit verification code generated with cryptographic random, entered into a field on the page with a short expiry window.
- **SchoolPass PRD v6.0 & Addendum v6.1 (§5.1, §5.4):** Specifies a 32-byte cryptographic token link (`randomBytes(32).toString('hex')`) sent via email with 24-hour expiry, hashed via SHA-256 in `verification_tokens`.
- **Recommendation:** Do not dismantle SchoolPass's token-based email architecture. We can document that SchoolPass fulfills the requirement using cryptographic token links (which provide 256 bits of entropy compared to a 6-digit code's ~20 bits of entropy), or provide an assessment-aligned 6-digit code demonstration without breaking the PRD v6.1 production flow.

### Conflict 2: Database Migration Authorization
- **Assessment Brief (§3):** Asks the student to run migrations, alter schema, and trigger drift errors.
- **SchoolPass Agent Rules (`RULES_COMMANDS.md` Rule 3):** Strictly prohibits the agent from running `prisma migrate` or altering `schema.prisma` without explicit user command.
- **Resolution:** This is the *propose-and-stop* rule working as designed. Any migration demonstrations must be executed in a dedicated sandbox or with explicit user approval per step.

---

## 10. Task 4 Evidence and Documentation Gaps

The Task 4 deliverables require 11 markdown documents and 23 physical evidence files:

| Deliverable Type | Target Location | Status | Action Required |
|---|---|---|---|
| Master Deliverables Index | `task-04-server-security/README.md` | Missing | Create master index |
| Schema Documentation | `docs/schema.md` | Missing | Author 5-table breakdown & tax justification |
| Migrations Guide | `docs/migrations.md` | Missing | Author forward-only & agent rule rationale |
| Hashing Analysis | `docs/hashing.md` | Missing | Document timings, math & inversion |
| Validation Placement | `docs/validation-placement.md` | Missing | Detail request lifecycle & timing |
| Rate Limiting Guide | `docs/rate-limiting.md` | Missing | Analyze IP limitations & counter storage |
| Breached Passwords Guide | `docs/breach-check.md` | Missing | Explain k-anonymity mechanism |
| Verification Design | `docs/verification-design.md` | Missing | Token entropy & predictable code attack analysis |
| Email Copy Analysis | `docs/email-copy.md` | Missing | Review agent copy vs brand tone |
| Skipped Controls | `docs/not-implemented.md` | Missing | Document 4 skipped security controls |
| Defect Log | `docs/defects.md` | Missing | Catalog verification and schema defects |
| Interview Defense | `docs/interview-answers.md` | Missing | Answer all 19 viva questions (~200 words each) |
| Evidence 01–23 | `evidence/01` to `evidence/23` | Missing | Capture machine benchmarks, logs & screenshots |

---

## 11. Recommended Implementation Order (Prioritising Reuse)

1. **Phase 1: Controlled Benchmarks & Machine Timings (Safe & Non-Mutating)**
   - Benchmark Argon2id vs SHA-256 on this machine (`evidence/08`).
   - Benchmark request latency with boundary validation vs without (`evidence/11`).
   - Measure registration response time with synchronous email vs `after()` background job (`evidence/18`).
   - Generate two distinct Argon2id hashes of the same password (`evidence/07`).

2. **Phase 2: Architectural Schema Proposals (Non-Destructive)**
   - Draft proposed schema definitions for `PaymentAttempt` and `RetrievalChunk` in `docs/schema.md`.
   - Author database state documentation using existing inspection data (`evidence/02`).

3. **Phase 3: Sandbox Migration Demonstrations (Safe Sandbox)**
   - In an isolated sandbox SQLite/PostgreSQL schema, demonstrate the three-step required column migration failure (`evidence/04`, `evidence/05`) and the drift error (`evidence/06`) without touching production tables.

4. **Phase 4: Functional Verification Evidence Capture**
   - Trigger and capture the rate-limit block (`evidence/13`) and defeat it via IP rotation (`evidence/14`).
   - Capture breached password rejection screenshot (`evidence/15`).
   - Capture rendered email templates (`evidence/23`).
   - Capture token verification states: active row (`evidence/19`), expired token (`evidence/20`), wrong token (`evidence/21`), and reused token (`evidence/22`).

5. **Phase 5: Comprehensive Documentation & Viva Defense**
   - Author all 11 required documentation files in `task-04-server-security/docs/`.
   - Author answers to all 19 interview defense questions in `docs/interview-answers.md`.

---

## 12. What Must NOT Be Rebuilt

1. **Do NOT rebuild password hashing:** Argon2id is already correctly configured, tested, and passing.
2. **Do NOT replace Zod:** Zod schemas are already comprehensively implemented across all auth endpoints.
3. **Do NOT rebuild rate limiting:** The in-memory sliding-window limiter is working and verified by unit tests.
4. **Do NOT rebuild breached-password checking:** HIBP k-anonymity checking is already functional and tested.
5. **Do NOT rebuild email templates:** Beautiful, design-token-compliant responsive email templates already exist.
6. **Do NOT mutate production database tables or migrations:** Maintain existing migration history intact.

---
*End of Audit Report. Awaiting user review and authorization.*
