# Production Account Deletion Architecture & Migration Proposal

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5 & Deliverable `docs/production-deletion-proposal.md`  
**Author:** Antigravity (Pair Programming Agent)  
**Status:** **Implemented in Application Code | Tested Locally | Awaiting User Approval for Neon Migration**

---

## 1. Executive Summary & Safety Boundary

This document specifies and records the implementation of lawful account deletion under the **Nigeria Data Protection Act (NDPA 2023 §34)** while strictly upholding corporate accounting retention under the **Companies and Allied Matters Act (CAMA 2020 §375)**.

### The Production Safety Boundary
1. **Implemented in Real Application Code:**
   The account deletion lifecycle is **natively implemented in the SchoolPass application codebase (`C:\Users\gbola\Desktop\SchoolPass`)**. It is not merely documented or simulated.
2. **Tested Locally:**
   The entire lifecycle is verified against the real auth store and index modules via [`task-05-sessions-and-defence/scripts/test-deletion-lifecycle.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-deletion-lifecycle.mjs), passing all 11/11 tests, alongside `npm run typecheck` passing with 0 errors.
3. **Awaiting User Approval for Neon Migration:**
   Per the strict safety boundary instructed by the user, **no migrations have been executed against the live Neon PostgreSQL database, and no production data has been altered**. The schema modifications and SQL migration file have been prepared and validated locally, and are presented in Section 4 for explicit user approval before execution.
4. **Not Yet Verified in a Live Browser Session:**
   Interactive browser end-to-end verification remains pending until the database migration is approved and applied to the database instance.

---

## 2. The Relational Flaw in the Original Schema

### Current Production Definition (`prisma/schema.prisma`)
```prisma
model Parent {
  id                      String    @id @default(cuid())
  email                   String    @unique
  name                    String
  passwordHash            String
  emailVerifiedAt         DateTime?
  // Missing: isLocked, scheduledDeletionAt, anonymizedAt, deletionRequestedAt
  payments                Payment[]
  sessions                Session[]
  // ...
}

model Payment {
  id         String   @id @default(cuid())
  parentId   String
  amount     Int
  status     String
  parent     Parent   @relation(fields: [parentId], references: [id], onDelete: Cascade)
}
```

### The Legal & Relational Hazard
1. **Relational Destruction:** If a parent endpoint executes `prisma.parent.delete({ where: { id } })`, PostgreSQL executes a cascade delete on `payments`.
2. **CAMA 2020 §375(2) Violation:** Nigerian corporate law mandates that accounting records and books of prime entry must be preserved for **not less than 6 years** from the date they are made. Destroying fee payments constitutes a regulatory infraction.
3. **NDPA 2023 §34 Reconciliation:** The NDPA guarantees the data subject's "Right to Erasure" (Right to be Forgotten). However, NDPA §34(2)(b) and §34(2)(c) explicitly exempt erasure when processing is necessary for:
   - Compliance with a legal obligation under Nigerian law (CAMA).
   - The establishment, exercise, or defense of legal or financial claims.

### The Architectural Resolution: Selective Identity Anonymisation
Rather than deleting the `Parent` row (which would cascade delete payments or fail under foreign key constraints), the deletion engine:
- Clears personal identity attributes: `name`, `email`, and `passwordHash`.
- Sets `email = "deleted_<sha256>@anonymized.schoolpass.local"`.
- Sets `passwordHash = "$argon2id$v=19$deleted_unusable_hash"`.
- Stamps `anonymizedAt = now()`.
- Disassociates non-financial child relations (`parent_students`, `student_link_requests`).
- **Strictly retains all `Payment` rows linked to the parent ID down to the kobo.**

---

## 3. The 4-Stage Deletion Lifecycle Specification

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Deletion Request (Immediate Soft Lockout)          │
│ - Sets isLocked = true, deletionRequestedAt = now()        │
│ - Sets scheduledDeletionAt = now() + 7 days                │
│ - Calls deleteAllUserSessions(parentId)                     │
│ - Clears schoolpass_session cookie                          │
│ - Multi-tier lockout: getSession() returns null immediately │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: 7-Day Grace Period (Recovery Window)               │
│ - Login attempts display "ACCOUNT_SCHEDULED_FOR_DELETION"   │
│ - Member may authenticate to Cancel Deletion via password   │
│ - Cancellation clears lock: isLocked = false,               │
│   scheduledDeletionAt = null                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ (After 7 Days Elapsed)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Transactional Purge & Identity Anonymisation       │
│ - Scheduled background cron (scripts/run-deletion-purge.mjs)│
│ - Atomic prisma.$transaction wrapping                       │
│ - Disassociates guardian-student links                      │
│ - Overwrites PII: name = "Anonymised Parent <id>"           │
│   email = "deleted_<hash>@anonymized.schoolpass.local"      │
│   passwordHash = "$argon2id$v=19$deleted_unusable_hash"     │
│ - Stamped: anonymizedAt = now()                             │
│ - PRESERVES: Payment rows intact down to the kobo           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: Idempotency Verification                           │
│ - Immediate rerun modifies 0 rows                           │
│ - Start/Finish counts confirm zero residual targets         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Proposed Production Schema Changes & Migration File

### A. Prisma Schema Amendments (`prisma/schema.prisma`)
```prisma
model Parent {
  id                      String    @id @default(cuid())
  email                   String    @unique
  name                    String
  passwordHash            String
  emailVerifiedAt         DateTime?
  
  // Account Deletion & Lifecycle Management
  isLocked                Boolean   @default(false)
  deletionRequestedAt     DateTime?
  scheduledDeletionAt     DateTime?
  anonymizedAt            DateTime?

  payments                Payment[]
  sessions                Session[]
  students                ParentStudent[]
  linkRequests            StudentLinkRequest[]

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  @@index([isLocked])
  @@index([scheduledDeletionAt])
  @@map("parents")
}

model Payment {
  id         String   @id @default(cuid())
  parentId   String
  amount     Int
  status     String
  // CRITICAL FIX: Changed from onDelete: Cascade to onDelete: Restrict
  parent     Parent   @relation(fields: [parentId], references: [id], onDelete: Restrict)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("payments")
}
```

### B. Prepared Local Migration SQL
**File location:** `C:\Users\gbola\Desktop\SchoolPass\prisma\migrations\20261102_account_deletion_lifecycle_and_restrict_payments\migration.sql`

```sql
-- Step 1: Add Account Deletion Lifecycle columns to parents table
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "scheduledDeletionAt" TIMESTAMP(3);
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "anonymizedAt" TIMESTAMP(3);

-- Step 2: Create indexes for fast background job querying and auth resolution
CREATE INDEX IF NOT EXISTS "parents_isLocked_idx" ON "parents"("isLocked");
CREATE INDEX IF NOT EXISTS "parents_scheduledDeletionAt_idx" ON "parents"("scheduledDeletionAt");

-- Step 3: Prevent accidental cascade destruction of CAMA financial records
-- Drop the legacy cascading foreign key constraint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_parentId_fkey";

-- Recreate foreign key constraint with RESTRICT to guarantee financial records can never be dropped
ALTER TABLE "payments" ADD CONSTRAINT "payments_parentId_fkey" 
  FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 5. Exact Implementation in Real SchoolPass Application

The deletion lifecycle is fully wired into the application core:

| File in `C:\Users\gbola\Desktop\SchoolPass` | Exact Functionality Implemented |
|---|---|
| [`src/lib/auth/store.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/store.ts) | Extended `ParentAccount` with `isLocked`, `deletionRequestedAt`, `scheduledDeletionAt`, `anonymizedAt`. Implemented `requestParentAccountDeletion()`, `cancelParentAccountDeletion()`, `findExpiredDeletionCandidates()`, and `anonymizeParentAccount()` with atomic student link detachment and payment retention. |
| [`src/lib/auth/index.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/index.ts) | Exported `DELETION_GRACE_PERIOD_DAYS = 7`. Updated `getSession()` to immediately reject locked accounts with `null`. Updated `loginParent()` to refuse locked accounts with `ACCOUNT_SCHEDULED_FOR_DELETION` (within grace) or `ACCOUNT_DELETED` (expired). Implemented `requestAccountDeletion()` and `cancelAccountDeletion()`. |
| [`src/app/api/auth/delete-account/route.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/api/auth/delete-account/route.ts) | Authenticated endpoint verifying parent session and password confirmation, calling `requestAccountDeletion()`. |
| [`src/app/api/auth/cancel-deletion/route.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/api/auth/cancel-deletion/route.ts) | Endpoint accepting `{ email, password }`, verifying credentials, resetting lock status and clearing scheduled deletion. |
| [`scripts/run-deletion-purge.mjs`](file:///c:/Users/gbola/Desktop/SchoolPass/scripts/run-deletion-purge.mjs) | Idempotent background cron worker script querying expired candidates, executing transactional purge, logging `[PURGE CRON] START:` and `[PURGE CRON] FINISH:`, and reporting candidate/processed/failure counts. |
| [`prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql`](file:///c:/Users/gbola/Desktop/SchoolPass/prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql) | Prepared local SQL migration file ready to apply once approved. |

---

## 6. Automated Testing & Verification Results

### Automated Suite: `test-deletion-lifecycle.mjs`
**Execution Command:**
```bash
node --import ./src/lib/auth/test-loader.mjs --conditions=react-server --test ../SchoolPass-Assessment/task-05-sessions-and-defence/scripts/test-deletion-lifecycle.mjs
```

**Results:**
```
▶ Task 5 Deletion: Lifecycle Parameters & Grace Period Specification
  ✔ enforces 7-day grace period per NDPA and assessment brief (3.7186ms)
✔ Task 5 Deletion: Lifecycle Parameters & Grace Period Specification (6.5491ms)
▶ Task 5 Deletion: Step 6 Req 1 - Immediate Lockout & Session Revocation
  ✔ requesting deletion locks account and causes getSession() to return null (1.1559ms)
✔ Task 5 Deletion: Step 6 Req 1 - Immediate Lockout & Session Revocation (2.0512ms)
▶ Task 5 Deletion: Grace Period Login Notice & Safeguards
  ✔ login during grace period returns ACCOUNT_SCHEDULED_FOR_DELETION and offers cancellation (4.4902ms)
  ✔ cancellation clears isLocked and restores active portal login (0.4465ms)
✔ Task 5 Deletion: Grace Period Login Notice & Safeguards (6.8077ms)
▶ Task 5 Deletion: Step 6 Req 2 & CAMA 2020 §375 Financial Ledger Protection
  ✔ anonymisation strips PII but preserves Payment records down to the kobo (4.2284ms)
✔ Task 5 Deletion: Step 6 Req 2 & CAMA 2020 §375 Financial Ledger Protection (5.2983ms)
▶ Task 5 Deletion: Step 6 Req 4 - Purge Engine Logging & Idempotency
  ✔ scheduled purge job logs start/finish counts and second run modifies 0 records (1.3961ms)
✔ Task 5 Deletion: Step 6 Req 4 - Purge Engine Logging & Idempotency (2.6828ms)
ℹ tests 11
ℹ pass 11
ℹ fail 0
ℹ duration_ms 1898.6071
```

### TypeScript Validation:
```bash
npm run typecheck
# > schoolpass@0.1.0 typecheck
# > tsc --noEmit
# Result: 0 errors
```

---

## 7. Migration Approval Checklist (Awaiting User Sign-Off)

Before applying the migration to Neon PostgreSQL, the following checklist is submitted for user review:

1. **[ ] Schema Review:** Confirm `Parent` columns (`isLocked`, `deletionRequestedAt`, `scheduledDeletionAt`, `anonymizedAt`).
2. **[ ] Relational Safety:** Confirm altering `Payment.parent` foreign key from `onDelete: Cascade` to `onDelete: Restrict`.
3. **[ ] Neon Deployment:** Explicit user confirmation required to execute `prisma migrate deploy` or apply `migration.sql` to live database.
4. **[ ] Browser Verification:** Once migration is applied, execute interactive browser session to capture visual screenshots (`12-deletion-request-locks-account.png`).
