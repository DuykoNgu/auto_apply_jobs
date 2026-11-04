# Sequence diagrams

> **Status:** Target design

Tám luồng chạy chính, mỗi luồng nối use case và thao tác OpenAPI với router, service, `acaj_ai`, repository, database và các nhánh lỗi. API chỉ ghi việc vào bảng `tasks`; worker lấy việc bằng `FOR UPDATE SKIP LOCKED` ([data model](../../06-data-model.md#task-table)).

| # | Flow | Trigger | Use case |
|---|---|---|---|
| 1 | Nạp CV và AI đọc CV | `POST /cvs` | UC03, UC04 |
| 2 | Chấm điểm job | Việc `SCORE_MATCHES` | UC12 |
| 3 | Tối ưu CV cho một job | Việc `OPTIMIZE_CV` | UC14–UC16 |
| 4 | Tự động nộp hồ sơ | Việc `SUBMIT_APPLICATION` theo lịch | UC18 |
| 5 | Đọc thư phản hồi | Việc `POLL_INBOX` theo lịch | UC20 |
| 6 | Xác nhận và gửi thư trả lời | `POST /applications/{id}/reply-draft/confirmation` | UC20 |
| 7 | Hoàn tác một câu đã tối ưu | `PATCH /tailored-cvs/{id}/sentences/{sid}` | UC15, UC23 |
| 8 | Cào và lấy dữ liệu job từ thị trường | Việc `COLLECT_JOBS` theo lịch, rồi `ANALYZE_JD` | UC11, UC12 |

## 1. Upload CV and AI extraction

```mermaid
sequenceDiagram
    autonumber
    actor U as Ứng viên
    participant W as Web Frontend
    participant R as cv/router
    participant S as CvService
    participant FS as File Storage
    participant DB as PostgreSQL
    participant K as Worker (TaskRunner)
    participant AI as acaj_ai

    U->>W: Chọn file CV
    W->>R: POST /cvs (multipart)
    R->>S: upload(user, file)
    alt File sai định dạng, > 10 MB hoặc > 5 trang (BR-002)
        S-->>R: ValidationError
        R-->>W: 400 problem+json
    else Hợp lệ
        S->>FS: put(file) → file_key
        S->>DB: INSERT cvs (status PENDING) + tasks (PARSE_CV)
        R-->>W: 202 CvSummary (PENDING)
    end
    K->>DB: claim PARSE_CV
    K->>FS: get(file_key)
    K->>AI: parse_cv(text or image)
    AI->>AI: OCR nếu là ảnh, che dữ liệu, gọi LLM, kiểm schema
    alt LLM lỗi sau 3 lần
        AI-->>K: Result FAILED
        K->>DB: cvs.status = FAILED, ghi ai_calls
    else Thành công
        AI-->>K: ParsedCv (facts, confidence)
        K->>DB: INSERT cv_facts, cv_fact_skills (đã chuẩn hóa), cvs.embedding
        K->>DB: cvs.status = READY hoặc NEEDS_REVIEW
        K->>DB: INSERT tasks (SCORE_MATCHES, COMPUTE_MARKET)
    end
    loop Mỗi 2 giây tới trạng thái cuối
        W->>R: GET /cvs/{cvId}
    end
    W-->>U: Kết quả, trường cần kiểm tra được tô màu
```

## 2. Score matches

```mermaid
sequenceDiagram
    autonumber
    participant K as Worker (TaskRunner)
    participant M as MatchingService
    participant F as CandidateFinder
    participant C as SkillCoverage
    participant SC as MatchScorer / ChanceRule
    participant DB as PostgreSQL

    K->>DB: claim SCORE_MATCHES (cv_id)
    K->>M: score_cv(cv_id)
    M->>DB: đọc system_settings (trọng số, ngưỡng, version)
    M->>F: find(cv)
    F->>DB: top 300 theo embedding + job có MUST trùng kỹ năng
    F-->>M: danh sách job
    loop Mỗi job
        M->>C: credits(kỹ năng ứng viên, yêu cầu job)
        C->>DB: skill_inferences (độ sâu ≤ 2)
        C-->>M: credit, skill factor, MUST còn thiếu
        M->>SC: factors → score (chặn 39 nếu skill = 0) → chance (hạ mức nếu thiếu MUST hoặc cạnh tranh cao)
    end
    M->>DB: UPSERT matches (một transaction)
    M->>DB: INSERT tasks OPTIMIZE_CV cho job HIGH / MEDIUM chưa có bản CV
    Note over M,DB: Điểm được lưu trước mọi lời gọi LLM (BR-012)
```

## 3. Optimize the CV for one job

```mermaid
sequenceDiagram
    autonumber
    participant K as Worker (TaskRunner)
    participant T as TailoringService
    participant Q as UsageLimiter
    participant E as EvidenceBuilder
    participant AI as acaj_ai.tailor_cv
    participant LLM as LLM provider
    participant DB as PostgreSQL
    participant FS as File Storage

    K->>DB: claim OPTIMIZE_CV (cv_id, posting_id)
    K->>T: optimize(cv_id, posting_id)
    T->>Q: còn hạn mức token hôm nay?
    alt Hết hạn mức (BR-016)
        T->>DB: dời việc sang ngày mai, tạo thông báo
    else Còn hạn mức
        T->>E: build(cv_id, posting_id)
        E->>DB: fact, yêu cầu JD, dòng skill_inferences hợp lệ
        E-->>T: EvidenceBundle (mọi mục có ID)
        T->>AI: tailor_cv(bundle)
        AI->>AI: che dữ liệu (PiiMasker)
        AI->>LLM: prompt vN, JD trong khối dữ liệu
        LLM-->>AI: JSON câu + ID căn cứ + cover letter
        AI->>AI: kiểm schema → kiểm căn cứ, chặn thực thể bịa, gắn nhãn → kiểm tra ATS
        alt Sai schema hoặc lỗi sau 3 lần
            AI-->>T: Result FAILED
            T->>DB: tailored_cvs.status = FAILED, ghi ai_calls
        else Có kết quả
            AI-->>T: TailoredDraft (READY hoặc NEEDS_REVIEW)
            T->>DB: INSERT tailored_cvs, tailored_sentences, sentence_evidence, ai_calls
            T->>FS: PDF (không có câu chờ xem lại, không có nhãn)
            opt NEEDS_REVIEW
                T->>DB: INSERT notifications ("Một câu cần bạn xem lại")
            end
        end
    end
```

## 4. Automatic application run

```mermaid
sequenceDiagram
    autonumber
    participant K as Worker (schedule)
    participant A as AutomationService
    participant AP as ApplicationService
    participant SB as Submitter (form / email)
    participant SRC as Trang tuyển dụng
    participant MAIL as Hộp thư ứng viên
    participant DB as PostgreSQL

    K->>A: run_for_user(user_id)
    A->>DB: automation_settings, số hồ sơ đã nộp hôm nay
    alt Tự động đang tắt hoặc đã hết hạn mức ngày
        A-->>K: bỏ qua
    else
        A->>DB: chọn job theo luật (điểm, chance ≠ LOW, chưa nộp, không loại trừ, CV READY/duyệt, ATS đạt)
        loop Tới khi hết hạn mức
            A->>AP: submit(user, posting, AUTO)
            AP->>DB: INSERT applications (QUEUED), UNIQUE chặn nộp trùng
            alt Kênh email
                AP->>SB: EmailSubmitter
                SB->>MAIL: gửi thư kèm PDF, cover letter, chứng chỉ
            else Kênh form
                AP->>SB: FormSubmitter
                SB->>SRC: điền và gửi form
                alt Gặp CAPTCHA hoặc bắt đăng nhập (BR-020)
                    SB-->>AP: manual_reason
                    AP->>DB: status = MANUAL_REQUIRED, tạo việc cần làm
                end
            end
            AP->>DB: status = SUBMITTED, submitted_at
        end
        A->>DB: INSERT notifications (tổng kết: đã nộp, cần nộp tay, lỗi)
    end
```

## 5. Inbox polling and reply classification

```mermaid
sequenceDiagram
    autonumber
    participant K as Worker (schedule)
    participant IW as InboxWatcher
    participant MAIL as Hộp thư ứng viên
    participant AI as acaj_ai
    participant AP as ApplicationService
    participant DB as PostgreSQL

    K->>IW: poll(user_id)
    IW->>MAIL: fetch_since(cursor) qua OAuth
    MAIL-->>IW: thư mới trong các chuỗi ứng tuyển
    loop Mỗi thư đến
        IW->>DB: INSERT mail_messages (UNIQUE provider_message_id: bỏ qua thư đã có)
        IW->>AI: classify_reply(thư đã che, min_confidence 0,8)
        AI-->>IW: nhãn + độ tin cậy (thư là dữ liệu, chỉ dẫn trong thư bị bỏ qua)
        IW->>AP: record_inbound(message, label)
        alt INTERVIEW hoặc OFFER
            AP->>DB: applications.status, application_outcomes
            IW->>AI: draft_reply(thư, ngữ cảnh hồ sơ)
            AI-->>IW: thư trả lời
            IW->>DB: INSERT reply_drafts (DRAFT), notifications
        else REJECTED
            AP->>DB: status = REJECTED, application_outcomes
        else UNKNOWN (độ tin cậy thấp)
            IW->>DB: notifications ("Có thư mới, hãy tự đọc")
        end
    end
```

## 6. Confirm and send a reply

```mermaid
sequenceDiagram
    autonumber
    actor U as Ứng viên
    participant W as Web Frontend
    participant R as applications/router
    participant AP as ApplicationService
    participant DB as PostgreSQL
    participant K as Worker (TaskRunner)
    participant MAIL as Hộp thư ứng viên

    U->>W: Bấm "Gửi thư trả lời"
    W-->>U: Hộp xác nhận: người nhận và nội dung
    U->>W: Bấm "Gửi thư"
    W->>R: POST /applications/{id}/reply-draft/confirmation
    R->>AP: confirm_reply(user, application_id)
    alt Hồ sơ của người khác
        AP-->>R: NotFound → 404 (BR-001)
    else Bản nháp đã gửi hoặc đã hủy
        AP-->>R: Conflict → 409
    else Hợp lệ
        AP->>DB: reply_drafts.status = CONFIRMED, confirmed_by, confirmed_at
        AP->>DB: audit_logs REPLY_CONFIRM, INSERT tasks (SEND_REPLY)
        R-->>W: 202 ReplyDraft (CONFIRMED)
    end
    K->>DB: claim SEND_REPLY
    K->>AP: send_reply(draft_id)
    AP->>AP: can_send()? chỉ khi CONFIRMED có người xác nhận
    AP->>MAIL: send(trong cùng chuỗi thư)
    AP->>DB: mail_messages (OUTBOUND), reply_drafts.status = SENT (CHECK ở database)
```

## 7. Revert one tailored sentence

```mermaid
sequenceDiagram
    autonumber
    actor U as Ứng viên
    participant W as Web Frontend
    participant R as tailoring/router
    participant T as TailoringService
    participant DB as PostgreSQL

    U->>W: Chọn câu, bấm "Hoàn tác về bản gốc"
    W->>R: PATCH /tailored-cvs/{id}/sentences/{sid} {action: REVERT}
    R->>T: update_sentence(user, sid, REVERT)
    alt Câu ORIGINAL (không có gì để hoàn tác)
        T-->>R: 400
    else
        T->>DB: tailored_sentences.state = REVERTED, text = original_text (hoặc bỏ câu INFERRED)
        T->>DB: ai_feedback (SENTENCE, NOT_USEFUL), audit_logs SENTENCE_REVERT
        T->>DB: INSERT tasks: dựng lại PDF
        R-->>W: 200 TailoredSentence
    end
    W-->>U: Câu hiện lại bản gốc, tỉ lệ hoàn tác hiện ở màn Chất lượng AI
```

## 8. Collect job postings from the market

Hai giai đoạn tách nhau: **thu thập** (không gọi LLM, chỉ lấy và chuẩn hóa dữ liệu thô) và **phân tích JD** (gọi `acaj_ai`). LLM lỗi thì job vẫn được lưu, chỉ chưa có yêu cầu đã phân tích (BR-012).

```mermaid
flowchart LR
    SCH(["schedule.py<br/>COLLECT_JOBS"]) --> SRC["Mỗi nguồn đang bật<br/>(job_sources.enabled)"]
    SRC --> FETCH["Collector lấy danh sách<br/>và trang chi tiết"]
    FETCH --> NORM["Chuẩn hóa<br/>URL · công ty · địa điểm · lương · cấp độ"]
    NORM --> UPSERT["UPSERT job_postings<br/>UNIQUE (source_id, external_id)"]
    UPSERT --> AN["ANALYZE_JD<br/>yêu cầu + nhận định có trích dẫn, embedding"]
    AN --> NEXT["SCORE_MATCHES<br/>COMPUTE_MARKET"]
    UPSERT --> EXP["Đánh dấu EXPIRED<br/>job hết hạn / không còn truy cập"]
```

### 8.1 Collect (`COLLECT_JOBS`)

```mermaid
sequenceDiagram
    autonumber
    participant K as Worker (schedule)
    participant JS as JobSourceService
    participant C as JobSourceCollector (topcv / linkedin / company_site)
    participant SITE as Trang nguồn job
    participant JI as JobIngestService
    participant DB as PostgreSQL

    K->>DB: claim COLLECT_JOBS
    K->>JS: collect_all()
    JS->>DB: job_sources WHERE enabled = true (BR-005)
    loop Mỗi nguồn (lỗi một nguồn không dừng nguồn khác)
        JS->>C: collect(source, since = last_collected_at)
        C->>SITE: đọc robots.txt, chỉ đi đường dẫn được phép
        loop Mỗi trang danh sách, giới hạn requests_per_minute
            C->>SITE: GET trang danh sách
            SITE-->>C: external_id, url, title, posted_at
            C->>SITE: GET trang chi tiết (chỉ tin mới hoặc đã đổi)
            SITE-->>C: HTML chi tiết
            C-->>JS: RawPosting (văn bản thô, không tin cậy, BR-013)
        end
        alt Nguồn lỗi (timeout, 429, đổi cấu trúc HTML)
            C-->>JS: SourceError
            JS->>DB: ghi lỗi vào tasks, giữ nguyên last_collected_at
        else Thành công
            JS->>JI: ingest(source, raw_postings)
            loop Mỗi tin
                JI->>JI: chuẩn hóa URL, tách lương, map địa điểm, work_mode, seniority, apply_channel
                JI->>DB: UPSERT companies theo tên
                JI->>DB: UPSERT job_postings ON CONFLICT (source_id, external_id) (BR-003)
                opt Tin mới hoặc description đã đổi
                    JI->>DB: analysis_status = PENDING, INSERT tasks (ANALYZE_JD)
                end
            end
            JI->>DB: tin quá expires_at hoặc trang trả 404/410 → status = EXPIRED (BR-004)
            JS->>DB: job_sources.last_collected_at = now()
        end
    end
    JS->>DB: INSERT tasks (COMPUTE_MARKET)
```

### 8.2 Analyze each JD (`ANALYZE_JD`)

```mermaid
sequenceDiagram
    autonumber
    participant K as Worker (TaskRunner)
    participant JA as JobAnalysisService
    participant AI as acaj_ai.analyze_jd
    participant LLM as LLM provider
    participant DB as PostgreSQL

    K->>DB: claim ANALYZE_JD (posting_id)
    K->>JA: analyze(posting_id)
    JA->>DB: job_postings.description, skill taxonomy
    JA->>AI: analyze_jd(description, taxonomy)
    AI->>LLM: prompt vN, JD trong khối dữ liệu (chỉ dẫn trong JD bị bỏ qua)
    LLM-->>AI: JSON yêu cầu + nhận định + vị trí trích dẫn
    AI->>AI: kiểm schema → loại mục không trỏ đúng đoạn JD (BR-009) → normalize_skills
    alt Sai schema hoặc lỗi sau 3 lần
        AI-->>JA: Result FAILED
        JA->>DB: analysis_status = FAILED, ghi ai_calls
    else Có kết quả
        AI-->>JA: JdAnalysis
        JA->>AI: embed(title + yêu cầu)
        JA->>DB: thay job_requirements, jd_insights; embedding; analysis_status = READY; ai_calls
        JA->>DB: INSERT tasks (SCORE_MATCHES) cho CV chính có bật tự động
    end
```

| Quy tắc | Áp dụng ở bước | Rule |
|---|---|---|
| Chỉ nguồn được phép, tôn trọng robots và tần suất; Admin tắt nguồn có hiệu lực từ lần chạy sau | 8.1 bước 3–5 | BR-005 |
| Không trùng job: `(source_id, external_id)` hoặc URL chuẩn hóa | 8.1 UPSERT | BR-003 |
| Hết hạn hoặc không truy cập được → `EXPIRED`, không gợi ý, không nộp | 8.1 cuối vòng | BR-004 |
| JD là văn bản không tin cậy, chỉ được đưa vào prompt như dữ liệu | 8.1, 8.2 | BR-013 |
| Mọi yêu cầu và nhận định trỏ về đoạn JD làm căn cứ | 8.2 | BR-009 |
| Con số thị trường tính bằng thống kê trên `job_postings` đã thu thập, không do LLM | `COMPUTE_MARKET` | BR-006 |

Câu hỏi mở: điều khoản thu thập của TopCV/LinkedIn chưa chốt ([Q4](../../01-scope.md)). Nguồn nào chưa được phép thì để `enabled = false`.
