# DoqSeal — Platform README (Agent & Developer Bible)

> **Audience:** humans and coding agents working on DoqSeal.  
> This document describes **everything currently built**: product, three repos, local setup, Azure production, demo account, data model, extraction pipeline, webhooks, and deploy rules.  
> **Do not invent features that are not listed here.** Prefer this file over chat memory when unsure.

---

## 1. What DoqSeal is

DoqSeal is a B2B **document intelligence** product for organisations (diagnostic centers, ops teams, etc.):

1. Users create **organisations** and **projects**.
2. They upload PDFs/images into a project or the shared **Drive**.
3. An **AI extraction pipeline** turns files into structured JSON (fields, checklist, pointers, titles).
4. Users **chat** with that knowledge (RAG) in **Intelligence**.
5. Optional **webhooks** notify external systems on document lifecycle events.
6. Org admins manage **members**, **API keys**, **usage limits**, and **audit logs**.

Brand accent: **`#2563eb`**.

---

## 2. Three repositories (siblings)

Local layout (typical):

```
d:\doqseal\
  doqseal-dashboard\     # This repo — Next.js UI + BFF
  doqseal-backend\       # Fastify API + jobs + auth
  doqseal-ai-engine\     # RabbitMQ worker + FastAPI chat/health
```

| Repo | GitHub | Default branch | Role | Local port |
|------|--------|----------------|------|------------|
| **doqseal-dashboard** | `kritarth1107/doqseal-dashboard` | **`master`** | Web UI + Next.js API routes that proxy to backend | **3000** |
| **doqseal-backend** | `kritarth1107/doqseal-backend` | **`main`** | Auth, orgs, projects, documents, jobs, webhooks (upload), quotas | **3030** |
| **doqseal-ai-engine** | `kritarth1107/doqseal-ai-engine` | **`main`** | Extraction worker, RAG index, chat HTTP | Worker + **3031** health |

They share the same **MongoDB** and **RabbitMQ**. Backend and AI must use the **same `AES_SECRET`** to decrypt stored files.

---

## 3. High-level architecture

```
Browser
  └─ Dashboard (:3000)
       ├─ Cookie: session_token (JWT from backend)
       ├─ Header: x-organisation-id
       └─ Next.js /api/*  →  Backend (:3030) /api/{version}/…

Backend
  ├─ MongoDB (users, sessions, orgs, projects, documents, jobs, extractions, …)
  ├─ Azure Blob or local STORAGE_ROOT (encrypted files)
  ├─ RabbitMQ queue: extraction.jobs   message: { "jobId": "…" }
  └─ Proxies chat → AI engine /chat

AI engine worker
  ├─ Consumes extraction.jobs
  ├─ Loads job + document + project from Mongo
  ├─ Decrypts file, runs pipeline (PDF text / OCR / VLM)
  ├─ Writes extraction + updates job/document
  ├─ Indexes into Qdrant for RAG
  └─ Fires project webhooks (processing / processed / failed)

Demo org path (special)
  └─ Job marked demoMode → canned JSON after ~8s → NO RabbitMQ, NO AI, NO quota burn
```

---

## 4. Authentication & organisations

### Email OTP (primary)

1. Dashboard `POST /api/auth/login-with-email` → backend kingdom `login-request`
2. User enters OTP → `POST /api/auth/login-with-email/verify-otp`
3. Backend returns JWT; dashboard sets httpOnly cookie **`session_token`** (~7 days)
4. Subsequent API calls send the cookie; BFF forwards `Authorization: Bearer …` to backend

### Social login

NextAuth providers (Google / GitHub / LinkedIn / X) sync via backend `kingdom/social`. Env: `NEXTAUTH_*`, provider client IDs/secrets.

### Org context

- Active org is sent as **`x-organisation-id`** (and often cookie `active_organisation_id`).
- Backend enforces membership via `assertUserInOrganisation` — do not rely only on JWT org claims.
- Users can belong to multiple orgs; switcher is in the sidebar.

### Backend auth middleware

Bearer JWT + DB `Session` validation + optional fingerprint headers.

---

## 5. Demo account (critical for agents)

Defined in backend `constants/demo.account.ts` (and mirrored timing/steps in dashboard `lib/demo-extraction.ts`).

| Item | Value |
|------|--------|
| Email | **`demo@doqseal.com`** |
| OTP | **`123456`** (fixed; email is skipped) |
| User display name | Doqseal Demo |
| Organisation | **Zeroknow Technologies** (`zeroknow-technologies`, `isDemo: true`) |
| Seeded project | **Test Request Forms(TRFs)** |
| Sample PDF | `doqseal-backend/assets/demo/changdev-munde.pdf` |

### Extraction context on demo project

```
Center Stamp, Patient Name, Age, Sex, Clinical History,
Medical Officer Stamp, Medical Superintendent Stamp
```

### Behaviour differences (do not “fix”)

- Uploads on the **demo org** create jobs with **`demoMode: true`**.
- After ~**8 seconds**, a **canned** TRF extraction (`DEMO_TRF_EXTRACTION`) is revealed.
- **No** RabbitMQ publish, **no** AI worker, **no** quota consumption for that path.
- Stuck “real” jobs on the demo org can be rescued into the demo finish path.
- First successful demo OTP verify runs **`ensureDemoWorkspace`** (user, org, project, sample assets as needed).

### Seed manually

```bash
cd doqseal-backend
npm run seed:demo-account
# also: npm run seed:demo-projects
```

**Production:** demo login works on live Azure when the backend deploy includes this code and Mongo is reachable.

---

## 6. Product features currently built

### Dashboard App Router (auth-required)

| Area | Routes |
|------|--------|
| Auth / onboarding | `/auth`, `/auth/hook`, `/onboarding` |
| Home | `/dashboard` |
| Drive (no project) | `/drive` |
| Intelligence (RAG chat) | `/intelligence` |
| Projects | `/projects` |
| Project detail | `/projects/[projectId]` |
| **Project settings** | **`/projects/[projectId]/settings`** |
| Document detail / extraction UI | `/projects/[projectId]/documents/[documentId]` |
| Analytics | `/analytics/usage`, `/analytics/audit-logs`, `/analytics/compliance` |
| Org manage | `/manage/organisation`, `/manage/members`, `/manage/api-keys`, `/manage/limits`, `/manage/create-organisation` |
| User settings | `/settings/[[...tab]]` |
| Invites | `/invite/[token]` |
| E-sign (feature-flagged) | `/sign/*` when `NEXT_PUBLIC_ESIGN_ENABLED` |

Nav config: `lib/navigation.ts`. Sidebar: `components/Sidebar.tsx`.

### Projects

- **Create** (modal on `/projects`): name, description, share-with-org → redirects to **settings**.
- **Settings page** (not a modal):  
  - General: name, description, share with organisation  
  - **Extraction context** (`extractionHint`) — free text sent to AI for every file in the project  
  - **Webhook**: **exactly one** HTTPS URL + multi-select events  
- Project detail shows hint + webhook summary cards linking to settings.

### Documents

- Upload via modal → encrypted storage → extraction job.
- Status: uploaded → processing → completed / failed (UI maps completed → “indexed” in lists).
- Delete can purge file while keeping extracted context for chat (product copy reflects this).

### Intelligence

- Chat UI with history sidebar.
- Dashboard BFF → backend `/chat` → AI engine `POST /chat` (Ollama / LLM + Qdrant RAG).

### Drive

- Organisation document library where `projectId` is `null`.
- AI treats these as “Organisation Drive” with empty extraction hint.

### Org admin

- Members & invites, API keys (`/api-wickets` on backend), usage/limits, audit logs, DPDP erase endpoints exist on backend.

### Quotas (defaults)

~100 MB storage, ~500 AI extractions/month, ~10 000 API requests/day (see `quota.service.ts`). Demo path does not burn AI quota.

---

## 7. Extraction context → AI (important)

`extractionHint` is stored on the **Project** in Mongo (`projects.extractionHint`).

**Queue message is only `{ jobId }`.** The AI worker reloads the full project from Mongo and uses the hint:

| Path | How hint is used |
|------|------------------|
| **VLM** (`vlm_extract.py`) | Injected as **PRIMARY EXTRACTION CONTEXT** in the schema prompt; model should fill `checklist` + fields |
| **OCR / PDF-text** (`ocr_extract.py`) | Hint split into labels; checklist + pointers filled via label matching |
| **Stub** | Influences stub template selection |
| **Worker logs** | `hint_chars=N` and truncated hint text |

If a user changes the hint in settings, the **next** job for that project picks it up automatically (no need to put hint on the RabbitMQ message).

---

## 8. Webhooks

### Rules

- **One webhook URL per project** (Zod `.max(1)`; backend `normalizeProjectWebhooks` rejects more).
- Shape: `{ url, events: WebhookEvent[], enabled?: boolean }`
- Legacy `webhookUrls: string[]` still coerced on read (first URL → events default `document.processed`).

### Events

| Event | When |
|-------|------|
| `document.uploaded` | Backend after upload + job create |
| `document.processing` | AI worker when job starts |
| `document.processed` | AI worker (or demo finish) on success |
| `document.failed` | AI worker on failure |

Constants: backend `constants/webhook.events.ts`, dashboard `lib/webhook-events.ts`.

### HTTP delivery

- `POST` JSON to the URL  
- Headers: `Content-Type: application/json`, `User-Agent: DoqSeal-Webhooks/1.0`, `X-DoqSeal-Event: <event>`  
- Failures are **logged only** — never fail the upload/job.

### Payload shape

```json
{
  "event": "document.processed",
  "projectId": "…",
  "documentId": "…",
  "jobId": "…",
  "organisationId": "…",
  "status": "completed",
  "originalFilename": "file.pdf",
  "displayTitle": "…",
  "error": null,
  "extraction": {
    "data": {},
    "fieldConfidence": {},
    "strategy": "pdf_text|ocr|hybrid|…",
    "status": "approved|approved_with_warnings|needs_review"
  },
  "timestamp": "2026-08-30T12:00:00.000Z"
}
```

---

## 9. Backend API map

Base URL local: `http://localhost:3030/api/{API_VERSION}/…`  
Prod (Container App):  
`https://doqseal-prod-backend.graybush-3e61ef54.centralindia.azurecontainerapps.io/api/v1/`

> Note: backend `.env.example` may use `API_VERSION=v1.0.0` while prod dashboard build arg uses `/api/v1/`. **Keep dashboard `NEXT_PUBLIC_API_URL` and backend route prefix aligned** for the environment you run.

| Prefix | Purpose |
|--------|---------|
| `/kingdom` | OTP login, social, logout |
| `/user` | Profile, create org |
| `/organisations` | Org details, usage, stats, members, invites, audit, erase |
| `/projects` | `POST /`, `GET /`, `GET /:projectId`, **`PATCH /:projectId`** |
| `/documents` | upload, list, get, file download, delete, reprocess |
| `/jobs` | Job status polling |
| `/api-wickets` | API keys |
| `/envelopes` | E-sign (if enabled) |
| `/chat` | Proxy to AI engine |
| `/health` | Dependency health |
| `/docs` | OpenAPI / Scalar |

### Project PATCH body (settings)

```ts
{
  name?: string;
  description?: string;
  extractionHint?: string;
  webhooks?: [{ url: string; events: string[]; enabled?: boolean }]; // max 1
  webhookUrls?: string[]; // deprecated, max 1
  sharedWithOrganisation?: boolean;
}
```

Dashboard BFF: `app/api/projects/[projectId]/route.ts` (GET + PATCH).

### Job queue

- Env: `EXTRACTION_QUEUE` (default **`extraction.jobs`**)
- Publish: `job.service.ts` → `{ jobId }`
- Skip publish when `demoMode`

---

## 10. AI engine pipeline

### Modes (`EXTRACTION_MODE`)

| Mode | Behaviour |
|------|-----------|
| **`hybrid`** (default prod) | Prefer PDF text layer → else OCR → skip VLM if text/OCR strong → else Qwen2.5-VL → OCR fallback |
| **`ocr_only`** | EasyOCR + hint/schema parsing, no VLM |
| **`stub`** | Fake structured payload (dev/Phase 0) |

### Speed knobs (env)

`PREFER_PDF_TEXT`, `PDF_TEXT_MIN_CHARS`, `PDF_RENDER_SCALE`, `SKIP_VLM_MIN_OCR_CONFIDENCE`, `SKIP_VLM_MIN_TEXT_CHARS`, `MAX_PDF_PAGES`, `WARMUP_MODELS`, `WARMUP_VLM`

### Internal HTTP (`app/main.py`)

- `GET /health`
- `POST /chat`
- `DELETE /rag/documents/{document_id}?organisationId=`

### Mongo collections used by worker

- Read: `extraction_jobs`, `documents`, `projects`
- Write: `extraction_jobs`, `documents`, `extracted`
- Vectors: **Qdrant** (per-org collections), not Mongo

---

## 11. Data model highlights

### Project (`projects`)

- `projectId`, `organisationId`, `name`, `description`
- `extractionHint` — free-text AI instructions
- `webhooks[]` — at most one meaningful URL in product rules
- `fields[]`, `crossFieldRules` — optional structured schema
- `status`: `active` | `archived`
- `sharedWithOrganisation`, `createdBy`, `deletedAt`

### Document (`documents`)

- `documentId`, `organisationId`, `projectId` (**null = Drive**)
- `originalFilename`, `displayTitle`, mime, size, hash
- Storage: path/URI + envelope encryption metadata
- `status`: uploaded → processing → completed / failed
- `sharedWithOrganisation`

### Job (`extraction_jobs`)

- `jobId`, `documentId`, `organisationId`, `projectId`
- `status`, `error`, timestamps
- `demoMode`, `demoRevealAt` (demo only)

### Extraction (`extracted`)

- `extractionId`, links to document/job
- `data` (JSON), `fieldConfidence`, `validationErrors`
- `status`: `approved` | `approved_with_warnings` | `needs_review`
- `strategy`: e.g. `pdf_text`, `ocr`, `hybrid`, `stub`

---

## 12. Local development

### Prerequisites

1. **Node.js** 20+ (dashboard + backend)
2. **Python** 3.11+ (AI engine)
3. **MongoDB** — e.g. `mongodb://localhost:27017/doqseal`
4. **RabbitMQ** — e.g. `amqp://doqseal:doqseal@localhost:5672`
5. Optional: **Ollama** on `:11434` for chat; **Qdrant** for RAG
6. GPU optional for VLM; `ocr_only` / PDF-text path works on CPU

### Start order

1. MongoDB + RabbitMQ  
2. Backend `:3030`  
3. AI worker (+ `run-health.sh` on `:3031`)  
4. Dashboard `:3000` with `NEXT_PUBLIC_API_URL` pointing at backend  

### Dashboard

```bash
cd doqseal-dashboard
npm install
# .env.local — see env names below (never commit secrets)
npm run dev
```

### Backend

```bash
cd doqseal-backend
cp .env.example .env   # fill secrets
npm install
npm run dev
npm run seed:demo-account   # optional
```

### AI engine

```bash
cd doqseal-ai-engine
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # AES_SECRET must match backend
./run-worker.sh            # or: python -m app.worker
# other terminal:
./run-health.sh            # FastAPI :3031
```

### Environment variable **names** (no secret values)

**Dashboard (`.env.local`):**  
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ESIGN_ENABLED`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `LINKEDIN_ID`, `LINKEDIN_SECRET`, `X_ID`, `X_SECRET`

**Backend:**  
`NODE_ENV`, `PORT`, `API_VERSION`, `CORS_ORIGINS`, `LIVE_FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_VALIDITY`, `AES_SECRET`, `RESEND_API`, `EMAIL_FROM`, `LOG_LEVEL`, `AMQP_URI`, `EXTRACTION_QUEUE`, `STORAGE_ROOT`, `AI_ENGINE_URL`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER`, `ESIGN_ENABLED`

**AI engine:**  
`MONGODB_URI`, `AMQP_URI`, `EXTRACTION_QUEUE`, `STORAGE_ROOT`, `AES_SECRET`, `EXTRACTION_MODE`, `VLM_MODEL`, `VLM_USE_4BIT`, `MAX_PDF_PAGES`, `OCR_LANGUAGES`, `CONFIDENCE_THRESHOLD`, `PREFER_PDF_TEXT`, `PDF_TEXT_MIN_CHARS`, `PDF_RENDER_SCALE`, `SKIP_VLM_*`, `WARMUP_*`, `QDRANT_URL`, `QDRANT_API_KEY`, `EMBEDDING_MODEL`, `HOST`, `PORT`, `OLLAMA_URL`, `LLM_MODEL`, `AZURE_STORAGE_*`

**Shared secrets that must match across services:** `AES_SECRET`, `MONGODB_URI`, `AMQP_URI`, `EXTRACTION_QUEUE`, storage config.

---

## 13. Azure production

### Shared Azure resources

| Resource | Name |
|----------|------|
| Resource group | **`doqseal-prod-rg`** |
| ACR | **`doqsealprodacr`** |
| Region | Central India (Container Apps hostname pattern) |

GitHub OIDC secrets (names): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`

### Deploy targets

| Service | Trigger branch | Workflow | Azure target | Image |
|---------|----------------|----------|--------------|-------|
| Dashboard | **`master`** | `.github/workflows/deploy-azure.yml` | Web App **`doqseal-prod-dashboard`** | `doqseal-dashboard` |
| Backend | **`main`** | `deploy-azure.yml` | Container App **`doqseal-prod-backend`** | `doqseal-backend` |
| AI engine | **`main`** | `deploy-azure.yml` | Container App **`doqseal-prod-ai-engine`** (GPU `gpu-t4`, `Dockerfile.gpu`) | `doqseal-ai-engine` |
| Ollama | **`main`** (path filters) | `deploy-ollama.yml` | **`doqseal-prod-ollama`** | `doqseal-ollama` |

### How deploy works

1. Push to the correct branch.  
2. GHA logs into Azure via OIDC.  
3. `az acr build` builds the image in ACR.  
4. Updates Web App container config **or** Container App revision.  
5. Dashboard build receives build-arg `NEXT_PUBLIC_API_URL` pointing at the **prod backend** URL.

### Agent rule for deploys

- Dashboard → push **`master`**
- Backend / AI → push **`main`**
- Never force-push; never commit `.env` / `.env.local` / secrets
- After multi-repo changes (webhooks + hint + settings), **push all three** so Azure stays consistent

---

## 14. Dashboard BFF conventions

- Prefer `backendFetch` + `parseBackendJson` from `lib/backend-client.ts`
- Always forward org via `withOrgHeaders(activeOrgId, …)` from client
- Session: read `session_token` cookie in route handlers
- Do **not** call Mongo or RabbitMQ from the dashboard — only the backend/AI do

---

## 15. UI / design notes for agents

- Existing product UI is a **dashboard**: cards/lists are fine; do not redesign as a marketing landing page unless asked.
- Keep brand blue `#2563eb`.
- Project **settings are a dedicated page**, not a modal: `/projects/[projectId]/settings`.
- Auth pages support dark mode patterns already added on `/auth` and `/auth/hook`.
- Prefer concise toasts (sonner) and existing `PageHeader` patterns.

---

## 16. Common agent workflows

### Change project settings (hint / webhook)

1. Edit dashboard settings page + PATCH BFF if needed.  
2. Ensure backend `UpdateProjectBody` + `project.service` + `webhook.service` accept the shape.  
3. AI already reads `extractionHint` from Mongo — strengthen prompts if behaviour is wrong.  
4. Push dashboard `master` + backend `main` (+ AI `main` if prompts changed).

### Debug “AI not using my extraction context”

1. Confirm project document has `extractionHint` in Mongo (GET project API).  
2. Confirm job is **not** demoMode (demo ignores AI).  
3. Check AI worker logs for `hint_chars` / “Extraction context for …”.  
4. Confirm worker and backend share the same Mongo DB.

### Debug webhooks

1. Settings page has URL + events saved (`webhooks[0]`).  
2. Upload fires `document.uploaded` from backend.  
3. Processing/processed/failed fire from AI worker (or demo processed from backend demo service).  
4. Receiver must accept POST JSON; check AI/backend logs for webhook warnings.

### Add a new authenticated page

1. Add under `app/(auth-required)/…`  
2. Optionally register in `lib/navigation.ts`  
3. Use `useAuth().activeOrgId` + `withOrgHeaders`

---

## 17. What is intentionally out of scope / incomplete

Treat these as **not** fully productized unless code proves otherwise:

- Heavy structured `fields[]` schema editor UX (model exists; free-text hint is the primary UX)
- Multiple webhooks per project (explicitly limited to **one**)
- E-sign depends on feature flags
- Local dashboard may lack a committed `.env.example` — copy var names from this README

---

## 18. Quick reference cheatsheet

| Need | Go here |
|------|---------|
| Demo login | `demo@doqseal.com` / `123456` |
| Project settings URL | `/projects/{id}/settings` |
| Extraction instructions field | `extractionHint` on Project |
| Queue | `extraction.jobs` ← `{ jobId }` |
| Webhook events | uploaded · processing · processed · failed |
| Max webhooks | **1** per project |
| Dashboard deploy branch | `master` |
| Backend / AI deploy branch | `main` |
| Azure RG / ACR | `doqseal-prod-rg` / `doqsealprodacr` |
| Brand color | `#2563eb` |

---

## 19. Related docs in sibling repos

- Backend: `API.md` (if present), `.env.example`, OpenAPI via `/docs`
- AI engine: `docs/PIPELINE.md` (if present), `.env.example`

When this README and code disagree, **trust the code**, then update this file.

---

*Last aligned with the multi-repo state that includes: project settings page, single webhook + events, extractionHint → VLM/OCR, demo OTP workspace, and Azure GHA deploys for all three services.*
