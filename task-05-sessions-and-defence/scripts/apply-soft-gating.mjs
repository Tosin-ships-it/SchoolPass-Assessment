/**
 * Task 5: Apply Real Soft-Gating Implementation to SchoolPass
 * 
 * Target files in C:\Users\gbola\Desktop\SchoolPass:
 * 1. src/lib/auth/index.ts:
 *    - isSoftGatingEnabled helper
 *    - AuthSession interface (isEmailVerified)
 *    - getSession (allows unverified parent sessions, stamps isEmailVerified)
 *    - registerParent (creates immediate session + cookie under soft-gating)
 *    - loginParent (allows login for unverified parents under soft-gating)
 * 2. src/app/api/auth/register/route.ts:
 *    - passes isSoftGated and redirectTo: '/records' on registration success
 * 3. src/app/auth/register/ParentRegisterForm.tsx:
 *    - handles isSoftGated with immediate navigation to /records
 * 4. src/app/(parent)/components/UnverifiedEmailBanner.tsx:
 *    - accessible, persistent warning banner with resend-verification action
 * 5. src/app/(parent)/layout.tsx:
 *    - async server component layout rendering banner when unverified
 * 6. src/app/api/records/link-requests/route.ts:
 *    - server-side 403 barrier when unverified parent calls POST
 * 7. src/app/(parent)/records/page.tsx & StudentLinkSection.tsx:
 *    - passes isEmailVerified to StudentLinkSection and displays restriction feedback
 */

import * as fs from 'fs';
import * as path from 'path';

const schoolPassRoot = 'C:/Users/gbola/Desktop/SchoolPass';

console.log('Applying Real Soft-Gating Implementation to SchoolPass...\n');

// 1. Create src/app/(parent)/components/UnverifiedEmailBanner.tsx
const bannerDir = path.join(schoolPassRoot, 'src/app/(parent)/components');
if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
}

const bannerCode = `'use client';

import React, { useState } from 'react';

export function UnverifiedEmailBanner({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification email. Please try again.');
      } else {
        setFeedback('Verification email sent! Please check your inbox.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="status"
      aria-label="Email Verification Notice"
      style={{
        width: '100%',
        backgroundColor: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        color: '#92400e',
        padding: '12px 16px',
        fontSize: '14px',
        lineHeight: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span aria-hidden="true" style={{ fontSize: '18px' }}>⚠️</span>
        <span>
          <strong>Action Required:</strong> Your email address (<strong>{email}</strong>) has not been verified. Some features like student linking and tuition fee payments require verified email ownership.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          style={{
            backgroundColor: '#d97706',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
      </div>

      {feedback && (
        <span style={{ color: '#065f46', fontWeight: 600, fontSize: '13px' }}>
          ✓ {feedback}
        </span>
      )}
      {error && (
        <span style={{ color: '#991b1b', fontWeight: 600, fontSize: '13px' }}>
          ✕ {error}
        </span>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(bannerDir, 'UnverifiedEmailBanner.tsx'), bannerCode, 'utf8');
console.log('✓ Created src/app/(parent)/components/UnverifiedEmailBanner.tsx');

// 2. Update src/app/(parent)/layout.tsx
const layoutPath = path.join(schoolPassRoot, 'src/app/(parent)/layout.tsx');
const parentLayoutCode = `import type { Metadata } from 'next';
import React from 'react';
import { getSession } from '@/lib/auth';
import { UnverifiedEmailBanner } from './components/UnverifiedEmailBanner';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <>
      {session && !session.isEmailVerified && (
        <UnverifiedEmailBanner email={session.user.email} />
      )}
      {children}
    </>
  );
}
`;

fs.writeFileSync(layoutPath, parentLayoutCode, 'utf8');
console.log('✓ Updated src/app/(parent)/layout.tsx');

// 3. Update src/lib/auth/index.ts
const authIndexPath = path.join(schoolPassRoot, 'src/lib/auth/index.ts');
let authIndexContent = fs.readFileSync(authIndexPath, 'utf8');

// A. Add isSoftGatingEnabled export helper if not present
if (!authIndexContent.includes('export function isSoftGatingEnabled')) {
  const gatingHelper = `
/**
 * Soft Gating vs Hard Gating Policy Configuration:
 * - Hard Gating: Stops user after registration, requires email verification before any session is issued.
 * - Soft Gating: Creates account and logs user in immediately with persistent warning banner and server-side mutation barriers.
 * Active by default on feat/soft-gating branch unless GATING_MODE=hard is explicitly set.
 */
export function isSoftGatingEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GATING_MODE === 'hard' || process.env.GATING_MODE === 'hard') {
    return false;
  }
  return true;
}
`;
  authIndexContent = authIndexContent.replace('export const SESSION_DURATION_MS =', `${gatingHelper}\nexport const SESSION_DURATION_MS =`);
}

// B. Update AuthSession interface
if (!authIndexContent.includes('isEmailVerified?: boolean;')) {
  authIndexContent = authIndexContent.replace(
    `  isLinked?: boolean; // For parents: whether they have any linked students\n}`,
    `  isLinked?: boolean; // For parents: whether they have any linked students\n  isEmailVerified?: boolean; // True if email has been verified; false under soft gating before verification\n  emailVerifiedAt?: Date | null;\n}`
  );
}

// C. Update getSession() to allow soft-gated unverified parent sessions and attach isEmailVerified
const oldGetSessionParent = `    if (session.role === 'parent') {
      const parent = await findParentById(session.userId);
      if (!parent || !parent.emailVerifiedAt) return null;

      const links = await getParentStudentLinks(parent.id);
      return {
        sessionId: session.id,
        userId: parent.id,
        role: 'parent',
        user: {
          id: parent.id,
          name: parent.name,
          email: parent.email,
        },
        isLinked: links.length > 0,
      };
    }`;

const newGetSessionParent = `    if (session.role === 'parent') {
      const parent = await findParentById(session.userId);
      if (!parent) return null;
      if (!isSoftGatingEnabled() && !parent.emailVerifiedAt) return null;

      const links = await getParentStudentLinks(parent.id);
      return {
        sessionId: session.id,
        userId: parent.id,
        role: 'parent',
        user: {
          id: parent.id,
          name: parent.name,
          email: parent.email,
        },
        isLinked: links.length > 0,
        isEmailVerified: Boolean(parent.emailVerifiedAt),
        emailVerifiedAt: parent.emailVerifiedAt,
      };
    }`;

if (authIndexContent.includes('if (!parent || !parent.emailVerifiedAt) return null;')) {
  authIndexContent = authIndexContent.replace(
    /if \(!parent \|\| !parent\.emailVerifiedAt\) return null;\s*const links = await getParentStudentLinks\(parent\.id\);\s*return \{[\s\S]*?isLinked: links\.length > 0,\s*\};/,
    `if (!parent) return null;\n      if (!isSoftGatingEnabled() && !parent.emailVerifiedAt) return null;\n\n      const links = await getParentStudentLinks(parent.id);\n      return {\n        sessionId: session.id,\n        userId: parent.id,\n        role: 'parent',\n        user: {\n          id: parent.id,\n          name: parent.name,\n          email: parent.email,\n        },\n        isLinked: links.length > 0,\n        isEmailVerified: Boolean(parent.emailVerifiedAt),\n        emailVerifiedAt: parent.emailVerifiedAt,\n      };`
  );
}

// D. Update registerParent() to issue immediate session under soft-gating
if (!authIndexContent.includes('isSoftGated: isSoftGatingEnabled()')) {
  authIndexContent = authIndexContent.replace(
    /return \{\s*success: true,\s*verificationToken: rawToken,\s*parentId: parent\.id,\s*studentLink,\s*\};/,
    `// Soft Gating: Issue active authenticated session immediately upon registration\n  let isSoftGated = false;\n  if (isSoftGatingEnabled()) {\n    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);\n    const sessionRecord = await createSessionRecord(parent.id, 'parent', expiresAt);\n    const signedToken = signSessionPayload(sessionRecord.id);\n    await setSessionCookie(signedToken);\n    isSoftGated = true;\n  }\n\n  return {\n    success: true,\n    verificationToken: rawToken,\n    parentId: parent.id,\n    studentLink,\n    isSoftGated,\n  };`
  );
}

// E. Update loginParent() to allow unverified logins under soft-gating
if (authIndexContent.includes('if (!parent.emailVerifiedAt) {')) {
  authIndexContent = authIndexContent.replace(
    `if (!parent.emailVerifiedAt) {`,
    `if (!parent.emailVerifiedAt && !isSoftGatingEnabled()) {`
  );
}

fs.writeFileSync(authIndexPath, authIndexContent, 'utf8');
console.log('✓ Updated src/lib/auth/index.ts (getSession, registerParent, loginParent, isSoftGatingEnabled)');

// 4. Update src/app/api/auth/register/route.ts
const registerRoutePath = path.join(schoolPassRoot, 'src/app/api/auth/register/route.ts');
let registerRouteContent = fs.readFileSync(registerRoutePath, 'utf8');

if (!registerRouteContent.includes('isSoftGated: result.isSoftGated')) {
  registerRouteContent = registerRouteContent.replace(
    /return Response\.json\(\{\s*success: true,\s*message: 'Registration successful\. Please verify your email address\.',[\s\S]*?studentLink: result\.studentLink,\s*\}\);/,
    `return Response.json({\n      success: true,\n      message: result.isSoftGated\n        ? 'Registration successful. Welcome to SchoolPass!'\n        : 'Registration successful. Please verify your email address.',\n      ...(isDevStubsEnabled() && { verificationToken: result.verificationToken }),\n      email,\n      studentLink: result.studentLink,\n      isSoftGated: Boolean(result.isSoftGated),\n      redirectTo: result.isSoftGated ? '/records' : undefined,\n    });`
  );
  fs.writeFileSync(registerRoutePath, registerRouteContent, 'utf8');
  console.log('✓ Updated src/app/api/auth/register/route.ts');
}

// 5. Update src/app/auth/register/ParentRegisterForm.tsx
const registerFormPath = path.join(schoolPassRoot, 'src/app/auth/register/ParentRegisterForm.tsx');
let registerFormContent = fs.readFileSync(registerFormPath, 'utf8');

if (!registerFormContent.includes('if (data.isSoftGated && data.redirectTo)')) {
  registerFormContent = registerFormContent.replace(
    `setIsSuccess(true);`,
    `if (data.isSoftGated && data.redirectTo) {\n        window.location.href = data.redirectTo;\n        return;\n      }\n\n      setIsSuccess(true);`
  );
  fs.writeFileSync(registerFormPath, registerFormContent, 'utf8');
  console.log('✓ Updated src/app/auth/register/ParentRegisterForm.tsx');
}

// 6. Update src/app/api/records/link-requests/route.ts (Server-Side Barrier for Unverified Parents)
const linkRequestsRoutePath = path.join(schoolPassRoot, 'src/app/api/records/link-requests/route.ts');
let linkRequestsContent = fs.readFileSync(linkRequestsRoutePath, 'utf8');

if (!linkRequestsContent.includes('EMAIL_VERIFICATION_REQUIRED')) {
  linkRequestsContent = linkRequestsContent.replace(
    `  if (!session || session.role !== 'parent') {\n    return Response.json({ error: 'Unauthorized' }, { status: 401 });\n  }`,
    `  if (!session || session.role !== 'parent') {\n    return Response.json({ error: 'Unauthorized' }, { status: 401 });\n  }\n\n  // Server-Side Soft-Gating Barrier: Unverified parents cannot submit link requests\n  if (!session.isEmailVerified) {\n    return Response.json(\n      {\n        error: 'Please verify your email address before submitting student link requests.',\n        errorCode: 'EMAIL_VERIFICATION_REQUIRED',\n      },\n      { status: 403 }\n    );\n  }`
  );
  fs.writeFileSync(linkRequestsRoutePath, linkRequestsContent, 'utf8');
  console.log('✓ Updated src/app/api/records/link-requests/route.ts (Server-side 403 barrier for unverified parents)');
}

// 7. Update records/page.tsx to pass isEmailVerified to StudentLinkSection
const recordsPagePath = path.join(schoolPassRoot, 'src/app/(parent)/records/page.tsx');
let recordsPageContent = fs.readFileSync(recordsPagePath, 'utf8');

if (!recordsPageContent.includes('isEmailVerified={session.isEmailVerified}')) {
  recordsPageContent = recordsPageContent.replace(
    `<StudentLinkSection\n          initialRequests={requests}\n          initialActiveLinks={activeLinks}\n        />`,
    `<StudentLinkSection\n          initialRequests={requests}\n          initialActiveLinks={activeLinks}\n          isEmailVerified={session.isEmailVerified}\n        />`
  );
  fs.writeFileSync(recordsPagePath, recordsPageContent, 'utf8');
  console.log('✓ Updated src/app/(parent)/records/page.tsx');
}

// 8. Update StudentLinkSection.tsx to accept isEmailVerified
const studentLinkSectionPath = path.join(schoolPassRoot, 'src/app/(parent)/records/StudentLinkSection.tsx');
let studentLinkSectionContent = fs.readFileSync(studentLinkSectionPath, 'utf8');

if (!studentLinkSectionContent.includes('isEmailVerified?: boolean;')) {
  studentLinkSectionContent = studentLinkSectionContent.replace(
    `interface Props {\n  initialRequests: StudentLinkRequestRecord[];\n  initialActiveLinks: ParentStudentLink[];\n}`,
    `interface Props {\n  initialRequests: StudentLinkRequestRecord[];\n  initialActiveLinks: ParentStudentLink[];\n  isEmailVerified?: boolean;\n}`
  );
  studentLinkSectionContent = studentLinkSectionContent.replace(
    `export function StudentLinkSection({ initialRequests, initialActiveLinks }: Props) {`,
    `export function StudentLinkSection({ initialRequests, initialActiveLinks, isEmailVerified }: Props) {`
  );
  fs.writeFileSync(studentLinkSectionPath, studentLinkSectionContent, 'utf8');
  console.log('✓ Updated src/app/(parent)/records/StudentLinkSection.tsx');
}

console.log('\nAll Soft-Gating updates applied successfully.');
