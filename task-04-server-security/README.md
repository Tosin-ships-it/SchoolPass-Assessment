# Task 4: The Server Is the Source of Truth

**Assessment Track:** Ship and Found Five Tasks — Task Four: Server Security and Data Integrity  
**Application:** SchoolPass (`C:\Users\gbola\Desktop\SchoolPass`)  
**Assessment Workspace:** `task-04-server-security`  
**Automated Backend Test Status:** **221 tests passing, 0 failing (`pass 221, fail 0`)**  
**Execution Phase Status:** **ALL 23 EVIDENCE ARTIFACTS COMPLETED & VERIFIED | 14 TECHNICAL DOCUMENTS AUTHORIZED | READY WITH DOCUMENTED DEVIATIONS**  

---

## 1. Executive Summary & Objective

The objective of Task 4 (*The Server Is the Source of Truth*) is to prove that the SchoolPass backend enforces rigorous data integrity, cryptographic security, rate limiting, and asynchronous background operations such that malicious tools, automated bots, or direct HTTP API requests cannot compromise the system when the client form is completely bypassed.

Task 3 concluded with direct HTTP requests bypassing client-side validation. Task 4 permanently closes that gap:
- Every client-side rule is authoritatively re-enforced at the server boundary using **Zod schema validation**.
- Passwords are encrypted using memory-hard **Argon2id** ($m=64\text{ MiB}, t=3, p=1$) with backward-compatible transparent scrypt migration.
- Breached credentials are eliminated at registration using **Have I Been Pwned (HIBP) k-anonymity** with zero password transmission.
- Automated credential stuffing is suppressed via **sliding-window rate limiting** with anti-spoofing IP extraction.
- User registration latency is decoupled from external SMTP routing using **Next.js 15 `after()`** non-blocking background dispatch.
- Database integrity is guarded through immutable ledgers and **forward-only migrations** protected by the propose-and-stop rule.

---

## 2. Navigating the Submission

The Task 4 deliverable workspace is organized into three primary subdirectories:

```text
task-04-server-security/
│
├── README.md                         <-- Master Assessment Overview & Submission Guide
│
├── docs/                             <-- 14 Authoritative Technical Documents
│   ├── final-compliance-report.md    <-- Final Compliance Audit & Requirement Verification Matrix
│   ├── schema.md                     <-- Prisma Schema Audit, 14-Mo Tax Write-Up & Planning Models
│   ├── migrations.md                 <-- Migration History, Forward-Only Rules & 3-Step Pattern
│   ├── hashing.md                    <-- RFC 9106 Argon2id, Work Factor Math & Salt Defenses
│   ├── validation-placement.md       <-- Request Lifecycle, Boundary Validation & Timing Analysis
│   ├── rate-limiting.md              <-- Sliding-Window Policy, Anti-Spoofing & CGNAT Analysis
│   ├── breach-check.md               <-- HIBP k-Anonymity Model, Range API & Fail-Open Policy
│   ├── verification-design.md        <-- 256-Bit Cryptographic Token Links & 6-Digit Deviation Rationale
│   ├── email-copy.md                 <-- Design System Token Mapping & Marketing Copy Critique
│   ├── not-implemented.md            <-- 4 Deliberately Skipped Controls & Implementation Matrix
│   ├── defects.md                    <-- Resolved Vulnerabilities & Operational Risk Register
│   ├── interview-answers.md          <-- 19 Viva Defense Answers (~200 words each)
│   ├── existing-implementation-audit.md <-- Historical Implementation Audit Baseline
│   └── gap-closure-plan.md           <-- Master Gap Closure Plan & Approval Protocol (v1.2.0)
│
├── evidence/                         <-- 23 Verified Empirical Evidence Artifacts
│   ├── README.md                     <-- Evidence Audit Register & Demonstration Guide
│   ├── 01-schema-drawing.jpg         <-- [VERIFIED] User Hand-Drawn Relational Schema Design
│   ├── 02-database-state-before.png  <-- [VERIFIED] Prisma Studio Baseline Model Catalogue Screenshot
│   ├── 03-initial-migration.txt      <-- [VERIFIED] Baseline Migration Record & SQLite Sandbox Init Log
│   ├── 04-required-column-failure.txt<-- [VERIFIED] Engine Failure Adding NOT NULL to Populated Table (SQLite Sandbox)
│   ├── 05-required-column-three-steps.txt <-- [VERIFIED] 3-Step Zero-Downtime Migration Protocol (SQLite Sandbox)
│   ├── 06-drift-error.txt            <-- [VERIFIED] Prisma Client Schema Drift Error & Fix (SQLite Sandbox)
│   ├── 07-hash-twice-different.txt   <-- [VERIFIED] Argon2id Unique Salt Demonstration
│   ├── 08-timing-argon-vs-sha.txt    <-- [VERIFIED] Argon2id vs SHA-256 Local Hardware Benchmark
│   ├── 09-email-case-normalised.png  <-- [VERIFIED] Email Case Normalization UI Proof
│   ├── 10-password-trim-working.png  <-- [VERIFIED] Password Trimming & Two-Stage Login Proof
│   ├── 11-validation-timing.txt      <-- [VERIFIED] Zod Parsing vs Pipeline Timing Benchmark
│   ├── 12-direct-request-before-and-after.txt <-- [VERIFIED] Task 3 Bypass vs Task 4 Hardened Refusal
│   ├── 13-rate-limit-triggered.png   <-- [VERIFIED] HTTP 429 Lockout & Retry-After Capture
│   ├── 14-rate-limit-defeated.txt    <-- [VERIFIED] In-Process Rate-Limit Defeat via Client IP Key Change
│   ├── 15-breach-check-rejection.png <-- [VERIFIED] HIBP Breached-Password Registration Rejection
│   ├── 16-smtp-failure.txt           <-- [VERIFIED] Simulated SMTP Authentication Error Sanitization Log
│   ├── 17-smtp-success.txt           <-- [VERIFIED] Simulated ESMTP Protocol Handshake Exchange Log with messageId
│   ├── 18-registration-timing-sync-vs-job.txt <-- [VERIFIED] Next.js after() Background Timing Benchmark
│   ├── 19-verification-row.png       <-- [VERIFIED] Active Verification Token DB Inspector View
│   ├── 20-verification-expired.png   <-- [VERIFIED] Expired Verification Token Link Error UI View (Email Link Flow)
│   ├── 21-verification-wrong-code.png<-- [VERIFIED] Invalid/Corrupted Token Link Error UI View (Email Link Flow)
│   ├── 22-verification-code-reused.png<-- [VERIFIED] Reused Verification Token Link Error UI View (Email Link Flow)
│   └── 23-rendered-email.png         <-- [VERIFIED] Responsive Branded Email Browser Preview
│
├── sandbox/                          <-- Isolated Quarantined Migration Testing Environment
│   ├── schema.prisma                 <-- Throwaway SQLite Schema for Migration Tests
│   └── test-drift.mjs                <-- Automated Drift Induction & Reproduction Script
│
└── scripts/                          <-- Reproducible Local Benchmark & Capture Scripts
    ├── benchmark-hashing.mjs         <-- Argon2id vs SHA-256 Benchmark Script
    ├── benchmark-validation.mjs      <-- Zod Schema Overhead Benchmark Script
    ├── benchmark-email-after.mjs     <-- Next.js after() Timing Decomposition Script
    ├── capture-screenshot.mjs        <-- Native Chrome/Edge DevTools Protocol Screenshot Tool
    ├── demonstrate-rate-limit.mjs    <-- Rate-Limit Trigger and Defeat Network Script
    └── generate-all-evidence-screenshots.mjs <-- Automated UI Render & Capture Harness
```

---

## 3. Deliberate Architectural Decisions & Deviations

In accordance with repository source-of-truth rules (`docs/SchoolPass_PRD_v6.md` baseline amended by `docs/PRD_ADDENDUM_v6.1.md`), two key architectural decisions govern this assessment submission:

### 3.1 Retention of 32-Byte Cryptographic Token Links (No 6-Digit Codes)
- **Assessment Prompt (§10):** Specifies 6-digit numeric verification codes entered into a web input field with 2-to-10 minute expiry.
- **SchoolPass Decision:** Retains cryptographically secure 32-byte hexadecimal token links (`crypto.randomBytes(32)`), stored exclusively as SHA-256 hashes in `verification_tokens` table, with a 24-hour expiration window.
- **Rationale:**  
  1. **Entropy:** 256 bits of entropy ($\approx 1.1579 \times 10^{77}$ combinations) vs 19.9 bits ($1,000,000$) for 6-digit codes. A 6-digit space can be cracked by a distributed botnet in $<17\text{ minutes}$, whereas 256 bits is immune to brute force.
  2. **Mobile UX in Nigeria:** Switching apps between mobile browsers and Gmail on budget 2GB Android devices triggers the OS Low Memory Killer (LMK), crashing the browser tab and destroying form state. Single-tap links eliminate app switching.
  3. **Telco Congestion:** Accommodates 3–15 minute cellular email delays without premature expiration.  
  *Detailed write-up: [`docs/verification-design.md`](docs/verification-design.md) and [`docs/defects.md`](docs/defects.md).*

### 3.2 Planning-Level Design for Missing Schema Models
- **Assessment Prompt (§1):** Specifies a separate money-attempts table and retrieval-chunks table.
- **SchoolPass Decision:** Models `PaymentAttempt` and `RetrievalChunk` are designed in full detail at a planning level in [`docs/schema.md`](docs/schema.md), but **deliberately not added to `schema.prisma` in production**.
- **Rationale:** Modifying `schema.prisma` without migrating would induce client schema drift; running migrations against the live Neon database violates strict assessment boundaries.

---

## 4. Assessment Completion Tracker

### 4.1 Phase Progress Summary

| Phase | Description | Tier | Status | Deliverables |
|:---:|---|:---:|:---:|---|
| **Phase 1** | Local Benchmarks & Hardware Timings | Tier 1 | **COMPLETED & VERIFIED** | Evidence 07, 08, 11, 18; Docs `hashing.md`, `validation-placement.md` |
| **Documentation Sprint** | Full Technical Documentation Suite | Tier 1 | **COMPLETED & VERIFIED** | All 14 Markdown documents authored, updated, and reviewed |
| **Phase 2** | Architectural Proposals & Inspector View | Tiers 1 & 3 | **COMPLETED & VERIFIED** | Evidence 01 (Schema drawing), Evidence 02 (DB state before) |
| **Phase 3** | Sandbox Migration Demonstrations | Tier 2 | **COMPLETED & VERIFIED** | Evidence 03, 04, 05, 06 (Isolated throwaway sandbox) |
| **Phase 4** | Functional Verification Evidence Capture | Tier 1 | **COMPLETED & VERIFIED** | Evidence 09, 10, 12, 13, 14, 15, 16, 17 |
| **Phase 5** | Verification Flow & Email Evidence Capture | Tier 1 | **COMPLETED & VERIFIED** | Evidence 19, 20, 21, 22, 23 |

---

### 4.2 Comprehensive Deliverables Checklist

#### Technical Documentation (14 / 14 Complete)
- [x] [`docs/final-compliance-report.md`](docs/final-compliance-report.md) — Comprehensive Task 4 requirement-by-requirement audit, compliance status, and submission readiness verdict.
- [x] [`docs/schema.md`](docs/schema.md) — Prisma schema audit, entity mapping, 14-month tax audit response, and planning models (`PaymentAttempt`, `RetrievalChunk`).
- [x] [`docs/migrations.md`](docs/migrations.md) — Migration history, forward-only rationale, agent restrictions, 3-step pattern, and drift defense.
- [x] [`docs/hashing.md`](docs/hashing.md) — Argon2id configuration ($m=64\text{MB}, t=3, p=1$), work factor math, salt proofs, whitespace trimming vs casing preservation, and scrypt migration.
- [x] [`docs/validation-placement.md`](docs/validation-placement.md) — Request lifecycle sequence, boundary validation, empirical microsecond timing (~7.1 µs delta), and deconstructing the 2-3s delay myth.
- [x] [`docs/rate-limiting.md`](docs/rate-limiting.md) — 5-attempt/15-min sliding window, right-most IP anti-spoofing algorithm, natural expiry policy, and shared campus/CGNAT analysis.
- [x] [`docs/breach-check.md`](docs/breach-check.md) — HIBP k-anonymity protocol, 5-char SHA-1 prefix isolation, 2.5s timeout, fail-open resilience, and why naive checking is a privacy violation.
- [x] [`docs/verification-design.md`](docs/verification-design.md) — 256-bit cryptographic token links, SHA-256 database storage, 6-digit deviation justification, PRNG attack math, and retry safety.
- [x] [`docs/email-copy.md`](docs/email-copy.md) — Task 1 design system token mapping (`#087E8B`), zero external images, and critique of agent-generated vs commercial copy.
- [x] [`docs/not-implemented.md`](docs/not-implemented.md) — Analysis of 4 deliberately skipped security controls (SMS 2FA, mTLS, 6-digit codes, multi-region Redis) and implementation matrix.
- [x] [`docs/defects.md`](docs/defects.md) — Verified edge-case defects (verification retry safety, legacy whitespace trap, IP spoofing, serverless freeze) and operational risk register.
- [x] [`docs/interview-answers.md`](docs/interview-answers.md) — Authoritative, technically rigorous viva defense answers for all 19 assessment questions (~200 words each).
- [x] [`docs/existing-implementation-audit.md`](docs/existing-implementation-audit.md) — Baseline implementation audit verifying 221 passing backend security tests.
- [x] [`docs/gap-closure-plan.md`](docs/gap-closure-plan.md) — Authoritative gap-closure plan (v1.2.0) with strict 4-tier approval protocol.

#### Evidence Artifacts (23 / 23 Complete & Verified)
- [x] [`evidence/01-schema-drawing.jpg`](evidence/01-schema-drawing.jpg) — **[VERIFIED]** Genuine user hand-drawn schema drawing with 5+ tables, relationships, indexes, and 14-month tax audit annotations.
- [x] [`evidence/02-database-state-before.png`](evidence/02-database-state-before.png) — **[VERIFIED]** Prisma Studio screenshot capturing baseline model catalogue before migration demonstrations (unhydrated model list view; does not display individual records or masked parent records).
- [x] [`evidence/03-initial-migration.txt`](evidence/03-initial-migration.txt) — **[VERIFIED]** Production baseline migration record and isolated SQLite sandbox initial migration log. Demonstrates Prisma migration mechanics in SQLite; SchoolPass uses PostgreSQL in production.
- [x] [`evidence/04-required-column-failure.txt`](evidence/04-required-column-failure.txt) — **[VERIFIED]** Controlled demonstration of required column failure on populated table in isolated SQLite sandbox (`NOT NULL constraint failed`). Demonstrates Prisma migration mechanics rather than PostgreSQL operational behavior. *(Satisfies Automatic Fail Rule)*
- [x] [`evidence/05-required-column-three-steps.txt`](evidence/05-required-column-three-steps.txt) — **[VERIFIED]** Canonical three-step zero-downtime migration protocol demonstration in isolated SQLite sandbox. Demonstrates Prisma DDL migration protocol mechanics.
- [x] [`evidence/06-drift-error.txt`](evidence/06-drift-error.txt) — **[VERIFIED]** Controlled Prisma Client schema drift error demonstration, runtime failure capture (P2022), and fix in isolated SQLite sandbox.
- [x] [`evidence/07-hash-twice-different.txt`](evidence/07-hash-twice-different.txt) — **[VERIFIED]** Two distinct Argon2id hashes of identical password proving unique 16-byte salt generation.
- [x] [`evidence/08-timing-argon-vs-sha.txt`](evidence/08-timing-argon-vs-sha.txt) — **[VERIFIED]** Local hardware benchmark (Argon2id median 93.6 ms vs SHA-256 1.5 µs; complete single-core attacker guessing rates). *(Satisfies Automatic Fail Rule)*
- [x] [`evidence/09-email-case-normalised.png`](evidence/09-email-case-normalised.png) — **[VERIFIED]** Screenshot demonstrating uppercase registration and lowercase login equivalence.
- [x] [`evidence/10-password-trim-working.png`](evidence/10-password-trim-working.png) — **[VERIFIED]** Screenshot demonstrating whitespace-trimmed password registration and clean login.
- [x] [`evidence/11-validation-timing.txt`](evidence/11-validation-timing.txt) — **[VERIFIED]** Empirical microsecond benchmark of Zod schema boundary validation (~7.1 µs delta).
- [x] [`evidence/12-direct-request-before-and-after.txt`](evidence/12-direct-request-before-and-after.txt) — **[VERIFIED]** Side-by-side comparison of Task 3 curl bypass vs Task 4 hardened HTTP 400 rejection.
- [x] [`evidence/13-rate-limit-triggered.png`](evidence/13-rate-limit-triggered.png) — **[VERIFIED]** Capture of HTTP 429 lockout response and `Retry-After: 900` header after 5 failed attempts.
- [x] [`evidence/14-rate-limit-defeated.txt`](evidence/14-rate-limit-defeated.txt) — **[VERIFIED]** In-process demonstration of sliding-window rate limit trigger and legitimate defeat by supplying a different client IP string key (`197.210.64.82`) without proxy spoofing. Demonstrates key-change counter reset; does not alter physical network adapters. *(Satisfies Automatic Fail Rule)*
- [x] [`evidence/15-breach-check-rejection.png`](evidence/15-breach-check-rejection.png) — **[VERIFIED]** Capture of registration rejection for known breached password `Password123!`.
- [x] [`evidence/16-smtp-failure.txt`](evidence/16-smtp-failure.txt) — **[VERIFIED]** Terminal log of simulated SMTP authentication failure (`535 5.7.8`) with sanitized error messages and credential protection.
- [x] [`evidence/17-smtp-success.txt`](evidence/17-smtp-success.txt) — **[VERIFIED]** Terminal log of simulated/mocked successful ESMTP protocol handshake exchange (`250 2.0.0 OK`) with returned `messageId`. Demonstrates protocol compliance without sending real emails; does not establish actual delivery to a real inbox.
- [x] [`evidence/18-registration-timing-sync-vs-job.txt`](evidence/18-registration-timing-sync-vs-job.txt) — **[VERIFIED]** Next.js `after()` background timing decomposition and active environment safety blocker audit.
- [x] [`evidence/19-verification-row.png`](evidence/19-verification-row.png) — **[VERIFIED]** Database record view of active verification token row and verified parent state.
- [x] [`evidence/20-verification-expired.png`](evidence/20-verification-expired.png) — **[VERIFIED]** Capture of user error view when presenting an expired verification token link (>24 hours). (Demonstrates email-link token expiration; six-digit numeric code flow was deliberately omitted as a documented assessment deviation).
- [x] [`evidence/21-verification-wrong-code.png`](evidence/21-verification-wrong-code.png) — **[VERIFIED]** Capture of user error view when presenting an invalid verification token link. (Demonstrates email-link token invalidity; six-digit numeric code flow was deliberately not implemented).
- [x] [`evidence/22-verification-code-reused.png`](evidence/22-verification-code-reused.png) — **[VERIFIED]** Capture of user error view when attempting to reuse an already-consumed verification token link. (Demonstrates email-link single-use token lifecycle; six-digit numeric code flow was deliberately not implemented).
- [x] [`evidence/23-rendered-email.png`](evidence/23-rendered-email.png) — **[VERIFIED]** Browser preview of rendered responsive verification email using Task 1 brand tokens.

---

## 5. Strict Boundaries & Assessment Safety Protocol

This assessment strictly adhered to non-destructive read-only operational boundaries:
1. **SchoolPass Application Source Code:** 100% unmodified.
2. **Prisma Schema (`schema.prisma`):** 100% unmodified.
3. **Active Neon PostgreSQL Database:** Zero schema migrations run; zero database records created, mutated, or deleted.
4. **Environment Variables (`.env`):** Unmodified (protecting live Neon DB and Gmail SMTP credentials).
5. **Git Repositories:** Zero commits, pushes, resets, stashes, or branch switches executed.
6. **Isolated Sandbox Testing:** All migration failure and schema drift tests were quarantined inside `task-04-server-security/sandbox/`, ensuring zero impact on the live school management platform.
