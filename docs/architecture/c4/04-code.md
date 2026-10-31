# C4 Level 4 — Code

> **Purpose:** cho thấy các lớp Python cộng tác thế nào trong hai tính năng cốt lõi: **Matching** (luật, không LLM) và **Tối ưu CV cho từng job** (LLM có kiểm chứng). Cả hai chạy trong Automation Worker; người dùng đọc kết quả qua Backend API.

Tên lớp là thiết kế mục tiêu, nằm trong các module FastAPI ([folder structure](../../07-folder-structure.md#3-backend--fastapi-one-codebase-for-api-and-worker)) và package `acaj_ai`. Chi tiết thuộc tính và phương thức: [class diagrams](../uml/01-class-diagrams.md).

## L4.1 Matching

```mermaid
flowchart TB
    runner["TaskRunner<br/><i>tasks/runner.py</i><br/>claims SCORE_MATCHES"]
    handler["score_matches_task<br/><i>matching/tasks.py</i>"]
    svc["MatchingService<br/><i>matching/service.py</i><br/>prefilter, score, persist"]
    pre["CandidateFinder<br/><i>matching/prefilter.py</i><br/>pgvector top-300 + MUST overlap"]
    cov["SkillCoverage<br/><i>matching/coverage.py</i><br/>credit per requirement"]
    tax["TaxonomyService<br/><i>taxonomy/service.py</i><br/>skill_inferences lookup"]
    scorer["MatchScorer<br/><i>matching/scorer.py</i><br/>pure function: 4 factors → score"]
    chance["ChanceRule<br/><i>matching/chance.py</i><br/>thresholds + downgrades"]
    settings["SettingsRepository<br/>weights, thresholds, version"]
    repo["MatchRepository<br/>upsert matches"]
    next["TaskQueue.enqueue(OPTIMIZE_CV)<br/>for HIGH / MEDIUM jobs"]

    runner --> handler --> svc
    svc --> pre
    svc --> cov --> tax
    svc --> scorer
    svc --> chance
    svc --> settings
    svc --> repo
    svc --> next

    style scorer fill:#1168bd,color:#fff
    style chance fill:#1168bd,color:#fff
    style cov fill:#1168bd,color:#fff
```

- `MatchScorer` và `ChanceRule` là hàm thuần: cùng đầu vào luôn cho cùng kết quả, không I/O, không LLM. Test đơn vị bao phủ ≥ 90% (NFR-MAINT-001).
- `MatchingService` ghi điểm trước rồi mới tạo việc `OPTIMIZE_CV`, nên điểm không phụ thuộc LLM (BR-012).

## L4.2 CV tailoring

```mermaid
flowchart TB
    runner["TaskRunner<br/>claims OPTIMIZE_CV"]
    handler["optimize_cv_task<br/><i>tailoring/tasks.py</i>"]
    svc["TailoringService<br/><i>tailoring/service.py</i>"]
    builder["EvidenceBuilder<br/><i>tailoring/evidence.py</i><br/>facts + requirements + inferences"]
    quota["UsageLimiter<br/><i>tasks/quota.py</i><br/>daily token quota"]
    tailor["acaj_ai.tailor_cv"]
    mask["PiiMasker"]
    gen["CvTailor<br/>LLMClient + prompt vN"]
    schema["OutputSchemaValidator"]
    ground["GroundingValidator"]
    ats["AtsChecker"]
    repo["TailoredCvRepository<br/>tailored_cvs, sentences, evidence"]
    usage["AiCallRepository<br/>ai_calls"]
    pdf["PdfRenderer<br/>store pdf_key"]
    notify["NotificationService<br/>when NEEDS_REVIEW"]

    runner --> handler --> svc
    svc --> quota
    svc --> builder
    svc --> tailor
    tailor --> mask --> gen --> schema --> ground --> ats
    svc --> repo
    svc --> usage
    svc --> pdf
    svc --> notify

    style tailor fill:#7b3fbf,color:#fff
    style gen fill:#7b3fbf,color:#fff
    style mask fill:#2e7d32,color:#fff
    style schema fill:#2e7d32,color:#fff
    style ground fill:#2e7d32,color:#fff
```

- `EvidenceBuilder` chỉ đưa vào bundle các dòng `skill_inferences` thật, nên LLM không thể "suy ra" kỹ năng ngoài phả hệ (BR-008).
- Mọi kết quả, kể cả `FAILED`, đều ghi `ai_calls` để tính hạn mức và chi phí (BR-016).
- Bản CV `NEEDS_REVIEW` vẫn được lưu; câu chờ xem lại bị bỏ khi xuất PDF gửi đi.
