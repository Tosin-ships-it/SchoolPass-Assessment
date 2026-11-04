# Data Retention Matrix & Legal Compliance Architecture

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5, Step 7 & Deliverable `docs/retention-matrix.md`  
**Governing Legislation:**  
- **Nigeria Data Protection Act (NDPA 2023):** Section 34 (Right to Erasure / Right to be Forgotten), Section 24 (Data Minimization)  
- **Companies and Allied Matters Act (CAMA 2020):** Section 375(2) (Mandatory 6-Year Retention of Books of Account)  
- **Federal Inland Revenue Service (Establishment) Act:** Section 28 (Financial Record Keeping)  
- **SchoolPass Product Requirements Document (PRD v6.0 §14 & PRD Addendum v6.1 §5):** 7-Year Student & Attendance Ledger Retention

---

## 1. Table-by-Table Data Retention Matrix

| Model / Table | Data Category | Purged vs. Retained | Retention Duration | Statutory / Legal / Business Basis | Rationale & Handling |
|---|---|---|---|---|---|
| **`parents`** (Identity) | Guardian PII (Name, Email, Password Hash) | **Anonymised upon Purge** | Retained during active enrollment; Anonymised 7 days post-deletion request | NDPA 2023 §34(1)(a) / NDPA §38 | Full record cannot be dropped because foreign keys anchor historical tuition payments. PII is permanently overwritten with pseudonymous hashes. |
| **`sessions`** | Auth & Session Tokens | **Purged** | 7 Days (or immediate on logout/reset) | NDPA 2023 §24(1)(e) (Storage Limitation) | Transient authentication data. Purged immediately upon logout, password reset, or expiration to prevent session hijacking. |
| **`verification_tokens`** | Email Verification Hashes | **Purged** | 24 Hours | NDPA 2023 §24(1)(e) | Single-use cryptographic token. Deleted immediately upon successful verification or natural expiration. |
| **`password_reset_tokens`** | Password Reset Hashes | **Purged** | 15 Minutes | OWASP ASVS / NIST SP 800-63B | High-risk single-use token. Deleted immediately upon consumption or expiration to prevent token reuse. |
| **`rate_limits`** | IP & Account Attempt Counters | **Purged** | 15 Minutes (Sliding Window) | Operational Security (DDoS / Brute Force) | Ephemeral rate-limiting telemetry. Automatically discarded after window expiry. |
| **`students`** | Minor Academic & Identity Records | **Retained** | 7 Years post-graduation or withdrawal | PRD v6.0 §14; National Policy on Education | Required for academic transcript verification, secondary school transfers, and ministry accreditation. |
| **`parent_students`** | Guardian-Student Linkages | **Purged upon Deletion** | Duration of active relationship | NDPA 2023 §34 | Links authorizing pickup and portal access are severed immediately upon account deletion. |
| **`attendance_records`** | Daily Classroom Attendance | **Retained** | 7 Years | PRD v6.0 §14; Ministry of Education Regulations | Statutory academic compliance proving mandatory instructional hours. |
| **`arrival_confirmations`** | Gate Arrival Logs | **Retained** | 7 Years | Child Safeguarding & Security Audit Policy | Timestamped proof of student pickup and gate departure; critical evidence in missing person investigations. |
| **`arrival_codes`** | Daily Single-Use Pickup QR Codes | **Purged** | 24 Hours | Security Minimization | Codes expire daily at 6:00 PM and are purged automatically to prevent code replay. |
| **`payments`** | Tuition & Fee Invoices | **Retained Permanently** | **6 Years Minimum** (CAMA) / 7 Years (PRD) | **CAMA 2020 §375(2)**; FIRS Act §28 | Statutory financial records. Must be preserved down to the kobo to support corporate audits, dispute defense, and tax reporting. |
| **`refunds`** | Payment Reversals | **Retained Permanently** | **6 Years Minimum** | CAMA 2020 §375(2) | Accounting balancing entries required for tax and banking reconciliation. |
| **`audit_logs`** | Security & Compliance Events | **Retained** | 3 Years | NDPA 2023 §40; ISO/IEC 27001 | Forensic trail of access grants, administrative permissions, and deletion purges. |
| **`ai_usage_daily`** | Gemini AI Token Telemetry | **Purged** | 90 Days | Cost Accounting & Quota Monitoring | Aggregated telemetry discarded after billing cycle reconciliation. |

---

## 2. Resolving the Statutory Conflict: NDPA Erasure vs. CAMA Financial Retention

### The Direct Conflict
The central legal tension in school data management arises when a guardian exercises their **Right to Erasure** under NDPA 2023 §34, demanding:
> *"Delete all my personal data, accounting references, and payment history from your database immediately."*

Simultaneously, **CAMA 2020 §375(2)** strictly mandates:
> *"Every company shall cause accounting records to be kept... and such records shall be preserved for a period of six years from the date on which they were made."*

Failure to maintain accounting records is a criminal offense under Nigerian corporate law, exposing the school's trustees to severe fines and personal liability.

### The Resolution: Which Law Wins and on What Basis?
**CAMA 2020 and Financial Statutes Prevail over Unconditional Erasure.**

**Statutory Basis:**
Under **NDPA 2023 Section 34(2)(b)** and **Section 38**, the right to erasure is explicitly non-absolute. The controller is exempt from deleting personal data where processing is necessary:
1. For compliance with a legal obligation under Nigerian law (CAMA 2020 §375).
2. For the establishment, exercise, or defense of legal claims (e.g. tuition payment disputes, chargeback litigation).

### Technical Implementation: Anonymisation Against Deletion
To respect both statutes simultaneously:
- **SchoolPass NEVER executes a hard SQL `DELETE FROM parents` or `DELETE FROM payments`.**
- Instead, the scheduled purge job performs **Selective Identity Anonymisation**:
  - The `Payment` row remains untouched: `amount: 15000000`, `reference: PAY-2026-TERM1-0082`, `verifiedAt: 2026-09-12`.
  - The `Parent` foreign key remains linked, but the personal profile is wiped:
    ```sql
    UPDATE parents SET
      name = 'Anonymised Parent 7f8a9b',
      email = 'deleted-cm419x@anonymised.schoolpass.internal',
      passwordHash = '*PURGED_NDPA_COMPLIANT*',
      anonymizedAt = NOW()
    WHERE id = 'cm419x...';
    ```
- **Why this satisfies both laws:**
  - **NDPA 2023 Compliance:** Under NDPA definitions, once data is irreversibly anonymized such that the individual is no longer identifiable directly or indirectly, it ceases to be "personal data". The data subject's privacy rights are fully discharged.
  - **CAMA 2020 Compliance:** The financial ledger balances to the exact kobo, audit logs prove transaction legitimacy, and financial books remain intact for external auditors.

---

## 3. Database Backups & Synchronization Architecture

A widespread compliance failure in web applications is purging user records from the primary database while leaving identifiable data in long-term backups. If a backup is restored following a disaster, previously deleted users are unlawfully resurrected.

### Backup Specifications
1. **Primary Database Storage:** PostgreSQL managed instance on Neon (AWS us-east-2).
2. **Backup Storage Location:** Encrypted AWS S3 bucket in Frankfurt (`eu-central-1`), protected with SSE-KMS and strict IAM policies.
3. **Backup Schedule & Retention:**
   - Continuous WAL archiving with 7-day Point-in-Time Recovery (PITR).
   - Daily snapshot snapshots retained for 30 days.
   - Monthly archive snapshots retained for 1 year.

### The Backup Sync Interval & Deletion Tombstone Protocol
Under NDPA guidelines and EDPB standards, backups do not need to be rewritten in real time upon every deletion request (which would invalidate cryptographic snapshot integrity). Instead, SchoolPass enforces the **Restoration Tombstone Sync Protocol**:
1. When the scheduled purge job anonymises an account, it writes an immutable tombstone event to `audit_logs`:
   ```json
   { "event": "ACCOUNT_ANONYMIZATION_TOMBSTONE", "userId": "cm419x...", "purgedAt": "2026-11-02T15:38:19Z" }
   ```
2. **Disaster Recovery Playbook:** If a database backup from 14 days ago must be restored, the automated restoration pipeline executes the **Tombstone Replay Script**:
   - Queries `audit_logs` for all `ACCOUNT_ANONYMIZATION_TOMBSTONE` events occurring after the backup snapshot timestamp.
   - Re-applies anonymisation and session purges against the restored database *before* the application server is re-opened to incoming traffic.
3. **Natural Backup Expiration:** Daily backup snapshots roll off and are permanently destroyed after 30 days via S3 Lifecycle Policies. Identifiable data disappears completely from all backup media within 30 days.
