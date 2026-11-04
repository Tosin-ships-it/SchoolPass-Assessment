# The Cascade Drop Trap: How Implementing the "Right to be Forgotten" Almost Destroyed Six Years of Tuition Records

**Author:** [Candidate Name / Antigravity Engineering Lead]  
**Topic:** Architectural Decision Story — Data Privacy vs. Statutory Financial Retention in Web Engineering  
**Target Publication Platforms:** Substack, Medium, or LinkedIn Articles  
**Target Word Count:** ~1,500 words  
**Status:** Publication-Ready Draft (Task 5, Step 13 Assessment Submission)

---

## Abstract

When software engineers implement the "Right to Erasure" under modern data privacy statutes like GDPR or the Nigeria Data Protection Act (NDPA 2023), the instinctive reflex is simple: add a "Delete Account" button, prompt the user for password confirmation, and execute `DELETE FROM users WHERE id = ?`. In an educational management portal like SchoolPass, that single naive query would have triggered an automatic, unrecoverable cascading deletion of six years of tuition payments and transaction ledgers, immediately violating Section 375 of the Companies and Allied Matters Act (CAMA 2020).

This is the technical story of discovering a catastrophic `onDelete: Cascade` constraint in a baseline Prisma schema, untangling the legal collision between privacy laws and corporate accounting statutes, and engineering a resilient four-stage account deletion lifecycle based on selective identity anonymisation, immediate multi-tier session revocation, and transaction-wrapped background purge workers.

---

## 1. The Requirement and the Initial Naivety

In Task 5 of the SchoolPass assessment, the instruction appeared clear on the surface:
> *"Implement lawful account deletion in SchoolPass adhering to NDPA 2023 §34. The user must be able to request deletion, experience a seven-day grace period with cancellation rights, and have their account purged when due."*

When I sat down to design the feature with an AI coding partner, my initial prompt framed the task in standard web-engineering terms:

> **Engineering Prompt (Task 5, Step 6):**  
> *"Implement lawful account deletion for SchoolPass adhering to NDPA 2023 §34 right to erasure. The user must experience an immediate lockout, a seven-day grace period with cancellation rights, and a scheduled background purge job. Before writing code, inspect `prisma/schema.prisma` for relational constraints to ensure compliance with financial record retention under CAMA 2020 §375."*

My initial mental model was straightforward. I would create an authenticated endpoint (`POST /api/auth/delete-account`), accept the user's password to prevent cross-site request forgery or accidental clicks, mark the account, and when the grace period elapsed, invoke:

```typescript
await prisma.parent.delete({
  where: { id: parentId }
});
```

It was clean, idiomatic, and followed standard full-stack tutorial patterns.

Then I inspected the relational database schema.

---

## 2. The Discovered Risk: `onDelete: Cascade`

In `prisma/schema.prisma` (lines 291–310), the baseline schema defined the relational link between the `Parent` guardian model and the `Payment` financial model:

```prisma
model Parent {
  id                      String          @id @default(cuid())
  email                   String          @unique
  name                    String
  passwordHash            String
  payments                Payment[]
  sessions                Session[]
  // ...
  @@map("parents")
}

model Payment {
  id                   String        @id @default(cuid())
  studentId            String
  parentId             String
  amount               Decimal       @db.Decimal(12, 2)
  internalReference    String        @unique
  flutterwaveReference String?       @unique
  status               PaymentStatus
  createdAt            DateTime      @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  parent  Parent  @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@map("payments")
}
```

Look closely at the foreign key constraint on the `Payment` model:
`parent Parent @relation(fields: [parentId], references: [id], onDelete: Cascade)`.

In PostgreSQL, an `ON DELETE CASCADE` constraint delegates deletion authority to the database engine. If a `Parent` row is removed, PostgreSQL's query engine automatically traverses dependent tables with matching foreign keys and drops every related row.

In an active school portal, `Payment` records represent tuition fee settlements, registration dues, and term fees paid in Nigerian Naira down to the kobo. Deleting a parent who withdrew their child would have automatically and silently wiped out their entire payment history from the relational database.

---

## 3. The Statutory Conflict: NDPA 2023 §34 vs. CAMA 2020 §375

This was not merely a relational design bug; it was an unavoidable collision between two statutory obligations:

### The Privacy Mandate: NDPA 2023 §34
Under Section 34 of the Nigeria Data Protection Act 2023, data subjects possess the fundamental "Right to Erasure" (the Right to be Forgotten). If a parent withdraws their child from a school, they are legally entitled to request that the data controller erase their personal data without undue delay.

### The Accounting Mandate: CAMA 2020 §375(2)
Conversely, corporate entities operating in Nigeria are governed by the Companies and Allied Matters Act (CAMA 2020). Section 375(2) mandates:
> *"The accounting records shall be kept at the registered office of the company or at such other place as the directors think fit, and shall at all times be open to inspection by the officers of the company, and must be preserved for not less than six years from the date on which they were made."*

If a school proprietor undergoes a Federal Inland Revenue Service (FIRS) audit or a state ministry review, they are legally obligated to present six years of revenue entries. Telling tax auditors that fee ledgers were erased because a parent clicked "Delete Account" is a regulatory infraction carrying severe statutory penalties.

### The Compliance Reconciliation
A closer reading of data protection law reconciles this apparent conflict. Under NDPA §34(2)(b) and §34(2)(c), the right to erasure does **not** apply when processing or retention is necessary for:
1. Compliance with a legal obligation under Nigerian law (such as CAMA 2020).
2. The establishment, exercise, or defense of legal or financial claims.

From an engineering perspective, the conclusion was inescapable: **The parent's financial ledger must never be deleted. Only their personally identifiable information (PII) may be erased.**

---

## 4. What We Tried First — and What Failed

### Attempt 1: The Cosmetic Soft-Delete Flag
Our first attempted fix was adding a simple boolean flag to the `Parent` model:
`isDeleted Boolean @default(false)`.

When deletion was requested, the endpoint executed:
`await prisma.parent.update({ where: { id }, data: { isDeleted: true } });`

**Why It Failed:**
This was purely cosmetic security. While the UI hidden elements, **the user's database sessions remained valid**. A parent could initiate deletion, keep their existing browser tab open, and continue making link requests, viewing attendance, or modifying child pickup settings because the session token (`<cuid>.<hmac-sha256>`) was still active in PostgreSQL and passing Edge Middleware checks. Furthermore, an attacker who intercepted the session cookie had an open 7-day window to compromise the account.

### Attempt 2: Nullable Foreign Keys
Next, we considered setting the foreign key on `Payment` to nullable (`parentId String?`) and applying `onDelete: SetNull`.

**Why It Failed:**
Disassociating payments from their parent entity destroyed historical relational reporting. In the school administrator's ledger, transactions appeared as orphaned payments with no historical lineage, making it impossible to reconcile which family had settled specific term invoices during tax audits.

---

## 5. The Architecture: A Resilient 4-Stage Deletion Lifecycle

We stepped back and designed an authoritative 4-stage lifecycle that satisfied both NDPA §34 and CAMA §375 without risking data corruption:

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: Deletion Request (Immediate Multi-Tier Lockout)        │
│ • Requires password confirmation at /api/auth/delete-account    │
│ • Sets isLocked = true, deletionRequestedAt = now()             │
│ • Stamps scheduledDeletionAt = now() + 7 days (grace period)    │
│ • Calls deleteAllUserSessions(parentId) (wipes DB session rows) │
│ • Clears schoolpass_session cookie (Max-Age=0)                  │
│ • Multi-tier enforcement: getSession() returns null immediately │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: 7-Day Grace Period (Recovery Window)                   │
│ • Login attempts refuse entry: ACCOUNT_SCHEDULED_FOR_DELETION   │
│ • Notification displays scheduled deletion date & cancel link   │
│ • Member can POST /api/auth/cancel-deletion with password       │
│ • Cancellation resets isLocked = false, scheduledDeletionAt=null│
└───────────────────────────────┬─────────────────────────────────┘
                                │ (After 7 Days Elapsed)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: Transactional Purge & Selective Identity Anonymisation │
│ • Background cron worker (scripts/run-deletion-purge.mjs)       │
│ • Atomic prisma.$transaction wrapping                           │
│ • Drops guardian links: parent_students & student_link_requests │
│ • Overwrites PII: name = "Anonymised Parent <id>"               │
│   email = "deleted_<sha256>@anonymized.schoolpass.local"        │
│   passwordHash = "$argon2id$v=19$deleted_unusable_hash"         │
│ • Stamped: anonymizedAt = now()                                 │
│ • CRITICAL: Payment records preserved intact down to the kobo   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 4: Idempotent Verification                                │
│ • Job logs START and FINISH lines with explicit counts          │
│ • Second run against same state modifies exactly 0 records      │
└─────────────────────────────────────────────────────────────────┘
```

### The Proposed Schema Fix: Restricting Foreign Key Deletion
To permanently guard against accidental cascade drops, we authored a PostgreSQL migration proposing to alter the `Payment` relation:

```prisma
model Payment {
  id                   String        @id @default(cuid())
  studentId            String
  parentId             String
  amount               Decimal       @db.Decimal(12, 2)
  internalReference    String        @unique
  flutterwaveReference String?       @unique
  status               PaymentStatus
  createdAt            DateTime      @default(now())

  // PROPOSED SCHEMA CHANGE: Reject parent deletion if financial records exist
  parent               Parent        @relation(fields: [parentId], references: [id], onDelete: Restrict)
}
```

In theory, changing `onDelete: Cascade` to `onDelete: Restrict` ensures that the database engine rejects any query that would orphan or destroy linked payment ledgers. However, it is essential to be technically accurate about the current operational reality: this change is a **proposed PostgreSQL schema modification contained in an authored but unapplied migration file** (`prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql`).

The live production Neon database was not modified and currently still retains `onDelete: Cascade`. Furthermore, while our isolated local SQLite development sandbox defined its own separate schema using `onDelete: Restrict` to demonstrate the lifecycle workflows, that SQLite sandbox had its own schema definition from the beginning and does not test or prove that the PostgreSQL migration works against live data. In production today, preventing destructive cascade drops relies entirely on our application-layer lifecycle logic rather than an active database-level constraint.

---

## 6. What I Got Wrong: Real Engineering Mistakes

In software engineering, the mistakes you encounter during implementation are far more informative than the clean code you ship. Two real errors stood out during this work:

### Mistake 1: The Temporal Dead Zone in `loginParent()`
When implementing the deletion lockout check in [`src/lib/auth/index.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/index.ts), I placed the account deletion guard at the very beginning of the function:

```typescript
export async function loginParent(emailInput: string, passwordInput: string, ip = 'unknown') {
  const email = emailInput.trim().toLowerCase();
  
  // MISTAKE: Checking parent.isLocked before parent was retrieved!
  if (parent.isLocked) {
    return { success: false, error: 'Account scheduled for deletion' };
  }

  const parent = await findParentByEmail(email);
  // ...
}
```

Because of JavaScript's `const` Temporal Dead Zone (TDZ), attempting to access `parent.isLocked` before `const parent = await findParentByEmail(email)` threw an unhandled runtime error:
`ReferenceError: Cannot access 'parent' before initialization`.

This caused login requests to throw `HTTP 500 Internal Server Error` instead of cleanly rejecting invalid accounts. Diagnosing this with Node's native module inspector and moving the guard to execute *after* `findParentByEmail(email)` resolved the issue.

### Mistake 2: The Production Migration Safety Boundary
A second critical lesson was respecting production database boundaries. When drafting the schema changes, it was tempting to immediately execute `npx prisma migrate dev` against the remote Neon PostgreSQL instance to see the new columns live. 

However, altering foreign key constraints from `Cascade` to `Restrict` on a shared database requires table locks and could disrupt active connections. By establishing an explicit safety boundary—preparing the migration SQL locally ([`prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql`](file:///c:/Users/gbola/Desktop/SchoolPass/prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql)), verifying the lifecycle logic through in-memory test suites and an isolated SQLite sandbox, and pausing before touching live production data—we ensured that zero production records were put at risk.

---

## 7. Implementation Reality & Technical Fact-Check

To maintain absolute engineering transparency, here is the exact separation between what was built and tested versus what was preserved:

1. **Risks Discovered During Implementation:**
   The baseline schema in `prisma/schema.prisma` contained an active `onDelete: Cascade` foreign key linking `payments` to `parents`. Any naive implementation of account deletion would have permanently purged historical revenue records upon parent removal.
2. **Potential Consequences of Executing the Proposed Migration:**
   Altering the foreign key constraint from `Cascade` to `Restrict` via SQL in PostgreSQL requires table locks on `payments` and could fail or disrupt active database connections if executed uncoordinated during school operational hours.
3. **Changes Actually Implemented and Tested:**
   - **Auth Store Lifecycle Functions:** Implemented `requestParentAccountDeletion()`, `cancelParentAccountDeletion()`, `findExpiredDeletionCandidates()`, and `anonymizeParentAccount()` in [`src/lib/auth/store.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/store.ts).
   - **Multi-Tier Lockout & Revocation:** Enforced immediate session revocation in `loginParent()` and `getSession()` within [`src/lib/auth/index.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/index.ts).
   - **Authenticated API Endpoints:** Built `POST /api/auth/delete-account` and `POST /api/auth/cancel-deletion` requiring password re-verification.
   - **Background Purge Worker:** Implemented [`scripts/run-deletion-purge.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass/scripts/run-deletion-purge.mjs) with atomic transaction wrapping, logging, and idempotency guarantees.
   - **In-Memory Automated Unit/Contract Tests:** Verified through [`scripts/test-deletion-lifecycle.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-deletion-lifecycle.mjs), passing all 11/11 tests, with `npm run typecheck` passing with 0 errors. These 11 tests are in-memory unit and contract checks that validate lifecycle state machines, timing parameters, and credential rules without connecting to any database.
   - **Isolated SQLite Sandbox Operations:** Separately, database operations (including the transactional purge and idempotency runs) were exercised using [`scripts/run-deletion-lifecycle.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/scripts/run-deletion-lifecycle.mjs) against an isolated local SQLite sandbox database (`sandbox.db`). This demonstrated the lifecycle logic in a database environment, but did not execute or validate the PostgreSQL migration script.
4. **Migration Status & Unexecuted Actions:**
   The PostgreSQL migration script ([`prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql`](file:///c:/Users/gbola/Desktop/SchoolPass/prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql)) was authored and reviewed, but has **not been executed against any database**. The SQLite sandbox used its own pre-existing `Restrict` schema definition rather than running this migration. Production Neon was not modified, was never touched by this migration, and currently still uses `onDelete: Cascade`.

---

## 8. Conclusion

Data privacy engineering is not a checkbox exercise of deleting database rows. In real-world enterprise applications, data subjects' privacy rights exist in constant tension with statutory accounting obligations, anti-fraud auditing requirements, and database referential integrity.

By designing a deletion lifecycle around identity anonymisation, session revocation and financial-record preservation, SchoolPass moves towards a more responsible approach to data protection engineering. The implementation was tested locally, while the proposed PostgreSQL constraint migration remains pending deployment approval. This work highlights the importance of balancing privacy obligations, financial record retention and database integrity.

---

*Live canonical publication URL will be updated in `README.md` upon public posting.*
