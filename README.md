HackatoneaFit — Rapid civic PQRSD intake + AI-assisted triage
=============================================================

A compact, production-oriented hackathon project built to demonstrate rapid problem-solving and an operational MVP: a decoupled web application for citizen petitions (PQRSD) with automated triage and draft generation powered by an agent-based LLM pipeline.

This repository contains:
- backend/ — FastAPI backend with agent/LLM pipeline and Supabase persistence.
- frontend/ — Next.js interface for public submission and administration.
- diapositivas.pdf — demo slides.
- migrations/ and supabase SQL — schema & vector search setup.
- docs and local legal corpus for context-aware responses.

Quick summary
-------------------------------
In a short development window we delivered:
- A fully working submission flow (normal and anonymous) with file attachments and tracking IDs.
- A background agent pipeline that triages incoming requests, enriches legal/contextual data, and produces a draft institutional response.
- Semantic "quick suggestions" search using vectorized embeddings and Supabase RPCs to surface validated responses.
- An admin interface to review and publish official responses.

Why this matters
----------------
- Real-world workflow: the product focuses on making public service intake faster and less error-prone.
- Human-in-the-loop safety: all AI-generated drafts are marked 'requires_human' and routed to admin review.
- Pragmatic fallback: deterministic fallbacks are built for when LLM providers are unavailable.
- MVP-first, then resilient: core features are production-focused, with automated triage to reduce manual load.

Core technology stack
---------------------
- Backend: Python 3.11 + FastAPI, Uvicorn
- Agents / LLM: LLM chain + deterministic tools
- Persistence: Supabase REST + Supabase Storage + SQL migrations for vector tables
- Vector search: pgvector, HNSW indexes, 768-dim embeddings
- Frontend: Next.js, React, TypeScript, React Hook Form, Zod
- CI / Dev: requirements.txt, package.json; recommended container/VM for fast local testing

MVP architecture
-----------------------------
1. User submits PQRSD via Next.js frontend (normal or anonymous).
2. Backend receives multipart/form-data, validates payload, stores request in Supabase.
3. Attachments uploaded to Supabase Storage and metadata persisted.
4. Agent pipeline:
   - Triage: deterministic checks + LLM classification to assign competence/department.
   - Enrichment: attach legal context from backend/legal_corpus and run sentiment/type extraction.
   - Draft generation: LLM produces structured draft; deterministic fallback if necessary.
   - Vector persistence: embeddings upserted for semantic retrieval & quick suggestions.
5. Admin UI: protected routes, review drafts, and publish official responses. Publishing triggers additional background vector/promotion flows.

Agent & LLM details
-----------------------------------------------
- Agent pipeline implemented at `backend/src/application/agent_flow/*`.
- Hybrid triage approach: deterministic rules (tools) + LLM scoring for ambiguous cases.
- Draft generation includes PII redaction utilities and explicit `requires_human` marking.
- Fallback chain is configured so the system degrades gracefully if primary model fails.
- Local legal corpus (`backend/legal_corpus`) is used to ground LLM outputs for higher factuality.

Getting started
--------------------------------------------------------------------------------
The live application is available via the "About" section of this repository or:
[https://hackatoneafit.vercel.app/]

Requirements:
- Python 3.11.5
- Node.js
- Supabase project or local PostgreSQL with pgvector extension

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
- Limit attachments to 5 files, 10MB each.
- Environment keys (Supabase service role key, GROQ_API_KEY) must be kept secret and not committed.

Contributors
----------------------
- Hackathon authors:
   - sanma613
   - Mariaisabel2
   - Mayday3003
   - Josecopro    

Contact & demo
--------------
- To request a live demo or a hosted environment, contact the project owner (sanma613).
