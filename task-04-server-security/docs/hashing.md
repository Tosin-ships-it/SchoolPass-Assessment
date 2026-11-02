# Password Hashing Architecture and Timing Analysis

**Document Version:** 1.0.0  
**Application:** SchoolPass Authentication Engine  
**Algorithm:** Argon2id (RFC 9106) via `@node-rs/argon2`  
**Related Evidence Artifacts:**
- [`evidence/07-hash-twice-different.txt`](file:///C:/Users/gbola/Desktop/SchoolPass-Assessment/task-04-server-security/evidence/07-hash-twice-different.txt)
- [`evidence/08-timing-argon-vs-sha.txt`](file:///C:/Users/gbola/Desktop/SchoolPass-Assessment/task-04-server-security/evidence/08-timing-argon-vs-sha.txt)

---

## 1. Executive Summary

SchoolPass enforces modern, memory-hard password hashing using **Argon2id** (the winner of the Password Hashing Competition and codified in RFC 9106). Fast cryptographic hashes (such as SHA-256, SHA-512, and MD5) are strictly rejected for credential storage. 

This document presents empirical hardware benchmarks measured on the local host machine, mathematical calculations of attacker guessing rates, a detailed explanation of the **Timing Inversion Principle**, the cryptographic mechanics of salting, the justification for password whitespace trimming versus case preservation, and the legacy scrypt migration strategy implemented in SchoolPass.

---

## 2. Algorithm Choice & Production Configuration

### 2.1 Why Argon2id Was Chosen
General-purpose cryptographic hash functions (such as SHA-256) were engineered for message integrity, digital signatures, and proof-of-work. Their primary design goal is **raw speed and minimal computational overhead**. In password defense, however, high throughput is disastrous: an attacker with stolen database records can evaluate billions of candidate passwords per second on consumer hardware.

Argon2id was selected for SchoolPass because it combines:
1. **Argon2d (Data-Dependent Memory Access):** Provides maximum resistance against GPU and ASIC brute-force cracking by requiring data-dependent memory lookups.
2. **Argon2i (Data-Independent Memory Access):** Provides complete resistance against cache-timing and side-channel attacks during password evaluation.
3. **Argon2id Hybrid:** Evaluates the first half of memory passes independently of secret data (side-channel defense) and subsequent passes dependently on data (cracking-hardware defense).

### 2.2 SchoolPass Parameter Configuration
As defined in `src/lib/auth/crypto.ts`:
- **Memory Cost ($m$):** `65536 KiB` (64 MiB RAM per hashing operation).
- **Time Cost / Iterations ($t$):** `3` iterations.
- **Parallelism ($p$):** `1` thread.
- **Derived Key Output Length:** `32` bytes.
- **Salt Length:** `16` bytes (128 bits of cryptographically random entropy).

This configuration satisfies **OWASP Level 3 Application Security Guidelines** and RFC 9106 recommendations, calibrating execution time to approximately $90\text{--}100\text{ ms}$ on standard server hardware.

---

## 3. Empirical Hardware Benchmarks (Argon2id vs. SHA-256)

### 3.1 Test Environment & Methodology
- **Host OS:** Windows 11 Enterprise (`Windows_NT 10.0.26200 x64`)
- **Processor:** Intel(R) Core(TM) i7-8650U CPU @ 1.90GHz (4 physical cores / 8 logical threads)
- **Node.js Runtime:** v24.21.0
- **High-Resolution Timer:** `process.hrtime.bigint()`
- **Test Password:** `"Correct-Horse-Battery-Staple-2026!"` (identical across both algorithms)
- **Warm-Up Protocol:** 5 warm-up iterations for Argon2id; 100 warm-up iterations for SHA-256.

### 3.2 Measured Benchmark Results

| Metric | Argon2id ($m=65536, t=3, p=1$) | SHA-256 (General Cryptographic) | Ratio (Argon2id vs SHA-256) |
|---|:---:|:---:|:---:|
| **Sample Size** | 20 measured runs | 10,000 measured runs | — |
| **Median Execution Time** | **$93.605\text{ ms}$** | **$0.001500\text{ ms}$** ($1.500\ \mu\text{s}$) | **62,403x slower** |
| **Mean Execution Time** | $97.385\text{ ms}$ | $0.002308\text{ ms}$ ($2.308\ \mu\text{s}$) | 42,194x slower |
| **Minimum Execution Time** | $83.223\text{ ms}$ | $0.001200\text{ ms}$ ($1.200\ \mu\text{s}$) | — |
| **Maximum Execution Time** | $148.433\text{ ms}$ | $1.434200\text{ ms}$ | — |
| **Standard Deviation** | $13.970\text{ ms}$ | $0.018799\text{ ms}$ | — |

*Full measurement tables and individual iteration data are recorded in [`evidence/08-timing-argon-vs-sha.txt`](file:///C:/Users/gbola/Desktop/SchoolPass-Assessment/task-04-server-security/evidence/08-timing-argon-vs-sha.txt).*

---

## 4. Attacker Guess Calculations & Mathematics

### 4.1 Measured Single-Core Attacker Throughput
The single-core cracking rate represents how many candidate passwords an attacker can test per second on a single core of identical hardware:

$$\text{Guesses per Second} = \frac{1000\text{ ms}}{T_{\text{median}}(\text{ms})}$$

- **Argon2id Single-Core Throughput:**
  $$\text{Rate}_{\text{Argon2id}} = \frac{1000\text{ ms}}{93.605\text{ ms}} \approx 10.68\text{ guesses / second / core}$$

- **SHA-256 Single-Core Throughput:**
  $$\text{Rate}_{\text{SHA-256}} = \frac{1000\text{ ms}}{0.001500\text{ ms}} \approx 666,667\text{ guesses / second / core}$$

### 4.2 Theoretical Extrapolations (Multi-Core and Hardware Modeling)
> [!NOTE]
> The following figures are **theoretical mathematical extrapolations** based on hardware specifications and known cracking benchmarks. They are included to illustrate scaling dynamics and do not represent measured attacker performance on this workstation.

#### 1. Full 8-Thread CPU Utilization (This Workstation)
- **Argon2id (8 threads):**
  $$\text{Theoretical Rate} = 8 \times 10.68 \approx 85.4\text{ guesses / second}$$
  *RAM Consumption:* $8 \times 64\text{ MiB} = 512\text{ MiB}$ of high-speed memory bandwidth.
- **SHA-256 (8 threads):**
  $$\text{Theoretical Rate} = 8 \times 666,667 \approx 5,333,336\text{ guesses / second}\ (5.33\text{ MH/s})$$
  *RAM Consumption:* $\approx 0\text{ MiB}$.

#### 2. High-End 64-Core Server (e.g. Dual AMD EPYC)
- **Argon2id (64 threads):** $\approx 683\text{ guesses / second}$. Requires $4\text{ GiB}$ of memory bus throughput.
- **SHA-256 (64 threads):** $\approx 42.6\text{ Million guesses / second}\ (42.6\text{ MH/s})$.

#### 3. Consumer GPU Cracking Rig (Single NVIDIA RTX 4090)
- **SHA-256 on GPU:** Because SHA-256 requires zero RAM and simple 32-bit logical operations, tools like Hashcat achieve over **$25\text{ Billion hashes / second}$** ($25\text{ GH/s}$). An 8-character alphanumeric keyspace ($2.18 \times 10^{14}$ combinations) is exhausted in **under 2.5 hours**.
- **Argon2id on GPU:** Because each thread requires $64\text{ MiB}$ of RAM, a 24 GB VRAM GPU is constrained to at most $384$ concurrent threads ($24,576\text{ MiB} / 64\text{ MiB}$). The random memory lookups saturate the GPU memory bus, dropping the effective rate to $\approx 1,500\text{--}2,500\text{ guesses / second}$. Exhausting the same keyspace would take **over 2,700 years**.

---

## 5. The Timing Inversion Principle

The fundamental principle governing password defense is the **Asymmetric Timing Inversion**:

```
[Defender (SchoolPass Server)]
1 Login Attempt = 1 Hash Computation (~94 ms delay)
Cost to user: Imperceptible (< 0.1 sec)
Impact on UX: Completely unnoticeable

              VS

[Attacker (Stolen Database Offline Cracking)]
1 Attacker Dictionary = 100,000,000 Password Guesses
At 10.68 guesses/sec = 9,363,295 seconds (~108 DAYS of continuous 100% CPU)
Cost to attacker: Prohibitive compute time, electricity, and hardware lockup
```

### The Inversion Explained:
1. **The Server computes the hash once** per authentication attempt. A $94\text{ ms}$ calculation is entirely unnoticeable to a parent clicking "Sign In", occurring well within the expected HTTP round-trip latency.
2. **The Attacker must compute the hash billions of times** during an offline brute-force or dictionary attack against stolen database records.
3. Therefore, increasing the computational cost of the hash function imposes **virtually zero cost on the legitimate defender**, while imposing **exponential, economically ruinous costs on the attacker**.

---

## 6. Salting: Mechanics and Vulnerability Analysis

### 6.1 What Salting Does
A cryptographic salt is a sequence of cryptographically random bytes generated uniquely for each password before hashing. The salt is concatenated with the password prior to derivation:

$$\text{StoredHash} = \text{Argon2id}(\text{Password}, \text{Salt}, m, t, p)$$

The salt is stored alongside the hash in the modular crypt format / PHC string (e.g. `$argon2id$v=19$m=65536,t=3,p=1$<base64_salt>$<base64_hash>`). **The salt is not a secret; its value lies in its uniqueness.**

### 6.2 Empirical Demonstration: Same Password Twice
When hashing `"Correct-Horse-Battery-Staple-2026!"` twice consecutively, SchoolPass produced:
- **Hash 1:** `$argon2id$v=19$m=65536,t=3,p=1$Upu0gl17F9OSO/PWGPKBNg$WqHB66CTESlaKMhhmDkV/YXL2jTb76/TsH4iYlPqeKg`
  - Extracted Salt: `Upu0gl17F9OSO/PWGPKBNg` (16 bytes)
- **Hash 2:** `$argon2id$v=19$m=65536,t=3,p=1$tBem6fX/fyQSfqmoILel2w$yigEKmhM1O1HTSEJ+ENfooPeHT2rujIT0exebst9CRM`
  - Extracted Salt: `tBem6fX/fyQSfqmoILel2w` (16 bytes)

Both hashes differ completely (`hash1 !== hash2`), yet both successfully verify the exact same plaintext password (`verifyPassword(pw, hash) === true`).

### 6.3 What Happens If Salting Is Skipped?
If an application hashes passwords without unique salts:
1. **Precomputed Rainbow Tables:** Attackers precompute lookup tables mapping millions of known passwords to their hash values. Cracking any unsalted password reduces to an instantaneous $O(1)$ database table lookup.
2. **Cross-Account Credential Matching:** If Parent A and Parent B both use the password `Password123!`, unsalted hashes produce identical strings in the database. An attacker who compromises one password immediately compromises all other accounts sharing that hash.
3. **Multi-Target Cracking Acceleration:** When an attacker attempts a candidate password like `Admin2026!`, testing that single guess evaluates against *every* unsalted user in the database simultaneously. With unique per-user salts, testing `Admin2026!` tests exactly one user, forcing the attacker to repeat the work $N$ times for $N$ users.

Argon2id handles salt generation automatically inside the native C/Rust engine using system entropy (`/dev/urandom` / Windows CryptGenRandom), ensuring an application developer cannot inadvertently omit or duplicate salts.

---

## 7. Password Normalisation: Trimming vs. Case Preservation

In `src/lib/auth/schemas.ts` and `src/lib/auth/index.ts`, SchoolPass applies a deliberate architectural distinction:
- **Email:** Trimmed AND lowercased (`email.trim().toLowerCase()`).
- **Password:** Trimmed of leading/trailing whitespace, but **NEVER lowercased**.

### 7.1 Why Passwords Are Never Lowercased
Lowercasing a password destroys its cryptographic entropy. The character keyspace for an 8-character password using lowercase letters, uppercase letters, digits, and symbols is:

$$\text{Keyspace}_{\text{full}} = (26 + 26 + 10 + 33)^8 = 95^8 \approx 6.63 \times 10^{15}\text{ combinations}$$

If the server lowercases the password, the keyspace collapses to:

$$\text{Keyspace}_{\text{lowercased}} = (26 + 10 + 33)^8 = 69^8 \approx 5.14 \times 10^{14}\text{ combinations}$$

Lowercasing reduces the search space by over **92%**, significantly weakening the user's defense against offline dictionary and brute-force attacks. Users intentionally select mixed-case passphrases for security; altering case silently violates user intent.

### 7.2 Why Passwords ARE Trimmed of Whitespace
Leading and trailing whitespace characters (spaces, tabs) are commonly introduced by clipboard copy-paste operations on mobile devices and password managers (e.g. copying a password from an SMS or note app often grabs an accidental trailing space). 

Because whitespace is visually invisible in masked password input fields (`••••••••`), a user cannot diagnose why their login is failing. Trimming removes this invisible friction without diminishing intentional internal passphrase spaces (e.g. `"my secure school pass"` retains all internal spaces).

### 7.3 Safe Two-Stage Login Architecture
To ensure users who registered legacy accounts with trailing spaces are never locked out, `src/lib/auth/index.ts` implements **Safe Two-Stage Login**:
1. **Stage 1 (Primary):** Checks `verifyPassword(input.trim(), storedHash)`. If valid, login succeeds.
2. **Stage 2 (Legacy Fallback):** If Stage 1 fails and `input` contains whitespace, the server checks `verifyPassword(input, storedHash)`. If valid, authentication succeeds AND the server transparently upgrades the stored hash to the trimmed Argon2id representation.

---

## 8. Legacy Scrypt Migration Strategy

SchoolPass originally employed `scrypt` ($N=16384, r=8, p=1$). When upgrading to Argon2id, the engineering team maintained zero downtime and zero session loss through **Transparent Lazy Migration**:

1. **Dual Verification Support (`src/lib/auth/crypto.ts`):** `verifyPassword` inspects the hash prefix. If it begins with `$argon2id$`, it calls `argon2Verify`. If it begins with `scrypt$`, it unpacks the parameters and verifies using Node.js `crypto.scrypt` with `timingSafeEqual`.
2. **Rehash Detection (`needsRehash`):** Checks whether a stored hash matches the target Argon2id parameters ($m=65536, t=3, p=1$). If the record is legacy scrypt or uses older cost factors, `needsRehash` returns `true`.
3. **Opportunistic Upgrade on Login (`conditionallyRehashParentPassword`):** When a user successfully authenticates using their plaintext password, the server derives an Argon2id hash in the background and updates `parents.passwordHash` via an atomic Prisma transaction.

This ensures legacy users are upgraded transparently upon their next login without requiring forced password resets.
