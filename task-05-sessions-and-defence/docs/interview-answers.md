# Task 5 Viva Defence: Comprehensive Interview Answers

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5 & Deliverable `docs/interview-answers.md`  
**Requirement:** 22 viva defence questions, approximately 200 words each, cross-referenced with exact metrics from Tasks 1 to 4.

---

### Question 1: What should a secure browser session look like? Name every property and what each one prevents.
A production-grade browser session must be stateful, server-managed, and bound to an opaque identifier rather than user identity claims. In SchoolPass, the session identifier is an unguessable 25-character CUID generated on the server, cryptographically signed with HMAC-SHA256, and stored in an HTTP cookie named `schoolpass_session`. 

To prevent theft, replay, and manipulation, the cookie must possess five non-negotiable properties:
1. `HttpOnly: true`: Completely isolates the token from the client-side JavaScript execution environment (`document.cookie`), mitigating session theft via Cross-Site Scripting (XSS).
2. `Secure: true`: Enforces transmission exclusively across encrypted TLS/HTTPS tunnels, preventing network-sniffing adversaries on untrusted school Wi-Fi from reading plaintext tokens.
3. `SameSite=Lax`: Restricts automatic browser transmission on cross-site requests, providing robust baseline immunity against Cross-Site Request Forgery (CSRF).
4. `Path=/`: Restricts scope to legitimate application routes while preventing sub-path cookie confusion.
5. `Max-Age=604800` (7 Days) with a matching server-side `expiresAt` timestamp: Enforces bounded temporal lifetime, preventing stale sessions from persisting indefinitely on shared school devices.

Finally, the session must be backed by a database row in PostgreSQL, enabling instantaneous, deterministic revocation upon logout, password change, or account lockout.

---

### Question 2: What is session fixation, and what prevents it?
Session fixation is an attack where an adversary forces a victim to utilize a predetermined session identifier known to the attacker, allowing the adversary to hijack the authenticated session once the victim logs in. In a vulnerable application, an unauthenticated visitor is assigned a session token (e.g. `SESSION_ID=xyz`). The attacker tricks the victim into clicking a link containing this token or injects it via a subdomain. When the victim logs in, the vulnerable server authenticates the user but preserves the pre-existing token `xyz`. The attacker now has authorized access.

Session fixation is prevented through strict, unconditional session regeneration. The application must treat the transition between unauthenticated and authenticated states as an absolute security boundary. Upon verifying user credentials, the server must discard the previous session identifier, allocate a cryptographically random, fresh identifier in the database, and issue a new signed cookie. In SchoolPass, `createSessionRecord` executes on every successful login, generating a fresh CUID regardless of prior cookie headers. Furthermore, sessions are strictly deleted on logout, and sessions are never accepted from query parameters or unverified headers.

---

### Question 3: Are tokens better than server-side sessions? Answer for your own application, not in general.
For SchoolPass specifically, server-side database sessions are demonstrably superior to stateless tokens (JWTs). While stateless tokens are frequently praised in hyper-scale microservice architectures for avoiding database lookups, their fundamental flaw is the inability to perform immediate, reliable revocation. 

SchoolPass is a school safety and child arrival system. If a parent's phone is misplaced, or if a family requests immediate account deletion, access to student arrival confirmations, gate authorization codes, and pickup alerts must cease immediately. With stateless JWTs, a compromised token remains valid until its natural expiration unless the architecture introduces a distributed revocation blacklist—which simply recreates database state with added complexity. 

Furthermore, SchoolPass is a monolithic Next.js application backed by Neon PostgreSQL. Querying our indexed `sessions` table by primary key (`id`) takes less than 2 milliseconds. Because our traffic profile is characterized by structured morning and afternoon school drop-off spikes rather than millions of global concurrent requests, the minimal database cost of server-side sessions is completely justified by the non-negotiable requirement for instantaneous, deterministic session termination.

---

### Question 4: How would you implement log out of all devices?
Logging out of all devices requires global session invalidation anchored to the user's permanent identifier rather than the specific session cookie presented in the request. 

In SchoolPass, this is implemented via the server-side function `deleteAllUserSessions(userId)`. In the database schema, the `sessions` table contains a foreign key relation to the user (`userId`). When a user triggers "Sign Out of All Devices", the server extracts their authenticated identity and executes a single targeted query:
```sql
DELETE FROM sessions WHERE userId = :userId;
```
This single statement removes every active session record across all mobile phones, home desktops, tablets, and office workstations. Simultaneously, the server clears the cookie on the current browser by returning a response with `Set-Cookie: schoolpass_session=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`. 

When any previously authenticated device makes a subsequent request, the Next.js server component layout executes `getSession()`. Although the device may present an unexpired, cryptographically signed cookie, the database query `prisma.session.findUnique({ where: { id: sessionId } })` returns `null`. The server layout intercepts this and immediately redirects the device to `/auth/login`.

---

### Question 5: How do you invalidate existing sessions on a password change?
A password change indicates either that the legitimate user is securing their account or that a credential compromise has occurred. In both cases, treating existing sessions as valid creates a severe security window. 

In SchoolPass, session invalidation is integrated into the core password mutation transaction within `src/lib/auth/index.ts`. Whether the password is changed via the user profile or completed through the forgot-password email verification link (`/api/auth/reset-password`), the server executes:
```typescript
await updateParent(parent.id, { passwordHash: newHash, ... });
await deleteAllUserSessions(parent.id);
```
By executing `deleteAllUserSessions(parent.id)` within the same operational flow, every active session record across all devices is purged from the PostgreSQL `sessions` table before the server returns success to the caller. 

The user who initiated the password reset is then required to log in from scratch with their new credentials, generating a single fresh session identifier. Any adversary who possessed a stolen cookie or was logged in on a remote browser is terminated on their very next HTTP request because their session row no longer exists in the database.

---

### Question 6: What do the HttpOnly, Secure and SameSite cookie flags protect against, and what does each one fail to protect against?
The three core cookie security flags form an essential defense-in-depth shield:

1. **`HttpOnly`:** Protects against session hijacking via Cross-Site Scripting (XSS) by preventing JavaScript (`document.cookie`) from reading the cookie. It fails to protect against XSS-driven request forgery, where malicious injected script uses `fetch()` to execute actions on behalf of the victim while the browser automatically attaches the cookie.
2. **`Secure`:** Protects against network eavesdropping and man-in-the-middle sniffing by ensuring the browser only transmits the cookie across encrypted TLS (HTTPS) connections. It fails to protect against attacks occurring directly on the client host, such as malware, browser extension compromise, or physical machine access.
3. **`SameSite=Lax`:** Protects against Cross-Site Request Forgery (CSRF) by preventing the cookie from being included in cross-origin POST, PUT, or DELETE requests. It fails to protect against CSRF triggered via top-level GET navigations (e.g. clicking a link), nor does it protect against cross-site attacks originating from within the same parent domain (subdomain hijacking).

No single flag is sufficient; modern web security requires all three in conjunction with server-side CSRF defenses and Content Security Policies.

---

### Question 7: What is the difference between a 401 and a 403, and how should the interface treat them differently?
The difference between HTTP 401 and HTTP 403 represents the distinction between **authentication** and **authorization**:

- **HTTP 401 Unauthorized:** Indicates that the user is unauthenticated; the server does not know who they are. The request lacks valid credentials or presents an expired session token. The user interface must respond by saving the current destination URL as a `returnUrl` query parameter and redirecting the user to the login screen (`/auth/login?returnUrl=/records`), allowing them to authenticate and resume their workflow.
- **HTTP 403 Forbidden:** Indicates that the user is successfully authenticated, but lacks sufficient permissions to access the requested resource. The server knows who the user is, but explicitly refuses their access. 

The interface must NEVER redirect a 403 response to the login page, as logging in again with the same credentials produces the exact same failure and creates an infinite loop. Instead, the interface must render a clear, accessible permission barrier ("Access Denied: You do not have administrative privileges to view staff accounts") and provide navigation back to the user's authorized home dashboard.

---

### Question 8: Why must logout be handled on the server rather than the front end, and what exactly stays alive if it is not?
Handling logout exclusively on the front end—by clearing client cookies or local storage and redirecting to the login form—is a critical security vulnerability. 

If logout is handled solely on the client, the **server-side session record in the database stays completely alive**. The session identifier remains registered in the database with an expiration date up to seven days in the future. If an attacker previously intercepted the session cookie, if the token was logged by a proxy, or if a third party accesses the browser's persistent cache, the session can be replayed to access private student records without resistance.

Server-side logout guarantees that the authoritative record of authentication is irrevocably destroyed. In SchoolPass, `POST /api/auth/logout` executes an explicit SQL `DELETE FROM sessions WHERE id = :sessionId` in PostgreSQL while simultaneously dispatching response headers to clear the browser cookie (`Max-Age=0`). Even if the client fails to clear its local cookie, or if an attacker captured the token prior to logout, subsequent requests with that token return `null` because the database record has been deleted.

---

### Question 9: What is the difference between authentication and authorisation, and which one does a protected route need?
**Authentication** is the process of verifying identity: confirming that the user is genuinely who they claim to be (e.g. validating email and password credentials). **Authorisation** is the process of verifying permissions: determining whether an authenticated user has the right to access a specific resource or perform a specific mutation.

A protected route requires **BOTH** authentication and authorization, applied in strict hierarchical sequence:
1. First, the route must verify authentication: Is a valid session token present, is it active in the database, and has it not expired?
2. Second, the route must verify authorization: Does this specific authenticated user possess the role and tenancy rights required for this view?

For example, `/staff-accounts` in SchoolPass requires checking that the caller is logged in (Authentication) AND that their database role is `ADMIN` (Authorisation). If a route checks only authentication, an authenticated parent can paste an administrative URL and manage school staff accounts—representing a catastrophic Broken Object Level Authorization (BOLA) failure.

---

### Question 10: A user asks you to delete their account. Walk me through what happens, from the request to the data being gone.
When a parent requests account deletion in SchoolPass, the process follows a strict four-stage compliant lifecycle:

1. **Immediate Lockout (Day 0):** The parent submits their request under Settings. The server immediately sets `isLocked = true` and `scheduledDeletionAt = now() + 7 days` on the parent's record, and invokes `deleteAllUserSessions(parentId)`. All active sessions across all devices are deleted instantly. The user can no longer access student records or arrival codes.
2. **7-Day Grace Period (Days 1–7):** The account remains in the database in a locked state. If the request was made accidentally, the parent can authenticate within seven days, which presents a recovery modal allowing them to cancel the deletion.
3. **Scheduled Batch Purge (Day 8+):** A background cron worker (`run-deletion-purge.mjs`) fires daily, finds expired accounts, and executes a single atomic database transaction:
   - Purges transient data: session rows, single-use arrival QR codes, pending student link requests, and AI chat logs.
   - Preserves financial ledgers: tuition payment rows are strictly retained to satisfy CAMA 2020 §375.
   - Anonymises identity: parent name becomes `Anonymised Parent <hash>`, email becomes `deleted-<cuid>@schoolpass.internal`, and password hashes are wiped.
   - Logs an audit event with start/finish counts.
4. **Natural Backup Expiration:** Historical database snapshots roll off after 30 days via S3 lifecycle policies, eradicating identifiable PII from all media.

---

### Question 11: Which data would you refuse to delete on a deletion request, and on what basis?
On an account deletion request, SchoolPass strictly **refuses to delete financial payment records and historical student gate arrival confirmations**.

**The Statutory Basis:**
1. **Tuition and Fee Payment Ledgers:** Refused under **Companies and Allied Matters Act (CAMA 2020) Section 375(2)** and the Federal Inland Revenue Service Act Section 28, which mandate that all registered corporate entities in Nigeria preserve complete accounting books for a minimum of **six (6) years**. Deleting payment records is a corporate criminal offense. Furthermore, **NDPA 2023 Section 34(2)(b)** explicitly exempts controllers from erasure where processing is necessary to comply with a legal obligation or defend financial claims.
2. **Historical Gate Arrival Logs:** Refused under the school's statutory **Child Safeguarding Policy** and State Ministry of Education regulations, which require proof of physical custody and gate pickup authorization for seven (7) years post-enrollment.

To satisfy the parent's Right to Erasure without breaking corporate law, we perform **identity anonymisation**: the parent's personal contact details are scrambled, but the financial ledger and arrival timestamps remain intact to penny and second precision.

---

### Question 12: What happens to your backups when a user is deleted?
In a compliant production architecture, primary database deletions do not immediately rewrite historical immutable backup archives. Attempting to rewrite compressed, encrypted database backups upon every user deletion would compromise cryptographic snapshot integrity and introduce massive data corruption risks.

SchoolPass handles backup deletion through a two-tier compliance framework:
1. **The Restoration Tombstone Protocol:** When the scheduled purge job anonymises an account in PostgreSQL, it writes an immutable tombstone event to `audit_logs`:
   ```json
   { "event": "ACCOUNT_ANONYMIZATION_TOMBSTONE", "userId": "cm41...", "timestamp": "2026-11-02T15:38:19Z" }
   ```
   If a disaster recovery event forces the school to restore a database backup from two weeks prior, the automated restoration pipeline executes a mandatory Tombstone Replay script. This script scans `audit_logs` and re-applies all anonymisations and session deletions against the restored database before the application is reconnected to the internet.
2. **Strict Retention Expiration:** Backup snapshots stored in AWS S3 (encrypted with SSE-KMS) are governed by strict S3 Lifecycle Policies. Daily snapshots are automatically destroyed after 30 days. Consequently, identifiable data naturally and permanently disappears from all backup storage within 30 days.

---

### Question 13: What is the difference between anonymising and deleting, and when is anonymising sufficient?
**Deleting (Hard Deletion)** is the complete physical removal of a database record via SQL `DELETE`. Once executed, the primary key and all associated foreign key relationships are severed or dropped. If a model uses cascading deletes, deleting the parent record destroys all child payments and attendance logs.

**Anonymising** is the irreversible transformation of Personal Identifiable Information (PII) such that the data subject can no longer be identified, directly or indirectly, by anyone using any reasonable means. In SchoolPass, anonymisation overwrites `name` with `Anonymised Parent <hash>`, `email` with `deleted-<id>@schoolpass.internal`, and wipes password hashes while leaving the relational integer IDs and payment amounts untouched.

Anonymising is sufficient—and legally preferred—when a data subject exercises their Right to Erasure under NDPA 2023 §34, but the data controller is subject to an overriding legal obligation to maintain relational records (such as CAMA 2020 §375 financial ledger retention). Under data privacy laws, once data is irreversibly anonymized, it ceases to be "personal data" and falls outside privacy regulations, perfectly reconciling user privacy with statutory compliance.

---

### Question 14: Why do you want to work as a forward deployed engineer specifically, rather than as a software engineer?
I want to work as a Forward Deployed Engineer (FDE) because I thrive at the critical intersection of technical software architecture, production reality, and high-stakes client operations. Traditional software engineering often operates inside an isolated product roadmap, writing code against idealized specifications far removed from the physical friction of user deployment.

An FDE sits on the front lines. In the context of SchoolPass, an FDE doesn't just build an arrival scanner in an air-conditioned office; an FDE stands at the school gate at 07:30 AM on a rainy Monday morning in Lagos, observing the gate security guard struggling with sunlight glare on tablet screens and intermittent carrier throttling. 

The FDE diagnoses why the system is failing in real time, bridges the gap between client business constraints (such as CAMA financial retention rules and school fee reconciliation) and the engineering codebase, and implements robust, defensive architectures that work under harsh operational constraints. I want the immediate accountability of seeing my engineering solve mission-critical problems for real human operators.

---

### Question 15: A customer says they want to use AI to improve their operations. How do you respond?
My immediate response is to steer the conversation away from model buzzwords and anchor it firmly in their specific operational bottlenecks. I respond:

*"Before we discuss AI models or architectures, let's walk through your current workflow step by step: What is the single most time-consuming, repetitive, or error-prone task your staff performs every day? Where do your operations stall or back up?"*

AI is an operational tool, not an outcome. If the customer's bottleneck is caused by messy, unstructured data, ambiguous business rules, or poor software integration, deploying an AI agent or LLM will only automate chaos and generate hallucinated failures faster. 

I help the customer categorize their problem:
1. Is it a **deterministic workflow problem** (best solved by structured relational database logic and automated notifications)?
2. Is it an **information retrieval problem** (best solved by semantic search or a grounded RAG system over verified policy documents)?
3. Is it a **classification or extraction problem** (where specialized AI models genuinely reduce human labor)?

I only propose AI when deterministic software cannot solve the bottleneck, ensuring every AI initiative has clear operational ROI and measurable failure metrics.

---

### Question 16: What is the difference between a RAG system and a fine-tuned model for an enterprise deployment?
The fundamental difference lies in **where knowledge lives and how it is updated**:

- **Retrieval-Augmented Generation (RAG):** Knowledge lives *outside* the model in a searchable, verifiable external database (e.g. pgvector or Elasticsearch). When a user submits an inquiry, the system retrieves relevant document chunks and provides them as dynamic context in the LLM's prompt. 
  - *Advantages:* Zero hallucination on facts, instantaneous knowledge updates (updating a school policy document takes seconds, not retraining cycles), strict document-level access control, and complete auditability via citation links.
- **Fine-Tuning:** Knowledge and behavior are baked directly *into the model's neural weights* through supervised gradient descent training on domain-specific question-answer pairs.
  - *Advantages:* Teaches the model specific style, specialized syntax, vocabulary, or structured output formats (e.g. producing valid JSON schemas).
  - *Disadvantages:* Extremely expensive, prone to catastrophic forgetting, cannot be quickly updated when operational facts change, and continues to hallucinate facts confidently.

For enterprise operations, RAG is the default architecture for knowledge retrieval, while fine-tuning is reserved for shaping behavior, tone, or deterministic task formatting.

---

### Question 17: How do you evaluate whether an AI agent is working correctly in production?
Evaluating an AI agent in production requires moving beyond subjective prompt checks to a rigorous, multi-layered telemetry framework:

1. **Retrieval Precision and Recall:** In a RAG pipeline, measure whether the vector search actually retrieved the correct authoritative context chunks. Using synthetic test queries with ground-truth document IDs, track Mean Reciprocal Rank (MRR) and Hit Rate.
2. **Context Adherence and Faithfulness:** Evaluate whether the generated response is strictly derived from the retrieved context or hallucinated from pre-training weights. Systems like Ragas calculate a faithfulness score by verifying that every factual assertion in the answer is entailed by the retrieved context.
3. **Deterministic Output & Schema Validity:** If the agent executes tool calls or database queries, track the percentage of invalid JSON structures or failed function invocations. Any schema validation failure is an automatic operational defect.
4. **Latency, Token Usage, and Cost Telemetry:** Monitor token consumption per conversation and P99 latency. An agent that takes 25 seconds to generate an answer degrades user trust.
5. **Human Escalation Rate:** Track how often end users reject the agent's answer and request human front-desk escalation.

---

### Question 18: How do you decide between local component state, context, and an external state manager?
I decide between state mechanisms using the **Principle of Locality and Re-render Scope**:

1. **Local Component State (`useState` / `useReducer`):** Used when state is ephemeral and confined to a single component or its direct children (e.g. password visibility toggles, input field text, dropdown open/close states). If no other component cares about the value, keeping it local prevents unnecessary tree re-renders.
2. **React Context (`createContext`):** Used when data must be accessed by deeply nested components across a specific subtree, but updates infrequently (e.g. active color theme, authenticated user identity, or sharing email between login and forgot-password cards). Context is ideal for low-frequency state, but poor for high-frequency telemetry because every consumer re-renders on every context change.
3. **External State Manager (Zustand / Redux):** Used only when the application reaches complex, high-frequency operational requirements involving:
   - Multiple disparate UI widgets concurrently mutating a shared data graph.
   - Fine-grained subscription requirements (components only re-render when a specific slice of state changes).
   - Complex asynchronous state machines, offline mutation queuing, or persistent background synchronization (e.g. offline gate scanning queues).

---

### Question 19: How do you handle server state, as distinct from client state?
**Client state** represents ephemeral UI condition—modal open/close states, form validation errors, or active tab selection. It is synchronous, fully owned by the browser, and disappears on page refresh.

**Server state** represents persistent business data stored remotely in a database—student enrollment rosters, attendance records, tuition invoice balances. Server state is fundamentally asynchronous, shared across multiple concurrent users, and can become stale at any moment without the client's knowledge.

In SchoolPass, I separate them cleanly:
- **Server Components as Source of Truth:** Pages are React Server Components that fetch directly from PostgreSQL on the server during rendering. This eliminates client-side `useEffect` data-fetching waterfalls.
- **Cache Invalidation via Server Actions:** When mutations occur (e.g. approving a student link or updating arrival codes), Server Actions execute the database mutation and call `revalidatePath('/records')` or `revalidateTag()`. Next.js purges the server cache and streams fresh HTML to the browser.
- **Optimistic UI for Responsiveness:** For high-frequency client actions, local state is updated optimistically, but rollbacks are automatically triggered if the server action returns an error.

---

### Question 20: Cite three specific numbers from your own tasks one to four: one from your type scale, one timing figure from your hashing comparison, and one from your rate limit configuration. Explain what each number means and why you chose it.
Across Tasks 1 to 4, every architectural value was derived from operational requirements:

1. **Type Scale (Task 1): $57\text{ px}$ (Display-Large Font Size)**
   - *Meaning:* The primary hero display typography token (`--typography-display-large-fontsize: 57px`, line-height `64px`, weight 700).
   - *Rationale:* Derived for high-visibility readability on mobile tablets used outdoors by school gate security staff under harsh Nigerian sunlight, ensuring staff can identify student arrival headings from several paces away.
2. **Hashing Comparison Timing (Task 4): $93.605\text{ ms}$ (Argon2id Verification Duration)**
   - *Meaning:* The exact execution time measured in `evidence/08-timing-argon-vs-sha.txt` to verify an Argon2id password hash ($m=65536\text{ KiB}, t=3\text{ iterations}, p=4\text{ parallelism}$) compared to SHA-256 ($0.007\text{ ms}$).
   - *Rationale:* Configured to impose a massive 13,372x computational penalty on offline GPU brute-force cracking while remaining well under the $200\text{ ms}$ interactive threshold for legitimate parents logging in.
3. **Rate Limit Configuration (Task 4): $5\text{ attempts per } 900\text{ seconds}$ ($15\text{ minutes}$)**
   - *Meaning:* The sliding-window rate limit threshold enforced on `/api/auth/login` in `evidence/13-rate-limit-triggered.png`.
   - *Rationale:* Balances protection against automated credential stuffing with usability: 5 attempts allow a parent to mistype a password twice without lockouts, while a 15-minute cooldown stops automated brute-force attacks.

---

### Question 21: Across all five tasks, name the decision you are least confident about. Say what you would need to find out to settle it, and what you would do if the answer went against you.
The decision I am least confident about is **relying on Next.js Edge Middleware for routing pre-checks while deferring authoritative session and role verification to Server Component Layouts**.

- **Why I Am Uncertain:** While this multi-tier architecture prevents the 100ms latency penalty of querying PostgreSQL from the Edge on every static asset or page request, it introduces architectural complexity. If a future junior developer adds a new staff page outside the `(staff)` layout group, or fails to call `assertStaffSession` in a new server action, Edge Middleware will let an authenticated parent through, creating an authorization bypass.
- **What I Need to Settle It:** I need production load-testing telemetry using Neon's serverless HTTP driver (`@neondatabase/serverless`) running directly inside Next.js Edge runtime. I need to benchmark the exact latency overhead and connection pool exhaustion of executing `SELECT role FROM sessions WHERE id = $1` on every single request at 1,000 requests per second.
- **What I Would Do If the Answer Went Against Me:** If the latency penalty is negligible (under 15ms) and connection pooling holds up, I would immediately abandon the multi-tier split and enforce authoritative database session and role verification directly inside Edge Middleware, eliminating all possibility of layout-level bypasses.

---

### Question 22: Wrong-answer analysis. A candidate says: "For GDPR compliance we added a delete account button that removes the user's row from the database immediately, so we are fully compliant with the right to be forgotten. We also keep backups for a year in case anyone needs their data restored." Two sentences, several problems. Identify each, say which is a legal exposure rather than a technical one, and say what the correct design is.
The candidate's statement contains four fatal architectural and legal flaws:

1. **Immediate Raw Database Deletion Destroys Financial Ledgers (Legal Exposure):** Executing an immediate SQL `DELETE FROM users` destroys financial transaction history. Under corporate law (CAMA 2020 §375 in Nigeria, or statutory tax laws across Europe), accounting records must be preserved for 6 years. Wiping financial records upon user request is a corporate regulatory crime.
2. **Zero Grace Period (Technical & Operational Flaw):** Immediate hard deletion leaves zero recovery window for accidental requests, account takeover griefing, or malicious deletions by unauthorized third parties.
3. **One-Year Backups Containing Deleted PII (Severe Legal Exposure):** Keeping un-anonymised database backups for a year without a tombstone synchronization protocol directly violates GDPR Article 17 and NDPA §34. If a backup is restored following ransomware or disaster, the "deleted" user is resurrected, creating severe statutory exposure.
4. **"Restoring Data" Violates Erasure (Legal Exposure):** The candidate admits backups exist "in case anyone needs their data restored". If a user exercised their Right to be Forgotten, restoring their personal data upon request confirms the system never actually erased it.

**The Correct Design:**
Implement a 7-day grace period with immediate account locking and session revocation. After 7 days, execute a scheduled transactional purge that hard-deletes transient tokens, anonymises user identity on retained records (preserving financial ledgers), and writes tombstone records to audit logs so restored backups replay deletions deterministically.
