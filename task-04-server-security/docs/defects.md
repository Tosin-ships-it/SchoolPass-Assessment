# Confirmed Defects, Architectural Divergences & System Risk Register

**Document Version:** 1.0.0  
**Target Application:** SchoolPass (`C:\Users\gbola\Desktop\SchoolPass`)  
**Assessment Area:** Task 4 — Server Security and Data Integrity  
**Primary Source Code:** `src/lib/auth/*`, `prisma/schema.prisma`  
**Date:** November 2, 2026  

---

## 1. Executive Summary

In complex backend systems, software reliability is forged by identifying edge-case failures, understanding architectural conflicts, and defending against race conditions. Rather than concealing historical defects or papering over discrepancies between generalized assessment requirements and production PRDs, engineering integrity requires cataloging every defect, confirmed risk, and deliberate architectural divergence.

This document serves as the formal Defect Log and Risk Register for SchoolPass Task 4, distinguishing confirmed system defects from deliberate architectural deviations and documenting the design lessons learned during development.

---

## 2. Confirmed Defects & Resolved Vulnerabilities

### 2.1 Defect 1: Verification Link Replay Race & Non-Idempotent Retry
- **Classification:** Resolved Concurrency & Idempotency Defect.
- **Affected Component:** `src/lib/auth/index.ts` (`verifyEmail`).
- **The Defect:**  
  In the initial reference implementation, email verification was not retry-safe. When a parent clicked the verification link in their email, the server verified the user and immediately deleted the `VerificationToken` row. If the parent double-clicked the link, refreshed the page, or if an automated enterprise email virus scanner (e.g., Microsoft Defender Safe Links) pre-fetched the link before the parent opened it:
  1. The first request deleted the token row from the database.
  2. The second request attempted `prisma.verificationToken.findUnique()` and received `null`.
  3. The server treated the missing token as a security attack, throwing an unhandled exception or returning a terrifying error: *"Invalid verification token. Authentication failed."*
  4. The parent was left confused, believing their registration had failed, even though their account was already marked verified in the `parents` table.
- **The Resolution:**  
  `verifyEmail` was refactored to implement defensive, idempotent verification handling:
  - If the token row is not found, the handler queries `parents` by the target email.
  - If `Parent.emailVerifiedAt` is already populated, the server returns an informative success state:
    ```json
    {
      "success": true,
      "message": "Your email address is already verified. You may proceed to log in.",
      "alreadyVerified": true
    }
    ```
  - Unhandled 500 exceptions and false security alerts are completely eliminated.

---

### 2.2 Defect 2: Legacy Password Whitespace Lockout (The Two-Stage Login Trap)
- **Classification:** Resolved Backward-Compatibility Defect.
- **Affected Component:** `src/lib/auth/schemas.ts`, `src/lib/auth/index.ts` (`loginParent`).
- **The Defect:**  
  To improve user experience, Task 4 Step 5 requires trimming whitespace from passwords during registration (`passwordSchema.trim()`), preventing accidental clipboard spaces from corrupting credentials. However, in legacy versions of the application (or during account import from previous school software), some parents registered passwords that intentionally or accidentally contained trailing spaces (e.g., `"LagosParent2025! "`).  
  If the login schema applied `.trim()` unconditionally to the input:
  1. The user typed `"LagosParent2025! "`.
  2. The schema trimmed it to `"LagosParent2025!"`.
  3. The server computed `verifyPassword("LagosParent2025!", legacyHash)`.
  4. Verification failed because the legacy hash was computed against the untrimmed string.
  5. The parent was permanently locked out of their account with no way to diagnose why their correct password was rejected.
- **The Resolution (Safe Two-Stage Migration):**  
  `loginPasswordSchema` was updated to accept the **raw, untrimmed password**. In `loginParent`:
  ```typescript
  // Stage 1: Try trimmed password first
  let isValid = await verifyPassword(trimmedPassword, parent.passwordHash);

  // Stage 2: Fallback to untrimmed password if whitespace was present and Stage 1 failed
  if (!isValid && rawPassword !== trimmedPassword) {
    isValid = await verifyPassword(rawPassword, parent.passwordHash);
    if (isValid) {
      // Rehash asynchronously to trimmed password on next cycle
      await rehashToTrimmed(parent.id, trimmedPassword);
    }
  }
  ```
  Legacy accounts are authenticated seamlessly and transparently upgraded to modern trimmed Argon2id hashes.

---

### 2.3 Defect 3: Client IP Header-Spoofing Vulnerability
- **Classification:** Resolved Security Bypass Vulnerability.
- **Affected Component:** `src/lib/auth/rateLimit.ts` (`extractClientIp`).
- **The Defect:**  
  The standard community pattern for resolving client IP addresses in Express or Next.js is reading the first entry in `req.headers['x-forwarded-for']`:
  ```typescript
  // VULNERABLE PATTERN
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim();
  ```
  An attacker can bypass rate limits entirely by generating a random IPv4 address on every request and injecting it into the header:
  ```bash
  curl -H "X-Forwarded-For: 185.220.101.$RANDOM" https://schoolpass.ng/api/auth/login
  ```
  Because the backend reads the left-most IP, the rate limiter keys on a fresh IP for every request, allowing infinite brute-force guesses.
- **The Resolution:**  
  `extractClientIp` was updated to enforce strict platform precedence:
  1. `x-vercel-forwarded-for`: Prioritizes the unforgeable platform hypervisor header.
  2. `x-real-ip`: Reads trusted reverse proxy headers.
  3. `x-forwarded-for` (Right-Most Inspection): When multiple hops exist, it extracts the **right-most IP address** (the address appended by the immediate upstream edge load balancer), completely neutralizing client-spoofed prefixes.

---

### 2.4 Defect 4: Serverless Execution Context Freeze (Lost Background Emails)
- **Classification:** Resolved Serverless Lifecycle Defect.
- **Affected Component:** `src/lib/auth/email.ts` (`triggerVerificationEmail`).
- **The Defect:**  
  When running in local Node.js development, developers frequently offload tasks using un-awaited promises:
  ```typescript
  // WORKS IN DEV, FAILS IN PRODUCTION
  sendVerificationEmail(params).catch(console.error);
  return Response.json({ success: true });
  ```
  In local development, the Node.js event loop runs continuously, so the email sends successfully. However, when deployed to Vercel Serverless Functions or AWS Lambda, the hypervisor freezes the container the instant the HTTP response stream closes. The un-awaited promise is paused mid-execution, terminating the TLS socket to the SMTP server. The email is never sent.
- **The Resolution:**  
  Integrated Next.js 15 `after()`:
  ```typescript
  import { after } from 'next/server.js';

  if (typeof after === 'function') {
    after(async () => {
      await sendVerificationEmail(params);
    });
  }
  ```
  `after()` registers the background task with the Vercel execution context (`waitUntil`), instructing the platform to keep the compute container alive until the email transmission settles, while returning the HTTP 201 response to the parent immediately.

---

## 3. Deliberate Architectural Deviations

### Deviation 1: 32-Byte Cryptographic Token Links vs. 6-Digit Codes
- **Requirement Source:** Assessment Brief §10 specifies 6-digit numeric verification codes entered into 6 input boxes with short (2-to-10 minute) expiration.
- **Production Authority:** `docs/SchoolPass_PRD_v6.md` (§5.1, §5.4) and `docs/PRD_ADDENDUM_v6.1.md`.
- **Approved Architectural Decision:** Retain SchoolPass's existing email-link verification architecture; deliberately omit the 6-digit numeric code flow.
- **Key Architectural Principles:**
  1. **Cryptographically Secure Random Tokens:** SchoolPass generates 32-byte (256-bit) cryptographically random tokens via `crypto.randomBytes(32)` providing $\approx 1.1579 \times 10^{77}$ combinations.
  2. **Hash Isolation in Database:** Plaintext tokens are never stored in the database. Only standard SHA-256 digests (`tokenHash`) are persisted in `verification_tokens`, neutralizing database exfiltration attacks.
  3. **Expiry & Single-Use Protections:** Links enforce an explicit 24-hour expiration window (`expiresAt`) and atomic single-use deletion upon consumption, guaranteeing replay attack immunity.
  4. **Evidence Scope Disclosures:** `evidence/20-verification-expired.png`, `evidence/21-verification-wrong-code.png`, and `evidence/22-verification-code-reused.png` demonstrate expired, invalid, and reused **email-link scenarios**. These screenshots do **not** demonstrate incorrect or reused six-digit numeric codes.
  5. **Compliance Classification:** The assessment's six-digit-code input flow was **deliberately not implemented**. This represents a **documented assessment deviation**, not a completed requirement.
- **Production Justifications:**
  1. **Entropy Superiority:** 256 bits of entropy versus 19.9 bits ($1,000,000$ combinations) for 6-digit codes, preventing distributed botnet brute-force cracking.
  2. **Mobile Usability & Low-RAM Constraints:** Avoids mobile browser tab reloads and lost form state caused by Android OS Low Memory Killers (LMK) when switching to Gmail on 2GB RAM budget smartphones in Nigeria.
  3. **Cellular Delivery Delays:** Accommodates 3–15 minute Nigerian telco cellular email delays without premature user abandonment.

---

## 4. Current Operational Risk Register

| Risk ID | Component | Description | Likelihood | Impact | Current Mitigation |
|:---:|---|---|:---:|:---:|---|
| **RSK-01** | External HIBP API | Third-party HIBP API outage stalling parent registration requests. | Medium | High | 2.5s `AbortController` timeout + fail-open policy + local `COMMON_PASSWORDS` pre-filter. |
| **RSK-02** | Shared Campus IP | Shared Starlink/fiber gateway IP lockout affecting entire school office. | High | Medium | Multi-dimensional composite keying (`IP + Email`) recommendation; natural expiry window. |
| **RSK-03** | SMTP Quota Exhaustion | High morning enrollment volumes exhausting Gmail SMTP daily quotas (500-2,000/day). | Medium | High | Asynchronous fallback to Resend REST API; in-memory deduplication cache. |
| **RSK-04** | Live DB Mutation | Accidentally running integration tests against active Neon production database. | High | Critical | Strict read-only assessment boundary; `.env` protections; isolated sandbox test harnesses. |
