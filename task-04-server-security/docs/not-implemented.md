# Deliberately Deferred Security Controls & Assessment Implementation Matrix

**Document Version:** 1.0.0  
**Target Application:** SchoolPass (`C:\Users\gbola\Desktop\SchoolPass`)  
**Assessment Area:** Task 4 — Server Security and Data Integrity (Step 12)  
**Primary Source Code:** `prisma/schema.prisma`, `src/lib/auth/*`  
**Date:** November 2, 2026  

---

## 1. Executive Summary & Engineering Philosophy

In application security, the hallmark of mature engineering is not blindly installing every conceivable security control, but rather exercising **contextual risk judgment**. Implementing excessive, inappropriate, or friction-heavy controls wastes operational capital, degrades user experience for legitimate parents, and introduces complex failure modes that often create new security vulnerabilities.

Security controls must be proportionate to the threat model, the institutional budget, and the technical infrastructure of the operating environment.

This document analyzes the four security controls deliberately evaluated and rejected for SchoolPass, articulates the specific economic and technical conditions required to reconsider them, and provides a transparent implementation status matrix categorizing all Task 4 requirements across implemented, planning-level, and deferred states.

---

## 2. Four Deliberately Skipped Security Controls

In accordance with Step 12 of the assessment brief, four specific security controls were evaluated during architectural planning and deliberately excluded:

### 2.1 Control 1: SMS-Based Two-Factor Authentication (SMS 2FA / OTP)
- **What It Is:**  
  Requiring every parent and staff member to enter a 6-digit one-time password (OTP) sent via SMS text message upon every login or password reset.
- **Why It Was Rejected for SchoolPass at This Stage:**
  1. **Prohibitive Unit Economics:** In Nigeria, SMS aggregator gateways (e.g., Termii, Twilio) charge between ₦4.00 and ₦6.00 per SMS message. For a school with 300 students and ~500 parents logging in twice daily during school terms, SMS 2FA would cost over **₦150,000 to ₦200,000 per month** in SMS bills alone—consuming a significant portion of the software subscription fee.
  2. **Unreliable Nigerian Telco Delivery:** Nigerian telecommunications networks (MTN, Airtel, Glo, 9mobile) suffer from frequent carrier routing congestion, regulatory "Do Not Disturb" (DND) filtering, and intermittent delivery delays of 5 to 30 minutes. Locking parent portal access behind SMS delivery guarantees massive morning login failures when parents attempt to confirm student arrival.
  3. **Weak Security Against SIM-Swap Attacks:** SMS is transmitted in plaintext over cellular SS7 networks, rendering it vulnerable to SIM swapping, IMSI catchers, and interception.
- **What Would Have to Change to Implement It:**  
  1. Restricting 2FA exclusively to high-value administrative roles (`StaffRole.ADMIN`) using free, phishing-resistant **Time-Based One-Time Passwords (TOTP via Google/Microsoft Authenticator)** or WebAuthn/Passkeys, avoiding SMS carrier costs entirely.
  2. Financial approvals exceeding ₦1,000,000 where the financial risk justifies dedicated transaction-signing costs.

---

### 2.2 Control 2: Client-Certificate / Mutual TLS (mTLS) Authentication
- **What It Is:**  
  Requiring client browsers and mobile devices to present an X.509 cryptographic certificate signed by the school's private Certificate Authority (CA) during the TLS handshake before HTTP traffic reaches the server.
- **Why It Was Rejected for SchoolPass at This Stage:**
  1. **Extreme User Friction:** Mutual TLS requires users to manually install PKCS#12 (`.p12` / `.pfx`) certificate profiles into their mobile operating system's trust store. Over 95% of parents lack the technical literacy to install and configure client certificates on Android and iOS devices.
  2. **Mobile Device Management Overhead:** Managing certificate enrollment, revocation lists (CRLs), and renewals across hundreds of personal parent smartphones without a centralized Mobile Device Management (MDM) fleet would completely overwhelm the school's administrative staff.
- **What Would Have to Change to Implement It:**  
  Dedicated, school-owned hardware terminals (e.g., front-desk tablets or security guard gate scanners) operating on a closed intranet where IT administrators physically provision and manage the device certificates.

---

### 2.3 Control 3: Six-Digit Numeric Email Verification Codes (Short Window)
- **What It Is:**  
  Delivering a 6-digit numeric verification code via email with a 2-minute to 10-minute expiration window, requiring manual user transcription into a web form.
- **Why It Was Rejected for SchoolPass at This Stage:**
  1. **Inferior Cryptographic Entropy:** A 6-digit code has only $10^6$ combinations ($\approx 19.9\text{ bits of entropy}$), making it vulnerable to distributed brute-force attacks if IP rate limits are bypassed.
  2. **Mobile App-Switching Memory Kills:** On budget Android devices common among Nigerian parents (2GB–3GB RAM), switching between the browser and email client triggers the OS Low Memory Killer (LMK), reloading the browser tab and destroying pending form state.
  3. **Cellular Latency Disconnect:** A 2–5 minute expiration window frequently expires before Nigerian carrier networks deliver the email, creating severe registration abandonment.
- **What Would Have to Change to Implement It:**  
  Introducing an offline USSD fallback (`*384*...#`) or WhatsApp chatbot channel for low-bandwidth environments where web browsers are not used.

---

### 2.4 Control 4: Multi-Region Active-Active Clustering with Distributed Redis
- **What It Is:**  
  Deploying multi-region PostgreSQL replicas with synchronous cross-continental write-forwarding and a globally distributed Redis cache (e.g., Upstash or AWS ElastiCache) for session and rate-limit tracking.
- **Why It Was Rejected for SchoolPass at This Stage:**
  1. **Disproportionate Architecture:** SchoolPass operates on a single-school architecture where users reside in a single geographic timezone (West Africa Time, UTC+1). Multi-region routing adds immense architectural complexity without latency benefits.
  2. **High Recurring Infrastructure Costs:** Maintaining active-active distributed clusters costs upwards of **$250 to $600/month**, violating the economic mandate to keep school management software affordable for local institutions.
  3. **Split-Brain & Consistency Risks:** Distributed caching introduces complex cache invalidation bugs and distributed locking race conditions during parent fee settlements.
- **What Would Have to Change to Implement It:**  
  Scaling the platform into a multi-tenant SaaS serving $>200\text{ schools}$ across Nigeria, Ghana, and Kenya, where regional database sovereignty and cross-border failover become statutory requirements.

---

## 3. Comprehensive Task 4 Implementation Matrix

To maintain strict truth-in-documentation standards, every Task 4 assessment requirement is classified into its exact state:

### 3.1 Status Categories:
1. **Implemented & Verified (Phase 1):** Code exists, tests pass, hardware benchmarks captured, evidence file created.
2. **Implemented in Codebase (Pending Phase 2 Evidence):** Fully functioning in SchoolPass source code; awaiting safe local capture in Phase 2.
3. **Proposed at Planning Level:** Formally designed in documentation; deliberately not added to physical `schema.prisma` to protect live database integrity.
4. **Deliberately Excluded:** Evaluated and omitted with documented architectural rationale.

---

### 3.2 Feature-by-Feature Status Breakdown

| Item | Requirement Area | Status | Location / Implementation File | Assessment Deliverable |
|:---:|---|:---:|---|---|
| **1.1** | Users Table | **Implemented** | `Parent`, `StaffUser` in `prisma/schema.prisma` | `docs/schema.md` |
| **1.2** | Sessions Table | **Implemented** | `Session` in `prisma/schema.prisma` | `docs/schema.md` |
| **1.3** | Money Table | **Implemented** | `Payment`, `FeeEntry`, `Refund` in `schema.prisma` | `docs/schema.md` |
| **1.4** | Money-Attempts Table | **Proposed (Plan)** | Section 4.1 in `docs/schema.md` (`PaymentAttempt`) | `docs/schema.md` |
| **1.5** | Retrieval Chunks Table | **Proposed (Plan)** | Section 4.2 in `docs/schema.md` (`RetrievalChunk`) | `docs/schema.md` |
| **1.6** | Schema Diagram & 14-Mo Tax | **Verified** | Genuine drawing by user & Section 3 in `docs/schema.md` | `evidence/01-schema-drawing.jpg`, `docs/schema.md` |
| **2.1** | Database State Inspection | **Verified (Limitation)** | Baseline Prisma Studio model catalogue screenshot | `evidence/02-database-state-before.png` |
| **3.1** | Initial Migration Record | **Verified (Limitation)** | Baseline migration record & SQLite sandbox init log | `evidence/03-initial-migration.txt` |
| **3.2** | Required Column Failure | **Verified (Limitation)** | Populated table failure in isolated SQLite sandbox | `evidence/04-required-column-failure.txt` |
| **3.3** | Three-Step Migration Demo | **Verified (Limitation)** | 3-step zero-downtime protocol in SQLite sandbox | `evidence/05-required-column-three-steps.txt` |
| **3.4** | Client Schema Drift Demo | **Verified (Limitation)** | Prisma Client drift error capture & fix in SQLite sandbox | `evidence/06-drift-error.txt` |
| **3.5** | Migration Rules & Rationale | **Implemented** | `docs/migrations.md` | `docs/migrations.md` |
| **4.1** | Argon2id Hashing Algorithm | **Verified** | `crypto.ts` ($m=64\text{MB}, t=3, p=1$) | `docs/hashing.md`, `evidence/08` |
| **4.2** | Legacy Hash Migration | **Implemented** | Two-stage scrypt upgrade in `crypto.ts` | `docs/hashing.md` |
| **4.3** | Two Distinct Hashes Proof | **Verified** | Native `@node-rs/argon2` random salt | `evidence/07-hash-twice-different.txt` |
| **4.4** | Hardware Timing & Math | **Verified (Limitation)** | Empirical local micro-benchmark on Intel i7-8650U | `evidence/08-timing-argon-vs-sha.txt` |
| **5.1** | Email Case Normalisation | **Verified** | UI registration & login screenshot verification | `evidence/09-email-case-normalised.png` |
| **5.2** | Password Whitespace Trim | **Verified** | UI registration trim & two-stage login screenshot | `evidence/10-password-trim-working.png` |
| **5.3** | Password Casing Preservation | **Implemented** | Documented in `docs/hashing.md` | `docs/hashing.md` |
| **6.1** | Zod Boundary Validation | **Verified** | `validateJsonBody` in `validation.ts` | `docs/validation-placement.md` |
| **6.2** | Validation Timing Benchmark | **Verified (Limitation)** | Empirical microsecond timing (~7.1 µs delta) | `evidence/11-validation-timing.txt` |
| **7.1** | Client/Server Rule Parity | **Verified** | Task 3 curl bypass vs Task 4 HTTP 400 refusal | `evidence/12-direct-request-before-and-after.txt`|
| **8.1** | Sliding-Window Rate Limiting | **Implemented** | `rateLimit.ts` (5 attempts / 15 min) | `docs/rate-limiting.md` |
| **8.2** | Trigger Lockout (HTTP 429) | **Verified** | Automated capture of HTTP 429 & Retry-After | `evidence/13-rate-limit-triggered.png` |
| **8.3** | Defeat Rate Limit (IP Key)| **Verified (Limitation)** | In-process client IP key change execution transcript | `evidence/14-rate-limit-defeated.txt` |
| **9.1** | Breached-Password Protection | **Implemented** | `passwordValidation.ts` (k-anonymity) | `docs/breach-check.md` |
| **9.2** | Breach Rejection Capture | **Verified** | Automated capture of `Password123!` refusal | `evidence/15-breach-check-rejection.png` |
| **10.1** | Cryptographic Token Link | **Implemented** | `crypto.ts` (256-bit entropy token) | `docs/verification-design.md` |
| **10.2** | Six-Digit Codes | **Deliberately Excluded**| Omitted in favor of 256-bit token links | `docs/verification-design.md`, `defects.md` |
| **10.3** | Non-Blocking Background Job | **Verified (Limitation)** | Next.js `after()` timing simulation in `email.ts` | `evidence/18-registration-timing-sync-vs-job.txt`|
| **11.1** | SMTP Configuration & Safety | **Verified (Limitation)** | Simulated SMTP failure & protocol handshake logs | `evidence/16`, `evidence/17`, `evidence/18` |
| **11.2** | Branded Email Templates | **Verified** | Task 1 design tokens in `email.ts` | `evidence/23-rendered-email.png`, `docs/email-copy.md`|
| **11.3** | Verification Token DB Row | **Verified** | Database inspector screenshot of token row | `evidence/19-verification-row.png` |
| **11.4** | Token Expiry Error View | **Verified** | UI screenshot of expired link error view (Email Link) | `evidence/20-verification-expired.png` |
| **11.5** | Wrong Token Error View | **Verified** | UI screenshot of invalid link error view (Email Link) | `evidence/21-verification-wrong-code.png` |
| **11.6** | Reused Token Error View | **Verified** | UI screenshot of reused link error view (Email Link) | `evidence/22-verification-code-reused.png` |
