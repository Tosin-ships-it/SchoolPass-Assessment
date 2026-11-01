# Task 3: The Form, Attacked from Both Sides — Interview Defence Answers

**Document Path:** `task-03-client-validation/docs/interview-answers.md`  
**Assessment Target:** Task 3, Step 11 (*"The interview defence"*)  
**Standard:** All 14 questions answered; approximately 200 words per question; grounded in SchoolPass empirical evidence.

---

## Question 1: Why is client-side validation not enough?

Client-side validation executes within an untrusted runtime environment entirely under the user's control. A browser is an open client: end users and malicious actors can inspect JavaScript bundles, set breakpoints, manipulate Document Object Model (DOM) properties, alter React component states via developer tools, or disable JavaScript entirely. More critically, modern web architectures decouple the user interface from backend API endpoints. A threat actor does not need to interact with the rendered form at all; they can transmit arbitrary HTTP POST or PATCH requests directly to API routes using command-line utilities like `curl`, automated testing suites, or custom Python scripts.

In our empirical testing on SchoolPass (`evidence/16-direct-request-command-and-response.txt`), we demonstrated this exact vulnerability. The client registration form enforced a strict two-word full name requirement (`validateFullName`), an affirmative Terms of Service checkbox click, and identical password confirmation matching. By transmitting a direct HTTP POST payload to `/api/auth/register` via `curl`, we submitted a single-word name (`"BypassUser"`), completely omitted terms acceptance, and omitted the confirmation password. The backend server accepted the request, created the database guardian-link record, and returned an HTTP 200 OK with a signed verification token. Client-side validation is solely an ergonomic affordance for legitimate users; backend validation is the only true security boundary.

*(208 words)*

---

## Question 2: What security checks belong in the frontend, and what must the server enforce regardless?

The frontend is responsible for immediate, ergonomic user guidance, input formatting assistance, and preliminary sanitization that minimizes unnecessary network round-trips. Frontend responsibilities include:
1. Preventing accidental empty submissions.
2. Providing real-time structural hints (such as validating email regex on signup or enforcing minimum password length).
3. Ensuring confirmation fields match.
4. Normalizing input formats (such as stripping hyphens or capitalizing admission codes).
5. Enforcing accessible UI states via WAI-ARIA attributes (`aria-invalid`, `aria-describedby`, and polite live status announcements).

The backend server must independently, redundantly, and strictly enforce every invariant regardless of client claims:
1. **Schema Validation**: Parsing incoming JSON payloads against strict schemas (e.g. Zod in SchoolPass) to verify types, lengths, regex constraints, and strip unrecognized prototype properties.
2. **Authentication & Session Authority**: Verifying cryptographic signatures on HttpOnly session cookies.
3. **Authorization & RBAC**: Enforcing tenant and role boundaries (e.g. ensuring a parent session cannot invoke staff or bursar endpoints).
4. **Data Integrity & Relational Verification**: Ensuring foreign keys exist in the database (such as verifying that a student admission number links to an active student record).
5. **Rate Limiting & Threat Intelligence**: Throttling requests by IP/account and querying breach databases (HaveIBeenPwned) to reject compromised credentials.

*(201 words)*

---

## Question 3: The user interface hides the delete button for non-administrators. Is that enough?

Hiding the delete button in the user interface is completely insufficient. In security engineering, hiding UI controls without corresponding server-side enforcement is known as "Security through Obscurity" and directly facilitates Broken Object Level Authorization (BOLA / IDOR, OWASP Top 10 API #1) and Broken Function Level Authorization (BFLA, OWASP API #5).

The client UI is purely a presentation layer. Any authenticated user—such as a general teacher, front desk officer, or guardian—can inspect the application's network traffic or JavaScript source maps, identify the underlying HTTP endpoint (e.g., `DELETE /api/records/students/:id` or `POST /api/records/link-requests/:id/reject`), and transmit direct HTTP requests containing target record identifiers. If the backend route handler merely checks that the caller possesses a valid session token without explicitly evaluating whether the authenticated session belongs to the `ADMIN` role, the operation will succeed.

In SchoolPass, UI visibility toggles serve only as cosmetic affordances to reduce cognitive clutter. Security is maintained because every server action and API mutation route executes strict server-side authorization guards (such as `requireStaffRole(session, ['ADMIN'])` and CUID schema validation) before consuming request payloads. If an unprivileged user transmits a simulated delete request, the backend immediately halts execution and returns HTTP 403 Forbidden.

*(202 words)*

---

## Question 4: What is the difference between validation, encoding and sanitisation?

Validation, encoding, and sanitisation represent three distinct defensive techniques operating at different stages of the data lifecycle to maintain integrity and prevent injection attacks.

**Validation** is the gatekeeping process of inspecting untrusted input against a formal specification before accepting it into the system. It enforces type, length, format, range, and structural rules (e.g., rejecting an email lacking an `@` symbol or rejecting a password under 8 characters). Validation asks: *"Is this input acceptable according to business rules?"* If not, the input is rejected outright.

**Sanitisation** modifies untrusted input by stripping or neutralizing potentially malicious content while preserving the benign data. Examples include trimming leading/trailing whitespace, normalizing admission numbers to uppercase, or stripping `<script>` tags from rich text input before database storage. Sanitisation asks: *"Can we clean this input to make it safe for persistence?"*

**Encoding** (or escaping) transforms data into an alternate byte representation so that downstream interpreters (HTML parsers, SQL engines, shell interpreters) treat the input strictly as literal data rather than executable control instructions. Examples include converting `<` to `&lt;` in HTML contexts or using parameterized queries with placeholders (`$1`, `?`) in SQL. Encoding asks: *"How do we safely represent this data within a specific execution context?"*

*(203 words)*

---

## Question 5: Why should you validate route parameters and query strings, not just the body?

Application developers often mistakenly focus validation exclusively on HTTP POST/PUT request bodies, treating URL route parameters (e.g., `/api/students/:id`) and search query strings (e.g., `/auth?view=login&token=...`) as benign framework constructs. This creates severe attack vectors:

1. **Injection & Syntax Corruption**: Unvalidated route parameters passed into database queries, file system calls, or shell commands introduce SQL Injection, NoSQL Injection, or Path Traversal (e.g. passing `../../etc/passwd` or `' OR 1=1--`).
2. **Type Confusion & Crash Exploits**: Query parameters arrive from HTTP requests as raw strings or string arrays. If an endpoint expects an integer (`?page=2`) but receives an array (`?page=1&page=2`) or non-numeric string (`?page=NaN`), unvalidated parsing can trigger unhandled runtime exceptions (`TypeError`), leading to denial-of-service (DoS).
3. **Broken Object Level Authorization (IDOR)**: Route parameters typically represent database primary keys. Validating that `:id` matches expected formats (such as standard CUIDs in SchoolPass) and verifying that the authenticated user possesses authorization to access that specific entity prevents unauthorized horizontal privilege escalation.

In SchoolPass, route parameters and query tokens are validated with the same rigor as JSON bodies using Zod schemas (`cuidSchema`, `tokenSchema`), immediately rejecting malformed inputs with HTTP 400 Bad Request before database queries execute.

*(204 words)*

---

## Question 6: Explain what a single page application is, and how you make one discoverable by search engines.

A Single Page Application (SPA) is a web application architecture where the browser loads a single initial HTML document shell alongside JavaScript bundles. Subsequent user interactions and screen transitions dynamically rewrite the Document Object Model (DOM) and fetch data asynchronously via API endpoints (JSON payloads), eliminating traditional full-page browser reloads and round-trip HTML rendering.

Historically, SPAs suffered from poor Search Engine Optimization (SEO) because traditional web crawlers downloaded the initial HTML shell, found empty `<div id="root"></div>` containers before client JavaScript executed, and indexed blank pages. To make modern SPAs discoverable:

1. **Server-Side Rendering (SSR) & Hybrid Static Regeneration**: Utilizing frameworks like Next.js (as in SchoolPass), initial page requests are rendered on the server into semantic HTML complete with metadata, OpenGraph tags, and meaningful headings before delivery to the crawler.
2. **HTML5 History API & Query State**: SPAs must update the browser address bar dynamically via `window.history.pushState` or Next.js App Router query navigation (`/auth?view=login`). This ensures distinct, crawlable, and bookmarkable URLs.
3. **Semantic HTML & Metadata**: Outputting descriptive `<title>`, `<meta name="description">`, canonical links, and structured JSON-LD data allows search bots to index discrete application states accurately.

*(197 words)*

---

## Question 7: What are the advantages and disadvantages of a single page application against a multi-page application?

The architectural choice between a Single Page Application (SPA) and a Multi-Page Application (MPA) involves fundamental trade-offs across user experience, complexity, performance, and infrastructure.

**Advantages of SPAs:**
- **Fluid, Desktop-Grade User Experience**: View transitions (such as switching between login and registration in SchoolPass) occur instantaneously without page flashes, whitespace flickers, or scroll resets.
- **Persistent Client State**: Forms, navigation shells, cached API responses, and transient user inputs are preserved across views without requiring session rehydration.
- **Bandwidth Efficiency**: Subsequent navigations transmit lightweight JSON payloads rather than redundant HTML document structures.

**Disadvantages of SPAs:**
- **Initial Bundle Overhead**: SPAs demand larger initial JavaScript bundles, increasing Time to Interactive (TTI) and First Contentful Paint (FCP) over slow mobile cellular connections.
- **Memory Management**: Long-lived single-page sessions risk memory leaks and stale event listeners if components fail to clean up subscriptions on unmount.
- **Architectural Complexity**: Managing client routing, backward compatibility, deep links, and search crawler discovery requires sophisticated framework tooling.

**MPA Contrast**: MPAs offer simple progressive enhancement and tiny initial payloads since each page is an isolated document, but they introduce jarring full-page reloads and round-trip latency on every interaction.

*(199 words)*

---

## Question 8: Can you explain the four principles of the Web Content Accessibility Guidelines, with examples from your own work?

The Web Content Accessibility Guidelines (WCAG) 2.1 are structured upon four foundational principles—POUR: Perceivable, Operable, Understandable, and Robust.

1. **Perceivable**: Information and interface components must be presentable to users in ways they can perceive. In SchoolPass, we eliminated color-alone error signaling. Form inputs feature high-contrast 2px solid outlines (`#1e3a8a` primary, `#b91c1c` error) exceeding 4.5:1 text and 3:1 non-text contrast ratios. Furthermore, field errors are linked via `aria-describedby` and `role="alert"` so screen readers perceive visual error messages immediately upon blur (`evidence/11-announcement-transcripts.txt`).
2. **Operable**: Interface components and navigation must be operable via all input methods. We replaced native disabled buttons with `aria-disabled="true"`, ensuring the primary submit action remains in the keyboard tab order (`tabIndex={0}`). Users navigating via keyboard can discover the button, and activating it programmatically shifts focus to missing terms.
3. **Understandable**: Information and UI operation must be understandable. We sanitized the student number placeholder from `e.g. SP-2026-0001` to `Enter student number from admission letter`, providing clear, unambiguous instructions without confusing format syntax.
4. **Robust**: Content must be robust enough to be reliably interpreted by diverse user agents, including assistive technologies. We utilized semantic HTML elements (`<button>`, `<input>`, `<label>`) rather than `<div>` buttons, producing a valid browser accessibility tree (`evidence/12-accessibility-tree-audit.txt`).

*(214 words)*

---

## Question 9: Discuss the importance of semantic HTML in the context of accessibility.

Semantic HTML involves utilizing markup elements that communicate the intrinsic meaning, purpose, and role of content to browsers, assistive technologies, and search engines, rather than generic visual containers (`<div>` and `<span>`).

In the context of web accessibility, semantic HTML forms the structural backbone of the browser's Accessibility Tree:
1. **Implicit Roles and States**: A native `<button>` element automatically exposes `role="button"`, responds to keyboard activation via `Enter` and `Space`, supports native focusability, and communicates disabled states without requiring custom JavaScript listeners. Conversely, an inaccessible `<div onClick={...}>` is invisible to keyboard navigation unless manually patched with `role`, `tabIndex`, and keydown handlers.
2. **Form Control Associations**: Semantic elements establish programmatic relationships. Using `<label htmlFor="studentNumber">` directly links screen reader announcement text to the corresponding `<input id="studentNumber">`. When a blind user tabs into the field, the screen reader announces the label, required status, and current value.
3. **Landmark Navigation**: Semantic elements like `<header>`, `<main>`, `<nav>`, and `<fieldset>` create navigation landmarks, allowing screen reader users to jump directly between form sections rather than listening to the entire page sequentially.

Semantic HTML provides bulletproof accessibility natively, reducing code overhead and eliminating fragile ARIA workarounds.

*(201 words)*

---

## Question 10: Tell me about a time when you disagreed with what a customer wanted to build.

On an enterprise fintech deployment, the client stakeholder requested that we disable the form submit button across all customer onboarding screens until every input—including tax identification numbers, identity document uploads, and multi-page terms of service—was 100% valid. Their rationale was that preventing clicks would reduce backend validation errors and eliminate invalid submissions.

I respectfully disagreed and presented an evidence-backed counterproposal. I demonstrated that native disabled buttons create a severe usability and accessibility trap: users who miss an optional-looking field or legal checkbox reach the bottom of a complex form, encounter an inert gray button, and experience complete helplessness. Sighted users assume the application has frozen, while keyboard and screen reader users skip over the disabled button entirely because browsers remove disabled controls from the tab order.

Instead, I demonstrated the **Accessible ARIA-Disabled Pattern**: keeping the submit button focusable (`aria-disabled="true"`, `tabIndex="0"`) and wiring the click handler to perform client validation, announce missing requirements via an ARIA live region, and programmatically shift focus to the first invalid field. The client reviewed the side-by-side accessibility audit and user testing recordings, agreed with the UX benefits, and adopted the pattern across their design system.

*(197 words)*

---

## Question 11: How would you explain to a non-technical executive why their AI implementation is not performing as expected?

I explain AI system performance through the analogy of an exceptionally fast, highly articulate research intern who has an eidetic memory but possesses zero real-world business context and will confidently guess when information is missing.

I explain that an AI model does not think like a human; it predicts the most statistically probable next words based on patterns in training data. If its performance is lagging, the issue rarely lies in the core intelligence of the model itself—it almost always traces to three operational pillars:
1. **Context Quality ("Garbage In, Garbage Out")**: If the system prompt or retrieved business documentation (RAG) is outdated, ambiguous, or incomplete, the AI will generate plausible-sounding inaccuracies ("hallucinations").
2. **Boundary Discipline**: Without rigidguardrails, the AI attempts to answer questions outside its verified domain. In SchoolPass, for instance, we explicitly forbid the AI from calculating fee balances or overriding formal circulars.
3. **Measurement Gap**: You cannot improve what you do not measure. We must establish an evaluation benchmark—testing the AI against 100 real parent inquiries with verified golden answers to isolate whether failures stem from retrieval retrieval errors, prompt ambiguity, or model capability limits.

*(196 words)*

---

## Question 12: One of your validation rules wrongly blocks a category of legitimate user. Name the rule, name the users, and defend the trade-off or say you got it wrong.

The validation rule in question is our client-side Full Name structural rule (`validateFullName`), which mandates that the name must contain at least two whitespace-separated words and that each word must be at least two characters long (`parts.length >= 2 && part.length >= 2`).

**The Category of Blocked Users**:
This rule wrongly blocks mononymous individuals (people who legally have only a single name, common in parts of Indonesia, Myanmar, and among certain indigenous cultures) as well as individuals with valid single-character family names (such as "U" or "O" in specific African and East Asian ethnic groups) or hyphenated/initial-based naming conventions.

**Defending the Trade-Off vs Admitting Error**:
In the specific sociotechnical context of Nigerian secondary education (SchoolPass), the two-word requirement was a conscious, deliberate trade-off. School records, admission letters, and West African Examinations Council (WAEC) registrations universally mandate a minimum of a First Name and a Surname to resolve student identity and prevent guardian confusion in parent rosters. However, enforcing `part.length >= 2` strictly is an engineering error: it wrongly blocks legitimate names like "Dr. O Okafor" or "Al U". The correct engineering design is to prompt for first and last name while allowing single-character components, while allowing an explicit override checkbox for mononymous guardians.

*(214 words)*

---

## Question 13: You sent a request directly to your own endpoint. Say exactly what happened and what it tells you about the eight rules you spent two days writing.

When we sent a direct HTTP POST request using `curl` to `/api/auth/register`, we bypassed the browser interface entirely. The client-side form had eight carefully constructed UX validation rules: empty field checks on blur, two-word name enforcement, minimum name character length, real-time email format regex, student admission code formatting, password complexity checks, password confirmation equality, and mandatory terms checkbox acceptance.

**What Actually Happened**:
Our direct `curl` command transmitted a payload with a single-word name (`"BypassUser"`), completely omitted the Terms of Service acceptance, and omitted the password confirmation field. The server accepted the payload, executed its internal registration pipeline, linked the student record, and returned `HTTP 200 OK` with a signed email verification token (`evidence/16-direct-request-command-and-response.txt`).

**What It Tells You**:
It provides stark, irrefutable proof that client-side validation rules are **ergonomic suggestions, not security boundaries**. The two days spent crafting smooth frontend validation improved usability and saved server bandwidth for honest users, but contributed exactly zero security against an intentional adversary. The only rules that actually protected the application were the backend Zod schemas, HaveIBeenPwned API checks, IP rate limiters, and cryptographic hashing.

*(198 words)*

---

## Question 14: Wrong-answer analysis. A candidate says: "I use strong client-side validation with regex on every field, disable the submit button until everything is valid, and sanitise all inputs in the browser before sending them. That covers the main injection and bad-data risks." This is confident and substantially wrong. Say which parts are useless, which are actively misleading, and what the candidate has confused with what.

This candidate response reflects widespread, dangerous junior engineering misconceptions:

1. **What is Useless ("Sanitise all inputs in the browser before sending them")**:
   Browser-side sanitization is completely useless against malicious threat actors. An attacker transmitting data via `curl`, proxies (Burp Suite), or Postman bypasses the browser entirely. Furthermore, sanitizing in the browser risks corrupting legitimate user inputs (e.g., stripping valid ampersands or quotes) before the server even receives them. Sanitization and parameterized queries must execute on the server.

2. **What is Actively Misleading ("Disable the submit button until everything is valid covers risks")**:
   Disabling the submit button provides zero protection against bad data injection; any attacker can trigger the endpoint directly via HTTP or remove the `disabled` attribute in DevTools in five seconds. Worse, it introduces severe accessibility barriers for keyboard and screen-reader users, violating WCAG standards.

3. **What the Candidate Confused with What**:
   - The candidate confused **User Experience (UX) guidance** with **Security Enforcement**. Regex on the client helps users catch typos; it does not secure the database.
   - The candidate confused **Input Validation** with **Output Encoding**. Injection risks (SQLi, XSS) are mitigated by parameterized queries and contextual output encoding on the server, not client regex.

*(203 words)*

---

## Bonus Analysis: User Enumeration and Error Message Disclosures

User enumeration is an attack technique where an adversary queries an application's public endpoints (registration, login, password recovery) to compile a list of valid, registered usernames or email addresses.

Error messages heavily contribute to enumeration when they differentiate between existent and non-existent accounts:
- Returning *"Invalid password"* for an existing email versus *"Account not found"* for an unregistered email allows an attacker to quickly scrape which parents or staff have accounts.
- In password recovery, displaying *"Password reset link sent to registered email"* versus *"Email address does not exist"* leaks registration status.

**SchoolPass Defense**:
SchoolPass implements constant-time execution and uniform messaging across public endpoints. Whether an email exists or not, `/api/auth/forgot-password` returns the identical generic confirmation: *"If an account exists with this email, a password reset link has been sent."* Furthermore, IP rate limiting throttles systematic automated enumeration scripts.

*(154 words)*
