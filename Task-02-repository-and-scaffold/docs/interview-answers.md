# Task 2: Repository & Application Scaffold — Interview Defence Answers

**Document Path:** `Task-02-repository-and-scaffold/docs/interview-answers.md`  
**Assessment Reference:** Task 2, Step 11 (*"The interview defence"*)  
**Assessment Brief:** `docs/Assessment/Ship-and-Found-Five-Tasks.md`  
**Target Repository:** `SchoolPass-Assessment` / `SchoolPass`  
**Date:** October 30, 2026  

This document contains written answers to all 15 interview defence questions specified for Task 2. Every answer is constrained to approximately 200 words, grounded strictly in machine-verified SchoolPass Task 2 evidence, and explicitly distinguishes verified runtime observations from planned production features.

---

## Question 1: What is the difference between Git Flow and trunk-based development, and why have a lot of teams moved toward trunk-based?

Git Flow is a multi-branch model built around long-lived branches (`main`, `develop`, `release/*`, `feature/*`, `hotfix/*`). Features incubate on isolated branches for weeks before merging into `develop`, with releases batched periodically. This creates delayed integration, painful merge conflicts ("merge hell"), and slows delivery.

Trunk-based development centers on a single shared branch (`main`). Developers merge small, frequent commits into `main` daily or via short-lived feature branches (<48 hours), utilizing automated test suites and feature toggles to gate unfinished work.

Teams transitioned to trunk-based development to unlock continuous integration and continuous deployment (CI/CD). Merging small diffs frequently surfaces integration bugs immediately rather than weeks later, simplifies code reviews, eliminates branch drift, and keeps software continuously releasable.

In SchoolPass, trunk-based development keeps the Next.js 15 App Router foundation unified. Long-lived branches would isolate parent authentication from the Prisma database layer and staff portal shells, leading to severe token and route collisions upon merge. As verified in Task 1 (`evidence/12-git-log-branch-unmerged.txt`), SchoolPass utilizes `main` (`master`) alongside short-lived feature branches (`feat/student-number-linking`) and ephemeral test branches (`test/broken-token-referencing`), ensuring rapid integration while preventing untested regressions from lingering in the delivery pipeline.

---

## Question 2: What does git push --force actually do, and why is --force-with-lease generally safer?

Executing `git push --force` (`-f`) unconditionally overwrites the remote branch reference with your local commit pointer. Git bypasses its standard fast-forward safety check, forcefully wiping out any commits on the remote branch that do not exist in your local repository. If a team member pushed commits to that branch in the interim, their work is permanently orphaned from the remote branch ref.

In contrast, `git push --force-with-lease` is a conditional force push. Before overwriting the remote branch, Git checks whether your local remote-tracking reference (e.g., `origin/feat/student-intake`) matches the actual reference currently on GitHub. If another developer or automated agent has pushed new commits since your last `git fetch`, the lease check fails and Git rejects the push with an error.

This makes `--force-with-lease` significantly safer during everyday development. When rebasing a local feature branch against `main` or amending commit messages to maintain clean PR histories, `--force-with-lease` guarantees that local history updates will never silently obliterate a collaborator's remote work. On shared production branches like `main`, all force pushes should be strictly prohibited via branch protection rules.

---

## Question 3: Why is rewriting history, through rebase, amend or force push, dangerous on a shared branch?

Git commits are immutable snapshots identified by cryptographic SHA hashes computed from commit metadata, timestamps, author details, file trees, and parent commit hashes. When you rebase, amend, or reset a commit, Git does not modify the original commit; it creates an entirely new commit object with a different SHA hash.

Rewriting history on a shared branch is dangerous because it fractures the timeline for everyone collaborating on that branch. If Developer A rewrites commits on a shared branch and force-pushes, Developer B's local clone still tracks the original commit hashes. When Developer B pulls or pushes, their Git client attempts to reconcile two divergent histories containing identical code changes under different hashes. This causes duplicate commits in the log, triggers spurious merge conflicts, and risks resurrecting previously deleted bugs.

In SchoolPass, multiple modules—such as design token pipelines (`tokens.css`), authentication forms, and Prisma configurations—depend on predictable base commits. Rewriting shared history on `main` breaks CI/CD automated deployment webhooks and invalidates testing baselines. As demonstrated in Task 1 (`evidence/12-git-log-branch-unmerged.txt`), history rewriting was executed safely only on an unshared, local regression branch (`test/broken-token-referencing`), which was deleted unmerged without contaminating the shared repository.

---

## Question 4: What is the difference between git merge and git rebase, and when would you actually pick one over the other?

`git merge` and `git rebase` are alternative strategies for integrating changes between branches:

`git merge` takes the tip of a feature branch and combines it with `main`, creating a distinct "merge commit" with two parent pointers (unless fast-forwarded). It is non-destructive: existing commit hashes remain untouched, and the exact chronological sequence and branching context are completely preserved.

`git rebase` lifts commits from the current branch and replays them sequentially onto the tip of another branch (e.g., `main`). This rewrites commit hashes, producing a perfectly linear history without merge commits.

You pick `git rebase` during active development on private, unpushed feature branches to incorporate the latest updates from `main`. This resolves conflicts incrementally and ensures your pull request presents a clean, readable, linear diff.

You pick `git merge` when integrating a completed, reviewed feature branch or Pull Request into `main`. Merging preserves the historical audit trail of the feature, clearly identifies when the integration occurred, and prevents disrupting other contributors. In SchoolPass, local feature work benefits from rebasing to stay current with scaffold updates, while merges to `main` maintain the verifiable commit history required for assessment audits.

---

## Question 5: What causes a merge conflict, and what is actually happening in the file when you see the conflict markers?

A merge conflict occurs when Git's three-way merge algorithm cannot automatically reconcile divergent changes between two branches. This happens when two commits modify the exact same lines of a file (or adjacent lines within the same diff context) differently since their common merge base ancestor, or when one branch modifies a file that the other branch deleted.

When Git encounters this ambiguity, it halts the merge process and injects conflict markers directly into the working directory file:

```text
<<<<<<< HEAD
// Local branch version (what is currently checked out)
=======
// Incoming branch version (what is being merged)
>>>>>>> feat/student-number-linking
```

Internally, Git places the file in an unmerged state within the index (`.git/index`). The index stores three distinct versions of the file: Stage 1 (common ancestor), Stage 2 (target branch / `HEAD`), and Stage 3 (incoming branch). Git cannot choose between them without human business logic.

In SchoolPass, a conflict would occur if an engineer modifies `ParentRegisterForm.tsx` to handle NDPA privacy consents while another concurrently updates form styling. The developer must manually edit the file to combine the logic, remove the conflict markers, and stage the resolved file.

---

## Question 6: What is the difference between the working directory, the staging area and the repository?

Git tracks software across three distinct architectural layers on the local machine:

1. **The Working Directory:** The concrete filesystem directory on disk (e.g., `C:\...\SchoolPass`). It contains loose, uncommitted files, node modules, build artifacts (`.next/`), and untracked configurations (`.env.local`). Code here is volatile and unversioned. The local Next.js development server runs directly against this directory on port 3000.
2. **The Staging Area (Index):** A binary file (`.git/index`) that serves as Git's preparation dock. When you execute `git add`, Git snapshots the file into `.git/objects/` as a blob and registers its hash in the index. The staging area allows developers to craft precise, atomic commits rather than dumping all local file modifications into history simultaneously.
3. **The Repository (Object Store):** The permanent `.git` database. It stores immutable commit objects, directory trees, and cryptographic SHA hashes. Commits here represent durable snapshots with recorded authors, timestamps, and commit messages.

In SchoolPass Task 2, editing `ParentRegisterForm.tsx` alters the working directory; running `git add` stages the validated form logic; and running `git commit` permanently writes commit `cebb045` into the local repository store without affecting remote servers until pushed.

---

## Question 7: What is branch protection, and what does it typically enforce?

Branch protection is a repository governance mechanism configured on remote Git platforms (like GitHub or GitLab) to protect critical branches—predominantly `main`—from destructive modifications, untested code, or unauthorized deployments.

Branch protection typically enforces five core constraints:
1. **Disallows Direct Pushes:** Developers cannot run `git push origin main`. All code must arrive via a Pull Request.
2. **Mandatory Code Reviews:** Requires a minimum number of approving Pull Request reviews from designated code owners before merge.
3. **Required Status Checks:** Automated CI/CD pipelines must pass successfully (e.g., `npm run typecheck`, `npm run lint`, and test suites) before the merge button unlocks.
4. **Enforces Linear History & Disallows Force Pushes:** Blocks `git push --force` and branch deletions, ensuring the mainline history remains immutable and auditable.
5. **Signed Commits:** Requires cryptographically signed commits (GPG/SSH) to verify committer identity.

In SchoolPass, branch protection is vital because merging into `main` is architected to trigger automated production builds on Vercel. Enforcing branch protection ensures that broken Prisma schemas, unvetted authentication flows, or unhandled CSS token bugs cannot bypass code review and deploy directly to Nigerian school parents and administrators.

---

## Question 8: Walk me through a technical project you built end to end.

I built the foundation and architectural scaffold for **SchoolPass**, a private, mobile-first web portal for parents and staff of a Nigerian primary/secondary school (~400 students). The application centralizes morning gate arrivals, student fee payments in Nigerian Naira (`NGN`), private attendance tracking, and school policy inquiries without exposing student data to AI.

I scaffolded the application using Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, and Neon Serverless PostgreSQL (`pgvector`), styled exclusively with Figma Material Design 3 tokens converted to CSS custom properties (`tokens.css`). I enforced strict folder boundaries separating parent routes (`/ask`, `/records`, `/pay`) from staff management (`/attendance`, `/students`).

I built mobile-first screens constrained to `100dvh` for mid-range Android devices, and drafted legal disclosures under the Nigeria Data Protection Act (NDPA) 2023. Technically, I verified runtime resilience: diagnosing first-load compilation performance (7,591 ms TTFB), resolving port collisions (`evidence/07`), and debugging 404 routing errors (`evidence/09`). Finally, I audited database persistence with non-identical timestamps (`evidence/11`, `evidence/12`) and isolated database-connectivity failures (`evidence/13`), proving the registration API cleanly returns HTTP 500 without false success.

---

## Question 9: Tell me about a time when something you built broke in production.

SchoolPass is currently in its local development and scaffold verification phase; it has not yet been deployed to a live end-user production environment. However, during our infrastructure failure testing in the development environment, I encountered and diagnosed a genuine production-grade failure: the **Neon Serverless Database Cold-Start Timeout**.

In Neon serverless PostgreSQL, idle compute endpoints automatically suspend after 5 minutes of inactivity. When our registration pipeline attempted a database write after suspension, compute reactivation required 3.5 to 7 seconds. Because our initial connection string in `.env.local` lacked explicit connection timeout parameters, Prisma's client connection pool hit its default 5-second deadline and aborted, throwing `PrismaClientInitializationError: Can't reach database server (P1001)` and returning an HTTP 500 error (`docs/defects.md`, Defect 3).

The failure revealed that traffic lulls in production would cause intermittent registration failures for parents. I resolved this by appending `&connect_timeout=30&pool_timeout=30` to the database URL, granting sufficient headroom for serverless compute wake-up. Furthermore, I identified that the API route caught this exception but swallowed the error without console logging, which I remediated by recommending structured server-side logging.

---

## Question 10: How do you approach learning a new technical platform or codebase quickly when starting a new engagement?

My approach is systematic, test-driven, and focused on boundary mapping:

1. **Ingest Architectural Intent & Constraints First:** Before reading code, I review product requirement documents, architectural rules (`RULES_*.md`), data models, and statutory constraints (e.g., SchoolPass PRD v6.0 and NDPA 2023 privacy mandates). Understanding business constraints prevents false assumptions.
2. **Inspect the Tooling & Module Boundaries:** I analyze dependency manifests (`package.json`), path aliases (`tsconfig.json`), and folder structures. In SchoolPass, I mapped route groups separating parent portals from staff interfaces and confirmed how design tokens flow from Figma JSON into `tokens.css`.
3. **Verify the Active Development Loop:** I execute build and quality scripts (`npm run typecheck`, `npm run lint`), start the local server, and observe initial compilation behavior and HTTP timing (`evidence/03`, `evidence/04`).
4. **Trace a Single End-to-End Transaction:** I follow one complete lifecycle through the entire stack—tracing the parent registration request from client-side state in `ParentRegisterForm.tsx` to the API handler, password hashing, and Prisma PostgreSQL insertion.
5. **Probe Failure Modes:** I test system resilience by intentionally breaking ports, routes, and database connections, observing whether error telemetry accurately captures failures.

---

## Question 11: What is the difference between code that is correct and code that is complete?

"Correct" code satisfies narrow functional specifications: given expected inputs under optimal conditions, it produces the expected output. A registration route that successfully hashes a password and inserts a record into PostgreSQL when the network is healthy is functionally correct.

"Complete" code, by contrast, anticipates the full operational lifecycle, edge cases, failure states, and maintenance burdens of production:

1. **Defensive Error Handling:** Complete code anticipates failures. In SchoolPass, while our registration route was correct, catching errors without logging (`catch { return 500; }`) was incomplete because it blinded operators during outages (`docs/defects.md`, DEF-02).
2. **Protocol & Semantic Conformance:** Complete code returns RFC-compliant HTTP `201 Created` on resource creation rather than defaulting to `200 OK` (`docs/defects.md`, DEF-01).
3. **Environmental Resilience:** Complete code configures database timeouts (`connect_timeout=30`) for serverless cold starts and prevents unawaited background task dropouts (such as detached welcome email failures, DEF-04).
4. **Security & Boundary Enforcement:** Complete code enforces rate limiting, input validation via Zod, and architectural privacy barriers (e.g., ensuring zero child records reach AI models).
5. **Observability:** Complete code emits structured logs enabling rapid triage.

---

## Question 12: How do you design software for a customer who will need to maintain it after you are gone?

Designing for long-term customer maintenance requires eliminating hidden magic, reducing cognitive load, and embedding architectural guardrails:

1. **Standardized Architecture & Minimal Dependencies:** Avoid bespoke frameworks. In SchoolPass, I used standard Next.js 15 App Router conventions and native CSS custom properties (`tokens.css`), eliminating complex third-party abstractions or runtime styling engines that require specialized maintenance.
2. **Compile-Time Type Safety & Strict Contracts:** I enforced strict TypeScript types (`tsconfig.json`) and declarative Prisma schemas (`schema.prisma`). Any future breaking change in entity models immediately surfaces compile errors before code runs.
3. **Self-Documenting Environment Configuration:** All configuration variables are explicitly defined in `.env.example` with clear single purposes, preventing missing secrets from causing silent runtime failures.
4. **Honest, Auditable Defect Documentation:** Rather than presenting an idealized application, I documented verified code defects, root causes, line numbers, and recommended diff remediations in `docs/defects.md`, giving future maintainers immediate institutional knowledge.
5. **Reproducible Test Harnesses:** I documented exact curl commands, diagnostic port test scripts, and startup steps in `README.md`, ensuring any incoming engineer can verify database persistence and recover from server collisions without tribal knowledge.

---

## Question 13: Your first page load took a specific number of milliseconds. Where did that time go? Name the parts you can measure and the parts you are guessing about.

During our first local HTTP request to `http://localhost:3000` (`evidence/04-first-load.txt` and `docs/performance-note.md`), the total response time was **8,496 ms**, with a Time to First Byte (TTFB) of **7,591 ms** and a payload transfer duration of **905 ms** (transferring 87,897 bytes).

### What I Can Measure (Verified Data):
- **Total HTTP Response Duration:** 8,496 ms, measured from TCP socket dispatch to final byte reception.
- **Time to First Byte (TTFB):** 7,591 ms, confirming that 89.3% of total request duration occurred on the server before the first HTML byte was emitted.
- **Payload Size:** Exactly 87,897 bytes transferred over HTTP chunked streaming.
- **Server Initialization:** Terminal logs confirmed the Next.js dev server initialized in 23.9s (`evidence/03-server-start.txt`).

### What I Am Guessing About (Unmeasured Internals):
- **Internal Server Breakdown:** I cannot measure the exact millisecond division within TTFB between Node.js file I/O, on-demand TypeScript compilation, React 19 server component SSR rendering, and `tokens.css` parsing.
- **Browser Client Metrics:** Client-side parsing, CSSOM construction, and Largest Contentful Paint (LCP) were unmeasured due to a Playwright driver 404 initialization error, which prevented automated browser profiling.

---

## Question 14: Your application reported success to the user while writing nothing to the database. Explain the mechanism that allowed that, and name the one check that would have caught it in thirty seconds.

This false-success vulnerability arises from **optimistic UI updates** or **premature API response dispatching** where the interface announces success before the database transaction commits.

The architectural mechanism occurs when client-side JavaScript transitions form state (e.g., navigating to `/dashboard` or setting `isSuccess(true)`) immediately upon button click, assuming the network call will succeed, or when a route handler returns `HTTP 200/201` after queuing an unawaited background promise that subsequently crashes without rollback. In our codebase audit (`docs/defects.md`, DEF-04), while parent registration strictly awaited the database write, background email dispatching suffered from this: the UI reported `"Registration successful. Please verify your email"`, while dev server logs captured detached SMTP connection failures (`"Connection closed unexpectedly"`), leaving the user waiting for an email never sent.

### The One Check That Catches It in 30 Seconds:
**Query the database directly using an independent CLI query immediately after form submission:**

```bash
npx prisma db execute --stdin <<< "SELECT id, email, created_at FROM parents WHERE email = 'test-guardian@schoolpass.test';"
```

If the query returns zero rows, the database write was an illusion, instantly exposing the false-success defect.

---

## Question 15: Wrong-answer analysis. A candidate says: "I always check my app is working by signing up a test user and confirming I get taken to the dashboard. If the dashboard loads, the backend is working." Say what is wrong with this, what it would miss, and what you would do instead.

### What Is Wrong:
The candidate confuses client-side routing with backend data persistence. Landing on a dashboard proves only that the browser received an HTTP redirect or updated local state; it does not prove the backend functioned correctly or that data was committed to disk.

### What It Would Miss:
1. **Mocked / In-Memory Stubs:** The API might be returning hardcoded stub responses or writing to in-memory arrays that vanish upon server restart.
2. **Transaction Rollbacks & Partial Writes:** The user row might exist, but related records (such as student linking requests or verification tokens) may have failed silently.
3. **Detached Background Task Failures:** As identified in SchoolPass (`docs/false-success.md`), background welcome emails can fail silently while the user views a success screen.
4. **Prisma Cold Starts & Timeouts:** Transient network timeouts or duplicate constraint failures on subsequent attempts are completely missed.

### What to Do Instead:
1. **Verify Database Persistence Directly:** Query PostgreSQL (`SELECT * FROM parents...`) to confirm the row exists with proper bcrypt/Argon2id password hashes and timestamps.
2. **Inspect Server Logs & Status Codes:** Verify server telemetry captures an explicit `HTTP 201 Created` and zero unhandled rejections.
3. **Execute Negative Failure Tests:** Intentionally disconnect the database and verify the client halts with an error banner rather than optimistically navigating.
