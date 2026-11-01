# Git Rollback Architecture: Non-Destructive Reversion vs Destructive Reset

## Executive Summary
This document provides a technical and operational analysis of version control rollback strategies in software engineering. It compares non-destructive reversion (`git revert`) against destructive history rewriting (`git reset --hard`), walks through the empirical demonstration executed in the Task 3 sandbox, and outlines the safety protocols governing enterprise production environments.

---

## 1. Comparative Analysis: `git revert` vs `git reset --hard`

| Attribute | `git revert <commit-id>` | `git reset --hard <commit-id>` |
|---|---|---|
| **Mechanism** | Appends a **new forward commit** containing the exact inverse diff of the target commit. | Moves the branch `HEAD` pointer backwards, **deleting intermediate commits** from the branch history. |
| **History Integrity** | **Non-destructive & immutable**. Full history preserved. | **Destructive**. Intervening commits are severed from the branch reflog. |
| **Shared Branches** | **100% Safe**. Collaborators pull standard fast-forward updates. | **Dangerous**. Desynchronizes remote tracking; requires `git push --force`. |
| **Audit Compliance** | Satisfies SOC 2, ISO 27001, and regulatory compliance auditability. | Fails audit standards by obfuscating historical changes and incidents. |
| **Recovery Path** | Trivially undone by reverting the revert commit. | Complex recovery requiring manual inspection of local `git reflog`. |

---

## 2. Why `git reset --hard` is Prohibited in Production

In a collaborative engineering organization and production release pipeline:
1. **The Remote Divergence Trap**: If commit `C` has already been pushed to `origin/main` or deployed via CI/CD, running `git reset --hard HEAD~1` locally leaves local `main` behind `origin/main`. The developer is forced to execute `git push --force`, which overwrites the remote repository, destroying commits made by other team members.
2. **Loss of Incident Forensics**: During a production outage, engineering teams must know the exact timeline of deployment and rollback. A `git revert` commit clearly communicates:
   - What broke.
   - When the fix was deployed.
   - The exact pull request or commit that restored system health.
   `git reset` erases this timeline.
3. **Assessment Constraint Compliance**: In strict accordance with user directives, no `git reset` or `git revert` operations were executed against `C:\Users\gbola\Desktop\SchoolPass`. The rollback demonstration was conducted inside an isolated temporary sandbox.

---

## 3. Walkthrough of Sandbox Demonstration

The rollback demonstration was executed inside `task-03-client-validation/rollback-demo` and recorded in `evidence/17-commit-list-and-rollback.txt`.

### Step 1: Sequential Commit Creation
Three structured commits were created to model feature progression:
```
* 4f88e40 (HEAD -> main) security(leak): eliminate sensitive admission format from placeholder
* 31a4731 feat(validation): accessible aria-disabled button and live announcements
* 80165a2 feat(auth): initial authentication baseline
```

### Step 2: Identification of Target Commit
The team identified commit `4f88e40` for emergency rollback to verify non-destructive operation.

### Step 3: Non-Destructive Reversion
Executing `git revert 4f88e40 --no-edit`:
```
[main 7e8913b] Revert "security(leak): eliminate sensitive admission format from placeholder"
 1 file changed, 1 insertion(+), 1 deletion(-)
```

### Step 4: Post-Revert History Verification
Running `git log --oneline --graph` revealed an unbroken, auditable commit chain:
```
* 7e8913b (HEAD -> main) Revert "security(leak): eliminate sensitive admission format from placeholder"
* 4f88e40 security(leak): eliminate sensitive admission format from placeholder
* 31a4731 feat(validation): accessible aria-disabled button and live announcements
* 80165a2 feat(auth): initial authentication baseline
```

The working tree was safely restored to the state of commit `31a4731` without modifying Git pointers or risking team collaboration.

---

## 4. Verification Evidence Reference
- `evidence/17-commit-list-and-rollback.txt`: Complete verbatim terminal session showing sandbox initialization, commit creation, `git log` inspection, `git revert` execution, and post-reversion verification.
