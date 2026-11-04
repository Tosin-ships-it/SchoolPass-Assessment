# Session Architecture, Multi-Tier Authorization, and Cookie Security

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5, Step 1, 4, 5, 10 & Deliverable `docs/sessions.md`  
**Reference Implementations:**  
- Session Engine: [`src/lib/auth/index.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/index.ts)  
- Session Store: [`src/lib/auth/store.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/store.ts)  
- Cryptographic Token Signing: [`src/lib/auth/crypto.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/crypto.ts)  
- Edge Routing Fence: [`src/middleware.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/middleware.ts)  
- Server Component Role Layout: [`src/app/(staff)/layout.tsx`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/(staff)/layout.tsx)

---

## 1. Executive Summary

SchoolPass implements a **stateful, database-backed session model** with cryptographic HMAC-SHA256 cookie signing. Every session is tracked as a row in the PostgreSQL `sessions` table and bound to a 7-day expiration window. 

The architecture strictly avoids relying on Edge Middleware as the sole authorization boundary, enforcing a **Three-Tier Defense-in-Depth Model** across Edge Routing, Server Component Layouts, and transactional Server Actions.

---

## 2. Session Token Anatomy & Cryptographic Signing

The session cookie (`schoolpass_session`) uses an opaque identifier signed with a server secret:

$$\text{SessionToken} = \langle\text{cuid}\rangle \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{HMAC}_{\text{SHA256}}(\langle\text{cuid}\rangle, \text{SESSION\_SECRET})$$

### Why Opaque Identifiers with Server State?
Unlike stateless JSON Web Tokens (JWTs), which encode identity and role directly in base64 within the client payload:
1. **Instant Revocability:** When a parent logs out, changes their password, or requests account deletion, deleting the single row in the database instantly revokes access across all devices. A stateless JWT cannot be revoked without maintaining a distributed blacklist that recreates database state.
2. **Zero Information Leakage:** The cookie contains no user email, role, or identifiers that could aid an attacker in reconnaissance.
3. **Constant Token Size:** The cookie is fixed at 89 characters (25-character CUID + dot + 64-character hex signature), avoiding HTTP header bloat.

### Verification Algorithm
```typescript
export function verifySessionPayload(signedString: string, secret?: string): string | null {
  const lastDotIndex = signedString.lastIndexOf('.');
  if (lastDotIndex === -1) return null;

  const payload = signedString.substring(0, lastDotIndex);
  const signature = signedString.substring(lastDotIndex + 1);

  const expectedHmac = createHmac('sha256', sessionSecret).update(payload).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedHmac, 'hex');

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null; // Forged or tampered token rejected in constant time
  }
  return payload; // Returns verified CUID
}
```

---

## 3. Cookie Security Attributes Matrix

The session cookie is configured strictly via [`setSessionCookie`](file:///c:/Users/gbola/Desktop/SchoolPass/src/lib/auth/index.ts):

| Attribute | Configured Value | Attack Prevented | Operational Boundary / Limitations |
|---|---|---|---|
| **HttpOnly** | `true` | **Cross-Site Scripting (XSS) Token Theft:** Prevents JavaScript (`document.cookie`) from reading the session identifier. | Does not prevent XSS from issuing unauthorized requests via `fetch` while the cookie is automatically attached. |
| **Secure** | `true` (Production) | **Man-in-the-Middle (MITM) Sniffing:** Prevents plaintext transmission over unencrypted Wi-Fi or networks. | Requires valid SSL/TLS certificates; disabled in local development over `http://localhost`. |
| **SameSite** | `Lax` | **Cross-Site Request Forgery (CSRF):** Blocks the cookie from being dispatched on cross-origin POSTs (e.g. evil site submitting tuition payment). | Allows cookie attachment on top-level GET navigations (e.g. clicking a link in an email). |
| **Path** | `/` | **Path Traversal Ambiguity:** Ensures session availability across all authenticated portal sub-routes. | Must be paired with strict role-based layout boundaries. |
| **Max-Age** | `604,800` (7 Days) | **Perpetual Stale Persistence:** Establishes explicit client-side expiration matching server database expiration. | Requires user re-authentication weekly; inactive clients are dropped. |

---

## 4. The Three-Tier Multi-Layer Authorization Boundary

A critical vulnerability in modern Next.js applications is treating Edge Middleware as the sole security boundary. Edge Middleware runs on the V8 Edge Runtime and cannot query relational databases over standard TCP pools without incurring severe latency penalties.

SchoolPass decouples routing friction from authoritative data protection:

```
[ Incoming Request ]
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Edge Middleware Routing Fence (src/middleware.ts)    │
│ • Optimistic edge gate                                      │
│ • Checks presence of session cookie                         │
│ • Fast redirect to /auth/login if unauthenticated           │
│ • Zero database roundtrips -> 0ms latency                   │
└─────────────────────────────────────────────────────────────┘
         │ (Passes edge filter)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Server Component Layout (src/app/(staff)/layout.tsx) │
│ • Runs in Node.js server runtime during page rendering      │
│ • Executes getSession() -> queries PostgreSQL sessions      │
│ • Validates:                                                │
│   1. Session row exists and expiresAt > now()               │
│   2. Account is not locked (isLocked === false)             │
│   3. Role in database matches 'staff' | 'admin'             │
│ • Authoritative redirect: redirect('/auth/staff-login')     │
└─────────────────────────────────────────────────────────────┘
         │ (Layout permits component tree to mount)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: Server Actions & Mutations (students/actions.ts)    │
│ • Irrevocable mutation boundary                             │
│ • Calls assertStaffSession() or assertAdminSession()        │
│ • Verifies tenancy (e.g. is parent linked to student?)      │
│ • Throws 403 Forbidden on forged or unauthorized payloads   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Server-Side Logout & The Network Failure Edge Case

### Why Front-End Only Logout Fails
Poorly architected applications handle logout by removing the client cookie and redirecting to the login form. The database session row remains active until natural expiration (up to 7 days). An attacker who captured the cookie header or who accesses browser memory can replay the session indefinitely.

SchoolPass executes server-side deletion:
```typescript
// src/app/api/auth/logout/route.ts
const result = await logout(sessionCookie);
// src/lib/auth/index.ts
await deleteSessionRecord(sessionId); // SQL: DELETE FROM sessions WHERE id = :sessionId
```

### The Logout Network Failure Edge Case (Evidence 09 & 10)
**The Defect:** When a user on a flaky connection clicks "Sign Out", an AJAX request can fail silently due to packet loss or connection reset. If the UI naively transitions to "Signed Out", the user walks away from a shared school terminal while their session remains alive on the server.

**The SchoolPass Fix:**
1. **Native HTTP POST Form:** The logout control uses an HTML `<form action="/api/auth/logout" method="POST">` rather than client-side JavaScript. The browser handles connection retries natively.
2. **HTTP 303 See Other Redirect:** The server responds with HTTP 303, instructing the browser to transition location and wipe cookies simultaneously.
3. **Unconditional Cookie Clearance:** Even if the database query throws an error, the server's `finally` block dispatches `Set-Cookie: schoolpass_session=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`.

---

## 6. Password Reset Multi-Session Revocation

Under Section 5 of Task 5:
> *"On reset, every previous session and cookie is wiped and the user logs in again from scratch."*

When a password reset token is verified and a new password hash is stored:
```typescript
// src/lib/auth/index.ts
await updateParent(parent.id, { passwordHash: newHash, ... });
await deleteAllUserSessions(parent.id); // SQL: DELETE FROM sessions WHERE userId = :parentId
```
This revokes access across all devices (desktops, tablets, mobile phones) instantly. If an attacker stole a session cookie or compromise occurred, changing the password immediately terminates all active adversary sessions.
