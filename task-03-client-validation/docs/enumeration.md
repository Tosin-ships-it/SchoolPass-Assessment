# Security Vulnerability Analysis: Identifier Format Leakage & Account Enumeration

## Executive Summary
This document provides a security vulnerability analysis of UI placeholder leaks and account enumeration vectors identified in the SchoolPass authentication surface. It details the threat model, brute-force feasibility calculations, and the remediation implemented to neutralize these vectors.

---

## 1. The Sensitive Format Leak in Input Placeholders

### 1.1 The Vulnerability
In the baseline application scaffold, the Student Number input on the parent registration form was rendered with the following attribute:
```html
<input
  id="studentNumber"
  name="studentNumber"
  placeholder="e.g. SP-2026-0001"
/>
```
While intended by junior frontend developers as helpful sample text, exposing `e.g. SP-2026-0001` to unauthenticated visitors constitutes a **Sensitive Shape Leak (CWE-200: Exposure of Sensitive Information to an Unauthorized Actor)**.

### 1.2 Threat Model & Keyspace Reduction
An attacker seeking to enumerate valid student records or link unauthorized parent accounts needs to guess student admission numbers. 
1. **Unconstrained Keyspace**:
   - If an attacker has no knowledge of identifier format, an admission code could be a UUID (128 bits), an alphanumeric hash (36^8 = 2.8 trillion combinations), or an arbitrary string.
2. **Constrained Keyspace via Placeholder Leak**:
   - The placeholder `SP-2026-0001` reveals:
     - **Prefix**: Exactly two static capital letters (`SP` for SchoolPass).
     - **Delimiter**: Hyphen (`-`).
     - **Session Year**: 4-digit calendar year (`2026`).
     - **Delimiter**: Hyphen (`-`).
     - **Sequence Format**: 4-digit zero-padded sequential integers (`0001` to `9999`).
   - The search space collapses from billions of possibilities to **only 9,999 sequential numbers per academic session**:
     ```
     SP-2026-0001 to SP-2026-9999
     ```
   - An automated script executing at 10 requests per second can completely enumerate an entire school's prospective student roster in under 16 minutes if rate limits are misconfigured.

---

## 2. Remediated Instructional Placeholder

To protect student privacy under the Nigeria Data Protection Act (NDPA) 2023 without harming legitimate parent usability, the placeholder was updated:
```html
<input
  id="studentNumber"
  type="text"
  placeholder="Enter student number from admission letter"
  aria-required="true"
/>
```

### Benefits of Neutral Instructional Text:
1. **Zero Technical Clues**: Leaks no information regarding length, delimiters, prefixes, or sequence numbering.
2. **Contextual Guidance**: Directly instructs legitimate parents where to find their identifier (the official paper or PDF admission letter issued by the school).
3. **Defense-in-Depth**: Preserves backend format normalization (`toUpperCase()`, trimming) while depriving external threat actors of structural reconnaissance.

---

## 3. Account Enumeration Defenses Across Authentication Endpoints

In addition to placeholder sanitization, SchoolPass implements comprehensive defenses against account enumeration across all public endpoints:

### 3.1 Constant-Time Responses in Password Recovery
When an attacker queries `/api/auth/forgot-password` with an arbitrary email address:
- **Flawed Pattern**: Returning `"Email not found"` vs `"Reset email sent"`.
- **SchoolPass Pattern**: Regardless of whether the email exists in the database, the API returns identical response payloads and HTTP status:
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, a password reset link has been sent."
  }
  ```
- Constant-time execution paths and dummy cryptographic hashing ensure timing attacks cannot differentiate registered from unregistered emails.

### 3.2 Registration Error Normalization
When an existing email is submitted to `/api/auth/register`:
- Instead of returning `"User already exists"`, the system returns generic guidance directing the user to sign in or recover their password.

### 3.3 IP-Based Rate Limiting
All public endpoints enforce strict IP-level token buckets (`auth_register`, `auth_login`, `auth_password_reset`):
- Exceeding burst thresholds triggers HTTP 429 Too Many Requests with a `Retry-After` header, blocking automated dictionary attacks.
