# Gating Architecture & Policy: Hard Gating vs. Soft Gating

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5, Step 2 & Deliverable `docs/gating.md`  
**Shipped Implementation:** **Hard Gating (Mandatory Email Verification Before Portal Access)**  
**Alternative Explored:** **Soft Gating (Immediate Session Issuance with Warning Banner)**

---

## 1. Executive Summary & Policy Decision

Registration gating dictates the friction and trust boundary established when a new user registers on an application:

- **Soft Gating:** The account is provisioned and authenticated immediately upon submitting the registration form. No email verification is required to establish a session. The user is allowed into the dashboard, typically with a persistent warning banner ("Please verify your email within 24 hours to keep your account").
- **Hard Gating:** The registration process stops immediately after account provisioning. No session token is issued. The user cannot access protected routes until they verify their email via a secure link or 6-digit one-time token. Once verified, they must manually authenticate via the login interface.

### The SchoolPass Decision: Hard Gating Shipped

SchoolPass deliberately implements **Hard Gating**.

```
[ Parent Submits Registration ]
             │
             ▼
    [ Account Created ]
    [ No Session Issued ]
             │
             ▼
[ Verification Token Dispatched ]
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ HARD GATE BARRIER                                           │
│ Parent cannot access /records, /arrival, or /pay.          │
│ Unauthenticated session requests redirected to /auth/login. │
└─────────────────────────────────────────────────────────────┘
             │ (Parent enters 6-digit code or clicks link)
             ▼
   [ emailVerifiedAt Stamped ]
             │
             ▼
   [ Manual Login Required ]
             │
             ▼
[ Session Issued -> Portal Access Granted ]
```

---

## 2. Business & Regulatory Justification for Hard Gating

In consumer consumer web applications (e.g. social networks, fitness trackers), conversion funnels prioritize minimizing onboarding drop-off. For SchoolPass, the operational stakes are fundamentally different:

1. **Child Protection & Student Tenancy (NDPA 2023 §31 & §34):**
   SchoolPass holds sensitive minor records: student daily arrival timestamps, classroom assignments, guardian pickup authorizations, and emergency contacts. Granting immediate session access to unverified email addresses creates a critical vector for:
   - **Identity Spoofing:** An attacker registers with `proprietor@school.org` or a parent's corporate email and accesses portal features under that identity.
   - **Unauthorized Student Number Probing:** An unverified user attempting to link student numbers (`SP-YYYY-NNNN`) could observe valid student names and classes before their identity is validated.
2. **Financial Responsibility & Chargeback Mitigation (CAMA 2020 §375):**
   SchoolPass processes high-value term tuition fee payments (often ₦150,000 to ₦750,000 per term) via Flutterwave integration. Issuing immediate access without proof of email ownership exposes the school to fraudulent card transactions and chargeback claims where the payer claims their email address was used without knowledge.
3. **Delivery of Time-Critical Arrival Notifications:**
   The primary value proposition of SchoolPass is real-time gate departure and arrival SMS/Email alerts. If a parent registers with a mistyped email (`parent@gnail.com`) under soft gating, the system silently fails to deliver critical notifications regarding their child's gate clearance. Hard gating catches email typos *before* the parent leaves the registration workflow.

---

## 3. The Cost of Hard Gating (Drop-off & Conversion Friction)

Hard gating imposes real, measurable engineering and business costs:

| Metric | Hard Gating (Shipped) | Soft Gating (Alternative) |
|---|---|---|
| **Registration-to-Activation Drop-off** | **18% – 28% estimated loss** | **< 4% loss** |
| **Time to First Value (TTFV)** | 120 – 300 seconds (waiting for email, inbox search, spam folder check) | < 5 seconds (instant dashboard load) |
| **Front-Desk Support Burden** | High (parents asking school office why verification email hasn't arrived) | Low at signup; deferred to later |
| **Email Deliverability Dependency** | Hard blocker (if SMTP fails or network throttles, onboarding halts) | Soft blocker (app usable while SMTP queue catches up) |

### Quantifying the Conversion Loss
In a school with 600 students, onboarding 900 parents under hard gating means approximately 180 parents will stall during registration due to:
- Verification email delayed in corporate spam filters (e.g. bank or government agency email firewalls).
- Parent registering on a mobile device but unable to access work email from their phone.
- Inbox delivery latency during morning rush hours.

---

## 4. The Alternative Explored: Soft Gating Implementation on `feat/soft-gating`

To evaluate the alternative rigorously and satisfy the assessment brief requirement, a complete Soft Gating flow was implemented on Git branch `feat/soft-gating` in the SchoolPass application:

### Branch Information
- **Branch Name:** `feat/soft-gating`
- **Application Path:** `C:\Users\gbola\Desktop\SchoolPass`
- **Working Tree:** Safely branched from `feat/student-number-linking` preserving all active modifications and deletions.

### Real Code Implementation
1. **Policy Configuration (`src/lib/auth/index.ts`):**
   - Added `isSoftGatingEnabled()` helper returning `true` by default on `feat/soft-gating` (with override via `GATING_MODE=hard`).
2. **Immediate Registration Session (`src/lib/auth/index.ts#registerParent` & `src/app/api/auth/register/route.ts`):**
   - Upon registration, `createParent` provisions the account with `emailVerifiedAt: null`.
   - `createSessionRecord` immediately creates an active database session, signs the token via HMAC-SHA256, and sets the `schoolpass_session` cookie (`HttpOnly`, `SameSite=Lax`, `Max-Age=7d`).
   - The API route returns `{ success: true, isSoftGated: true, redirectTo: '/records' }`.
3. **Seamless Client Navigation (`src/app/auth/register/ParentRegisterForm.tsx`):**
   - Receives `isSoftGated: true` and navigates the parent directly to `/records`, bypassing the email verification barrier screen.
4. **Unverified Session Resolution (`src/lib/auth/index.ts#getSession`):**
   - Resolves the unverified parent session without returning `null`, attaching `{ isEmailVerified: false, emailVerifiedAt: null }`.
5. **Persistent Layout Warning Banner (`src/app/(parent)/components/UnverifiedEmailBanner.tsx` & `layout.tsx`):**
   - The parent layout renders an amber warning banner at the top of every page:
     > **Action Required:** Your email address (`parent@schoolpass.test`) has not been verified. Some features like student linking and tuition fee payments require verified email ownership. [Resend Verification Email]
   - The button triggers `POST /api/auth/resend-verification` with immediate UI feedback.
6. **Authoritative Server-Side Access Control (`src/app/api/records/link-requests/route.ts`):**
   - Enforces `if (!session.isEmailVerified) return Response.json({ error: "...", errorCode: "EMAIL_VERIFICATION_REQUIRED" }, { status: 403 })`.
   - Protects child data and prevents unauthorized student number linking on the server, defeating client-side bypass.

### Automated Test Suite Execution
- **Test File:** [`task-05-sessions-and-defence/scripts/test-soft-gating.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-soft-gating.mjs)
- **Results:** 12/12 passing tests in 935ms verifying policy configuration, unverified session resolution, server-side 403 barrier, registration redirect contrast, and login behavior contrast.
- **TypeScript:** `npm run typecheck` passed with 0 errors.


---

## 5. Regulatory & Trust Triggers to Switch Policies

SchoolPass would switch between gating models only under explicit operational triggers:

### When Would SchoolPass Switch to Soft Gating?
1. **School-Administered Front-Desk Pre-Verification:**
   If the school's front desk pre-seeds parent email addresses from physical registration forms, incoming registrations match known records. The application could safely switch to soft gating because the email address was already verified in person.
2. **Widespread Nigerian Carrier Latency:**
   If transactional email deliverability in Nigeria experiences persistent carrier-level throttling, preventing parents from clearing their children at the school gate during the first week of term.

### When Would Hard Gating Be Non-Negotiable?
1. **Direct Child Pickup Authorization:**
   Any feature enabling parents to delegate temporary pickup rights to third-party drivers or family members must remain strictly hard gated.
2. **Online Fee Payment Clearance:**
   Payment initiation and webhook verification must enforce confirmed email ownership to satisfy payment processor fraud requirements.

---

## 6. Verification & Evidence Artifacts

- Hard Gating Flow Capture: [`evidence/04-hard-gating-flow.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/04-hard-gating-flow.txt)
- Soft Gating Flow Capture: [`evidence/03-soft-gating-flow.txt`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/evidence/03-soft-gating-flow.txt)
