# Task 2: Defect Report & Architectural Vulnerability Audit

**Document Path:** `Task-02-repository-and-scaffold/docs/defects.md`  
**Assessment Target:** SchoolPass Repository & Scaffold (Task 2)  
**Audit Scope:** Registration Pipeline (`/api/auth/register`), Database Persistence Layer (`@prisma/client`), Error Handling, and Environment Configuration  
**Audit Date:** October 29, 2026  

---

## 1. Executive Summary

During the execution of Task 2's registration persistence verification, port collision recovery, and database connectivity failure tests, four verified defects and architectural vulnerabilities were identified across the SchoolPass application stack.

This document records the exact source files, line numbers, root cause analyses, observed runtime evidence, and recommended remediations for each defect.

### Verification Methodology & Testing Boundaries
> [!IMPORTANT]
> **Audit Disclosure:** Findings are categorized into **Actual Runtime Observations** and **Code-Review Conclusions**.  
> The **real browser UI was not exercised with a broken database connection** in order to prevent disruption to the live development server (`http://localhost:3000`, PID 7432) and to avoid modifying `.env` or `.env.local`. Database-connectivity failure was verified using an isolated, controlled HTTP test harness on port 3070 running the registration pipeline against an unreachable database endpoint (`127.0.0.1:54329`), cross-referenced with static code analysis of `ParentRegisterForm.tsx`.

---

## 2. Defect Register

### Defect 1: HTTP Status Code Misalignment on Resource Creation (`200 OK` vs. `201 Created`)

- **Classification:** REST Specification Conformance & API Design
- **Severity:** Low (Functional success, specification divergence)
- **Source File:** `C:\Users\gbola\Desktop\SchoolPass\src\app\api\auth\register\route.ts`
- **Affected Line:** Line 92
- **Observed Runtime Evidence:** Captured in `evidence/11-write-succeeded-logs.txt` and `evidence/12-write-second-row.txt`.

#### Description & Root Cause
When a parent successfully registers, the backend performs three persistent writes:
1. Creates a new parent record in the `parents` table.
2. Generates and stores a cryptographic verification token in `verification_tokens`.
3. Creates a student linking request in `student_link_requests`.

Despite creating three persistent resources, the route handler returns:
```ts
return Response.json({
  success: true,
  message: 'Registration successful. Please verify your email address.',
  ...(isDevStubsEnabled() && { verificationToken: result.verificationToken }),
  email,
  studentLink: result.studentLink,
});
```
In Next.js / Web Standards `Response.json(data)`, the status code defaults to `200 OK` unless an options object `{ status: 201 }` is explicitly provided. Under RFC 9110 §15.3.2, successful creation of new server resources must return `201 Created`.

#### Impact
- API monitors and automated client SDKs expecting `201 Created` may misinterpret the response as an update or idempotent read.
- Violates assessment specification requirement: *"Find the status codes. Name them. If there is no 201 anywhere, say so and explain what that means."*

#### Recommended Remediation
Explicitly pass status 201 to `Response.json`:
```diff
-    return Response.json({
+    return Response.json({
       success: true,
       message: 'Registration successful. Please verify your email address.',
       ...(isDevStubsEnabled() && { verificationToken: result.verificationToken }),
       email,
       studentLink: result.studentLink,
-    });
+    }, { status: 201 });
```

---

### Defect 2: Silent Error Swallowing in Registration Route Catch Block

- **Classification:** Observability, Reliability & Incident Debuggability
- **Severity:** High (Suppresses diagnostic telemetry during production outages)
- **Source File:** `C:\Users\gbola\Desktop\SchoolPass\src\app\api\auth\register\route.ts`
- **Affected Lines:** Lines 104–109
- **Observed Runtime Evidence:** Captured in `task-162.log` and `evidence/13-write-failed-logs.txt`.

#### Description & Root Cause
The top-level `catch` block in `src/app/api/auth/register/route.ts` catches all unhandled exceptions occurring anywhere in the registration pipeline:
```ts
  } catch {
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
```
Notice that the catch block does not bind an error variable (`catch (err)`), does not call `console.error(err)`, and does not emit a structured log entry via `logEvent({ level: 'error', ... })`.

#### Observed Runtime Behavior
When the database connection timed out or when Neon compute was cold, the server console printed only:
```text
POST /api/auth/register 500 in 9939ms
```
Zero error messages, stack traces, or exception names were printed to stdout or written to logs. The engineer or operator is left completely blind as to whether the 500 error was caused by a database connection failure, a bcrypt hashing error, a JSON parsing crash, or an upstream API failure.

#### Recommended Remediation
Bind the error object, log the stack trace to `console.error`, and record a structured operational log event:
```diff
-  } catch {
+  } catch (error) {
+    console.error('[API /api/auth/register] Unhandled exception:', error);
+    logEvent({
+      level: 'error',
+      event: 'registration_unhandled_exception',
+      actorType: 'anonymous',
+      outcome: 'failure',
+      details: { error: error instanceof Error ? error.message : String(error) },
+    });
     return Response.json(
       { error: 'An unexpected error occurred. Please try again.' },
       { status: 500 }
     );
   }
```

---

### Defect 3: Neon Serverless Database Cold-Start Timeout Vulnerability

- **Classification:** Infrastructure Configuration & Availability
- **Severity:** Medium (Causes intermittent failures during traffic lulls)
- **Source Files:** `C:\Users\gbola\Desktop\SchoolPass\.env.local` and `src/lib/db/index.ts`
- **Observed Runtime Evidence:** Captured during initial connection attempt (`PrismaClientInitializationError: Can't reach database server... errorCode: P1001`).

#### Description & Root Cause
The development database is hosted on Neon Serverless PostgreSQL (`ep-morning-sea-b463ljf1-pooler.c-6.us-east-2.aws.neon.tech`). In Neon serverless architecture, idle compute endpoints automatically suspend after 5 minutes of inactivity to conserve resources.

When a new query arrives after suspension, Neon must wake up the compute container before accepting TCP queries, which takes between 3.5 and 7 seconds.

The `DATABASE_URL` configured in `.env.local` and `.env` specifies:
```text
postgresql://...@ep-morning-sea-b463ljf1-pooler.../neondb?sslmode=require&channel_binding=require
```
Because no `connect_timeout` parameter is defined, Prisma's internal connection pool defaults to a tight connection deadline (typically 5 seconds). If the compute wake-up takes longer than this deadline, the Prisma client immediately throws:
```text
PrismaClientInitializationError: Can't reach database server at `ep-morning-sea-b463ljf1-pooler...` (P1001)
```

#### Observed Runtime Verification
- When tested with default parameters during a cold state, Prisma timed out in ~9.9s and returned HTTP 500.
- When tested with `&connect_timeout=30`, Prisma waited 2.85s for compute activation and connected successfully on Attempt 1.

#### Recommended Remediation
Append `&connect_timeout=30` and `&pool_timeout=30` to `DATABASE_URL` in `.env.local`:
```text
DATABASE_URL="postgresql://...?sslmode=require&channel_binding=require&connect_timeout=30&pool_timeout=30"
```

---

### Defect 4: Background Async Email Dispatch Error Swallowing & Detached Failures

- **Classification:** Background Task Management & User Expectation Mismatch
- **Severity:** Medium (User informed to check email when email was never delivered)
- **Source Files:** `C:\Users\gbola\Desktop\SchoolPass\src\lib\auth\email.ts` and `src\lib\auth\index.ts`
- **Affected Lines:** `src/lib/auth/email.ts` lines 691–712; `src/lib/auth/index.ts` lines 320–335
- **Observed Runtime Evidence:** Captured in `task-162.log` at timestamps `15:56:54Z` and `17:55:33Z`:
  ```text
  {"timestamp":"2026-10-29T15:56:54.272Z","level":"error","event":"welcome_email_error","actorType":"parent","actorId":"cmvtq7a5e0000lgqghf47rizh","outcome":"failure","details":{"error":"Connection closed unexpectedly"}}
  {"timestamp":"2026-10-29T17:55:33.766Z","level":"error","event":"welcome_email_error","actorType":"parent","actorId":"cmvtuftf60004lgqg0kelwxob","outcome":"failure","details":{"error":""}}
  ```

#### Description & Root Cause
In `src/lib/auth/index.ts`, `triggerWelcomeEmail` and `triggerVerificationEmail` are invoked asynchronously without `await`:
```ts
// Asynchronously dispatch welcome email in the background without delaying registration response
triggerWelcomeEmail({
  to: email,
  name: parent.name,
  userId: parent.id,
  actorType: 'parent',
});
```
Inside `triggerWelcomeEmail`, errors from `sendWelcomeEmail` are caught and logged, but no retry mechanism or dead-letter queue exists.

During both successful registration tests, the server returned `HTTP 200 OK` with `message: "Registration successful. Please verify your email address."` Within 20 seconds of the response, the background SMTP connection failed (`"Connection closed unexpectedly"`), meaning the welcome email was dropped.

#### Impact
The user is left waiting indefinitely for an email that failed in a background thread, while the UI gave them no indication that email delivery encountered an issue.

#### Recommended Remediation
1. In development environments where external SMTP credentials may be unverified or rate-limited, ensure fallback tokens are explicitly rendered in the UI or printed to terminal.
2. In production, utilize a durable queue (such as Redis/BullMQ or a database-backed transactional outbox pattern) rather than fire-and-forget background promises.

---

## 3. Summary Defect Matrix

| ID | Defect Title | Impacted File | Severity | Discovered Via |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | HTTP `200 OK` on resource creation instead of `201 Created` | `src/app/api/auth/register/route.ts:92` | Low | Runtime HTTP audit |
| **DEF-02** | Silent error swallowing in registration catch block | `src/app/api/auth/register/route.ts:104` | High | Code review & failure testing |
| **DEF-03** | Neon serverless database cold-start timeout vulnerability | `src/lib/db/index.ts` / `.env.local` | Medium | Runtime cold-start observation |
| **DEF-04** | Detached background email failure leaves user in dark | `src/lib/auth/email.ts:691` | Medium | Dev server terminal logs (`task-162.log`) |
