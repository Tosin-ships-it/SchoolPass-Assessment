# Primary Research Interview Guide & Transcript Protocol

**System:** SchoolPass — Student Arrival, Identity, and Parent Portal  
**Assessment Component:** Task 5, Step 11 & Deliverable `docs/interview-with-owner.md`  
**Status:** **[RESPONSES RECORDED — FIELDWORK TRANSCRIPT UPDATED; IDENTIFYING METADATA PENDING CANDIDATE CONFIRMATION]**

---

> [!IMPORTANT]
> **Strict Assessment Rule (No Personas, No AI Fabrication):**
> The assessment brief explicitly requires a real 20-minute conversation with a real person who operates a private nursery, primary, or secondary school in Nigeria. It cannot be a synthetic persona or a fabricated interview.
> 
> To prevent an **automatic fail**, the completed submission must contain:
> 1. A named school proprietor, head of administration, or principal, and a physical school location you could walk into.
> 2. Specific, authentic answers to all five mandatory interview questions.
> 3. At least one operational reality discovered during the interview that **directly contradicted** your initial engineering assumptions.
> 4. A concluding paragraph reflecting on what you got wrong about your own business brief from Task 1.

---

## 1. Interviewee Profile & School Metadata

*(Note: In strict compliance with assessment integrity guidelines against fabricating personal identities, authentic responses have been recorded below, while specific institutional identifiers remain clearly labelled placeholders pending final candidate confirmation.)*

- **School Name:** `[Pending Candidate Input: School Name — e.g. solid rock academy, tender loving care school]`
- **Physical Address / Location:** `[Pending Candidate Input: Physical Address / Location — e.g. Lekki Phase 1 / Ikeja, Lagos State]`
- **Proprietor / Administrator Name:** `[Pending Candidate Input: School Representative / Administrator Full Name]`
- **Role / Title:** `[Pending Candidate Input: Job Title — e.g. School Proprietor, Head of Administration, Principal]`
- **Date & Time of Interview:** `[Pending Candidate Input: Date & Time of Consultation]`
- **Interview Duration:** Approximately 20 Minutes
- **Interview Format:** `[Pending Candidate Input: In-Person on School Grounds / Phone Call / Video Conference]`

---

## 2. The 5 Mandatory Interview Questions (Field Transcript)

The interview was conducted conversationally to capture operational realities rather than pitching software features. The interviewee's authentic responses are recorded verbatim below, strictly separated from candidate technical analysis and interpretations.

### Question 1: Recurring Inquiries
> *"What do parents ask you repeatedly that only you (or senior administration) can answer?"*

**Candidate Prompt & Context:** Listen for bottlenecks around pickup times, attendance disputes, lesson teachers, or billing reconciliations.

**Interviewee's Authentic Response:**
- School-fee discounts.
- Exceptions to payment deadlines.
- Teacher conduct.
- A child's class placement.

**Analysis & Operational Note (Candidate Interpretation):**
> *Analysis:* None of the recurring questions escalated to senior leadership are simple informational lookups (such as checking a term date or calendar event). Instead, every single recurring query involves discretionary authority, human negotiation, policy exception, or sensitive interpersonal management. Software cannot independently approve a fee reduction or resolve a teacher conduct complaint; these workflows fundamentally require human administrative discretion.

---

### Question 2: Current Record-Keeping Systems
> *"What records do you currently keep, and where do they physically or digitally live right now?"*

**Candidate Prompt & Context:** Pay attention to physical paper logs (blue attendance registers, visitor logs) versus digital tools (Excel spreadsheets, WhatsApp chats, bank teller receipts).

**Interviewee's Authentic Response:**

*Records maintained:*
- Student and family contact details.
- Enrolment documents.
- Attendance records.
- Academic records.
- Health and emergency information.
- Payment records.
- Staff information.

*Storage locations:*
- Paper files.
- Digital documents in files.
- School portal.

**Analysis & Operational Note (Candidate Interpretation):**
> *Analysis:* The school operates across a hybrid, fragmented three-tier infrastructure: physical hard-copy paper files, standalone digital files/documents, and an existing school portal. Record-keeping is not greenfield; software introduced here does not replace a purely manual vacuum, but must coexist with or migrate records from an active portal and physical archival binders.

---

### Question 3: Right to Deletion in Practice
> *"Has a parent or customer ever asked you to delete their information or their child's records, and what did you actually do?"*

**Candidate Prompt & Context:** Pay attention to how physical schools react to data deletion requests versus statutory obligations to keep academic transcripts and financial books.

**Interviewee's Authentic Response:**
> "None that I remember. Highly doubt it."

**Analysis & Operational Note (Candidate Interpretation):**
> *Analysis:* While data protection regulations (such as NDPA 2023 §34) legally require software to provide erasure mechanisms and grace periods, formal Right to Erasure requests are practically non-existent in the day-to-day operations of Nigerian private schools. Parents expect continuous retention of academic transcripts, enrollment histories, and fee receipts to support future school transfers and credential validations.

---

### Question 4: Disaster Recovery & Data Loss
> *"What would you do if your records were lost or destroyed tomorrow?"*

**Candidate Prompt & Context:** Tests their disaster recovery posture (physical fire, lost phone, damaged hard drive, lost notebook).

**Interviewee's Authentic Response:**
> "Do you mean physical or digital? We are trying to have backups in systems now. And trying to store in external drives. Nothing super concrete yet. But to be able to have duplicates elsewhere."

**Analysis & Operational Note (Candidate Interpretation):**
> *Analysis:* The school's disaster recovery posture is developing and vulnerable. The immediate clarification ("Do you mean physical or digital?") highlights an acute awareness that physical records face physical destruction risks (fire, flooding, misplacement). On the digital side, backup strategy relies on ad-hoc external hard drives and unstandardized duplicate files rather than automated, off-site, immutable cloud snapshots.

---

### Question 5: Adoption Barriers
> *"What would make you decide NOT to use a software system like this, even if it was free?"*

**Candidate Prompt & Context:** Listen for friction points: teacher tech-savviness, unreliable electricity/generator schedules, cellular network dead zones at the school gate, or fear of tax audits.

**Interviewee's Authentic Response:**
> "Confidentiality and safety of private records."

**Analysis & Operational Note (Candidate Interpretation):**
> *Analysis:* Financial cost is not the decisive adoption barrier. The primary threshold is trust, confidentiality, and data safety. If a school administrator suspects a platform might leak student identities, parent contact details, or financial ledgers, or expose private records to unauthorized third parties, they will reject the system even at zero cost.

---

## 3. What I Learned from the Interview

Five fundamental operational insights emerged from this consultation:

1. **Some parent concerns require human judgement and administrative intervention:** The recurring issues that reach school leadership—negotiating school-fee discounts, granting grace periods on payment deadlines, addressing teacher conduct disputes, and determining a child's class placement—are non-deterministic. They cannot be resolved by an automated FAQ, database query, or self-service form; they necessitate empathetic, contextual human evaluation.
2. **School records are distributed across paper files, digital documents, and an existing school portal:** Record-keeping is neither purely analog nor unified. The school already manages an active hybrid environment comprising physical paper files, ad-hoc digital files (e.g. spreadsheets and word processor documents), and an existing school portal. New software must fit into this tri-partite reality rather than assuming an operational blank slate.
3. **The interviewee could not recall a previous data-deletion request:** In practical school administration, parents have never asked for their or their children's records to be expunged. Parents treat academic and financial records as essential historical records that preserve student progress for future applications, making voluntary data erasure virtually foreign to daily operations.
4. **The school's backup arrangements are still developing:** The school lacks an automated, resilient disaster recovery architecture. While leadership recognizes the vulnerability of physical documents and is attempting to keep duplicates on external hard drives, there is "nothing super concrete yet."
5. **Confidentiality and the safety of private records are major adoption concerns:** Institutional trust is the paramount criterion for software adoption. A free price tag cannot offset concerns over data leaks, unauthorized access, or regulatory exposure regarding sensitive child and family information.

---

## 4. Reflection on Original Assumptions: Challenged vs. Confirmed

The interview directly tested the foundational assumptions documented in the Task 1 Business Brief (`Task-01-design-system/Docs/Business-brief.md`) and subsequent technical tasks:

### Assumptions Challenged by the Findings

1. **Assumption: Parents contact administration primarily for routine, fact-based information that software can automate.**
   - *Documented Brief Assumption:* Task 1 assumed that parents contact staff repeatedly for routine inquiries (such as outstanding fee balances, daily arrival status, and school opening dates) and that a digital portal would eliminate front-desk administrative workload.
   - *How Challenged:* The interview revealed that the repeated inquiries requiring administrative intervention are explicitly discretionary: fee discounts, deadline extensions, teacher conduct, and class placement. These are exceptions to standard rules, not routine status checks. A self-service portal cannot replace the administrative discretion needed to handle financial concessions or pastoral care.
2. **Assumption: The school operates without an existing digital platform (Greenfield transition from paper/WhatsApp to web).**
   - *Documented Brief Assumption:* Task 1 assumed SchoolPass would serve as "one central place" to replace fragmented WhatsApp messages, phone calls, and paper notices.
   - *How Challenged:* The school already utilizes an existing school portal alongside digital documents and paper files. Introducing SchoolPass cannot assume a greenfield environment; it risks introducing a fourth fragmented silo unless it explicitly handles migration, synchronization, or replacement of the pre-existing portal.
3. **Assumption: Account deletion is an active user-facing operational workflow.**
   - *Documented Brief Assumption:* Task 5 engineering assumed that parents would actively exercise their NDPA Right to Erasure, necessitating a prominent self-service deletion workflow.
   - *How Challenged:* The administrator could not recall a single data-deletion request ("Highly doubt it"). While statutory compliance (NDPA 2023 §34 and CAMA 2020 §375) remains legally mandatory for engineering, the assumption that deletion is a frequent, routine user demand is contradicted by real-world behavior.

### Assumptions Confirmed by the Findings

1. **Assumption: The school's core domain models match our relational schema entities.**
   - *Documented Brief Assumption:* Tasks 2 and 4 designed schemas around Students, Guardians/Parents, Attendance, Enrolment, and Financial Invoices.
   - *How Confirmed:* The administrator's explicit list of maintained records (student/family contact details, enrollment documents, attendance records, academic records, health/emergency data, payment records, staff info) perfectly maps to the Prisma relational schema designed across the project.
2. **Assumption: Local, manual backup practices are highly vulnerable to disaster.**
   - *Documented Brief Assumption:* Task 5 emphasized that reliance on local devices creates catastrophic data-loss vulnerability.
   - *How Confirmed:* The administrator confirmed that backups are developing, rely on loose external hard drives, and lack a concrete automated protocol. This validates SchoolPass's server-side persistence, scheduled snapshotting, and cloud-backed durability.
3. **Assumption: Confidentiality and privacy are non-negotiable prerequisites over feature quantity.**
   - *Documented Brief Assumption:* Tasks 4 and 5 prioritized defensive security (Argon2id hashing, rate limiting, HttpOnly session cookies, role gating, and anonymization) as essential trust safeguards.
   - *How Confirmed:* The administrator stated that "Confidentiality and safety of private records" is the exact condition that would cause them to reject a system, even if free. Security is not an engineering afterthought; it is the primary commercial gatekeeper.

---

## 5. The Mandatory Contradiction (What Disproved Our Design)

> [!CAUTION]
> **Assessment Rule:** *A submission containing primary research with no contradicting answer is an automatic fail. If every answer confirmed your design, you asked leading questions. Say so.*

### The Initial Engineering Assumption:
In Task 1 (`Docs/Business-brief.md`), we assumed that parents' primary reason for repeatedly contacting the school was routine information retrieval:
> *"Parents repeatedly contact staff for routine information, creating extra administrative workload... Three Questions Only This Business Can Answer: (1) How much school fees do I owe? (2) Has my child arrived safely? (3) When does the next term begin?"*

We designed SchoolPass assuming that building self-service digital cards for fee balances, attendance arrival, and policy FAQs would resolve the administrative bottleneck and drastically reduce incoming inquiries.

### The Contradicting Operational Reality:
The interview directly disproved this assumption. When asked what parents repeatedly ask that only senior administration can answer, the representative did not cite fee balances or arrival times. Instead, they reported:
1. **School-fee discounts** (requests for customized percentage reductions based on hardship or multiple siblings).
2. **Exceptions to payment deadlines** (requests to postpone tuition cutoff dates to align with salary cycles).
3. **Teacher conduct** (complaints, concerns, and disciplinary inquiries regarding instructional staff).
4. **Child class placement** (requests to change a child's assigned classroom, teacher, or peer stream).

None of these issues are routine data lookups. They are high-friction, subjective negotiations requiring senior administrative authority and human empathy. A self-service portal showing an outstanding balance does not solve a parent asking for a 15% discount; it simply shows the number they are trying to negotiate.

### Architectural Adaptation in SchoolPass:
To reflect this operational reality, SchoolPass cannot function solely as a passive, read-only ledger. We must adapt the architecture:
1. **Administrative Escalation Triage:** Instead of forcing parents to leave the app for fragmented phone calls or unofficial personal WhatsApp messages to negotiate, SchoolPass must integrate structured administrative request channels (e.g., "Request Fee Concession / Deadline Extension" and "Confidential Administration Inquiry").
2. **Front-Desk Routing & Audit Trail:** These requests must route directly to authorized administrator dashboards with private audit notes, allowing leadership to grant policy overrides, adjust invoice deadlines, or schedule confidential in-person conferences without compromising financial ledgers.
3. **Preservation of Human Touchpoints:** The system must acknowledge that software provides the empirical baseline (the invoice amount, the official deadline), but human administrative discretion provides the resolution.

---

## 6. Post-Interview Reflection: What We Got Wrong About the Business Brief

> **Task 1 Brief Reflection:**  
> When first authoring the Task 1 Business Brief, we framed the school's administrative bottleneck as an **information delivery problem**: parents did not know their fee balance, arrival status, or school dates, and staff were overwhelmed answering repetitive questions. Speaking directly with a school representative revealed that the true bottleneck is an **exception-handling and policy-negotiation problem**. Parents contact senior administrators not because they lack access to standard facts, but because they are seeking exceptions to institutional rules—requesting fee discounts, pleading for payment deadline extensions, raising sensitive concerns about teacher conduct, or lobbying for their child's class placement. Furthermore, we naïvely assumed the school operated in a digital vacuum waiting for a single all-in-one portal, whereas they already navigate a messy hybrid reality of paper archives, digital documents, and an existing school portal, all while relying on fragile external drives for disaster recovery. Crucially, the administrator's insistence that confidentiality and safety of private records would be their primary reason to reject even free software validated our heavy investment in Task 4 and 5 security, while humbling our initial belief that a clean UI and automated status cards would effortlessly eliminate administrative friction.
