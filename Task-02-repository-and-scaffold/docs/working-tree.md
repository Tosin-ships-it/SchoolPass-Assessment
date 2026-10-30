# Task 2: Working Tree, Branching Architecture & Deployment Lifecycle

**Document Path:** `Task-02-repository-and-scaffold/docs/working-tree.md`  
**Assessment Reference:** Task 2, Step 8 (*"The working tree, drawn by hand"*) & Step 9 (*"Branch properly, and prove it"*)  
**Companion Artifacts:** Hand-drawn pipeline diagram (`evidence/14-working-tree-drawing.jpg`) & Git commit log graph (`evidence/15-git-log-graph.txt`)  
**Target Applications:** `SchoolPass` (Core Application) & `SchoolPass-Assessment` (Evaluation Artifacts)  
**Date:** October 30, 2026  

---

## 1. Executive Summary & The Working Tree Concept

In modern software engineering, the phrase **"working tree"** describes both a physical entity and a progression pipeline:

1. **Locally**, it is the concrete hierarchy of files and directories on a developer's workstation where raw source code is written, edited, and compiled.
2. **Architecturally**, it represents the continuous, multi-stage delivery pipeline through which code transitions: from the local working directory $\rightarrow$ to the local Git object store $\rightarrow$ to the centralized GitHub remote repository $\rightarrow$ and finally into the live production runtime environment.

A Git **branch** is the lightweight, movable pointer that binds these stages together. Without structured branching discipline, the entire delivery pipeline collapses into a fragile, single-channel conduit where untested experimental edits, work-in-progress drafts, and catastrophic defects flow directly into the hands of real users.

This document analyzes the four core structural stages of the SchoolPass delivery pipeline, details the distinct operational roles of `main` and isolated feature branches, demonstrates what breaks when a project relies on a single branch, and examines why branching discipline transforms from a matter of convenience into a critical operational necessity once an application is deployed to production.

---

## 2. The Four Stages of Code Progression

The SchoolPass codebase moves through four distinct physical environments, each governed by different durability guarantees, visibility boundaries, and rollback costs:

```
[ Local Workstation ]                 [ Remote Cloud ]               [ Production Runtime ]
┌─────────────────────────┐           ┌────────────────────────┐     ┌────────────────────────┐
│ 1. Local Working Dir    │           │ 3. GitHub Remote Repo  │     │ 4. Production Host     │
│    (C:\...\SchoolPass)  │           │    (Origin / PRs)      │     │    (Vercel Edge / Neon)│
│    - Uncommitted edits  │           │    - Shared mainline   │     │    - Real Parents      │
│    - Volatile filesystem│           │    - CI/CD build hooks │     │    - Real School Fees  │
└───────────┬─────────────┘           └───────────▲────────────┘     └───────────▲────────────┘
            │ git add                             │ git push                     │ Auto-Deploy
            ▼                                     │ (via branch)                 │ on Merge
┌─────────────────────────┐                       │                              │
│ 2. Local Git Repository ├───────────────────────┘                              │
│    (.git/ Object Store) │                                                      │
│    - Staged Index       │                                                      │
│    - Immutable Commits  │──────────────────────────────────────────────────────┘
└─────────────────────────┘                   (Direct push to main bypasses review)
```

### Stage 1: The Local Working Directory

- **Physical Reality:** The local working directory is the active filesystem tree residing on the developer's storage drive (e.g., `C:\Users\gbola\Desktop\SchoolPass`). It contains raw source code files (`.ts`, `.tsx`, `.css`), configuration manifests (`package.json`, `tsconfig.json`), the untracked `.env.local` secret file, local build caches (`.next/`), and dependency trees (`node_modules/`).
- **Git State:** Files in the working directory exist in one of three states relative to Git:
  - *Untracked:* New files created on disk that Git has never recorded.
  - *Modified:* Tracked files containing local edits that have not been staged.
  - *Ignored:* Files explicitly excluded from Git tracking via `.gitignore` (such as local environment secrets, compiled outputs, and scratch directories).
- **Execution Context:** The local development server (`npm run dev` on port 3000) executes directly against this directory. As demonstrated in `evidence/04-first-load.txt`, Next.js reads these local files directly from disk, compiling routes on-demand during HTTP requests.
- **Durability & Risk:** Changes here are completely volatile. Until a file is staged (`git add`) or committed (`git commit`), Git provides zero tracking or backup. If a developer accidentally deletes a file or introduces a syntax error, Git's object store cannot assist in recovery. Conversely, mistakes made here have a **zero-cost blast radius**: they affect only the local developer's machine and can be instantly discarded using `git restore <file>` or `git clean -fd`.

### Stage 2: The Local Git Repository (The Local Store)

- **Physical Reality:** The hidden `.git` directory located at the root of the project. This is Git's internal object-relational warehouse on the local machine.
- **Internal Mechanics:**
  - *The Index (Staging Area):* A binary cache (`.git/index`) that prepares the exact snapshot intended for the next commit. When a developer executes `git add src/app/auth/register/ParentRegisterForm.tsx`, Git creates a blob object in `.git/objects/` and stages the file path in the index.
  - *The Object Store:* An append-only, content-addressable storage database containing cryptographic SHA-1/SHA-256 hashes representing *blobs* (file contents), *trees* (directory structures), *commits* (snapshots with metadata, author identity, and parent pointers), and *annotated tags*.
  - *Local References (`refs/heads/*`):* Pointers representing local branches that advance automatically when new commits are created.
- **Durability & Isolation:** Commits recorded in the local repository (such as the initial scaffold commit `cebb045`, verified in `evidence/02-files-created.txt`) are permanent, immutable snapshots. However, they remain **100% isolated to the local computer**. No network packets leave the machine, no team members are affected, and no CI/CD pipelines are triggered.
- **Recovery Options:** If a developer makes a faulty commit locally, it can still be modified, squashed, or undone quietly using `git commit --amend`, `git reset --soft HEAD~1`, or `git reset --hard HEAD~1` without leaving any trace on upstream servers.

### Stage 3: The GitHub Remote Repository

- **Physical Reality:** The centralized, cloud-hosted Git repository hosted on GitHub infrastructure (`https://github.com/Tosin-ships-it/SchoolPass.git` or `SchoolPass-Assessment.git`).
- **Internal Mechanics:**
  - Houses the canonical remote-tracking branches (`refs/remotes/origin/*`).
  - Acts as the central synchronization hub and single source of truth for distributed team members.
  - Hosts the code review interface (Pull Requests), branch protection policies, issue trackers, and webhook dispatch engines.
- **The Transition Barrier (`git push`):** Code only reaches GitHub through an explicit, authenticated network operation: `git push origin <branch>`. Once pushed, commits cease to be private. They become visible to all project collaborators, security scanners, and automated webhook consumers.
- **The Collaboration Impact:** Rewriting history (via `git rebase` or `git push --force`) becomes dangerous once commits reside on GitHub. If another developer or automated agent has pulled those commits, force-pushing divergent history scrambles their local tracking trees and risks destroying concurrent work.

### Stage 4: The Production Environment

- **Physical Reality:** The live, publicly accessible infrastructure that delivers SchoolPass to real-world users. For SchoolPass, the planned production stack comprises:
  - *Application Compute & Hosting:* Vercel Serverless and Edge functions executing compiled Next.js production builds (`next build`).
  - *Persistent Relational Database:* Neon Serverless PostgreSQL with `pgvector` extension for attendance records, parent-student relationships, and circular embeddings.
  - *External Payment Infrastructure:* Flutterwave live API gateways for processing Nigerian Naira (`NGN`) school fee collections.
  - *Transactional Email Delivery:* Resend API servers dispatching parent verification emails and password reset links.
- **The Deployment Trigger:** In modern continuous integration / continuous deployment (CI/CD) pipelines, production hosting environments are directly bound to the GitHub remote repository. Whenever commits are pushed or merged into the production branch (`main`), GitHub sends an automated webhook payload to Vercel, which immediately triggers an automated production build, asset optimization, and edge edge deployment.
- **Durability & Blast Radius:** This is the terminal destination. Code executing here directly affects live users: parents attempting to pay school fees, gate officers scanning student morning arrivals, and school administrators reviewing attendance logs. Bugs deployed to this environment result in immediate business disruption, financial reconciliation errors, and data compliance liabilities.

---

## 3. Branching Architecture: The Roles of `main` and Feature Branches

A healthy software repository relies on clear separation between stable mainline code and work-in-progress feature development.

```
                  (Feature Branch: feat/student-intake)
                  ┌───────[Commit A]───────[Commit B]───────┐ (Pull Request Review)
                 /                                           \
[main] ──●──────●─────────────────────────────────────────────●───────●───────► (Continuous
       Scaffold                                             Merge   Release      Deployment)
                 \                                           /
                  └───────[Commit C]───────[Commit D]───────┘
                  (Feature Branch: feat/fee-payment)
```

### The Role of the `main` Branch

1. **The Production Benchmark:** The `main` branch (historically named `master` in older Git configurations) represents the single source of production-ready truth. Every commit on `main` must be releasable, compile cleanly (`npm run build`), pass typecheck validation (`npm run typecheck`), and conform to all architectural rules.
2. **Protected Trunk:** Under professional engineering standards, `main` is never an active workspace. Developers do not write code directly on `main`, do not stage temporary fixes on `main`, and do not commit directly to `main`.
3. **Automated Release Conduit:** In automated deployment architectures, `main` is bound to the production domain (`schoolpass.ng`). A merge to `main` is an intentional statement: *"This code has been planned, reviewed, tested, and is ready for live users."*

### The Role of Feature Branches

1. **Isolated Context Containment:** Feature branches (e.g., `feat/student-intake`, `feat/arrival-qr-engine`, `fix/neon-connection-timeout`) create an isolated sandbox for a single unit of work. Changes made on a feature branch do not alter `main`, do not interfere with parallel feature work being conducted by other engineers or agents, and do not trigger production deployments.
2. **Review & Audit Boundary (Pull Requests):** When work on a feature branch is complete, pushing the branch to GitHub enables the opening of a Pull Request (PR) against `main`. The PR acts as a mandatory checkpoint where:
   - Automated CI runs linters, test harnesses, and typechecks.
   - Ephemeral preview deployments (e.g., `schoolpass-git-feat-arrival-preview.vercel.app`) can be spun up to test user interfaces on mobile viewports without touching production databases.
   - Human reviewers and technical leads inspect diffs, verify token usage, and audit security boundaries (such as verifying no child data is exposed to AI endpoints per NDPA rules).
3. **Clean Discardability (The Deliberate Regression Argument):** Not every branch deserves to be merged. A vital property of feature branching is the ability to conduct exploratory experiments or test deliberate regressions, and discard them cleanly without leaving a trace in the mainline history.
   - *Verified Precedent in SchoolPass:* This principle was directly proven during Task 1 Step 8 of this assessment (documented in `Task-01-design-system/Evidence/12-git-log-branch-unmerged.txt`). A branch named `test/broken-token-referencing` was created to deliberately break token variables and evaluate contrast failure. Once the regression was verified and captured, the branch was forcefully deleted using `git branch -D test/broken-token-referencing`. Git reflog checks verified that commit `df84c12` was permanently dropped without ever polluting `master` or `main`.

---

## 4. What Breaks When a Project Uses Only One Branch

When a development team or AI agent works directly on `main` without feature branches, the safety boundaries of the delivery pipeline are eliminated. Committing exclusively to a single branch introduces five catastrophic failure modes:

### 1. The Blocked Hotfix & Poisoned Mainline

Consider a realistic SchoolPass scenario:
- An engineer is working directly on `main`, halfway through refactoring the database schema to introduce the `AttendanceRecord` table. The Prisma schema is partially rewritten, TypeScript errors exist across three files, and `npm run build` is failing.
- Suddenly, an urgent production defect is discovered: a typo in the Flutterwave webhook secret key handler is causing legitimate school fee payments to fail verification.
- **The Breakdown:** Because the engineer committed their half-finished attendance work directly to `main`, the entire mainline is broken. They cannot quickly push a one-line fix for the webhook without also pushing their broken attendance code, which would crash the production build. The team is forced into emergency manual surgery: stashing changes, reverting commits, or cherry-picking across unstaged files under extreme stress.

### 2. Accidental Premature Deployments

In a single-branch workflow with automated CI/CD enabled:
- Every execution of `git push origin main` triggers an immediate production build on Vercel.
- An engineer or AI agent making incremental "save-point" commits (e.g., *"wip: partial form styling"*, *"fix: try another port"*) triggers continuous live deployments.
- Half-finished interfaces, raw API endpoints lacking authorization checks, or broken database queries are immediately pushed live to Nigerian parents and school staff.

### 3. Destruction of the Code Review & Quality Gateway

Without feature branches, Pull Requests cannot exist. Code goes directly from the local keyboard into the shared trunk:
- Architectural mistakes (such as the hardcoded CSS custom properties documented in `docs/defects.md` where `var(--color-roles-outline)` was referenced without a fallback, breaking input borders in `StudentsManager.tsx`) bypass peer review.
- Automated CI status checks cannot act as gating guards; they can only report that `main` is already broken after the damage is committed.

### 4. Toxic Merge Collisions on Distributed Teams

When multiple developers or AI coding agents push commits directly to `main`:
- Git cannot perform clean, fast-forward branch merges.
- Developers constantly encounter push rejections (`fetch first`, `non-fast-forward`).
- Rebasing or merging remote changes directly into active local working directories leads to complicated merge conflict markers (`<<<<<<< HEAD ... >>>>>>>`) inside active files. Resolving conflicts under pressure frequently results in developers accidentally deleting colleagues' code, overwriting critical fixes, or introducing regression bugs.

### 5. Inability to Discard Failed Experiments

In software development, many architectural spikes and exploratory implementations fail.
- On a feature branch, discarding an approach requires running `git checkout main && git branch -D feat/failed-idea`. Main remains pristine.
- On a single-branch project, discarding work that has already been committed to `main` requires creating messy reverse-patch commits (`git revert`) or dangerous destructive history rewrites (`git reset --hard && git push --force`), permanently cluttering the Git log with misleading noise and confusing future auditors.

---

## 5. Why Branching Discipline Matters Exponentially More After Deployment

Branching discipline is beneficial during the initial development scaffold, but it becomes **mandatory and non-negotiable the instant code is deployed to a live production environment**:

| Parameter | Pre-Deployment (Scaffold Phase) | Post-Deployment (Live Production) |
| :--- | :--- | :--- |
| **Active Users** | Zero. Only the developer/agent testing locally. | Real parents, school administrators, and gate staff. |
| **Financial Exposure** | Zero. Mock or sandbox keys only. | Real Nigerian Naira (`NGN`) moving through Flutterwave gateways. |
| **Database State** | Ephemeral, resettable development database. | Stateful, permanent production database with legal retention mandates. |
| **Blast Radius of a Bug** | Local terminal error or port collision (`evidence/07`). | Public outage, service downtime, and parent panic. |
| **Deployment Trigger** | Manual local commands (`npm run dev`). | Automated CI/CD webhooks triggered by git pushes. |
| **Data Protection Liabilities** | Minimal; dummy seed records. | Strict NDPA 2023 statutory penalties for child data leaks. |

### The Critical Post-Deployment Differences

1. **The Automation Tripline:** Before deployment, pushing code to GitHub is merely an offsite backup. After deployment, `main` is wired directly to Vercel production hosting. A `git push origin main` command is no longer just a code storage operation; it is an active release event that updates live infrastructure within 90 seconds.
2. **Stateful Persistence Cannot Be "Git Reverted":**
   - If bad application code is deployed, running `git revert` rolls back the JavaScript bundle.
   - However, if that bad code executed destructive database operations—such as corrupting an attendance table, writing orphaned parent accounts, or executing a failed Prisma migration that locked PostgreSQL tables—reverting the Git commit does **not** revert the database state.
   - As documented in `docs/false-success.md`, SchoolPass interacts with a live PostgreSQL database on Neon. Post-deployment, database schema modifications must be tested on isolated database branches before being merged to `main`, because a broken migration in production can cause irreversible data loss.
3. **Real-World Operational Dependency:**
   - SchoolPass is designed around time-sensitive, physical school events: morning student arrival occurs between **6:30 AM and 10:00 AM** (PRD §17).
   - If an unvetted commit deployed directly to `main` introduces a server runtime crash (such as the route handling defect captured in `evidence/09-404-error.txt`), parents arriving at the school gate cannot generate arrival QR codes, staff cannot verify student intake, and school entrance operations grind to a halt.
   - Prior to deployment, a server error is an interesting debug exercise in terminal logs; post-deployment, it is an administrative crisis.

---

## 6. The Visibility Boundary & The Quiet-Undo Horizon

The working tree pipeline features two critical thresholds that every professional engineer must understand: **when code becomes visible to users**, and **the point past which mistakes can no longer be undone quietly**.

```
[ STAGE 1: Working Dir ] ──► [ STAGE 2: Local Repo ] ──► [ STAGE 3: GitHub Remote ] ──► [ STAGE 4: Production ]
                                                                                               │
◄────────── ZERO USER VISIBILITY ─────────────────────────────────────────────────────────────►│ ◄── VISIBLE TO USERS!
                                                                                               │     (Parents, Staff)
                                                                 ▲                             │
                                                                 │                             │
◄────────── SILENT LOCAL UNDO ───────────────────────────────────┤                             │
  - git restore .                                                │                             │
  - git reset --hard HEAD~1                                      │                             │
                                        AUDIT TRAIL BEGINS ──────┴─────────────────────────────► ◄── PUBLIC CRISIS!
                                          - PR review records                                        - Failed payments
                                          - Revert commits required                                  - Database corruption
                                          - History rewrites break team                              - Status page notices
```

### When Code Becomes Visible to Users

1. **In the Local Working Directory:** Visible **only** to the developer sitting at the workstation.
2. **In the Local Git Repository:** Visible **only** to the local machine.
3. **On the GitHub Remote (Feature Branch):**
   - Visible to project collaborators and code reviewers on GitHub.
   - If Preview Deployments are enabled, visible to internal testers via unique, unindexed preview URLs (e.g., `https://schoolpass-pr-12.vercel.app`).
   - **Crucially: 0% visible to real school parents or public users.**
4. **On GitHub `main` $\rightarrow$ Production Deployment:**
   - **The Visibility Threshold:** The instant a Pull Request merges into `main` and Vercel completes the production deployment build, the code becomes 100% visible to the world.
   - Every parent navigating to `https://schoolpass.ng`, every staff member checking attendance on mobile phones, and every search engine crawler immediately interacts with the new code.

### When Mistakes Can No Longer Be Undone Quietly

The ability to recover from an error quietly—without leaving a public audit trail, disrupting collaborators, or alarming users—erodes rapidly as code progresses through the pipeline:

#### 1. In the Local Working Directory: The Zero-Consequence Zone
- *How to undo:* Run `git restore <file>` or `git clean -fd`.
- *Quietness:* Absolute. The error was never committed to Git, never left RAM/disk cache, and no human or machine will ever know it happened.

#### 2. In the Local Repository: The Private History Zone
- *How to undo:* Run `git commit --amend` (to fix a message or include a missed file) or `git reset --soft HEAD~1` (to uncommit while retaining code edits).
- *Quietness:* Complete. Because the commit was never pushed, modifying or deleting the local commit hash leaves zero trace outside the local machine's private reflog.

#### 3. On GitHub Remote (Feature Branch): The Low-Impact Review Zone
- *How to undo:*
  - If caught before review: push an amended commit using `git push --force-with-lease origin feat/branch-name`.
  - If the branch is fundamentally flawed: simply close the Pull Request and delete the remote branch (`git push origin --delete feat/branch-name`).
- *Quietness:* Relatively quiet. While GitHub activity logs record that a branch or PR was closed, zero production users were affected, and `main` was never touched.

#### 4. Merged into `main` (Pushed to GitHub Remote): The Permanent Record Horizon
- *The Shift:* Once code is pushed to `main`, **silent history rewrites are strictly prohibited**. Force-pushing to `main` breaks the repository clones of every team member and corrupts automated build systems.
- *How to undo:* You must create a new, forward-facing revert commit: `git revert <commit-hash>` and push it.
- *Quietness:* Impossible to hide. The mistake and its explicit reversal are permanently etched into the immutable Git commit history for all present and future auditors to inspect.

#### 5. Deployed to Live Production: The Irreversible Horizon
- **The Point of No Return:** Once faulty code is deployed to live production, **a quiet fix is completely impossible**:
  - *User Experience Impact:* Parents attempting to register may have already encountered HTTP 500 errors (such as the database connectivity failure captured in `evidence/13-write-failed-logs.txt`). They have seen the failure on their screens.
  - *Data & State Side Effects:* If an authentication or registration bug allowed invalid records to enter the PostgreSQL database, rolling back the application code does not remove the bad data. Engineers must write custom SQL migration scripts to clean up live rows in the database.
  - *External Gateway Side Effects:* If a payment webhook processed fees incorrectly, Flutterwave transactions have already settled with banks. Undoing the mistake requires manual financial reconciliation, contacting affected parents, and issuing bank refunds.
  - *Institutional Trust:* For a school portal managing child security and tuition funds, production failures cannot be swept under the rug; they require incident reports, administrative explanations to the school principal, and transparent communication.

---

## 7. SchoolPass Workflow Audit: Verified Facts vs. Unverified Claims

To maintain total assessment integrity, this section clearly distinguishes between verified architectural facts confirmed in repository records and operational workflows planned for subsequent deployment phases:

| Architectural Component | Verified Reality in Repository Records | Status |
| :--- | :--- | :---: |
| **Local Working Directory** | Active filesystem verified on Windows workstation; Next.js dev server operated on port 3000 (`evidence/03-server-start.txt`). | **Verified** |
| **Local Git Store & Commits** | Initial scaffold commit `cebb045` verified (`evidence/02-files-created.txt`); commit history and reflog documented. | **Verified** |
| **Remote Repository** | GitHub remote confirmed at `https://github.com/Tosin-ships-it/SchoolPass-Assessment.git` on branch `main`. | **Verified** |
| **Isolated Test Ports** | Controlled failure environments verified on ports 3050 (`evidence/07`), 3060 (`evidence/09`), and 3070 (`evidence/13`). | **Verified** |
| **Deliberate Branch Deletion** | Unmerged regression branch `test/broken-token-referencing` deleted unmerged (`Task-01-design-system/Evidence/12`). | **Verified** |
| **Live Vercel Production Deploy** | Application is fully configured for Vercel deployment (`next.config.js`), but **no live public deployment has occurred**; current assessment state is verified as a local development scaffold. | **Planned / Unverified** |
| **Automated PR Merge Pipeline** | PR workflows, branch protection rules, and Vercel GitHub webhooks are architected per specification, but active production CI webhooks have not been triggered in this scaffold phase. | **Planned / Architecture** |

---

## 8. Summary & Engineering Principles

1. **The working tree is a progression pipeline**, not merely a local folder. Code moves from volatile local disk $\rightarrow$ to immutable local Git storage $\rightarrow$ to collaborative GitHub remotes $\rightarrow$ to live production compute.
2. **Branches are isolation chambers.** Feature branches protect `main` from half-finished features, broken compilations, and toxic merge collisions.
3. **Single-branch workflows fail under stress.** Committing directly to `main` turns every draft edit into a potential production outage and blocks emergency hotfixes.
4. **Deployment permanently raises the stakes.** Pre-deployment errors are private inconveniences; post-deployment errors impact live parents, real school fees, and persistent database state.
5. **The quiet-undo horizon closes at GitHub `main`.** Mistakes in the working directory can be wiped out silently; mistakes deployed to production require public incident remediation, manual database cleanups, and forward revert commits.
