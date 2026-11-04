/**
 * Task 5: Implement Real Account Deletion Lifecycle in SchoolPass
 * 
 * Target files in C:\Users\gbola\Desktop\SchoolPass:
 * 1. src/lib/auth/store.ts:
 *    - Update ParentAccount interface with isLocked, deletionRequestedAt, scheduledDeletionAt, anonymizedAt
 *    - Update updateParent to support lifecycle fields
 *    - Implement requestParentAccountDeletion, cancelParentAccountDeletion, anonymizeParentAccount, findExpiredDeletionCandidates
 * 2. src/lib/auth/index.ts:
 *    - Add DELETION_GRACE_PERIOD_DAYS constant (7 days)
 *    - In getSession: if (parent.isLocked) return null (immediate session lockout)
 *    - In loginParent: return ACCOUNT_SCHEDULED_FOR_DELETION if locked within grace period
 *    - Implement requestAccountDeletion (with password verification & session wipe)
 *    - Implement cancelAccountDeletion (with password verification & account recovery)
 * 3. src/app/api/auth/delete-account/route.ts:
 *    - Authenticated endpoint for requesting deletion
 * 4. src/app/api/auth/cancel-deletion/route.ts:
 *    - Public endpoint for cancelling deletion with password during grace period
 * 5. scripts/run-deletion-purge.mjs:
 *    - Production background purge engine script with start/finish counts and single transaction
 * 6. prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql:
 *    - Prepared SQL migration script (LOCAL ONLY - awaiting user approval)
 */

import * as fs from 'fs';
import * as path from 'path';

const schoolPassRoot = 'C:/Users/gbola/Desktop/SchoolPass';

console.log('Applying Real Account Deletion Lifecycle to SchoolPass...\n');

// 1. Update src/lib/auth/store.ts
const storePath = path.join(schoolPassRoot, 'src/lib/auth/store.ts');
let storeContent = fs.readFileSync(storePath, 'utf8');

// A. Update ParentAccount interface
if (!storeContent.includes('isLocked?: boolean;')) {
  storeContent = storeContent.replace(
    `export interface ParentAccount {\n  id: string;\n  name: string;\n  email: string;\n  passwordHash: string;\n  previousPasswordHashes: string[];\n  emailVerifiedAt: Date | null;\n  createdAt: Date;\n  updatedAt: Date;\n}`,
    `export interface ParentAccount {\n  id: string;\n  name: string;\n  email: string;\n  passwordHash: string;\n  previousPasswordHashes: string[];\n  emailVerifiedAt: Date | null;\n  isLocked?: boolean;\n  deletionRequestedAt?: Date | null;\n  scheduledDeletionAt?: Date | null;\n  anonymizedAt?: Date | null;\n  createdAt: Date;\n  updatedAt: Date;\n}`
  );
}

// B. Update updateParent function to support lifecycle fields
if (!storeContent.includes('updates.isLocked !== undefined')) {
  storeContent = storeContent.replace(
    `...(updates.emailVerifiedAt !== undefined && { emailVerifiedAt: updates.emailVerifiedAt }),`,
    `...(updates.emailVerifiedAt !== undefined && { emailVerifiedAt: updates.emailVerifiedAt }),\n        ...(updates.isLocked !== undefined && { isLocked: updates.isLocked }),\n        ...(updates.deletionRequestedAt !== undefined && { deletionRequestedAt: updates.deletionRequestedAt }),\n        ...(updates.scheduledDeletionAt !== undefined && { scheduledDeletionAt: updates.scheduledDeletionAt }),\n        ...(updates.anonymizedAt !== undefined && { anonymizedAt: updates.anonymizedAt }),`
  );
}

// C. Append Account Deletion Lifecycle Store Functions
const deletionStoreHelpers = `
// ==========================================
// Account Deletion & Compliance Lifecycle (Task 5 / NDPA 2023 §34 & CAMA 2020 §375)
// ==========================================

export async function requestParentAccountDeletion(
  parentId: string,
  gracePeriodDays = 7
): Promise<{ success: boolean; scheduledDeletionAt: Date }> {
  const scheduledDeletionAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);

  await updateParent(parentId, {
    isLocked: true,
    deletionRequestedAt: new Date(),
    scheduledDeletionAt,
  });

  // Step 6 Req 1: Immediate lock revokes all active sessions across devices
  await deleteAllUserSessions(parentId);

  return { success: true, scheduledDeletionAt };
}

export async function cancelParentAccountDeletion(parentId: string): Promise<boolean> {
  const updated = await updateParent(parentId, {
    isLocked: false,
    deletionRequestedAt: null,
    scheduledDeletionAt: null,
  });
  return Boolean(updated);
}

export async function findExpiredDeletionCandidates(
  cutoffDate: Date = new Date()
): Promise<ParentAccount[]> {
  try {
    const records = await prisma.parent.findMany({
      where: {
        isLocked: true,
        scheduledDeletionAt: { lte: cutoffDate },
        anonymizedAt: null,
      },
    });
    return records;
  } catch {
    return [];
  }
}

export async function anonymizeParentAccount(
  parentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parent = await findParentById(parentId);
    if (!parent) return { success: false, error: 'Parent not found' };

    const { createHash } = await import('node:crypto');
    const emailHash = createHash('sha256').update(parent.email).digest('hex').substring(0, 12);
    const shortId = parent.id.substring(parent.id.length - 6);

    // Atomic transaction: remove student links, overwrite PII, PRESERVE payment rows
    await prisma.$transaction(async (tx) => {
      // 1. Remove active student links and pending link requests
      await tx.parentStudent.deleteMany({ where: { parentId } });
      await tx.studentLinkRequest.deleteMany({ where: { parentId } });
      await tx.arrivalConfirmation.deleteMany({ where: { parentId } });
      await tx.aiUsageDaily.deleteMany({ where: { parentId } });

      // 2. Anonymize Parent identity
      await tx.parent.update({
        where: { id: parentId },
        data: {
          name: \`Anonymised Parent (\${shortId})\`,
          email: \`deleted_\${emailHash}@anonymized.schoolpass.local\`,
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$purged_account_no_access',
          emailVerifiedAt: null,
          anonymizedAt: new Date(),
        },
      });

      // Step 6 Req 2: Payment records are RETAINED in full for CAMA 2020 §375 6-year retention.
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
`;

if (!storeContent.includes('requestParentAccountDeletion')) {
  storeContent += deletionStoreHelpers;
  fs.writeFileSync(storePath, storeContent, 'utf8');
  console.log('✓ Updated src/lib/auth/store.ts with account deletion lifecycle methods');
}

// 2. Update src/lib/auth/index.ts
const authIndexPath = path.join(schoolPassRoot, 'src/lib/auth/index.ts');
let authIndexContent = fs.readFileSync(authIndexPath, 'utf8');

// A. Add DELETION_GRACE_PERIOD_DAYS constant
if (!authIndexContent.includes('DELETION_GRACE_PERIOD_DAYS')) {
  authIndexContent = authIndexContent.replace(
    `export const SESSION_DURATION_DAYS = 7;`,
    `export const SESSION_DURATION_DAYS = 7;\nexport const DELETION_GRACE_PERIOD_DAYS = 7; // Step 6: 7-day grace period before purge`
  );
}

// B. In getSession(): check if parent.isLocked -> return null (immediate session revocation)
if (!authIndexContent.includes('if (parent.isLocked) return null;')) {
  authIndexContent = authIndexContent.replace(
    `if (!parent) return null;`,
    `if (!parent) return null;\n      if (parent.isLocked) return null; // Deletion request locks account immediately`
  );
}

// C. In loginParent(): handle locked accounts scheduled for deletion
if (!authIndexContent.includes('ACCOUNT_SCHEDULED_FOR_DELETION')) {
  const lockedCheck = `
  // Account Deletion Safeguard: Check if account is locked / scheduled for deletion
  if (parent.isLocked) {
    if (parent.anonymizedAt || (parent.scheduledDeletionAt && parent.scheduledDeletionAt.getTime() <= Date.now())) {
      return {
        success: false,
        error: 'This account has been permanently deleted.',
        errorCode: 'ACCOUNT_DELETED',
      };
    }

    if (parent.scheduledDeletionAt && parent.scheduledDeletionAt.getTime() > Date.now()) {
      const scheduledDateStr = parent.scheduledDeletionAt.toISOString().split('T')[0];
      return {
        success: false,
        error: \`Your account is scheduled for deletion on \${scheduledDateStr}. You have a 7-day grace period to cancel deletion and restore your account.\`,
        errorCode: 'ACCOUNT_SCHEDULED_FOR_DELETION',
        canCancel: true,
        scheduledDeletionAt: parent.scheduledDeletionAt,
      };
    }
  }
`;
  authIndexContent = authIndexContent.replace(
    `const rateCheck = checkIpRateLimit(ip, 'parent_auth');`,
    `${lockedCheck}\n  const rateCheck = checkIpRateLimit(ip, 'parent_auth');`
  );
}

// D. Add requestAccountDeletion and cancelAccountDeletion methods
const deletionAuthMethods = `
/**
 * Request account deletion with mandatory password verification (Step 6 Req 1).
 * Locks the account immediately, revokes all sessions, and starts the 7-day grace period.
 */
export async function requestAccountDeletion(
  parentId: string,
  passwordConfirmation: string
): Promise<{
  success: boolean;
  error?: string;
  scheduledDeletionAt?: string;
}> {
  const parent = await findParentById(parentId);
  if (!parent) {
    return { success: false, error: 'Account not found.' };
  }

  const passwordValid = await verifyPassword(passwordConfirmation.trim(), parent.passwordHash);
  if (!passwordValid) {
    return { success: false, error: 'Invalid password. Password confirmation is required to delete your account.' };
  }

  const result = await requestParentAccountDeletion(parentId, DELETION_GRACE_PERIOD_DAYS);
  await clearSessionCookie();

  logEvent({
    level: 'info',
    event: 'parent_account_deletion_requested',
    actorType: 'parent',
    actorId: parentId,
    outcome: 'success',
  });

  return {
    success: true,
    scheduledDeletionAt: result.scheduledDeletionAt.toISOString(),
  };
}

/**
 * Cancel a pending account deletion request during the 7-day grace period.
 * Requires valid password authentication, clears lock state, and restores access.
 */
export async function cancelAccountDeletion(
  email: string,
  passwordConfirmation: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const parent = await findParentByEmail(email.trim().toLowerCase());
  if (!parent) {
    return { success: false, error: 'Account not found.' };
  }

  if (!parent.isLocked) {
    return { success: false, error: 'Account is not currently scheduled for deletion.' };
  }

  if (parent.anonymizedAt) {
    return { success: false, error: 'This account has already been permanently purged and cannot be restored.' };
  }

  const passwordValid = await verifyPassword(passwordConfirmation.trim(), parent.passwordHash);
  if (!passwordValid) {
    return { success: false, error: 'Invalid password.' };
  }

  await cancelParentAccountDeletion(parent.id);

  logEvent({
    level: 'info',
    event: 'parent_account_deletion_cancelled',
    actorType: 'parent',
    actorId: parent.id,
    outcome: 'success',
  });

  return { success: true };
}
`;

if (!authIndexContent.includes('export async function requestAccountDeletion')) {
  // Import store functions
  authIndexContent = authIndexContent.replace(
    `  findParentByEmail,`,
    `  findParentByEmail,\n  requestParentAccountDeletion,\n  cancelParentAccountDeletion,\n  anonymizeParentAccount,\n  findExpiredDeletionCandidates,`
  );
  authIndexContent += deletionAuthMethods;
  fs.writeFileSync(authIndexPath, authIndexContent, 'utf8');
  console.log('✓ Updated src/lib/auth/index.ts with requestAccountDeletion and cancelAccountDeletion');
}

// 3. Create src/app/api/auth/delete-account/route.ts
const deleteAccountDir = path.join(schoolPassRoot, 'src/app/api/auth/delete-account');
if (!fs.existsSync(deleteAccountDir)) {
  fs.mkdirSync(deleteAccountDir, { recursive: true });
}

const deleteAccountRouteCode = `import { getSession, requestAccountDeletion } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'parent') {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return Response.json({ error: 'Password confirmation is required.' }, { status: 400 });
    }

    const result = await requestAccountDeletion(session.userId, password);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'Your account has been scheduled for deletion. You have a 7-day grace period to restore it.',
      scheduledDeletionAt: result.scheduledDeletionAt,
    });
  } catch {
    return Response.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
`;

fs.writeFileSync(path.join(deleteAccountDir, 'route.ts'), deleteAccountRouteCode, 'utf8');
console.log('✓ Created src/app/api/auth/delete-account/route.ts');

// 4. Create src/app/api/auth/cancel-deletion/route.ts
const cancelDeletionDir = path.join(schoolPassRoot, 'src/app/api/auth/cancel-deletion');
if (!fs.existsSync(cancelDeletionDir)) {
  fs.mkdirSync(cancelDeletionDir, { recursive: true });
}

const cancelDeletionRouteCode = `import { cancelAccountDeletion } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return Response.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const result = await cancelAccountDeletion(email, password);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'Account deletion has been cancelled. Your account has been fully restored.',
    });
  } catch {
    return Response.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
`;

fs.writeFileSync(path.join(cancelDeletionDir, 'route.ts'), cancelDeletionRouteCode, 'utf8');
console.log('✓ Created src/app/api/auth/cancel-deletion/route.ts');

// 5. Create scripts/run-deletion-purge.mjs in SchoolPass
const purgeScriptCode = `/**
 * SchoolPass Production Purge Engine (Step 6 Req 3 & 4)
 * 
 * Scheduled background task that:
 * 1. Finds expired deletion requests (scheduledDeletionAt <= now(), anonymizedAt == null).
 * 2. Purges data in a single transaction (disassociates child links, anonymizes PII).
 * 3. Preserves all Payment financial records down to the kobo per CAMA 2020 §375.
 * 4. Logs a START line and a FINISH line with candidate, processed, and failure counts.
 * 5. Guarantees idempotency (safe to run twice, second run changes 0 records).
 */

import { prisma } from '../src/lib/db/index.js';
import { anonymizeParentAccount, findExpiredDeletionCandidates } from '../src/lib/auth/store.js';

async function runScheduledPurge() {
  const startTime = new Date();
  console.log(\`[PURGE CRON] START: \${startTime.toISOString()}\`);

  const candidates = await findExpiredDeletionCandidates(startTime);
  console.log(\`[PURGE CRON] Candidates found: \${candidates.length}\`);

  let processedCount = 0;
  let failedCount = 0;

  for (const parent of candidates) {
    try {
      const result = await anonymizeParentAccount(parent.id);
      if (result.success) {
        processedCount++;
      } else {
        console.error(\`[PURGE CRON] Failed to anonymize parent \${parent.id}: \${result.error}\`);
        failedCount++;
      }
    } catch (err) {
      console.error(\`[PURGE CRON] Error during purge of parent \${parent.id}:\`, err);
      failedCount++;
    }
  }

  const finishTime = new Date();
  const durationMs = finishTime.getTime() - startTime.getTime();
  console.log(\`[PURGE CRON] FINISH: \${finishTime.toISOString()} | Processed: \${processedCount} | Failed: \${failedCount} | Duration: \${durationMs}ms\`);
}

runScheduledPurge()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('[PURGE CRON] Critical failure:', e);
    prisma.$disconnect();
    process.exit(1);
  });
`;

fs.writeFileSync(path.join(schoolPassRoot, 'scripts/run-deletion-purge.mjs'), purgeScriptCode, 'utf8');
console.log('✓ Created scripts/run-deletion-purge.mjs');

// 6. Prepare local SQL migration in prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql
const migrationDir = path.join(schoolPassRoot, 'prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments');
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}

const migrationSql = `-- AlterTable: Add account deletion lifecycle columns to parents table
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "scheduledDeletionAt" TIMESTAMP(3);
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "anonymizedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "parents_scheduledDeletionAt_idx" ON "parents"("scheduledDeletionAt");
CREATE INDEX IF NOT EXISTS "parents_isLocked_idx" ON "parents"("isLocked");

-- AlterTable: Restrict foreign key deletion on payments to protect 6-year CAMA financial ledger
-- Drop old cascading foreign key constraint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_parentId_fkey";

-- Add new RESTRICT foreign key constraint
ALTER TABLE "payments" ADD CONSTRAINT "payments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
`;

fs.writeFileSync(path.join(migrationDir, 'migration.sql'), migrationSql, 'utf8');
console.log('✓ Prepared local migration file at prisma/migrations/20261102_account_deletion_lifecycle_and_restrict_payments/migration.sql (Awaiting user approval before applying)');

console.log('\nAccount Deletion application updates completed.');
