# Task 2: Model Choices & AI Usage Documentation

**Document Path:** `Task-02-repository-and-scaffold/docs/model-choices.md`  
**Assessment Step:** Task 2 Step 3 ("Choose your models deliberately")  
**Target Repositories:** `SchoolPass-Assessment` / `SchoolPass`  
**Date:** October 29, 2026  

---

## 1. Overview

This document records the AI models associated with Task 2, strictly distinguishing between:
1. **The AI coding assistant used during development** to perform scaffolding, debugging, and verification.
2. **The AI models configured inside the SchoolPass application** for product features.

All statements are grounded solely in verifiable conversation transcripts, workspace logs, and repository configuration files. Any detail not explicitly recorded in local files is marked as **Unknown**.

---

## 2. AI Model Used to Assist Development (The Coding Agent)

### Identification & Recorded Metadata
- **Agent Platform:** Google DeepMind Advanced Agentic Coding ("Antigravity IDE").
- **Agent Identity (from System Prompt):** Verified in conversation transcripts (`f0cd2349-c592-4808-9e5b-5d1cd529f219` and `bc3f6aac-333c-4e8d-b2bf-b21ce43954c0`).
- **Backend API Endpoint:** Verified from runtime network logs as `https://daily-cloudcode-pa.googleapis.com/v1internal:streamGenerateContent`.
- **Exact Model Name / Version:** **Unknown**. The local transcript logs record `source: "MODEL"` for assistant steps, but do not record the underlying model name or checkpoint string (e.g., whether it is a specific version of Gemini or another model).

### Tasks Performed by the Development Agent
The same Antigravity development agent was used across all phases of Task 2:
1. **Context Ingestion & Planning (Conversation `bc3f6aac...`, Sept 30, 2026):**
   - Read the PRD, design tokens, and rule files (`RULES_*.md`).
   - Identified missing tokens and configuration discrepancies.
   - Formulated the pre-build implementation plan recorded in `evidence/01-agent-plan.txt`.
2. **Initial Scaffold Generation (Conversation `bc3f6aac...`, Sept 30, 2026):**
   - Created the baseline Next.js, TypeScript, and Prisma configuration.
   - Set up root CSS tokens and the minimal landing page (`evidence/02-files-created.txt`).
3. **Failure Reproduction & Recovery (Conversation `f0cd2349...`, Oct 29, 2026):**
   - Reproduced and recovered from the missing `package.json` error (`evidence/05`, `evidence/06`).
   - Reproduced the port collision (`EADDRINUSE`) on port 3050, identified the process, terminated it, and verified restart (`evidence/07`, `evidence/08`).
   - Reproduced the 404 route error on port 3060, documented the diagnosis, and applied the route fix (`evidence/09`, `evidence/10`).
4. **Database Verification & Test Harness Execution (Conversation `f0cd2349...`, Oct 29, 2026):**
   - Executed the first registration write (`test-assessment-guardian-1@schoolpass.test`).
   - Executed the second registration write (`test-assessment-guardian-2@schoolpass.test`) 118 minutes later.
   - Operated an isolated test harness on port 3070 to test database connectivity failure (`evidence/13-write-failed-logs.txt`).
   - Generated database inspector evidence (`evidence/12-database-rows.png`).

### Single-Agent Usage & Alternatives
- **Why one agent was used:** The entire task was executed within the provided Antigravity IDE workspace. The IDE's integrated agent had direct access to workspace tools (`run_command`, `write_to_file`, `replace_file_content`, `view_file`, `manage_task`), allowing continuous execution without context migration.
- **Alternatives Evaluated or Ruled Out:** **Unknown / None Recorded**. The conversation transcripts contain no record of alternative coding models or external coding assistants being tested, configured, or compared.

---

## 3. AI Models Configured for the SchoolPass Application (Product Features)

The AI models configured *inside* the SchoolPass codebase are completely separate from the development assistant. These models are defined in product requirements (`RULES_AI.md`, `README.md`, and `src/lib/ai/`):

1. **Policy Question-Answering Model:**
   - **Configured Model:** Google Gemini (`gemini-1.5-flash` or `gemini-2.0-flash`).
   - **Purpose:** Answers parent questions strictly from school policy documents (`ApprovedSchoolInfo`) without retaining conversation history or accessing private student records.
   - **Configuration:** Daily quota of 20 questions per parent per day; temperature 0.2.

2. **Vector Embedding Model:**
   - **Configured Model:** `text-embedding-004`.
   - **Purpose:** Generates vector embeddings for approved school policy circulars chunked into 512-token segments with 50-token overlap.

---

## 4. Summary: Verified Facts vs. Unknowns

| Parameter | Verified from Project Records | Status |
| :--- | :--- | :---: |
| **Development Agent Platform** | Antigravity IDE (Google DeepMind) | **Verified** |
| **Development Agent API Endpoint** | `https://daily-cloudcode-pa.googleapis.com/...` | **Verified** |
| **Exact Coding Agent Model ID** | Not exposed in transcript logs | **Unknown** |
| **Alternative Coding Models Tested** | None recorded in conversation transcripts | **None / Unknown** |
| **Application Q&A Model** | Gemini Flash (configured in `RULES_AI.md`) | **Verified** |
| **Application Embedding Model** | `text-embedding-004` (configured in `RULES_AI.md`) | **Verified** |
| **Application Privacy Constraint** | Zero child data exposed to AI models | **Verified** |
