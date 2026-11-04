# SchoolPass Privacy Policy

**Effective Date:** 2nd November 2026  
**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Jurisdiction:** Federal Republic of Nigeria (Governed by the Nigeria Data Protection Act 2023)  
**Assessment Component:** Task 5, Step 8 & Deliverable `privacy.md`

---

## 1. Introduction in Plain Language

SchoolPass exists to give parents real-time visibility into their children's school arrival, academic attendance, and tuition billing. Because we handle information about minors and school finances, we hold ourselves to rigorous privacy and security standards. 

This policy explains in plain language what data we collect, how long we keep it, how our lawful account deletion process works, and which records we are legally required to retain.

---

## 2. Information We Collect and Hold

When you register and use SchoolPass as a parent or guardian, we hold:
- **Your Personal Profile:** Your full name, verified email address, and encrypted password hash (scrambled with Argon2id so no one, including our engineers, can read your actual password).
- **Your Guardian Links:** Which enrolled students you are authorized to view and collect from school, approved by the school administration.
- **Arrival & Gate Activity:** Daily gate clearance records, pickup authorizations, and single-use 6-digit pickup codes.
- **Financial Transactions:** Transaction amounts, timestamps, and Flutterwave payment reference numbers for tuition and school fees.

---

## 3. How to Request Account Deletion

You have the lawful right to request the deletion of your SchoolPass account at any time.

To request deletion:
1. Log in to the SchoolPass Parent Portal.
2. Navigate to **Settings > Account Security > Request Account Deletion**.
3. Confirm your request by entering your current password.

### The 7-Day Grace Period
We do not immediately destroy your account the second you click delete. We enforce a **seven (7) day grace period**:
- **Immediate Lockout:** The instant you request deletion, your account is locked and all active sessions across your phones and computers are logged out immediately. No one can log in or access your child's data.
- **Accidental Request Protection:** If you made the request by mistake or change your mind, you can cancel the deletion by logging into the portal within seven days and clicking "Cancel Deletion Request".
- **Automated Purge:** If seven days pass without cancellation, our automated background system permanently purges your account.

---

## 4. What Gets Purged vs. What Gets Retained

When your account is purged after the 7-day grace period:

### What We Permanently Purge:
- All active and historical session records.
- All single-use arrival QR codes and pickup tokens.
- All pending student linking requests.
- All historical AI assistant inquiry logs and wrong-answer reports.
- Your personal login credentials (email and password hashes).

### What We Are Legally Required to Retain:
1. **Financial Ledgers (Retained for 6 Years):**
   Under Section 375 of the Companies and Allied Matters Act (CAMA 2020), every registered corporate entity in Nigeria must preserve accounting records for at least six years. We retain payment amounts, payment dates, and bank transaction reference numbers down to the kobo.
2. **Student Safeguarding Records (Retained for 7 Years):**
   Historical student gate arrival timestamps are retained to satisfy statutory school safeguarding obligations and state ministry regulations.

### How We Protect You on Retained Records (Anonymisation)
To comply with the Nigeria Data Protection Act while meeting our statutory financial obligations, we **anonymise your identity**. Your name is replaced with a random cryptographic code (e.g. `Anonymised Parent 7f8a9b`) and your email address is overwritten (`deleted-cm419x@schoolpass.internal`). 

The financial transaction remains intact for the school's auditors, but it can never be traced back to your personal identity.

---

## 5. The Promise We Had to Remove (Exercise in Engineering Honesty)

In our initial draft ([`privacy-draft-with-broken-promise.md`](file:///c:/Users/gbola/Desktop/SchoolPass-Assessment/task-05-sessions-and-defence/privacy-draft-with-broken-promise.md)), Section 4.2 stated:
> *"Alternatively, parents who prefer not to use the digital portal may verbally request account deletion at the school front desk or with the gate security officer during morning drop-off. The receptionist or security staff will log the request, and our engineering team will manually wipe your account from the database within twenty-four hours."*

### Why We Removed It
We removed this promise because our system **cannot actually keep it**:
1. Gate security staff and front-desk receptionists have no user-interface controls or administrative permissions in SchoolPass to initiate account deletions or revoke session keys.
2. An engineer manually executing a raw SQL `DELETE` query upon a verbal request is illegal under NDPA 2023 verification standards and destroys related payment records due to relational constraints.
3. Verbal requests leave zero auditable proof of consent, leaving the school vulnerable to malicious deletion requests by third parties.

### How Such Promises Get Written in the First Place
Promises like this get written when well-meaning product teams draft policies based on customer service empathy rather than technical architecture. Someone writes what sounds reassuring to a non-technical parent without checking whether the database schema, administrative roles, and legal constraints can actually execute what was promised.
