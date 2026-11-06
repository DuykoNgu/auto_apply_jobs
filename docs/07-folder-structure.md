# Target folder structure

> Design status: TARGET · Agreed structure. `src/frontend/` đã có code cho các màn Candidate (dữ liệu demo trong `lib/demo/`, style Tailwind CSS v4 trong `app/theme.css`, hai root layout `(public)`/`(workspace)`); backend, `src/ai/` và Admin chưa có. Lệch so với target xem [ADR 0001](decisions/0001-frontend-port-from-design-prototype.md).

Frontend: **Next.js (App Router) + React + TypeScript**. Backend: **Python + FastAPI**, chia thành `host/` (khởi chạy, ráp module), `shared/` (hạ tầng chung) và `modules/` (nghiệp vụ); Backend API và Automation Worker dùng chung một codebase. Phần gọi LLM, OCR và kiểm chứng đầu ra nằm trong package riêng **`acaj_ai`** (`src/ai/`), không chạm database. Ranh giới các khối theo [C4 Container](architecture/c4/02-container.md).

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

Ba lớp: **`host/`** (khởi chạy và ráp module), **`shared/`** (hạ tầng dùng chung), **`modules/`** (nghiệp vụ, mỗi module tự chứa router, service, repository, models, schemas).

```text
src/backend/
├── host/                              # Composition root: ráp module, không chứa nghiệp vụ
│   ├── main.py                        # FastAPI app (Backend API)
│   ├── worker.py                      # Automation Worker entry: scheduler + task loop
│   ├── api_router.py                  # Mounts every module router under /api/v1
│   ├── container.py                   # DI: Protocol → implementation (repository, LLMClient, MailClient, collectors)
│   ├── task_registry.py               # Registers task type → handler of each module
│   └── schedule.py                    # Periodic: COLLECT_JOBS, COMPUTE_MARKET, POLL_INBOX, SEND_FOLLOW_UP
├── shared/                            # Dùng chung, không import module nào
│   ├── config.py                      # pydantic-settings
│   ├── database.py                    # SQLAlchemy engine, session, Base
│   ├── security.py                    # Password hashing (Argon2), JWT
│   ├── crypto.py                      # Encrypts mailbox tokens (NFR-SEC-006)
│   ├── storage.py                     # Object storage client, signed links
│   ├── deps.py                        # current_user, require_role, ownership helpers (BR-001)
│   ├── errors.py                      # Base exceptions + problem+json mapping
│   ├── pagination.py                  # Shared page/cursor params
│   └── tasks/                         # Queue infrastructure (not a business module)
│       ├── models.py                  # tasks, ai_calls
│       ├── repository.py              # Claims with FOR UPDATE SKIP LOCKED
│       ├── runner.py                  # Task loop, retries, quotas
│       ├── queries.py                 # Read-only ai_calls statistics for admin
│       └── enqueue.py                 # enqueue(task_type, payload): any module may call
├── modules/
│   ├── auth/                          # Register, login, JWT (uses app_users of account)
│   │   └── router.py  service.py  schemas.py
│   ├── account/                       # app_users, mailbox_connections
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   ├── tasks.py                   # PURGE_USER
│   │   └── integrations/mail_oauth.py # Gmail/Outlook OAuth: get and refresh tokens
│   ├── cv/                            # cvs, cv_facts, cv_fact_skills, attachments
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   ├── tasks.py                   # PARSE_CV
│   │   └── export.py                  # PDF export
│   ├── taxonomy/                      # skills, aliases, relations, inferences, courses, locations, industries
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   └── tasks.py                   # Recompute skill_inferences
│   ├── jobs/                          # job_sources, companies, job_postings, job_requirements, jd_insights
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   ├── tasks.py                   # COLLECT_JOBS, ANALYZE_JD
│   │   └── integrations/sources/      # base.py (JobSourceCollector), topcv.py, linkedin.py, company_site.py
│   ├── market/                        # market_snapshots + 4 child tables
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   └── tasks.py                   # COMPUTE_MARKET
│   ├── matching/                      # matches, system_settings (weights)
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   ├── scoring.py                 # Rule-based score, no LLM
│   │   └── tasks.py                   # SCORE_MATCHES
│   ├── tailoring/                     # tailored_cvs, tailored_sentences, sentence_evidence, tailored_attachments
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   └── tasks.py                   # OPTIMIZE_CV (calls acaj_ai)
│   ├── applications/                  # applications, mail_messages, reply_drafts, application_outcomes
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   ├── tasks.py                   # SUBMIT_APPLICATION, SEND_FOLLOW_UP, POLL_INBOX, SEND_REPLY
│   │   └── integrations/
│   │       ├── submit/                # form.py (Playwright), email.py
│   │       └── mail/                  # base.py (MailClient), gmail.py, outlook.py
│   ├── automation/                    # automation_settings, automation_excluded_companies
│   │   ├── router.py  service.py  repository.py  models.py  schemas.py
│   │   └── tasks.py                   # Orchestrates the automatic steps
│   ├── feedback/                      # ai_feedback
│   │   └── router.py  service.py  repository.py  models.py  schemas.py
│   ├── notifications/                 # notifications
│   │   └── router.py  service.py  repository.py  models.py  schemas.py
│   ├── audit/                         # audit_logs; no router, written via audit.service.record()
│   │   └── service.py  repository.py  models.py  schemas.py
│   ├── dashboard/                     # No tables; aggregates through other modules' services
│   │   └── router.py  service.py  schemas.py
│   └── admin/                         # No tables; reads through other modules' services
│       └── router.py  service.py  schemas.py
├── tests/
│   ├── fakes/                         # In-memory repositories, stub LLM, fake mail and sources
│   ├── architecture/test_boundaries.py# Runs import-linter; fails on dependency violations
│   ├── modules/<module>/              # Service tests with fakes
│   └── api/                           # Router smoke tests against openapi.yaml
├── alembic/                           # Migrations; the first one comes from docs/database (DBML → SQL + checks.sql)
├── .importlinter                      # Contracts: host → modules → shared; modules import only other modules' service
├── .env.example
├── requirements.txt
├── requirements-dev.txt               # + pytest, ruff, mypy, import-linter
└── Dockerfile                         # One image, run as `api` or `worker`
```

Thư viện chính: FastAPI, Uvicorn, Pydantic 2 + pydantic-settings, SQLAlchemy 2 + psycopg 3, pgvector, Alembic, PyJWT, pwdlib (Argon2), python-multipart, boto3 (object storage), Playwright, google-api-python-client và msal (email), cryptography.

### Modules

| Module | Tables | API tags | Worker tasks |
|---|---|---|---|
| auth | — (dùng `app_users` qua `account.service`) | Auth | — |
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
| admin | — (đọc `ai_calls` qua `shared/tasks/queries.py`; `ai_feedback`, `application_outcomes` qua service của module sở hữu) | Admin (users, AI quality) | — |
| audit | `audit_logs` | — | — |

Hàng đợi `tasks` và `ai_calls` là hạ tầng nên nằm ở `shared/tasks/`, không phải module nghiệp vụ; `admin.service` đọc thống kê `ai_calls` (chi phí, tỉ lệ lỗi theo model) qua các hàm trong `shared/tasks/queries.py`.

### Dependency flow

```text
host ──► modules ──► shared
              └────► acaj_ai (only via a module's tasks.py, inside the worker)
```

```text
api_router   → module/router → module/service → module/repository (interface) → PostgreSQL
worker       → shared/tasks/runner → module/tasks → module/service → acaj_ai / module/integrations / repository
acaj_ai      → LLMClient (interface) → provider client → LLM provider
```

### Rules

- `shared` không import `modules` hay `host`; module không import `host`. Kiểm tra bằng `.importlinter` trong CI.
- Module gọi module khác chỉ qua **service** (và `schemas` làm kiểu trả về), không gọi repository hay models của nhau. Ví dụ `automation` gọi `matching.service` và `applications.service`.
- Truy vấn cần dữ liệu của module khác thì viết thành phương thức repository của module sở hữu dữ liệu, lộ ra qua service. `admin` và `dashboard` không đọc bảng trực tiếp.
- Module đẩy việc nền chỉ qua `shared.tasks.enqueue`; handler gắn ở `host/task_registry.py`, nên `shared/tasks` không biết module nào.
- Service phụ thuộc **interface** (repository Protocol, `LLMClient`, `MailClient`, `JobSourceCollector`); implementation gắn ở `host/container.py`. Test thay bằng `tests/fakes/`.
- `matching.service` tính và lưu điểm **trước** khi `tailoring` gọi `acaj_ai` (BR-012).
- Chỉ `applications.service.send_reply` gửi thư trả lời, và chỉ khi `reply_drafts.status = CONFIRMED` (BR-022).
- Chỉ code trong `integrations/` của module sở hữu gọi nguồn job và email; chỉ `acaj_ai.llm` gọi LLM, với văn bản đã qua `acaj_ai.masking`.
- `router.py` chỉ chạy trong API; `tasks.py` chỉ chạy trong worker. Cùng `service.py` dùng cho cả hai.

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
