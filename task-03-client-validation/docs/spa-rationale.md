# Architecture Rationale: Single-Route SPA Authentication Consolidation

## Executive Summary
This document provides the technical justification and architectural analysis for consolidating the SchoolPass authentication interface from six fragmented multi-page Next.js routes into a unified Single Page Application (SPA) authentication view driven by the URL search parameter `/auth?view=<view-name>`.

---

## 1. Baseline Context vs Consolidated Architecture

### 1.1 The Baseline Multi-Page Architecture
In the initial project scaffold, authentication functionality was fragmented across multiple independent filesystem routes in the Next.js App Router:
- `/auth/login/page.tsx` (Parent Login)
- `/auth/register/page.tsx` (Parent Registration & Student Linking)
- `/auth/staff/page.tsx` (Staff Multi-Role Portal Login)
- `/auth/forgot-password/page.tsx` (Password Recovery Request)
- `/auth/reset-password/page.tsx` (Token-based Password Reset)
- `/auth/verify-email/page.tsx` (Token-based Email Verification)
- `/auth/page.tsx` (A detached, simplified mock container)

Total page count across the application was **15 pages** (verified in `evidence/01-page-count-before.txt`).

### 1.2 The Consolidated Single-Route Architecture
Under the Task 3 architecture, the authentication surface is consolidated into a single route:
```
/auth?view={login | register | staff | forgot-password | reset-password | verify-email}
```
Total page count across the application is reduced to **9 pages** (verified in `evidence/02-page-count-after.txt`), eliminating 6 redundant wrapper files while preserving 100% of the underlying form validation logic, modals, security controls, and session segregation.

---

## 2. Technical & Ergonomic Benefits

### 2.1 Elimination of Hard Navigations and Context Loss
In a multi-page setup, transitioning between parent login and registration (e.g. when an unregistered guardian attempts to sign in and clicks "Need an account? Register") requires a full browser navigation. This induces:
- Network round-trips for new HTML document payloads.
- Re-execution of client JavaScript bootstrap bundles.
- Annoying layout shifts and screen flashes.
- Complete loss of pre-filled transient input state (such as pre-entered student admission numbers or email addresses).

Under the consolidated query-driven architecture, view transitions occur instantaneously via Next.js client-side navigation (`router.push('/auth?view=register')` or native `useSearchParams` reactivity). The shared layout shell (`AuthShell`), brand logo, trust badges, and security notice headers remain persistently mounted.

### 2.2 Deep Linking and Backward Compatibility
A frequent criticism of poorly designed SPAs is the breakage of deep links, bookmarking, and the browser Back/Forward buttons. The SchoolPass implementation strictly prevents this:
1. **URL State Synchronization**: Every view transition updates the browser address bar with the corresponding query parameter (`/auth?view=register`, `/auth?view=login`).
2. **Backward Compatibility via Rewrites**: In `next.config.js`, declarative path rewrites transparently redirect legacy bookmarks and emails (`/auth/login`, `/auth/register`, `/auth/verify-email`) to the new consolidated query route without client-side redirects or broken links:
   ```javascript
   async rewrites() {
     return [
       { source: '/auth/login', destination: '/auth?view=login' },
       { source: '/auth/register', destination: '/auth?view=register' },
       { source: '/auth/staff', destination: '/auth?view=staff' },
       { source: '/auth/forgot-password', destination: '/auth?view=forgot-password' },
       { source: '/auth/reset-password', destination: '/auth?view=reset-password' },
       { source: '/auth/verify-email', destination: '/auth?view=verify-email' },
     ];
   }
   ```
3. **Cryptographic Token Deep Links**: Verification and password recovery links containing cryptographic tokens (`/auth?view=verify-email&token=...` and `/auth?view=reset-password&token=...`) parse the token directly from `useSearchParams` and immediately initiate token validation without intermediate redirection.

---

## 3. Product Requirement Hierarchy & Session Integrity

### 3.1 PRD Baseline Alignment
The product hierarchy established across PRD v6 and PRD Addendum v6.1 mandates:
- **Parent vs Staff Session Isolation**: Staff users and parent guardians operate under distinct security boundaries. Staff credentials authenticate against the `Staff` table with role-based access control (Teacher, Principal, FrontDesk, Bursar), while parents authenticate against the `Parent` table linked to student admission records.
- **Security Notice & Nigerian Legal Compliance**: Nigeria Data Protection Act (NDPA) 2023 disclosures and terms modal inspections must be directly accessible from the registration surface.

### 3.2 Preservation of Security Controls
Consolidation into a single client route does **not** merge backend session cookies or authorization models:
- Parent authentication invokes `/api/auth/login` and receives a parent session token.
- Staff authentication invokes `/api/auth/staff-login` and receives a staff session token.
- Middleware continues to enforce role-based route guards (`/parent/*` vs `/staff/*` vs `/admin/*`).

---

## 4. Verification Evidence References
- `evidence/01-page-count-before.txt`: 15 total pages in baseline scaffold.
- `evidence/02-page-count-after.txt`: 9 total pages in consolidated scaffold.
- `evidence/03-url-states.png`: Visual evidence of instant URL query parameter switching.
- `evidence/04-form-switch-logs.txt`: Browser runtime and server log verification of zero HTTP round-trips during view changes.
