HackatoneaFit — Rapid civic PQRSD intake + AI-assisted triage
=============================================================

A compact, production-oriented hackathon project built to demonstrate rapid problem-solving and an operational MVP: a decoupled web application for citizen petitions (PQRSD) with automated triage and draft generation powered by an agent-based LLM pipeline.

This repository contains:
- backend/ — FastAPI backend with agent/LLM pipeline and Supabase persistence.
- frontend/ — Next.js (App Router) interface for public submission and administration.
- diapositivas.pdf — demo slides (presentation artifact).
- migrations/ and supabase SQL — schema & vector search setup (pgvector/HNSW).
- docs and local legal corpus for context-aware responses.

Quick summary (hackathon pitch)
-------------------------------
In a short development window we delivered:
- A fully working submission flow (normal and anonymous) with file attachments and tracking IDs.
- A background agent pipeline that triages incoming requests, enriches legal/contextual data, and produces a draft institutional response.
- Semantic "quick suggestions" search using vectorized embeddings and Supabase RPCs to surface validated responses.
- An admin interface (frontend + protected routes) to review and publish official responses.

Why this matters
----------------
- Real-world workflow: the product focuses on making public service intake faster and less error-prone.
- Human-in-the-loop safety: all AI-generated drafts are marked 'requires_human' and routed to admin review.
- Pragmatic fallback: deterministic fallbacks are built for when LLM providers are unavailable.
- MVP-first, then resilient: core features are production-focused (S3/Storage, retries, observability), with automated triage to reduce manual load.

Core technology stack
---------------------
- Backend: Python 3.11 + FastAPI, Uvicorn
- Agents / LLM: LLM chain + deterministic tools (local knowledge base + fallback models); GROQ-style model config (GROQ_API_KEY / GROQ_MODEL)
- Persistence: Supabase REST + Supabase Storage (attachments) + SQL migrations for vector tables
- Vector search: pgvector, HNSW indexes, 768-dim embeddings (local deterministic embedding implemented)
- Frontend: Next.js (App Router), React, TypeScript, React Hook Form, Zod
- CI / Dev: requirements.txt, package.json; recommended container/VM for fast local testing

MVP architecture (high-level)
-----------------------------
1. User submits PQRSD via Next.js frontend (normal or anonymous).
2. Backend (FastAPI) receives multipart/form-data, validates payload (Pydantic), stores request in Supabase.
3. Attachments uploaded to Supabase Storage and metadata persisted.
4. Agent pipeline (background task):
   - Triage: deterministic checks + LLM classification to assign competence/department.
   - Enrichment: attach legal context from backend/legal_corpus and run sentiment/type extraction.
   - Draft generation: LLM produces structured draft; deterministic fallback if necessary.
   - Vector persistence: embeddings upserted for semantic retrieval & quick suggestions.
5. Admin UI: protected routes, review drafts, and publish official responses. Publishing triggers additional background vector/promotion flows.

Agent & LLM details (key technical achievement)
-----------------------------------------------
- Agent pipeline implemented at `backend/src/application/agent_flow/*`.
- Hybrid triage approach: deterministic rules (tools) + LLM scoring for ambiguous cases.
- Draft generation includes PII redaction utilities and explicit `requires_human` marking.
- Fallback chain is configured (GROQ_MODEL and GROQ_FALLBACK_MODELS) so the system degrades gracefully if primary model fails.
- Local legal corpus (`backend/legal_corpus`) is used to ground LLM outputs for higher factuality.

No explicit NASA logic found
----------------------------
I scanned the repository content and README files — there is no obvious NASA-specific logic or NASA datasets included. If you intended to highlight NASA-related logic, point me to the file(s) and I will add a dedicated section showcasing that work.

Getting started (developer)
---------------------------
Requirements:
- Python 3.11.9 (backend)
- Node.js (recommended 18.18+ or 20+ for frontend)
- Supabase project or local Postgres with pgvector

Backend quick start:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local         # fill in SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY and GROQ_API_KEY
uvicorn main:app --reload --port 8000
# smoke test
curl -fsS http://localhost:8000/health
```

Frontend quick start:
```bash
cd frontend
npm install
cp .env.example .env.local         # set NEXT_PUBLIC_BACKEND_BASE_URL
npm run dev
# open http://localhost:3000
```

Operational notes & safety
-------------------------
- All AI-generated drafts are flagged for human review.
- PII detection & redaction tools are applied to incoming payloads and drafts.
- Limit attachments to 5 files, 10MB each (configured in backend).
- Environment keys (Supabase service role key, GROQ_API_KEY) must be kept secret and not committed.

Recommended follow-ups (short-term)
----------------------------------
- Move large binary demo assets out of the root into `docs/` or a GitHub release (see cleanup audit).
- Add CI lint & unit tests for agent_flow functions (LLM fallback flows & PII redaction).
- Add a `SECURITY.md` describing responsible disclosure and handling of PII.
- Add an operations README for deployments and Supabase schema migration steps.

Contributors & license
----------------------
- Hackathon authors: (list contributors in repo)
- Suggested: include an explicit LICENSE file (MIT or your chosen license).

Contact & demo
--------------
- Demo slides: `diapositivas.pdf` (presentation artifact)
- To request a live demo or a hosted environment, contact the project owner (sanma613).
