# The SchoolPass Engineering Handbook: Seven Topic Areas for Production Web Systems

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5 & Deliverable `docs/handbook.md`  
**Target Audience:** Engineering candidates and students one cohort behind, building production-grade web systems in high-stakes environments.  
**Structure:** Seven comprehensive sections covering each core curriculum area, each detailed with:
1. The Concept (defined in plain language before use)
2. Why It Exists (the failure it prevents and statutory/technical rationale)
3. A Real Operational Scenario (named people, physical environment, operational conflict)
4. How It Is Done (concrete, reproducible implementation mechanisms)
5. Where It Goes Wrong (failure modes, security exploits, and business costs)
6. What You Got Wrong (our own authentic engineering mistakes verified in commit history)

---

## Section 1: Typography, Shadows, and the Design System Export

### 1. The Concept
A **design system** is a centralized, version-controlled repository of visual and behavioral tokens—mathematically proportioned font sizes, line heights, color hex codes, and elevation shadows—that govern the appearance of every interface component. A **design token** is a semantic variable (such as `--typography-display-large-fontsize` or `--elevation-card-resting`) that decouples visual styling from arbitrary hardcoded CSS values.

### 2. Why It Exists
Without an authoritative token export, user interfaces suffer from visual entropy. Different engineers pick arbitrary font sizes (`15px`, `17px`, `22px`) and haphazard drop shadows (`box-shadow: 0 4px 8px rgba(0,0,0,0.3)`). This creates inconsistent hierarchy, muddy elevation levels, and text that becomes illegible on varying screen sizes or under direct sunlight. Exporting design tokens directly into global CSS variables ensures that every button, card, and heading remains visually unified and accessible.

### 3. A Real Scenario
At King's Way College in Ikeja, Lagos, Vice Principal Mrs. Folashade Adeleke monitors student morning arrival using a wall-mounted tablet in the reception office, while Security Officer Sunday checks student arrival codes outdoors at the school gate under harsh morning sunlight using a budget Android device. 

In our early prototype, headings were rendered using arbitrary light-gray text with weak 12px margins and a flat, single-layer drop shadow. On Mrs. Adeleke's indoor screen, the cards looked passable; on Sunday's outdoor screen, glare washed out the arrival timestamps, and the flat drop shadow blended directly into the gray pavement background. Sunday had to shade the screen with his hand and repeatedly ask parents to re-state their children's names, causing a 20-car bottleneck at the gate.

### 4. How It Is Done
1. **Mathematical Type Scale:** Establish a modular typographic hierarchy based on a Major Third (1.250) or Perfect Fourth (1.333) scale, standardizing on responsive `rem` units with explicit line-height pairings to prevent descender clipping:
   ```css
   :root {
     --typography-display-large-fontsize: 57px;
     --typography-display-large-lineheight: 64px;
     --typography-headline-medium-fontsize: 28px;
     --typography-headline-medium-lineheight: 36px;
     --typography-body-large-fontsize: 16px;
     --typography-body-large-lineheight: 24px;
   }
   ```
2. **Dual-Layer Ambient and Key Light Shadows:** Real-world shadows are not single black blobs; they consist of an ambient, diffuse occlusion layer and a directional key light layer:
   ```css
   :root {
     /* Level 2 Elevation: Resting Interactive Cards */
     --shadow-elevation-2: 0px 1px 2px rgba(15, 23, 42, 0.06),
                           0px 4px 8px -2px rgba(15, 23, 42, 0.10);
     /* Level 4 Elevation: Active Modals and Dropdowns */
     --shadow-elevation-4: 0px 4px 6px -1px rgba(15, 23, 42, 0.08),
                           0px 12px 16px -4px rgba(15, 23, 42, 0.14);
   }
   ```
3. **Automated Export:** Tokens are exported from the Figma design system directly into `globals.css` or Tailwind configuration, preventing manual copy-paste errors.

### 5. Where It Goes Wrong
When developers bypass the design tokens and inject ad-hoc Tailwind classes (`shadow-lg`, `text-[17px]`, `bg-[#2a3b4c]`), visual hierarchy breaks down. Dark mode switches leave un-tokenized cards with white backgrounds and unreadable white text. Shadow blurs configured with pure black (`rgba(0,0,0,0.5)`) render as muddy, dirty smears on mobile OLED displays rather than clean elevation layers.

### 6. What I Got Wrong
In Task 1, when exporting our elevation tokens, I initially created harsh, single-layer drop shadows (`box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35)`). When rendered across student arrival cards on mobile, the heavy black shadows created an oppressive visual boundary that made the cards appear sunken rather than elevated. Furthermore, my initial hero display typography used a fixed `57px` size without a fluid `clamp()` formula or a corresponding `line-height` adjustment, causing the text to wrap awkwardly across three lines and collide with navigation bars on 360px viewport widths. I had to recalibrate the entire elevation system into dual-layer ambient/key light tokens and introduce fluid font scaling.

---

## Section 2: Scaffolding, the Development Server, and Database Diagnostics

### 1. The Concept
**Scaffolding** is the foundational architecture of an application repository—directory structures, package dependencies, compiler configurations, and environment variable bindings. **Database diagnostics** refers to automated, non-destructive connection health checks that inspect latency, connection pool limits, active connections, and schema synchronization between the application server and the database engine.

### 2. Why It Exists
Modern web applications frequently rely on remote serverless databases (such as Neon PostgreSQL). Without robust diagnostics and correct scaffolding, applications suffer from silent connection pool exhaustion, unhandled cold-boot timeouts, and configuration drift between local `.env` files and production deployment environments.

### 3. A Real Scenario
Chinedu, a newly hired junior engineer on the SchoolPass team, was tasked with running local integration tests for parent registration before the start of the academic term. He cloned the repository, ran `npm install`, copied `.env.example` to `.env.local`, and executed `npm run dev`. 

Unbeknownst to Chinedu, the connection string in his `.env` pointed directly to the raw compute node on port 5432 (`ep-morning-sea...neon.tech`) rather than the PgBouncer connection pooler (`ep-morning-sea...-pooler.neon.tech`). When his automated test script fired 50 parallel requests to test concurrent registration, Neon's raw compute exceeded its maximum connection limit. The database stopped accepting connections, crashing not just Chinedu's local dev server, but causing intermittent `500 Internal Server Error` responses across the staging environment where school staff were reviewing student records.

### 4. How It Is Done
1. **Explicit Connection Pooling Architecture:** In Next.js with Prisma and Neon, always separate direct compute URLs (used exclusively for migrations) from connection-pooled URLs (used for runtime application queries):
   ```env
   # Runtime queries use PgBouncer pooler (port 5432 with pgbouncer=true)
   DATABASE_URL="postgresql://user:pass@ep-morning-sea-b463ljf1-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
   # Direct compute URL used strictly by Prisma CLI for migrations
   DIRECT_URL="postgresql://user:pass@ep-morning-sea-b463ljf1.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
2. **Diagnostic Health Script:** Implement an automated diagnostic script (`scripts/db-diagnostics.mjs`) that validates connectivity, measures round-trip query latency, and inspects connection metrics before dev server startup:
   ```typescript
   const start = performance.now();
   const result = await prisma.$queryRaw`SELECT 1 as connected, current_database(), pg_backend_pid()`;
   const duration = performance.now() - start;
   console.log(`[Diagnostic] Database connected in ${duration.toFixed(2)}ms`);
   ```
3. **Prisma Client Singleton:** Prevent duplicate connection pools in Next.js development hot-reloading by attaching the Prisma Client to `globalThis`:
   ```typescript
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
   export const prisma = globalForPrisma.prisma ?? new PrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```

### 5. Where It Goes Wrong
If the Prisma client is instantiated inside route handlers (`new PrismaClient()`) instead of reusing a global singleton, every incoming HTTP request instantiates a new connection pool. In serverless environments, this rapidly exhausts PostgreSQL's `max_connections` (often capped at 100 on standard tiers), throwing `PrismaClientInitializationError: Can't reach database server at ...`.

### 6. What I Got Wrong
In Task 2, during early diagnostic harness development, I initially wrote database inspection queries that attempted to query `pg_stat_activity` directly without verifying whether the connection user had superuser or `pg_read_all_stats` permissions in Neon. The diagnostic script failed with `permission denied for table pg_stat_activity`, masking the actual connection health status. Furthermore, I initially omitted the `-pooler` suffix in my test harness connection string, which caused local multi-threaded test runners to exhaust Neon connections within seconds. I had to restructure the diagnostic harness to use standard `SELECT 1` ping queries and enforce PgBouncer endpoint configuration across all environments.

---

## Section 3: Information Design, the Browser Head, and Responsive Type

### 1. The Concept
**Information design** is the intentional structuring, labeling, and presentation of information so users can navigate and comprehend complex data without confusion. The **browser head** (`<head>`) is the non-rendered metadata container where character encoding, viewport scaling, OpenGraph unfurling properties, and browser security policies are defined. **Responsive typography** is text that dynamically calculates its size based on viewport width using fluid CSS formulas (`clamp()`).

### 2. Why It Exists
Nigerian parents and school gate security guards access SchoolPass from a chaotic variety of devices: 360px-wide budget Tecno/Infinix smartphones on low-bandwidth 3G, mid-tier Samsung phones, and high-DPI desktop office computers. If the browser head lacks proper viewport tags, mobile browsers default to rendering a desktop 980px layout, forcing users to pinch and scroll horizontally. If responsive type is omitted, long student names overflow card boundaries and truncate arrival times.

### 3. A Real Scenario
Zainab, a mother of three at Crescent Hall School in Victoria Island, received a WhatsApp broadcast message from the school containing a link to view her daughter's emergency early-dismissal arrival pass. She tapped the link while standing in a busy supermarket on her Infinix Smart 7 (screen width 360px).

Because the early prototype lacked OpenGraph metadata, the WhatsApp link appeared as a bare, suspicious URL (`https://portal.schoolpass.ng/records?pass=...`) with no preview thumbnail, school crest, or title, causing Zainab to wonder if it was a phishing scam. When she clicked through, the student arrival code heading had been styled with a fixed `font-size: 36px`. On her narrow display, the 10-character code broke across two lines, splitting the code in half (`2026-` on line 1, `49102` on line 2). The security guard at the gate refused to recognize the split code, forcing Zainab to step out of the queue and call the school reception.

### 4. How It Is Done
1. **Next.js Metadata Configuration:** Define comprehensive viewport and social metadata at the layout level:
   ```typescript
   export const metadata: Metadata = {
     metadataBase: new URL('https://portal.schoolpass.ng'),
     title: { default: 'SchoolPass Portal', template: '%s | SchoolPass' },
     description: 'Student arrival, verified pickup, and parental identity management.',
     openGraph: {
       title: 'SchoolPass Secure Parent Portal',
       description: 'Verified student arrival and identity authentication.',
       images: [{ url: '/og-schoolpass.png', width: 1200, height: 630, alt: 'SchoolPass Portal' }],
     },
   };
   
   export const viewport: Viewport = {
     width: 'device-width',
     initialScale: 1,
     maximumScale: 5,
     themeColor: '#1e3a8a',
   };
   ```
2. **Fluid Typography Formulas:** Implement CSS `clamp()` to interpolate font sizes smoothly between a minimum viewport width (360px) and a maximum desktop width (1200px):
   ```css
   /* Fluid Headline: scales smoothly from 20px on 360px screens to 28px on desktop */
   .fluid-headline {
     font-size: clamp(1.25rem, 1.05rem + 0.89vw, 1.75rem);
     line-height: 1.3;
   }
   /* Monospace Arrival Code: Prevents line breaks */
   .arrival-code {
     font-family: var(--font-mono);
     font-size: clamp(1rem, 0.85rem + 0.6vw, 1.25rem);
     white-space: nowrap;
     letter-spacing: 0.05em;
   }
   ```

### 5. Where It Goes Wrong
Omitting `metadataBase` in Next.js causes OpenGraph image URLs to resolve to relative paths, which fail when crawled by WhatsApp, Twitter, or Slack scrapers. Disabling user scaling (`user-scalable=no` or `maximum-scale=1`) directly violates WCAG 2.1 Criterion 1.4.4 (Resize Text), penalizing visually impaired parents who need to zoom in to read attendance timestamps.

### 6. What I Got Wrong
In Task 3, my initial metadata configuration lacked the `metadataBase` property. When testing link previews, Next.js emitted console warnings, and social unfurling in external messaging apps rendered empty gray placeholders instead of the school crest. Additionally, I initially applied fixed pixel margins (`margin-left: 48px`) to parent dashboard sidebar navigation; on small Android mobile viewports, this consumed nearly 20% of the horizontal screen estate, squashing the actual student attendance table into an unreadable vertical column. I had to refactor the navigation into a responsive collapsible drawer with fluid margin tokens.

---

## Section 4: The Working Tree, Branching, and Client-Side Validation

### 1. The Concept
The **Git working tree** is the current state of files on your local filesystem, reflecting uncommitted edits, staged changes, and untracked files. **Branching** is the creation of an isolated lineage of commits, allowing developers to implement alternative business logic (such as soft-gating vs. hard-gating) without polluting the main deployment branch. **Client-side validation** is the immediate browser-level checking of form inputs (via HTML5 constraints or JavaScript) before payload submission.

### 2. Why It Exists
Branching prevents unfinished, experimental, or alternative code paths from breaking production builds. Client-side validation exists to provide instantaneous user feedback—informing a parent that an email address is missing an `@` symbol or that a student code is too short before they endure a slow 3G network round-trip.

### 3. A Real Scenario
Registrar Bisi at Premier Academy was testing a new parent onboarding workflow. The school management was debating two approaches: **Hard Gating** (stopping parents immediately after signup, requiring email verification before allowing portal access) and **Soft Gating** (logging parents in immediately with an unverified warning banner, allowing them to view school calendars while restricting attendance link requests).

Developer Tunde was assigned to build the soft-gating alternative. Working carelessly directly on `main`, Tunde modified the registration action to bypass email checks and auto-login parents. In the middle of development, an urgent bugfix was requested for the live payment portal. Because Tunde had uncommitted, half-finished soft-gating changes scattered across his working tree, he ran `git stash`, attempted to patch the bug, encountered merge conflicts, and accidentally committed unverified soft-gating code to `main`. Unverified parents suddenly gained immediate un-gated access to live production student records before the architectural debate had even been resolved.

### 4. How It Is Done
1. **Disciplined Feature Branching:** Always inspect working-tree status before creating isolated feature branches:
   ```bash
   git status
   git checkout -b feat/soft-gating
   ```
2. **Accessible Client-Side Constraint Validation:** Implement accessible, real-time client validation using native HTML5 attributes and React state, binding error announcements to screen readers via ARIA attributes:
   ```tsx
   <input
     id="email"
     type="email"
     required
     value={email}
     onChange={(e) => setEmail(e.target.value)}
     aria-invalid={error ? 'true' : 'false'}
     aria-describedby={error ? 'email-error' : undefined}
     className={error ? 'border-red-500' : 'border-slate-300'}
   />
   {error && (
     <p id="email-error" role="alert" className="text-sm text-red-600">
       {error}
     </p>
   )}
   ```
3. **Preserving Working Trees:** Never run destructive commands like `git reset --hard` or `git clean -fd` to switch tasks. Use clean branches or Git worktrees to maintain multiple working states concurrently.

### 5. Where It Goes Wrong
The fatal mistake in web engineering is **trusting client-side validation as a security mechanism**. Client validation executes in an environment entirely controlled by the user. Any malicious actor or curious teenager can open DevTools, disable HTML5 `required` or `pattern` attributes, or bypass the browser entirely by sending crafted JSON payloads directly to `/api/auth/register` using `curl` or Postman. If the server does not re-validate every single field, invalid or hostile data enters the database.

### 6. What I Got Wrong
In Task 3, I implemented rich client-side validation for student registration codes (`pattern="^[A-Z0-9]{10}$"`), custom error banners, and real-time color changes. I was so pleased with the immediate UI feedback that I initially neglected to implement matching server-side validation on the API route. When I conducted a penetration test using a custom Node script, I sent an empty password and a 10,000-character student code directly to the backend. The server accepted the payload and crashed when attempting to store the string in a fixed-width database column. I learned the hard way that client validation is purely a user-experience courtesy, never a security boundary.

---

## Section 5: Migrations, Schema Design, and Email Delivery

### 1. The Concept
A **database migration** is a version-controlled, reproducible SQL script that transforms the database schema from one state to another (adding tables, altering columns, creating foreign key constraints). **Schema design** is the intentional relational structuring of entities, keys, and relational constraints. **Email delivery** is the asynchronous dispatch of transactional notifications (verification links, password reset codes) through specialized SMTP or API mail relays (e.g., Resend).

### 2. Why It Exists
As applications evolve, database structures must change without data loss. Version-controlled migrations ensure that every staging, testing, and production database applies identical structural changes in the exact same sequence. Transactional email delivery ensures that parents receive time-sensitive verification tokens reliably, even when local school email servers fail.

### 3. A Real Scenario
Mallam Sanusi, head of administration at Greenfield Academy, prepared to onboard 200 incoming Junior Secondary School (JSS1) parents on the Sunday before school resumption. He uploaded the CSV of newly admitted students and clicked "Generate Parent Invites".

The SchoolPass backend executed a synchronous loop: for each parent, it generated a token, wrote to the database, and invoked an external email API inline within the HTTP request handler. By the 15th parent, the external email provider's API rate-limited the connection, delaying response times from 200ms to 4 seconds. The Next.js API route timed out after 30 seconds. The database transaction rolled back halfway: 14 parents received emails with active tokens, 10 parents had database rows created without emails, and 176 parents were never processed. Parents began calling Mallam Sanusi in panic, with half claiming the portal worked and the other half receiving "Student Not Found" errors.

### 4. How It Is Done
1. **Multi-Step Safe Schema Migrations:** When modifying database constraints, never apply destructive alterations in a single step. Follow the expand-and-contract pattern:
   - Step 1: Add new nullable columns or tables (`migration.sql`).
   - Step 2: Backfill existing data using a safe data migration script.
   - Step 3: Apply `NOT NULL` constraints or alter foreign key constraints (e.g. changing `onDelete: Cascade` to `onDelete: Restrict`).
2. **Relational Constraints for Business Integrity:** Define foreign key actions that reflect legal obligations. In SchoolPass, payments must never be deleted when a parent is removed:
   ```prisma
   model Payment {
     id         String   @id @default(cuid())
     parentId   String
     amount     Int
     status     String
     // Enforces CAMA 2020 6-year retention: Deleting parent is BLOCKED if payments exist
     parent     Parent   @relation(fields: [parentId], references: [id], onDelete: Restrict)
   }
   ```
3. **Decoupled Asynchronous Email Dispatch:** Never block HTTP request handlers on external email network calls. Return an immediate HTTP 200/201 response to the user, and dispatch email delivery in the background or through a resilient queue worker with automated exponential backoff retries.

### 5. Where It Goes Wrong
The most common disaster in schema design is using `onDelete: Cascade` on financial or audit models. If a parent model cascades deletions to `Payment`, running a simple `prisma.parent.delete()` wipes the school's historical financial ledger, violating corporate tax laws. In email delivery, hardcoding third-party API keys in client-side bundles exposes mail credentials, allowing spammers to hijack the school's domain reputation.

### 6. What I Got Wrong
In Task 4 and early Task 5, I discovered that our Prisma schema had `onDelete: Cascade` on the `Payment` relation:
`parent Parent @relation(fields: [parentId], references: [id], onDelete: Cascade)`
I initially did not realize the legal implication of this constraint until auditing CAMA 2020 §375 requirements. Had a parent deletion request been processed in production with that schema, all historical tuition payments made by that parent would have been erased from PostgreSQL. I had to author a dedicated migration (`20261102_account_deletion_lifecycle_and_restrict_payments`) to alter the foreign key to `onDelete: Restrict` and replace destructive deletion with selective anonymization.

---

## Section 6: Server-Side Validation, Hashing, Rate Limiting, and Verification

### 1. The Concept
**Server-side validation** is the mandatory, programmatic verification of all incoming request payloads against strict type and schema contracts using tools like Zod. **Cryptographic password hashing** is a one-way, mathematically slow computation (such as Argon2id) that transforms plaintext passwords into irreversible hashes designed to resist hardware-accelerated GPU cracking. **Rate limiting** is the throttling of incoming requests from an IP or account within a time window (e.g., 5 attempts per 15 minutes) to defeat brute-force attacks.

### 2. Why It Exists
Every input received over the network must be treated as hostile. Server-side validation prevents SQL injection, prototype pollution, and malformed data from corrupting the database. Slow password hashing ensures that even if the database is leaked in a breach, attackers cannot crack passwords using offline dictionary attacks. Rate limiting stops automated credential stuffing scripts from overwhelming authentication endpoints.

### 3. A Real Scenario
A former IT contractor at a private academy in Lekki was terminated following a contract dispute. Knowing the school used an online portal, the contractor ran an automated Python script from a cloud VPS, attempting to brute-force the administrator account password using a list of 100,000 common Nigerian passwords (e.g., `Godisgood1`, `Password123`, `Lagos2024`).

In the school's original legacy system, passwords had been hashed using fast SHA-256 (`0.007ms` per hash), and login routes lacked rate limiting. The contractor's script fired 800 login attempts per second. Within 6 minutes, the server crashed due to CPU exhaustion, and the contractor successfully identified the headteacher's password, gaining full administrative control over student records and fee schedules.

### 4. How It Is Done
1. **Authoritative Zod Schema Parsing:** Enforce runtime schema validation before executing any business logic:
   ```typescript
   export const LoginSchema = z.object({
     email: z.string().trim().toLowerCase().email({ message: 'Invalid email address' }),
     password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
   });
   
   // Inside Route Handler
   const body = await req.json();
   const result = LoginSchema.safeParse(body);
   if (!result.success) {
     return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
   }
   ```
2. **Argon2id Memory-Hard Hashing:** Configure Argon2id with parameters that impose heavy memory and time penalties on attackers while maintaining responsive logins for parents:
   ```typescript
   import argon2 from 'argon2';
   
   export async function hashPassword(password: string): Promise<string> {
     return argon2.hash(password, {
       type: argon2.argon2id,
       memoryCost: 65536, // 64 MB
       timeCost: 3,       // 3 iterations
       parallelism: 4,    // 4 threads
     });
   }
   ```
3. **Sliding-Window Rate Limiting:** Enforce strict attempt limits with anti-enumeration generic responses:
   ```typescript
   const rateLimitKey = `rate_limit:${clientIp}:login`;
   const attempts = await incrementRateLimit(rateLimitKey, 900); // 15-minute window
   if (attempts > 5) {
     return NextResponse.json(
       { error: 'Too many login attempts. Please try again in 15 minutes.' },
       { status: 429 }
     );
   }
   ```
4. **Anti-Enumeration Error Parity:** Always return the exact same generic error message—`"Invalid email or password."`—regardless of whether the email was not found or the password was incorrect.

### 5. Where It Goes Wrong
A catastrophic failure mode is **account enumeration**. If an application returns `"No account found with this email"` when an email does not exist, and `"Incorrect password"` when the email exists, an attacker can submit a list of target emails (teachers, parents, executives) and immediately discover who holds an account on the platform. Another common flaw is omitting `.trim().toLowerCase()` on email inputs, causing parents who type a capitalized first letter on mobile keyboards to be locked out of their accounts.

### 6. What I Got Wrong
In Task 4, when benchmarking password hashing algorithms, our automated timing comparison in `evidence/08-timing-argon-vs-sha.txt` proved that SHA-256 took only `0.007ms` to verify, while Argon2id took `93.605ms`—a 13,372x computational difference. My initial mistake was failing to normalize email casing at the API boundary. A parent registering on an iPhone had their email auto-capitalized as `Amina.Ibrahim@gmail.com`. When logging in later, typing `amina.ibrahim@gmail.com` resulted in an authentication failure because PostgreSQL text comparisons are case-sensitive by default. I had to introduce global `.trim().toLowerCase()` sanitization across all authentication handlers.

---

## Section 7: Sessions, Logout, Account Deletion, and Compliance

### 1. The Concept
A **session** is a server-side record of an authenticated user's state, linked to a browser via a cryptographically signed cookie (`<cuid>.<hmac-sha256>`). **Server-side logout** is the permanent destruction of the session record in the database and the simultaneous clearance of the browser cookie. **Lawful account deletion** is a multi-stage lifecycle (soft delete, grace period, selective anonymization, background purge) reconciling privacy rights (NDPA 2023 §34) with statutory financial retention obligations (CAMA 2020 §375).

### 2. Why It Exists
Without server-side tracking, stolen session tokens cannot be revoked. If logout is executed purely on the client (clearing local state and redirecting to `/login`), the session record remains active in PostgreSQL, allowing an attacker who captured the cookie to impersonate the user until cookie expiration. Under data protection law, raw SQL deletions that destroy accounting records violate corporate accounting laws, while retaining identifiable personal data indefinitely violates privacy statutes.

### 3. A Real Scenario
Ibrahim, a parent at Solid Rock Academy, withdrew his two children after relocating from Lagos to Abuja. Ibrahim submitted a formal request under NDPA 2023 §34 demanding that the school erase his personal account and all associated records from their database.

Proprietress Hauwa opened the administrative database dashboard, found Ibrahim's user record, and clicked "Delete Row". Because the database had cascade deletion enabled, Ibrahim's record was wiped—along with three years of tuition payment receipts totaling ₦4,200,000. Two months later, state tax auditors arrived for a financial inspection. The school's banking statements showed deposits of ₦4,200,000 that had no corresponding records in the student management ledger. The auditors flagged the discrepancy as undisclosed income, imposing a ₦1,500,000 penalty on the school for non-compliance with CAMA accounting regulations.

### 4. How It Is Done
1. **OWASP-Compliant Session Cookies:** Issue cryptographically signed tokens stored in secure, tamper-proof cookies:
   ```typescript
   cookies().set('schoolpass_session', `${session.id}.${signature}`, {
     httpOnly: true,     // Prevents JavaScript XSS access
     secure: process.env.NODE_ENV === 'production', // Requires HTTPS
     sameSite: 'lax',    // Mitigates CSRF attacks
     path: '/',
     maxAge: 60 * 60 * 24 * 7, // 7 days
   });
   ```
2. **Resilient Server-Side Logout:** Execute logout using standard HTML form submissions returning `HTTP 303 See Other` to ensure network retries succeed even on unstable cellular connections:
   ```typescript
   // app/api/auth/logout/route.ts
   export async function POST(req: NextRequest) {
     const sessionId = extractSessionIdFromCookie(req);
     if (sessionId) {
       await prisma.session.deleteMany({ where: { id: sessionId } });
     }
     const response = NextResponse.redirect(new URL('/auth?view=login', req.url), { status: 303 });
     response.cookies.delete('schoolpass_session');
     return response;
   }
   ```
3. **Password Reset Revocation:** When a user resets their password, invoke `deleteAllUserSessions(userId)` to instantly kill all active sessions across all devices.
4. **4-Stage Lawful Deletion Lifecycle:**
   - **Stage 1 (Immediate Lockout):** User confirms password at `/api/auth/delete-account`. The server sets `isLocked = true`, records `scheduledDeletionAt = now() + 7 days`, wipes all database sessions, and clears the cookie.
   - **Stage 2 (7-Day Grace Period):** Login attempts are refused with `ACCOUNT_SCHEDULED_FOR_DELETION`. The user can cancel deletion at `/api/auth/cancel-deletion` within 7 days.
   - **Stage 3 (Transactional Selective Anonymization):** A background cron worker (`scripts/run-deletion-purge.mjs`) finds expired accounts. In an atomic transaction, it drops student links, overwrites PII (`name = "Anonymised Parent"`, `email = "deleted_<hash>@anonymized.schoolpass.local"`), and stamps `anonymizedAt = now()`. The `Payment` ledger is preserved intact down to the kobo.
   - **Stage 4 (Idempotent Purge):** The purge worker logs start/finish counts. A second run against the same database state modifies exactly 0 records.

### 5. Where It Goes Wrong
The most common implementation flaw is **treating Edge Middleware as the sole authorization boundary**. Because Edge Middleware cannot query PostgreSQL without incurring latency, it only checks cookie presence. If a logged-in parent pastes an administrative URL (`/staff-accounts`), middleware allows the request through. If the server-side page layout fails to independently query PostgreSQL and verify `session.role === 'staff'`, the parent gains unauthorized access to staff tooling.

### 6. What I Got Wrong
In Task 5, I made two significant engineering mistakes:
1. **The Temporal Dead Zone TDZ ReferenceError:** When implementing the account deletion lockout in `src/lib/auth/index.ts`, I placed the guard `if (parent.isLocked)` at line 528, *before* line 557 where `const parent = await findParentByEmail(email)` was declared. This threw an unhandled `ReferenceError: Cannot access 'parent' before initialization`, crashing logins with HTTP 500 errors. I had to diagnose the scope error and relocate the guard to execute *after* parent retrieval.
2. **The Client-Side Logout Desynchronization Defect (DEF-05-01):** We originally implemented logout via client-side AJAX `fetch()`. On unstable 3G school connections, dropped packets caused the network request to fail silently; the UI optimistically redirected to the login screen, but the session record remained alive in PostgreSQL. We had to replace client AJAX with an authoritative server-side form submission returning HTTP 303.

---

## Summary: The Engineering Mindset

Across all seven topic areas, production web engineering is defined not by how cleanly code runs under ideal conditions, but by how predictably it behaves when confronted with hostile inputs, flaky networks, legal statutory collisions, and hardware failures. 

Building SchoolPass demonstrated that:
1. Design systems protect readability under harsh real-world conditions.
2. Scaffolding and diagnostics prevent catastrophic connection exhaustion.
3. Metadata and responsive type ensure accessibility across the full spectrum of user devices.
4. Client validation is only a user courtesy; server validation is the only security boundary.
5. Schema migrations must be multi-step and respect statutory retention rules.
6. Hashing and rate limiting protect user identity against automated attacks.
7. Lawful deletion is an auditable lifecycle of anonymization, not a destructive database drop.
