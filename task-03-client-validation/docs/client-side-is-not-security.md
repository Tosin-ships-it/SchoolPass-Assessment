# Security Architectural Principle: Client-Side is Not Security

## Core Axiom
> **Client-side validation exists solely for User Experience (UX), ergonomics, and immediate user feedback. It does not, and cannot ever, constitute a security boundary.**

In web application architecture, the client execution environment (the user's web browser, mobile webview, or JavaScript runtime) is completely under the control of the untrusted client. Any security model that relies on frontend validation to protect backend data is fundamentally flawed.

---

## 1. The Threat Model of the Client Environment

An adversary interacting with SchoolPass is not constrained by browser UI forms. Threat actors employ multiple trivial methods to circumvent client validation:
1. **DOM & JavaScript Manipulation**: Editing input attributes in Chrome DevTools (`novalidate`, `required`), modifying component state via React DevTools, or invoking internal methods directly from the console.
2. **Disabling Client Logic**: Disabling JavaScript in browser settings or utilizing lightweight text-based browsers (e.g. Lynx, curl).
3. **Direct HTTP Transmissions**: Formulating raw HTTP requests using tools such as `curl`, Postman, Python `requests`, or automated vulnerability scanners. In this vector, the entire frontend bundle is never executed or downloaded.

---

## 2. Empirical Demonstration: Direct API Registration Bypass

To rigorously prove this architectural principle, an empirical attack was executed against the SchoolPass development server. The full verbatim command, headers, and server response are documented in `evidence/16-direct-request-command-and-response.txt`.

### 2.1 The Rules Under Evaluation
| Validation Rule | Client-Side Implementation | Backend Zod Schema Implementation |
|---|---|---|
| **Full Name Structure** | `validateFullName(name)` requires >= 2 words, with each word >= 2 characters. | `nameSchema = z.string().trim().min(2).max(100)` |
| **Legal Terms Acceptance** | Form submit blocked unless `acceptedTerms === true`. | Field is **omitted entirely** from `parentRegisterSchema`. |
| **Password Confirmation** | Form submit blocked unless `password === confirmPassword`. | Field is **omitted entirely** from `parentRegisterSchema`. |

### 2.2 The Executed Attack Command
```bash
curl.exe -i -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"BypassUser","email":"bypass_audit_unique_992@example.com","password":"k8#mX9$qL2!vN7@pZ","studentNumber":"SP-2026-0001"}'
```

### 2.3 The Observed Server Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Registration successful. Please verify your email address.",
  "verificationToken": "9d0d732dfa0e1fc6b6211fc8e081e9748d6fd51e7c436429703cd6e8b00ed422",
  "email": "bypass_audit_unique_992@example.com",
  "studentLink": {
    "success": true,
    "requestId": "cmvy6f0wq0003lgqcp9g00anq",
    "studentId": "cmve8ac0d0000lgmcf1tep5jc",
    "studentName": "Chinedu Okafor",
    "className": "JSS 1A"
  }
}
```

### 2.4 Empirical Analysis: Code Inspection vs Verified Execution
- **Inspected in Code**: Reading `src/lib/auth/schemas.ts` revealed that `parentRegisterSchema` does not include `acceptedTerms` and only requires `name.min(2)`.
- **Empirically Demonstrated**: The curl execution proved that a single-word name (`"BypassUser"`) with omitted terms and omitted password confirmation successfully registered a guardian link request in the database and generated a cryptographic verification token.

---

## 3. Defense-in-Depth: Where True Security Resides

Because client validation provides zero defensive protection against malicious actors, SchoolPass establishes robust multi-layer defense-in-depth on the server:

```
[Untrusted Client / Attacker]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ Layer 1: Network & IP Rate Limiting                   │
│ - Token bucket per IP (auth_register bucket)           │
│ - Rejects high-frequency brute force with HTTP 429     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 2: Server-Side Schema Parsing (Zod)              │
│ - Strict type coercion, string trimming, min/max bounds│
│ - Rejects malformed JSON and illegal character buffers │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 3: Credential Verification & Breach Screening    │
│ - HaveIBeenPwned k-anonymity SHA-1 API check           │
│ - Blocks compromised passwords regardless of complexity│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 4: Cryptographic Protection & Token Isolation    │
│ - Argon2id password hashing (OWASP 2026 standard)      │
│ - 256-bit CSPRNG verification tokens                   │
│ - SHA-256 token hashing at rest in database            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 5: Relational Integrity & Workflow State Gates   │
│ - Foreign key constraints on active student records    │
│ - Pending staff approval workflow for guardian links   │
│ - Email verification required before session creation  │
└────────────────────────────────────────────────────────┘
```

### Conclusion
Client-side validation is an essential ergonomic layer that saves legitimate users time and network bandwidth. However, system security is exclusively governed by strict, uncompromising server-side authorization and validation barriers.

---

## 4. Server-Side Remediation & Retest Verification

Following the successful direct API attack demonstration, comprehensive server-side protections were implemented and verified to permanently close the gap between client UX rules and backend enforcement.

### 4.1 Server-Side Protections Added
1. **Full Name Structural Validation (`nameSchema`)**:
   - Refined `nameSchema` in `src/lib/auth/schemas.ts` to require at least two words (`split(/\s+/).filter(Boolean).length >= 2`), rejecting single-word names with:
     `"Please enter your first and last name."`
   - Refined `nameSchema` to mandate that every name component has at least two characters (`part.length >= 2`), rejecting initial-only names with:
     `"Each name must be at least 2 characters long."`
2. **Mandatory Terms of Service Acceptance (`parentRegisterSchema`)**:
   - Added `acceptedTerms` and `terms` boolean fields to `parentRegisterSchema`.
   - Attached an object-level refinement enforcing that either `acceptedTerms === true` or `terms === true`. Requests omitting terms or sending `false` are rejected with:
     `"You must accept the Terms of Service and Privacy Policy."`
3. **Password Confirmation Integrity**:
   - Added optional `confirmPassword` to `parentRegisterSchema`.
   - If provided, the schema verifies `confirmPassword === password`. Mismatched submissions are rejected with:
     `"Passwords do not match."`
4. **Defense-in-Depth Service Layer (`registerParent`)**:
   - Redundantly implemented full-name structural checks in `src/lib/auth/index.ts` before any database queries execute.

### 4.2 Automated Test Coverage
The remediation was backed by automated tests across the test suite:
- **Unit Validation**: Verified all 11 permutation cases in `src/lib/auth/schemas.test.mjs`.
- **Route-Level Integration**: Added comprehensive route-level test cases in `src/lib/auth/stage3-routes.test.mjs` executing against `/api/auth/register`.
- **Entire Suite Passing**: All **221 tests** across 57 suites pass with 100% success (`ℹ pass 221, ℹ fail 0`).

### 4.3 Retest Results & Database Verification
The direct `curl` attack commands were re-executed against the live server:
1. **Single-Word Name**: Transmitting `"name": "BypassUser"` immediately returned `HTTP 400 Bad Request` (`{"error":"Please enter your first and last name."}`).
2. **Omitted Terms**: Transmitting valid name `"Bypass User"` with omitted terms returned `HTTP 400 Bad Request` (`{"error":"You must accept the Terms of Service and Privacy Policy."}`).
3. **Mismatched Confirmation**: Transmitting mismatched `confirmPassword` returned `HTTP 400 Bad Request` (`{"error":"Passwords do not match."}`).
4. **Database Side Effects**: Direct Prisma inspection confirmed that **zero records** were created across `Parent`, `VerificationToken`, and `GuardianLinkRequest`. All invalid requests were halted prior to database interaction.

