# Class diagrams

> **Status:** Target design · Python classes inside the FastAPI modules and `acaj_ai`

Ba sơ đồ dưới đây phủ ba phần quan trọng nhất: **Matching**, **Tối ưu CV cho từng job**, và **Tự động ứng tuyển và thư phản hồi**. Repository và client bên ngoài là interface (`Protocol`); implementation được gắn ở `core/container.py`, test thay bằng bản giả ([folder structure](../../07-folder-structure.md#rules)).

## 1. Matching

```mermaid
classDiagram
    direction LR
    class MatchingService {
        -CandidateFinder finder
        -SkillCoverage coverage
        -MatchScorer scorer
        -ChanceRule chance
        -MatchRepository matches
        -SettingsRepository settings
        -TaskQueue tasks
        +score_cv(cv_id) list~MatchResult~
    }
    class CandidateFinder {
        -JobPostingRepository postings
        +find(cv) list~PostingRef~
    }
    class SkillCoverage {
        -TaxonomyService taxonomy
        +credits(cv_skills, requirements) list~Credit~
        +skill_factor(credits) float
        +missing_must(credits) list~str~
    }
    class TaxonomyService {
        -SkillRepository skills
        +credit_of(candidate_skills, skill_id) float
        +recompute_inferences(max_depth) int
    }
    class MatchScorer {
        <<pure>>
        +factors(cv, posting, credits) Factors
        +score(factors, weights, gate_cap) int
    }
    class ChanceRule {
        <<pure>>
        +level(score, missing_must, competition, thresholds) InterviewChance
    }
    class Factors {
        +float skill
        +float semantic
        +float experience
        +float location
    }
    class MatchResult {
        +UUID cv_id
        +UUID posting_id
        +int score
        +InterviewChance chance
        +Factors factors
        +int weights_version
    }
    class MatchRepository {
        <<interface>>
        +upsert(results) None
        +list_for_cv(cv_id, min_chance, page) Page~MatchResult~
    }
    class InterviewChance {
        <<enumeration>>
        HIGH
        MEDIUM
        LOW
    }

    MatchingService --> CandidateFinder
    MatchingService --> SkillCoverage
    MatchingService --> MatchScorer
    MatchingService --> ChanceRule
    MatchingService --> MatchRepository
    SkillCoverage --> TaxonomyService
    MatchScorer ..> Factors
    MatchingService ..> MatchResult
    MatchResult --> InterviewChance
```

## 2. CV tailoring

```mermaid
classDiagram
    direction LR
    class TailoringService {
        -EvidenceBuilder evidence
        -UsageLimiter quota
        -TailoredCvRepository tailored
        -AiCallRepository calls
        -PdfRenderer pdf
        +optimize(cv_id, posting_id) TailoredCvRef
        +update_sentence(user_id, sentence_id, action, text) TailoredSentence
        +approve(user_id, tailored_cv_id) None
    }
    class EvidenceBuilder {
        -CvRepository cvs
        -JobPostingRepository postings
        -TaxonomyService taxonomy
        +build(cv_id, posting_id) EvidenceBundle
    }
    class EvidenceBundle {
        +list~Fact~ facts
        +list~Requirement~ requirements
        +list~Inference~ inferences
        +TargetJob target
        +ids() set~str~
    }
    class CvTailor {
        -LLMClient client
        -str prompt_version
        +draft(bundle) RawDraft
    }
    class GroundingValidator {
        +validate(raw, bundle) TailoredDraft
        -check_ids(sentence, bundle) list~str~
        -hard_entities_supported(sentence, cited) bool
        -support_ratio(sentence, cited) float
    }
    class AtsChecker {
        <<pure>>
        +check(draft, requirements) AtsReport
    }
    class PiiMasker {
        +mask(text) MaskedText
        +restore(text, mapping) str
    }
    class OutputSchemaValidator {
        +parse(raw_json, schema) dict
    }
    class LLMClient {
        <<interface>>
        +complete(prompt, schema) LlmResponse
        +embed(texts) list~Vector~
    }
    class TailoredDraft {
        +list~DraftSentence~ sentences
        +list~DroppedSentence~ dropped
        +str cover_letter
        +AtsReport ats
        +status() AiStatus
    }
    class DraftSentence {
        +str section
        +str text
        +Provenance provenance
        +bool needs_review
        +list~str~ evidence_ids
    }
    class Provenance {
        <<enumeration>>
        ORIGINAL
        REWRITTEN
        INFERRED
    }

    TailoringService --> EvidenceBuilder
    TailoringService ..> CvTailor : via acaj_ai.tailor_cv
    EvidenceBuilder ..> EvidenceBundle
    CvTailor --> LLMClient
    CvTailor --> PiiMasker
    CvTailor --> OutputSchemaValidator
    CvTailor ..> GroundingValidator
    GroundingValidator ..> TailoredDraft
    TailoredDraft --> DraftSentence
    DraftSentence --> Provenance
    GroundingValidator ..> AtsChecker
```

## 3. Automation and replies

```mermaid
classDiagram
    direction LR
    class AutomationService {
        -AutomationSettingsRepository settings
        -MatchRepository matches
        -ApplicationService applications
        +run_for_user(user_id) RunSummary
        +pipeline_status(user_id) list~StepState~
    }
    class ApplicationService {
        -ApplicationRepository applications
        -SubmitterRegistry submitters
        -MailClientFactory mail
        +submit(user_id, posting_id, mode) Application
        +send_follow_up(application_id) None
        +record_inbound(message) Application
        +confirm_reply(user_id, application_id) ReplyDraft
        +send_reply(draft_id) None
    }
    class Submitter {
        <<interface>>
        +submit(posting, pdf, cover_letter, attachments) SubmitResult
    }
    class FormSubmitter {
        +submit(posting, pdf, cover_letter, attachments) SubmitResult
    }
    class EmailSubmitter {
        +submit(posting, pdf, cover_letter, attachments) SubmitResult
    }
    class MailClient {
        <<interface>>
        +send(to, subject, body, attachments, thread_id) str
        +fetch_since(cursor) list~InboundMail~
    }
    class InboxWatcher {
        -MailClientFactory mail
        -ReplyClassifier classifier
        -ReplyDrafter drafter
        +poll(user_id) int
    }
    class ReplyClassifier {
        +classify(message, min_confidence) ReplyLabel
    }
    class ReplyDrafter {
        +draft(message, context) ReplyText
    }
    class ReplyDraft {
        +UUID id
        +DraftStatus status
        +UUID confirmed_by
        +datetime confirmed_at
        +can_send() bool
    }
    class SubmitResult {
        +bool submitted
        +str manual_reason
    }

    AutomationService --> ApplicationService
    ApplicationService --> Submitter
    Submitter <|.. FormSubmitter
    Submitter <|.. EmailSubmitter
    ApplicationService --> MailClient
    InboxWatcher --> MailClient
    InboxWatcher --> ReplyClassifier
    InboxWatcher --> ReplyDrafter
    InboxWatcher ..> ApplicationService : record_inbound
    ApplicationService ..> ReplyDraft
    Submitter ..> SubmitResult
```

`ReplyDraft.can_send()` trả `true` chỉ khi `status = CONFIRMED` và có `confirmed_by`, `confirmed_at`. Database có ràng buộc tương ứng ([checks.sql](../../database/checks.sql)), nên kể cả code sai cũng không ghi được `SENT` khi chưa xác nhận (BR-022).

## Mapping boundaries

| Layer | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| API (`schemas.py`) | Pydantic, khớp [openapi.yaml](../../api/openapi.yaml) | camelCase ra ngoài |
| Service | Dataclass / Pydantic nội bộ (`MatchResult`, `TailoredDraft`) | Không lộ ORM ra ngoài service |
| Repository | SQLAlchemy model trong `models.py` | Khớp [acaj.dbml](../../database/acaj.dbml) |
| `acaj_ai` | Pydantic bất biến (`EvidenceBundle`, `Result`) | Không biết tới ORM hay database |
