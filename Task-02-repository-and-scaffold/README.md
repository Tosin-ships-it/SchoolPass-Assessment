# Task 2: Repository & Application Scaffold

## Deliverables Index

This directory contains the documentation, performance analyses, usability testing records, and machine-verified evidence for Task 2 (Repository and Scaffold) of the SchoolPass assessment:

### Documentation (`docs/`)
- [`docs/scaffold-prompt.md`](docs/scaffold-prompt.md) — Verbatim record of the initial scaffolding prompt, intermediate context clarification prompt, final refined prompt, and a comparative analysis of key boundary changes.
- [`docs/model-choices.md`](docs/model-choices.md) — Documentation of AI model choices for Task 2, recording the IDE development assistant, unassisted scaffold execution, and application-configured product models.
- [`docs/performance-note.md`](docs/performance-note.md) — Technical analysis of the initial first-load HTTP response time (8,496 ms total, 7,591 ms TTFB) compared to the ~10 ms assessment target, explaining Next.js on-demand compilation and distinguishing network response from browser rendering.
- [`docs/working-tree.md`](docs/working-tree.md) — Analysis of the four stages of code progression (local working directory, local Git store, GitHub remote, production), branching architecture, failure modes of single-branch development, and post-deployment visibility boundaries.
- [`docs/readme-test.md`](docs/readme-test.md) — Usability and comprehension test protocol recording feedback from an external non-developer participant on the initial README, documenting terminology friction points, and tracking remediation.
- [`docs/defects.md`](docs/defects.md) — Technical register of verified application defects and architectural vulnerabilities, including line-number references, root causes, runtime evidence, and recommended diff remediations.
- [`docs/false-success.md`](docs/false-success.md) — Audit of the parent registration pipeline and database-connectivity failure testing, verifying via an isolated test harness on port 3070 that an unreachable database returns HTTP 500 without false success (with explicit disclosure that the live port 3000 browser UI was not run with an intentionally broken database).
- [`docs/interview-answers.md`](docs/interview-answers.md) — Written answers to all 15 assessment defence interview questions covering version control, forward-deployed engineering practices, and Task 2 technical evidence.
- [`docs/information-design.md`](docs/information-design.md) — Audit of browser `<head>` metadata configuration and body editorial passes across the application.

### Machine-Verified Evidence (`evidence/`)
- [`evidence/01-agent-plan.txt`](evidence/01-agent-plan.txt) — Verbatim pre-build plan and stated assumptions formulated by the AI agent during conversation `bc3f6aac-333c-4e8d-b2bf-b21ce43954c0` (Step 114) prior to Phase 2 scaffolding.
- [`evidence/02-files-created.txt`](evidence/02-files-created.txt) — Verified Git inventory of the initial scaffold commit (`cebb045`, `chore: initial SchoolPass project setup`), capturing all 101 added files.
- [`evidence/03-server-start.txt`](evidence/03-server-start.txt) — Machine-captured terminal output verifying development server startup (`npm run dev`) on port 3000 in 23.9s.
- [`evidence/04-first-load.txt`](evidence/04-first-load.txt) — Verified HTTP request record capturing the first 200 OK response (8,496 ms elapsed, 87,897 bytes) and documenting the Playwright driver browser inspection limitation.
- [`evidence/05-nested-folder-error.txt`](evidence/05-nested-folder-error.txt) & [`06-nested-folder-fixed.txt`](evidence/06-nested-folder-fixed.txt) — Machine-captured error output and resolution for the nested folder scaffold failure (Step 5, Failure 1).
- [`evidence/07-port-conflict.txt`](evidence/07-port-conflict.txt) & [`08-port-conflict-resolved.txt`](evidence/08-port-conflict-resolved.txt) — Verified logs demonstrating port collision (`EADDRINUSE`) on diagnostic port 3050 and clean process recovery (Step 5, Failure 2).
- [`evidence/09-404-error.txt`](evidence/09-404-error.txt) & [`10-404-resolved.txt`](evidence/10-404-resolved.txt) — Verified HTTP request and response logs capturing a route 404 failure and subsequent resolution (Step 5, Failure 3).
- [`evidence/11-write-succeeded-logs.txt`](evidence/11-write-succeeded-logs.txt) & [`12-write-second-row.txt`](evidence/12-write-second-row.txt) — Verified server logs and Neon database rows proving two distinct registration writes separated by 118.6 minutes (Step 6).
- [`evidence/12-database-rows.png`](evidence/12-database-rows.png) — Database inspector screenshot capturing persisted parent account rows.
- [`evidence/13-write-failed-logs.txt`](evidence/13-write-failed-logs.txt) — Verified runtime logs from an isolated test harness on port 3070 proving that a database connection failure returns HTTP 500 without false success.
- [`evidence/installed-dependencies.txt`](evidence/installed-dependencies.txt) — Machine-captured output of `npm list --depth=0` recording verified installed package versions in `node_modules` alongside declared semver ranges.
- [`evidence/test-suite-output.txt`](evidence/test-suite-output.txt) — Node.js test runner execution record verifying 214 tests pass across 57 suites with 0 failures.
- [`evidence/14-working-tree-drawing.jpg`](evidence/14-working-tree-drawing.jpg) — Hand-drawn working tree diagram photograph showing the four stages of code progression (Step 8).
- [`evidence/15-git-log-graph.txt`](evidence/15-git-log-graph.txt) — Git log graph showing commit history, branches, author, dates, and commit messages across all branches. The `feat/student-number-linking` branch was merged directly into `master`; no Pull Request was created on GitHub, so no Pull Request URL is available.
- [`evidence/16-head-route-one.png`](evidence/16-head-route-one.png) — Rendered `<head>` metadata inspection on Route 1 (Landing page `/`), verifying `<title>`, `<meta name="description">`, viewport, charset, and favicon tags (Step 10).
- [`evidence/17-head-route-two.png`](evidence/17-head-route-two.png) — Rendered `<head>` metadata inspection on Route 2 (Staff portal login `/staff/login`), verifying distinct route-specific `<title>` and `<meta name="description">` tags (Step 10).
- [`evidence/18-heading-wrap-bad.png`](evidence/18-heading-wrap-bad.png) — Chrome responsive device toolbar capture at 650px width showing awkward hero heading line wrap across 2 unbalanced lines (Step 10).
- [`evidence/19-heading-wrap-good.png`](evidence/19-heading-wrap-good.png) — Chrome responsive device toolbar capture at 450px width showing balanced hero heading wrap across 3 natural lines (Step 10).
- [`evidence/20-responsive-three-widths.png`](evidence/20-responsive-three-widths.png) — Combined composite browser capture showing live landing page layout and typography adapting across Mobile (360px), Tablet (768px), and Desktop (1280px) viewports with Chrome responsive device toolbars (Step 10).

### Optional Deliverables
- `evidence/21-walkthrough.mp4` — Optional 5-minute unscripted video walkthrough.

---

## 1. What This Is

**SchoolPass** is a private, mobile-first web application created for parents, guardians, and staff of a single primary and secondary school in Nigeria (~400 students). 

In many schools, parents repeatedly call, text, or visit the administrative office for basic information: checking whether a child arrived safely, asking about term dates, confirming outstanding school fees, or requesting account details. This creates heavy administrative workload for office staff and leaves parents relying on scattered WhatsApp messages and paper receipts.

SchoolPass centralizes these daily interactions into one secure, accessible place:
1. **School Policy Answers:** Clear, authoritative answers to everyday school questions (term dates, closing hours, uniform rules).
2. **Student Attendance & Arrival:** Daily morning arrival confirmation and attendance history for enrolled children.
3. **Fee Balances & Payments:** Transparent fee balance tracking and secure digital payment processing in Nigerian Naira (`NGN`).
4. **Front Desk Escalation:** Direct routing to the school's Front Desk Officer when personal human assistance is needed.

### Key Operational Terms
- **"Mobile-First Web Application":** An application accessed through a standard web browser on a smartphone (such as Chrome on an Android device) rather than downloaded from an app store. The entire layout, text size, and button spacing are designed specifically to fit compact mobile phone screens without horizontal scrolling.
- **"Private Portal":** Unlike a public school website, SchoolPass requires authentication (logging in). Each parent can view *only* the private records of their own linked children. Staff members access a dedicated administrative interface protected by role-based permissions.
- **"Strict Privacy Boundary":** Under the application's architectural rules, student personal information (names, attendance logs, and financial balances) is strictly isolated from automated AI models. Artificial intelligence is permitted only to answer questions using approved, public school circulars.

**Product Promise:** *The school's answers. Your child's records. One place.*

---

## 2. Honest Status

To give an accurate, professional account of the repository, the status of every component is classified into three transparent categories: **Finished & Verified**, **Partially Implemented**, and **Not Started / Unimplemented**.

### Finished & Verified

- **Tooling & Application Foundation:**
  - **Next.js (App Router):** The overarching web application framework that serves pages from the server and handles URL routing. Declared in `package.json` as `^15.2.1`; exact installed version in `node_modules` verified as `15.5.27` via `npm list --depth=0`.
  - **React:** The component library used to build reusable visual elements such as navigation bars, cards, and input fields. Declared in `package.json` as `^19.0.0`; exact installed version verified as `19.3.0` (with `react-dom@19.3.0`).
  - **TypeScript:** A typed programming language built on JavaScript that checks for code errors and typos during compilation before code ever runs. Declared in `package.json` as `^5.8.2`; exact installed version verified as `5.9.3`.
  - **Prisma ORM:** The database toolkit and query translator that allows application code to interact safely with the PostgreSQL database. Declared in `package.json` as `^6.4.1`; exact installed version verified as `6.19.3` (with `@prisma/client@6.19.3`).
  - *Reconciliation of Versions:* Earlier project notes and server logs cited `Next.js 15.5.27`, `React 19.3.0`, and `TypeScript 5.9.3` because npm resolves the semver caret (`^`) ranges declared in `package.json` to the actual package versions installed in `node_modules` (documented in `evidence/installed-dependencies.txt`).
  - *Clarification on "Tooling Shell":* In the initial scaffold commit (`cebb045`), Prisma was initialized as a minimal configuration shell (datasource and client generator only). As development progressed through Task 2, complete database domain models (`Parent`, `Student`, `StaffUser`, `AttendanceRecord`, `FeeEntry`, `VerificationToken`, etc.) were authored and migrated to the PostgreSQL database, with live writes machine-verified.
- **Design System Integration:**
  - **Figma Design Tokens (`design-tokens.tokens.json`):** Design tokens are the foundational visual design decisions—the exact brand colors, font sizes, line heights, corner roundness, and spacing rules decided in the Figma visual design mockup. Storing these decisions as structured data in a JSON file ensures that visual design choices are versioned and shared directly with the codebase.
  - **Token Conversion Pipeline:** An automated script (`convert-tokens.js`) reads `design-tokens.tokens.json` and translates those values into standard CSS custom properties (variables) in `tokens.css`. This allows components to share consistent brand styling without hardcoding raw color codes or pixel measurements.
- **Public Marketing Surface:**
  - A responsive landing page (`src/app/page.tsx`) presenting the product promise, feature overview cards, security overview, and a mobile navigation drawer.
- **Statutory Legal Disclosures:**
  - Dedicated standalone legal routes (`/privacy` and `/terms`) providing comprehensive public policy disclosures:
    - *Privacy Notice (`/privacy`):* Explains what personal information the school collects (parent names, phone numbers, child attendance, and fee history), who has access to it, how long it is stored, and how parents can exercise their data rights.
    - *Terms of Service (`/terms`):* Sets out the operational rules and acceptable-use agreement between the school and families using the portal.
    - *Nigeria Data Protection Act (NDPA) 2023 Principles:* The NDPA 2023 is Nigeria's national data protection legislation establishing statutory principles for the lawful, fair, and transparent processing of personal data. In SchoolPass, the policy of strictly isolating student records from external AI models is an application-level architectural and privacy design decision informed by data protection best practices, rather than an explicit statutory mandate written into the text of the Act.
- **Authentication UI & Security Suite:**
  - Complete authentication form interfaces (`src/app/auth/*`: Parent Sign In, Staff Login, Parent Account Registration, Password Reset Request, Password Reset Completion, and Email Verification).
  - Modern, secure password hashing powered by **Argon2id** (`@node-rs/argon2@2.2.2`, RFC 9106, 64 MiB memory cost, 3 iterations), with backward-compatible verification and transparent automatic rehashing for legacy `scrypt` hashes (`src/lib/auth/crypto.ts`).
  - Cryptographic session cookie signing using HMAC-SHA256 (`node:crypto`).

### Partially Implemented

- **Portal Interface Shells:**
  - The Parent Portal shell (`/ask`) with guardian student-linking status banners and the Staff Attendance shell (`/attendance`) with date and class filters exist as authenticated routes with server-side middleware protection (`src/middleware.ts`). However, their internal dashboards currently display placeholder data rather than live, dynamic daily database records.
- **Transactional Email Dispatch:**
  - A multi-transport email subsystem (`src/lib/auth/email.ts`) exists, supporting both Resend API delivery and standard SMTP (e.g., local mail testing). Welcome emails and email verification links are triggered asynchronously during registration. However, background email delivery lacks a persistent retry queue, meaning dropped network connections during local development are logged as errors without automatic retry.
- **Branching Workflow & Pull Request (Step 9):**
  - While feature branch development and commit history exist (documented in `evidence/15-git-log-graph.txt`), the `feat/student-number-linking` branch was merged directly into `master`. No Pull Request was created on GitHub (0 open and 0 closed Pull Requests on `Tosin-ships-it/SchoolPass`), so no Pull Request URL is available.

### Not Started / Unimplemented

- **Payment Gateway Integration:**
  - Flutterwave checkout modal integration, server-side payment verification, automated webhook signature handling, and automated fee balance reconciliation are not yet built. Payment and refund data structures exist in the database schema, but no live API communication occurs.
- **Gate Arrival Engine:**
  - Daily morning QR code generation, dynamic expiration at 10:00 AM, and 6-digit gate code validation by security officers are not yet implemented.
- **AI Policy Question-Answering Pipeline:**
  - Google Gemini vector embeddings (`text-embedding-004`) and automated retrieval-augmented generation (RAG) over approved school circulars (`ApprovedSchoolInfo`) are not yet implemented. The public landing page describes this planned feature, but no external AI API calls are active in the codebase.
- **Front Desk Escalation Routing:**
  - Automated WhatsApp prefill routing to the school front desk has not yet been built.

---

## 3. Stack With Reasons

Each technology in the SchoolPass stack was chosen to meet the real-world operational constraints of a Nigerian school community:

- **Next.js (App Router) — Declared: `^15.2.1`, Installed: `15.5.27`:**
  - *Why:* Chosen for Server Components and streaming Server-Side Rendering (SSR). Instead of sending a massive bundle of JavaScript to the user's phone to render the page (like a traditional Single Page Application), Next.js renders HTML on the server and streams small, lightweight payloads over the network. This architectural approach is intended to support fast, reliable page loading for parents using budget smartphones on slow or constrained cellular networks, though real-world low-bandwidth cellular field testing has not yet been conducted.
- **TypeScript — Declared: `^5.8.2`, Installed: `5.9.3`:**
  - *Why:* Chosen for compile-time type safety. SchoolPass manages delicate institutional data: attendance states, parent-student family relationships, and monetary fee balances. TypeScript catches logic errors, missing fields, and type mismatches during development before code is ever released.
- **React — Declared: `^19.0.0`, Installed: `19.3.0` (with `react-dom@19.3.0`):**
  - *Why:* Chosen as the foundational component library for Next.js 15. It allows the user interface to be split into modular, self-contained components (such as form inputs, buttons, and alert boxes) that can be tested and reused across parent and staff interfaces.
- **Prisma ORM — Declared: `^6.4.1`, Installed: `6.19.3` (with `@prisma/client@6.19.3`):**
  - *Why:* Chosen for declarative, schema-driven database management. Prisma defines database tables and relationships in a single human-readable file (`prisma/schema.prisma`) and automatically generates type-safe database queries in TypeScript, eliminating runtime SQL syntax errors.
- **PostgreSQL (Neon Serverless with `pgvector`):**
  - *Why:* Chosen for relational data integrity and ACID transaction guarantees. School fee payments require strict transactional consistency—a payment record must never be partially recorded. Neon provides serverless cloud PostgreSQL that scales with demand, while the `pgvector` extension provides native storage for future AI vector embeddings.
- **Vanilla CSS with Design Tokens (`tokens.css`):**
  - *Why:* Chosen for zero runtime overhead, native browser performance, and strict fidelity to Figma design tokens. Using native CSS custom properties eliminates the need for heavy CSS-in-JS libraries or external styling frameworks that increase download sizes on mobile devices.
- **Argon2id & Node.js Crypto (`@node-rs/argon2@2.2.2` / `node:crypto`):**
  - *Why:* Chosen for state-of-the-art password security and cryptographic integrity. Argon2id is the internationally recommended algorithm (RFC 9106) for password hashing because it resists GPU-accelerated cracking attacks. Native `node:crypto` provides timing-safe HMAC signing for session cookies without relying on third-party authentication services that could lock the school into proprietary platforms.

---

## 4. Getting Started

Follow these step-by-step instructions to set up, configure, and run SchoolPass on your local computer.

### Prerequisites

Before starting, ensure you have the following tools installed on your system:
- **Node.js:** Suggested prerequisite: Node.js v20.x or v22.x LTS (the active local development environment was verified on Node `v24.21.0`; compatibility testing across specific earlier LTS releases has not been independently executed). Check with `node -v`.
- **npm:** Suggested prerequisite: npm v10+ (verified locally on npm `11.19.0`). Check with `npm -v`.
- **Git:** Version control command-line tool. Check with `git --version`.
- **PostgreSQL Database:** A PostgreSQL database instance (a cloud instance on [Neon](https://neon.tech) is used in development).

---

### Step-by-Step Setup Commands

#### 1. Clone the repository and open the project directory
Download a copy of the SchoolPass source code to your computer and navigate into the project folder:
```bash
git clone https://github.com/Tosin-ships-it/SchoolPass.git
cd SchoolPass
```

#### 2. Install project dependencies
Download and install all required software packages declared in `package.json`:
```bash
npm install
```

#### 3. Configure environment variables
Create your local environment configuration file by copying the provided example template:
```bash
cp .env.example .env
```
Open `.env` in your text editor and provide your database connection string and session secret (see Section 5 for details).

#### 4. Compile the design tokens
Run the token conversion script to translate the Figma design values into browser-ready CSS custom properties in `tokens.css`:
```bash
npm run tokens
```
*Expected output:* The script will confirm that CSS variables for colors, typography, spacing, radius, shadows, and motion have been generated in `tokens.css`.

#### 5. Start the local development server
Launch the Next.js development server to compile and serve the application locally:
```bash
npm run dev
```
*Expected output:* The terminal will display (as verified in `evidence/03-server-start.txt`):
```text
▲ Next.js 15.5.27
- Local:        http://localhost:3000
- Network:      http://172.20.10.10:3000
✓ Ready in 23.9s
```
Open your web browser and navigate to `http://localhost:3000` to view the running application.

*(Note: The very first time you load the homepage, Next.js compiles the page on-demand, which takes a few seconds. Subsequent page reloads respond almost instantaneously).*

---

### Quality & Verification Commands

To verify that the application code is healthy and free of errors, run the following diagnostic commands from the project root:

- **Typecheck:** Runs the TypeScript compiler to ensure there are no type errors:
  ```bash
  npm run typecheck
  ```
- **Lint:** Runs Next.js ESLint rules to enforce code quality and clean syntax:
  ```bash
  npm run lint
  ```
- **Automated Tests:** Runs the built-in Node.js test runner across authentication and security test suites (verified: 214 tests pass across 57 suites, 0 fail; recorded in `evidence/test-suite-output.txt`):
  ```bash
  npm run test
  ```

---

## 5. Environment Variables

All configuration settings are declared in `.env.example`. No private keys, passwords, or live credentials are stored in version control.

Below is the complete reference explaining what each variable does:

| Variable Name | Purpose & Explanation | Operational Status in Current Build |
| :--- | :--- | :---: |
| `DATABASE_URL` | The PostgreSQL connection URL (e.g., Neon connection string). Used by Prisma to connect to the database for reading and writing data. | **Required & Actively Used** |
| `SESSION_SECRET` | A secret cryptographic string (minimum 32 characters) used by the server to sign session authentication cookies, preventing cookie tampering. | **Required & Actively Used** |
| `NEXT_PUBLIC_APP_URL` | The base URL of the website (e.g., `http://localhost:3000` locally, or `https://schoolpass.ng` in production). Used for absolute redirects and SEO tags. | **Required & Actively Used** |
| `EMAIL_TRANSPORT` | Selects which email service to use for sending verification emails: set to `resend` for the Resend API or `smtp` for standard mail servers (defaults to `resend`). | **Optional & Actively Used** |
| `RESEND_API_KEY` | Your API key from Resend. Used to deliver onboarding invitations, email verification links, and password resets when `EMAIL_TRANSPORT=resend`. | **Used When Resend Active** |
| `RESEND_FROM` | The sender email address displayed on outgoing emails (e.g., `SchoolPass <onboarding@resend.dev>`). | **Optional & Actively Used** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Standard mail server credentials used to send emails locally without using Resend credits when `EMAIL_TRANSPORT=smtp`. | **Used When SMTP Active** |
| `NEXT_PUBLIC_ENABLE_DEV_STUBS` | A development flag (`true` or `false`). When set to `true`, the registration screen displays the email verification token on-screen for local testing without checking an inbox. | **Development Only** |
| `GEMINI_API_KEY` | Google Gemini API key reserved for generating text embeddings and answering policy questions from school circulars. | **Reserved (Feature Unstarted)** |
| `FLUTTERWAVE_PUBLIC_KEY` | Public key reserved for initializing the client-side Flutterwave payment modal. | **Reserved (Feature Unstarted)** |
| `FLUTTERWAVE_SECRET_KEY` | Secret key reserved for server-side payment verification and refunds. | **Reserved (Feature Unstarted)** |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Secret hash key reserved for verifying that incoming payment notifications genuinely originate from Flutterwave. | **Reserved (Feature Unstarted)** |

---

## 6. What the App Does Not Do and Why

The following capabilities are deliberately excluded from SchoolPass in accordance with product specifications (PRD v6.0 §2.3, §15) and operational design principles:

1. **No Social Feeds or Parent-to-Parent Messaging:**
   - *Why:* Excluded to prevent rumors, misinformation, and administrative chaos. SchoolPass is strictly an authoritative administrative channel between the school administration and individual families, not a social network.
2. **No Real-Time Teacher Chat:**
   - *Why:* Excluded to protect teachers' personal evening hours and prevent unlogged administrative requests. General inquiries must be directed to the school's Front Desk Officer during office hours.
3. **No Live Video Classes or Homework Grading (LMS):**
   - *Why:* Excluded because SchoolPass is an administrative and financial records portal, not a Learning Management System. Class assignments and grading belong in academic tools.
4. **No Push Notifications:**
   - *Why:* Excluded as a product design choice: relying on native background push notifications can introduce battery drain and delivery uncertainty on entry-level Android devices over constrained mobile networks. The product strategy therefore prioritizes web-based self-service with transactional email and future direct SMS fallbacks instead.
5. **No Native Mobile App Store Builds:**
   - *Why:* Excluded in favor of a mobile-optimized web application (100dvh viewport). Requiring parents to download an app from Google Play or Apple App Store introduces storage constraints on budget phones, app update friction, and high multi-platform maintenance costs.
6. **No Multi-School Tenancy:**
   - *Why:* Excluded as an architectural decision: SchoolPass is designed as an independent, single-tenant application dedicated to a single school, avoiding the shared-database complexity of multi-tenant platforms where tenant-filtering bugs could accidentally expose one school's records to another.
7. **No Private Student Records in AI Prompts (Architectural Privacy Decision):**
   - *Why:* The Nigeria Data Protection Act (NDPA) 2023 establishes core statutory standards for the lawful and secure processing of personal data, especially concerning children. SchoolPass enforces an application-level architectural and privacy boundary: automated artificial intelligence models are strictly restricted to reading approved, public school circulars (`ApprovedSchoolInfo`). Private student records—such as names, attendance logs, gate arrivals, and fee balances—are never indexed, vectorized, or passed into external AI prompts under any circumstances. This separation is an intentional engineering decision designed to guarantee student confidentiality and prevent accidental data leakage to third-party LLM providers.

---

## 7. Known Defects

To maintain complete engineering transparency, genuine defects in the current codebase are documented below along with their practical impact, technical root cause, and verification methodology.

In accordance with auditing standards, defects are explicitly categorized into **findings verified in the real running application**, **findings established through controlled isolated test harnesses**, and **findings identified via static code inspection**:

### Category A: Verified in Real Application Runtime (`http://localhost:3000` / Live Neon DB)

#### 1. REST Status Code Divergence on Parent Registration (`200 OK` vs. `201 Created`)
- **File:** [`src/app/api/auth/register/route.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/api/auth/register/route.ts), line 92
- **Verification Method:** Verified during real registration transactions on the primary development server (`evidence/11-write-succeeded-logs.txt` and `evidence/12-write-second-row.txt`).
- **Practical Impact:** Automated API monitoring tools and client SDKs that expect standard HTTP status codes may misinterpret account creation responses as read or update operations rather than resource creations.
- **Root Cause:** When parent registration creates a new user, verification token, and student link request, the route handler returns `Response.json(...)` without specifying a status option. Under Next.js / Web standards, `Response.json()` defaults to `200 OK` rather than the standard RFC 9110 §15.3.2 status `201 Created`.

#### 2. Serverless Database Initial Connection Failure (`P1001`)
- **Files:** `src/lib/db/index.ts`, `.env`, and `.env.local`
- **Verification Method:** Directly observed at runtime during local development against Neon Serverless PostgreSQL (`ep-morning-sea-b463ljf1-pooler...`).
- **Directly Observed Fact:** An initial connection attempt to the database threw a connection timeout exception: `PrismaClientInitializationError: Can't reach database server at ep-morning-sea-b463ljf1-pooler... (errorCode: P1001)`.
- **Architectural Context:** Neon Serverless PostgreSQL automatically scales compute to zero / suspends idle endpoints after inactivity to conserve resources. When suspended, resuming compute introduces latency on the first subsequent connection while the container initializes.
- **Root Cause Analysis:** The `DATABASE_URL` configured in `.env` and `.env.local` specifies `sslmode=require&channel_binding=require` without explicit connection timeout parameters (`connect_timeout` or `pool_timeout`). Consequently, Prisma relies on its default connection deadline; if compute resumption or network handshakes take longer than this window, Prisma aborts with `P1001`.
- **Proposed (Unverified) Mitigation:** Appending connection timeout parameters such as `&connect_timeout=30&pool_timeout=30` to `DATABASE_URL` is a documented recommended practice in serverless environments to allow compute sufficient time to resume. However, this parameter is **not currently configured** in `.env` or `.env.local`, and this specific mitigation has not been independently benchmarked or verified in this environment.

#### 3. Detached Background Email Failure Leaves User Waiting
- **Files:** `src/lib/auth/email.ts`, line 691; `src/lib/auth/index.ts`, lines 320–335
- **Verification Method:** Observed directly in development server terminal logs (`task-162.log`) during registration testing.
- **Practical Impact:** A parent submits the registration form and the screen tells them *"Registration successful. Please verify your email address"*, but the verification email was dropped in the background due to connection failure without alerting the user.
- **Root Cause:** The route handler dispatches the email asynchronously as an unawaited background promise (`triggerWelcomeEmail`) so the HTTP response returns quickly. If the SMTP or Resend connection drops in the background, the error is caught and logged internally, but the user is never notified that their email failed to send, and no persistent retry queue exists.

---

### Category B: Verified via Controlled Isolated Test Harness (Port 3070)

#### 4. Silent Error Swallowing in Registration Route Catch Block
- **File:** [`src/app/api/auth/register/route.ts`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/api/auth/register/route.ts), lines 104–109
- **Verification Method:** Discovered through code review and verified using an isolated, controlled HTTP test harness on port 3070 running the registration pipeline against an unreachable database endpoint (`127.0.0.1:54329`, captured in `evidence/13-write-failed-logs.txt`).
- **Audit Disclosure:** To prevent disrupting the live development server on port 3000 and avoid modifying `.env.local`, the real browser UI was not directly exercised with an intentionally broken database connection.
- **Practical Impact:** If a database connection fails during parent registration, the server console prints only `POST /api/auth/register 500` with zero error messages, exception details, or stack traces, leaving system administrators blind to the underlying cause during an outage.
- **Root Cause:** The catch block catches all unhandled exceptions (`catch { return Response.json({ error: ... }, { status: 500 }); }`) without binding an error variable (`catch (error)`) or calling `console.error()`.

---

### Category C: Identified via Static Code Inspection

#### 5. Undefined CSS Custom Property in Staff Student Management
- **File:** [`src/app/(staff)/students/StudentsManager.tsx`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/(staff)/students/StudentsManager.tsx), lines 312, 469, 502, 535, 569, 601, 633, 667, 724
- **Verification Method:** Static code inspection cross-referenced against `tokens.css`.
- **Practical Impact:** On the prospective students intake management screen, form input fields appear without visible borders on some browsers, making it difficult for staff to see where to type.
- **Root Cause:** The code applies inline styles referencing `var(--color-roles-outline)` without a fallback value. The design token stylesheet (`tokens.css`, line 142) declares this variable as `--color-roles-outline-color`. Under CSS standards (W3C Custom Properties Level 1 §3.3), calling an undeclared property without a fallback causes shorthand border properties to reset to `none`.

#### 6. Missing Token Fallback in Shared Authentication Inputs
- **File:** [`src/app/auth/components/AuthFormElements.tsx`](file:///c:/Users/gbola/Desktop/SchoolPass/src/app/auth/components/AuthFormElements.tsx), lines 85–98, 142–156
- **Verification Method:** Static code inspection.
- **Practical Impact:** Shared input fields on the login and registration forms can display inconsistent or invisible outlines if external stylesheets fail to cascade properly.
- **Root Cause:** Input elements reference `--color-roles-outline` directly without providing a secondary fallback color (such as `#79747E`).
