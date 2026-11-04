# Technical Uncertainties, Known Limits, and Architectural Gaps (What I Do Not Know)

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5, Deliverable `docs/what-i-do-not-know.md`  
**Requirement:** Minimum eight (8) concrete technical uncertainties located within the codebase.

---

### Introduction
The inability to locate the limits of one's own system is an engineering vulnerability. Below is a detailed, unvarnished inventory of eight architectural uncertainties, failure modes, and legal ambiguities present in the current SchoolPass implementation.

---

## 1. Prisma Migration Recovery on Partial DDL Failure in Neon PostgreSQL
**The Uncertainty:** What exactly happens to database state if a multi-step migration (such as altering the foreign key on `payments` from `Cascade` to `Restrict`) fails halfway through on a remote Neon branch?
- **What I Know:** PostgreSQL supports transactional DDL for most operations, meaning a failed migration *should* roll back cleanly.
- **What I Do Not Know:** How Prisma's `_prisma_migrations` tracking table behaves when Neon's serverless compute experiences an ephemeral connection reset during a DDL statement. If Prisma records the migration as failed (`applied_steps_count` mismatch), does it leave the database schema locked against subsequent migrations until manual human intervention (`prisma migrate resolve`) is performed?

---

## 2. Scheduled Cron Purge Execution During Server Downtime
**The Uncertainty:** What happens to the daily account deletion purge job if the application container or virtual machine is offline or restarting during the scheduled cron firing window?
- **What I Know:** The purge script (`run-deletion-purge.mjs`) is idempotent and logs start/finish counts accurately when executed.
- **What I Do Not Know:** If the cron schedule is configured for `02:00 AM UTC` and the server undergoes a maintenance restart between `01:55 AM` and `02:05 AM`, the operating system cron daemon will simply skip the event. I have not implemented a persistent catch-up heartbeat or queue worker (e.g. BullMQ / Celery) to detect missed runs and trigger them upon container startup. Expired deletion requests would remain unpurged for an additional 24 hours.

---

## 3. In-Memory Rate Limiting Survival Across Serverless Multi-Instance Scaling
**The Uncertainty:** How does SchoolPass rate limiting hold up when deployed to a serverless platform (e.g. Vercel) across multiple ephemeral container instances?
- **What I Know:** In our unit tests and local environment, rate limiting is tracked either in-memory or via single database rows in `RateLimit`.
- **What I Do Not Know:** In a multi-region or autoscaled environment without an external Redis cluster (Upstash / Redis), each serverless lambda maintains an isolated memory space. An attacker distributing password-guessing requests across multiple IP addresses and edge nodes could theoretically multiply their attempt allowance by the number of active lambda containers before triggering rate limits.

---

## 4. Legal Viability of Our Retention Matrix Under Adverse Nigerian Case Law
**The Uncertainty:** Would our retention of anonymised parent IDs and transaction records survive a hostile legal challenge by a data subject in a Nigerian High Court?
- **What I Know:** NDPA 2023 §34 provides an exception to erasure for legal compliance (CAMA 2020 §375), and anonymised data is technically exempt from data protection principles once the data subject is no longer identifiable.
- **What I Do Not Know:** There is virtually zero published Nigerian judicial precedent interpreting NDPA 2023 §34 against CAMA §375 in educational institutions. If an aggrieved parent subpoenas the school and argues that a pseudonymous parent ID linked to a named child's tuition invoice constitutes "indirectly identifiable personal data", I do not know whether a Nigerian court would order the permanent destruction of the accounting ledger.

---

## 5. Session Cookie Signing vs. True Cryptographic Encryption
**The Uncertainty:** What are the exact failure modes of signing session cookies with HMAC-SHA256 rather than full authenticated encryption (AES-256-GCM)?
- **What I Know:** HMAC-SHA256 provides message integrity and authenticity. A client cannot modify the CUID without invalidating the 64-character hex signature.
- **What I Do Not Know:** The payload itself (`<cuid>`) is base64/plaintext, not ciphertext. If a misconfigured reverse proxy or corporate TLS inspection appliance logs the raw `Cookie` request headers, the raw session identifier is exposed in plaintext. I have not benchmarked the CPU overhead of upgrading from HMAC signing to AES-GCM envelope encryption on high-throughput route handlers.

---

## 6. Next.js Edge Middleware Cache Coherence & Revalidation Latency
**The Uncertainty:** When a session is deleted in PostgreSQL during logout, what is the exact revalidation window for Next.js internal Router Cache and Data Cache?
- **What I Know:** Because Edge Middleware does not query PostgreSQL on every request (to preserve sub-10ms response times), middleware only checks token cryptographic validity and role presence.
- **What I Do Not Know:** If a user logs out in Browser Tab A, and immediately navigates back in Browser Tab B, does the Next.js Client-side Router Cache render a stale, cached React Server Component payload before Tier 2 server component validation intercepts the request?

---

## 7. Database Connection Pool Exhaustion During Morning Drop-Off Spikes
**The Uncertainty:** What happens to Neon's connection pooler when 600 parents concurrently arrive at the school gate between 07:30 AM and 08:00 AM?
- **What I Know:** Neon uses PgBouncer to manage connection pooling, and our connection string points to `-pooler`.
- **What I Do Not Know:** If 600 parents simultaneously open the portal to display their arrival pickup QR codes, does PgBouncer queue transactions cleanly, or does latency degrade to the point where school gate guards experience connection timeouts (`PrismaClientInitializationError: Can't reach database server`)? I have not performed load testing at 500+ requests per second against Neon's free-tier compute.

---

## 8. Multi-Guardian Tenancy Conflicts on Account Deletion Requests
**The Uncertainty:** How should the system resolve account deletion when two divorced or separated guardians share linked access to the same student?
- **What I Know:** If Mother requests account deletion, her `parent_students` link is removed and her personal profile is anonymised.
- **What I Do Not Know:** If Mother was the primary billing contact who made historical tuition payments, but Father remains active to view attendance, how does the interface present historical payment receipts to Father without displaying anonymised placeholder records (`Anonymised Parent 7f8a9b`) that confuse the remaining parent? The current data model does not distinguish between primary bill-payers and secondary emergency guardians.
