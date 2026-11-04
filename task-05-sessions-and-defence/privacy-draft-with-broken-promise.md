# SchoolPass Privacy Policy (DRAFT - CONTAINING UNKEPT PROMISE)

**Version:** 0.9-DRAFT (Pre-Audit)  
**System:** SchoolPass — Student Arrival, Identity, and Parent Portal

---

### [NOTICE OF ASSESSMENT EXERCISE]
*This draft document represents the internal pre-release privacy policy before legal and technical audit. It contains one specific operational promise that the SchoolPass engineering system cannot actually honor (highlighted below in Section 4).*

---

## 1. What Information SchoolPass Collects
When you use SchoolPass as a parent or guardian, we collect:
- Your name, email address, and encrypted password.
- Your relationship to enrolled students and your student link approvals.
- Daily student gate arrival confirmations and single-use pickup verification codes.
- Tuition payment records, transaction reference numbers, and timestamps.

## 2. How Your Data is Used
We use this information exclusively to:
- Authenticate your access to your child's academic and attendance records.
- Notify you in real time via email/SMS when your child passes through the school gate.
- Reconcile tuition fee payments with the school bursar's office.

## 3. Account Deletion and the 7-Day Grace Period
You may request the deletion of your account at any time through the Parent Portal under Settings > Account Security.
- **Immediate Lockout:** Once requested, your account is immediately locked and all active sessions are signed out.
- **7-Day Grace Period:** Your account remains in an inactive state for seven (7) days. If you made the request by mistake or change your mind, you can cancel the request by logging in before the 7 days expire.
- **Automated Purge:** After 7 days, an automated background job removes your login credentials, active sessions, and personal contact details.

## 4. How to Request Deletion (THE UNKEPT PROMISE)

> ### [UNFULFILLABLE PROMISE IN DRAFT - SECTION 4.2]
> *"Alternatively, parents who prefer not to use the digital portal may verbally request account deletion at the school front desk or with the gate security officer during morning drop-off. The front-desk receptionist or security staff will log the request, and our engineering team will manually wipe your account from the database within twenty-four (24) hours."*
>
> **Why this promise was broken and had to be removed:**
> 1. Neither gate security staff nor front-desk receptionists possess administrative privileges or technical interfaces in SchoolPass to trigger account deletions or cryptographic session wipes.
> 2. Manual database deletion by engineers upon verbal request is explicitly illegal under NDPA 2023 regulations and violates data controller verification procedures.
> 3. Verbal requests leave zero auditable proof of consent, exposing the school to liability if a disgruntled spouse or third party verbally requests the deletion of a legitimate guardian's account.

## 5. What Data is Retained
Even after account deletion, Nigerian law requires us to retain:
- Tuition and fee transaction records for six (6) years under the Companies and Allied Matters Act (CAMA 2020 §375).
- Historical student attendance and gate arrival records for seven (7) years under child safeguarding and ministry regulations.
All retained financial and arrival records are permanently anonymised so that your personal contact details are completely detached.
