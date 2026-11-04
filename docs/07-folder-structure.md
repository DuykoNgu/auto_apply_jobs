# Target folder structure

> Design status: TARGET · Agreed structure. `src/frontend/` đã có code cho các màn Candidate (dữ liệu demo trong `lib/demo/`, style Tailwind CSS v4 trong `app/theme.css`, hai root layout `(public)`/`(workspace)`); backend, `src/ai/` và Admin chưa có. Lệch so với target xem [ADR 0001](decisions/0001-frontend-port-from-design-prototype.md).

Frontend: **Next.js (App Router) + React + TypeScript**. Backend: **Python + FastAPI**, chia theo **module**; Backend API và Automation Worker dùng chung một codebase. Phần gọi LLM, OCR và kiểm chứng đầu ra nằm trong package riêng **`acaj_ai`** (`src/ai/`), không chạm database. Ranh giới các khối theo [C4 Container](architecture/c4/02-container.md).

## 1. Repository

```text
auto_apply_jobs/
├── src/
│   ├── frontend/                 # Next.js (Web Frontend)
│   ├── backend/                  # FastAPI API + Automation Worker, one codebase
│   └── ai/                       # acaj_ai: masking, OCR, extraction, tailoring, grounding, classification, evals
├── docs/
│   ├── api/                      # openapi.yaml + API documentation
│   ├── architecture/             # C4 (c4/) and AI pipeline
│   ├── database/                 # acaj.dbml + checks.sql
│   ├── requirements/             # Business rules, non-functional requirements
│   ├── images/                   # UI screenshots used in the README
│   ├── 01-scope.md … 08-acceptance-criteria.md
│   └── mindmap.png
├── docker-compose.yml            # postgres (pgvector), minio (object storage), api, worker, frontend
├── .gitignore                    # Ignores .env files, keeps .env.example
└── README.md
```

## 2. Frontend — Next.js

```text
src/frontend/
├── app/                          # App Router: one route per screen in the IA
│   ├── (public)/
│   │   ├── login/                # SCR-01
│   │   └── register/             # SCR-02
│   ├── (workspace)/              # Shell (top navigation + notifications), requires login
│   │   ├── layout.tsx
│   │   ├── dashboard/            # SCR-03
│   │   ├── auto-apply/           # SCR-42: upload CV, 8-step pipeline, conditions, activity
│   │   ├── cv/                   # SCR-10
│   │   │   ├── upload/           # SCR-11: AI extraction review
│   │   │   ├── new/              # SCR-12: template, manual or AI
│   │   │   └── [cvId]/           # SCR-13
│   │   ├── insights/             # SCR-20: demand, salary, skill gaps, roadmap
│   │   ├── jobs/                 # SCR-30
│   │   │   └── [jobId]/          # SCR-31
│   │   │       ├── cv/           # SCR-32: tailored CV, provenance, evidence
│   │   │       └── preview/      # SCR-33: PDF sent to the recruiter, ATS checks
│   │   ├── applications/         # SCR-40
│   │   │   └── [applicationId]/  # SCR-41: thread, AI label, reply draft, confirmation
│   │   ├── account/              # SCR-50: profile, security, mailbox
│   │   └── admin/                # Admin only
│   │       ├── sources/          # SCR-60
│   │       ├── users/            # SCR-61
│   │       └── ai/               # SCR-62: quality, cost, matching weights
│   ├── forbidden/                # SCR-90
│   ├── not-found.tsx             # SCR-91
│   └── providers.tsx             # TanStack Query, theme, i18n (vi, en)
├── features/                     # One folder per feature: components/, hooks/, api.ts
│   ├── auth/  account/  dashboard/  automation/  cv/  insights/
│   ├── jobs/  tailoring/  applications/  feedback/  notifications/  admin/
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── ai/                       # Shared AI states: AiStatusBadge, ProvenanceMark, EvidencePopover, FeedbackButtons
│   └── cv-sheet/                 # CV paper rendering (Noto Serif), shared by SCR-11, SCR-32, SCR-33
├── lib/
│   ├── api-client.ts             # fetch wrapper: JWT, problem+json, 401 → login, 403 → forbidden
│   ├── api-types.ts              # Generated from docs/api/openapi.yaml (openapi-typescript)
│   ├── poll.ts                   # Polls an AI resource until READY / NEEDS_REVIEW / FAILED
│   └── format.ts                 # Dates, salary, time zone
├── messages/                     # vi.json, en.json
├── proxy.ts                      # Login and role redirects
├── tests/                        # Vitest + Testing Library
├── .env.example
└── package.json                  # Tailwind CSS, shadcn/ui, react-hook-form + zod, TanStack Query/Table
```

Luồng gọi: `app/ route → feature component → feature hook → feature api.ts → lib/api-client → REST API`.

## 3. Backend — FastAPI, one codebase for API and worker

```text
src/backend/
├── app/
│   ├── main.py                   # FastAPI app (Backend API)
│   ├── worker.py                 # Automation Worker entry: scheduler + task loop
│   ├── api_router.py             # Mounts every module router under /api/v1
│   ├── core/
│   │   ├── config.py             # pydantic-settings
│   │   ├── database.py           # SQLAlchemy engine, session
│   │   ├── security.py           # Password hashing, JWT
│   │   ├── crypto.py             # Encrypts mailbox tokens (NFR-SEC-006)
│   │   ├── storage.py            # Object storage client, signed links
│   │   ├── container.py          # Binds interfaces to implementations (DI)
│   │   ├── deps.py               # current_user, require_role, ownership helpers (BR-001)
│   │   └── errors.py             # problem+json mapping
│   ├── modules/
│   │   └── <module>/
│   │       ├── router.py         # Endpoints of this module (API only)
│   │       ├── service.py        # Business logic; depends on repository interfaces
│   │       ├── repository.py     # Protocol + SQLAlchemy implementation
│   │       ├── models.py         # SQLAlchemy models
│   │       ├── schemas.py        # Pydantic request/response, match openapi.yaml
│   │       └── tasks.py          # Worker handlers for this module's task types (if any)
│   ├── integrations/
│   │   ├── sources/              # One collector per job source: topcv.py, linkedin.py, company_site.py
│   │   ├── submit/               # Form submission (Playwright) and email submission
│   │   └── mail/                 # Gmail and Outlook clients over OAuth
│   └── tasks/
│       ├── runner.py             # Claims tasks with FOR UPDATE SKIP LOCKED, retries, quotas
│       └── schedule.py           # Periodic tasks: COLLECT_JOBS, COMPUTE_MARKET, POLL_INBOX, SEND_FOLLOW_UP
├── tests/
│   ├── fakes/                    # In-memory repositories, stub LLM, fake mail and sources
│   └── modules/
├── alembic/                      # Migrations; the first one comes from docs/database (DBML → SQL + checks.sql)
├── .env.example
├── requirements.txt
├── requirements-dev.txt          # + pytest, ruff, mypy
└── Dockerfile                    # One image, run as `api` or `worker`
```

Thư viện chính: FastAPI, Uvicorn, Pydantic 2 + pydantic-settings, SQLAlchemy 2 + psycopg 3, pgvector, Alembic, PyJWT, pwdlib (Argon2), python-multipart, boto3 (object storage), Playwright, google-api-python-client và msal (email), cryptography.

### Modules

| Module | Tables | API tags | Worker tasks |
|---|---|---|---|
| auth | — (dùng `app_users`) | Auth | — |
| account | `app_users`, `mailbox_connections` | Account, Mailbox | `PURGE_USER` |
| cv | `cvs`, `cv_facts`, `cv_fact_skills`, `attachments` | CVs, Attachments | `PARSE_CV` |
| taxonomy | `skills`, `skill_aliases`, `skill_relations`, `skill_inferences`, `courses`, `course_skills`, `locations`, `industries` | Lookups | tính lại `skill_inferences` |
| jobs | `job_sources`, `companies`, `job_postings`, `job_requirements`, `jd_insights` | Jobs, Admin (sources) | `COLLECT_JOBS`, `ANALYZE_JD` |
| market | `market_snapshots` và 4 bảng con | Market | `COMPUTE_MARKET` |
| matching | `matches`, `system_settings` (trọng số) | Admin (matching settings) | `SCORE_MATCHES` |
| tailoring | `tailored_cvs`, `tailored_sentences`, `sentence_evidence`, `tailored_attachments` | Tailored CVs | `OPTIMIZE_CV` |
| applications | `applications`, `mail_messages`, `reply_drafts`, `application_outcomes` | Applications | `SUBMIT_APPLICATION`, `SEND_FOLLOW_UP`, `POLL_INBOX`, `SEND_REPLY` |
| automation | `automation_settings`, `automation_excluded_companies` | Automation | điều phối các bước tự động |
| feedback | `ai_feedback` | Feedback | — |
| dashboard | — (đọc qua service của module khác) | Dashboard | — |
| notifications | `notifications` | Notifications | — |
| admin | — (đọc `ai_calls`, `ai_feedback`, `application_outcomes`) | Admin (users, AI quality) | — |
| audit | `audit_logs` | — | — |
| tasks | `tasks`, `ai_calls` | — | runner |

### Dependency flow

```text
api_router → module/router → module/service → module/repository (interface) → PostgreSQL
worker     → tasks/runner  → module/tasks   → module/service → acaj_ai / integrations / repository
acaj_ai    → LLMClient (interface) → provider client → LLM provider
```

### Rules

- Module gọi module khác chỉ qua **service**, không gọi repository của nhau. Ví dụ `automation` gọi `matching.service` và `applications.service`.
- Service phụ thuộc **interface** (repository Protocol, `LLMClient`, `MailClient`, `JobSourceCollector`); implementation gắn ở `core/container.py`. Test thay bằng `tests/fakes/`.
- `matching.service` tính và lưu điểm **trước** khi `tailoring` gọi `acaj_ai` (BR-012).
- Chỉ `applications.service.send_reply` gửi thư trả lời, và chỉ khi `reply_drafts.status = CONFIRMED` (BR-022).
- Chỉ code trong `integrations/` gọi nguồn job và email; chỉ `acaj_ai.llm` gọi LLM, với văn bản đã qua `acaj_ai.masking`.
- `router.py` chỉ có ở API; `tasks.py` chỉ chạy trong worker. Cùng `service.py` dùng cho cả hai.

## 4. AI package — `acaj_ai`

```text
src/ai/
├── acaj_ai/
│   ├── masking.py                # PiiMasker: mask before the LLM, restore after
│   ├── ocr.py                    # OcrEngine
│   ├── extraction/
│   │   ├── cv.py                 # CvExtractor → facts with ids
│   │   └── jd.py                 # JdAnalyzer → requirements and insights with quotes
│   ├── skills.py                 # SkillNormalizer (taxonomy passed in by the caller)
│   ├── embedding.py              # Embedder
│   ├── tailoring/
│   │   ├── evidence.py           # EvidenceBundle: facts, requirements, inferences, all with ids
│   │   ├── tailor.py             # CvTailor: rewrite and cover letter, cite ids
│   │   ├── grounding.py          # GroundingValidator: drop uncited sentences, set provenance
│   │   └── ats.py                # AtsChecker (rules)
│   ├── market.py                 # Market summary text; every number checked against the statistics
│   ├── replies/
│   │   ├── classify.py           # ReplyClassifier with confidence
│   │   └── draft.py              # ReplyDrafter
│   ├── llm/
│   │   ├── client.py             # LLMClient interface + provider client, retries, usage record
│   │   ├── schema.py             # OutputSchemaValidator
│   │   └── prompts/              # Versioned prompt templates; untrusted text goes in data blocks
│   ├── settings.py               # Reads LLM_* environment variables
│   └── cli.py                    # acaj-ai eval | parse | tailor | classify
├── evals/
│   ├── datasets/                 # JSONL with gold labels: cv-parse, jd-extract, grounding, hallucination, reply-classify, injection
│   ├── thresholds.toml           # Targets from NFR-AI-001 … NFR-AI-010
│   └── reports/                  # Generated, ignored by Git
├── tests/
└── pyproject.toml                # package acaj-ai, command acaj-ai
```

Lệnh terminal: `acaj-ai eval` chạy toàn bộ eval ở chế độ stub (dùng trong CI); thêm `--live` để chạy với LLM thật khi đổi model hoặc prompt (NFR-MAINT-002). Backend truyền dữ liệu vào và lưu kết quả đã kiểm chứng; `acaj_ai` không có router và không truy cập database.

## 5. Environment variables

Mẫu: `src/backend/.env.example` và `src/frontend/.env.example`. Copy thành `.env` / `.env.local`; các file thật bị Git bỏ qua.

| Variable | Used by | Purpose |
|---|---|---|
| `APP_ENV`, `API_HOST`, `API_PORT`, `LOG_LEVEL`, `CORS_ORIGINS` | API | Cấu hình chạy |
| `DATABASE_URL` | API, worker | Kết nối PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRE_MINUTES` | API | Xác thực người dùng |
| `TOKEN_ENCRYPTION_KEY` | API, worker | Mã hóa token hộp thư |
| `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` | API, worker | Object storage cho CV và PDF |
| `CV_MAX_FILE_MB`, `CV_MAX_PAGES` | API | Giới hạn file (BR-002) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `OAUTH_REDIRECT_URL` | API, worker | Kết nối Gmail và Outlook |
| `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `EMBEDDING_MODEL`, `LLM_TIMEOUT_SECONDS`, `LLM_MAX_RETRIES` | Worker, `acaj-ai` CLI | LLM provider, đọc bởi `acaj_ai.settings` |
| `WORKER_ID`, `WORKER_POLL_INTERVAL_SECONDS` | Worker | Lấy việc từ `tasks` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Địa chỉ API |

Các ngưỡng nghiệp vụ (trọng số matching, ngưỡng khả năng đậu phỏng vấn, độ sâu suy ra kỹ năng, hạn mức token) nằm trong bảng `system_settings`, nên Admin đổi được mà không cần deploy lại.
