# API documentation

> Design status: TARGET
>
> Contract: [`openapi.yaml`](openapi.yaml) (OpenAPI 3.0.3, 53 operations, validated with `openapi-spec-validator`)

Hợp đồng được suy ra từ use case ([Actors, roles, use cases](../03-use-cases.md)), màn hình ([Information architecture](../04-information-architecture.md)) và mô hình dữ liệu ([Data model](../06-data-model.md)).

## Conventions

| Topic | Rule |
|---|---|
| Base path | `/api/v1` |
| Format | JSON (`application/json`); upload file dùng `multipart/form-data` |
| Authentication | `Authorization: Bearer <JWT>` lấy từ `login`, hết hạn sau 30 phút (NFR-SEC-001) |
| Authorization | Mỗi thao tác khai báo vai trò được gọi trong `x-roles`; backend kiểm tra. Dữ liệu của người khác trả về `404` (BR-001) |
| AI work | Thao tác khởi động việc AI trả về `202` kèm `TaskAccepted`; tài nguyên có trường `status` kiểu `AiStatus` (`PENDING`, `READY`, `NEEDS_REVIEW`, `FAILED`). Frontend hỏi lại cho tới trạng thái cuối |
| Time | ISO 8601 có múi giờ; giao diện hiển thị theo múi giờ người xem |
| Pagination | `page` (từ 1), `pageSize` (mặc định 20, tối đa 100); phản hồi có `page`, `pageSize`, `total`, `items` |
| Errors | `application/problem+json` với `title`, `status`, `traceId` và `errors` theo trường. `401` đưa về trang đăng nhập; `403` hiện trang Forbidden; `429` khi quá giới hạn đăng nhập hoặc hết hạn mức token AI trong ngày |
| Files | Không trả file trực tiếp; trả link có chữ ký hết hạn sau 15 phút (`SignedLink`) |

## Domain rules reflected in the contract

- `Match` gồm `chance` (khả năng đậu phỏng vấn, chỉ số chính), `score` 0–100 và giá trị 4 yếu tố. Tất cả do công thức tính; không có thao tác nào để LLM tạo hay sửa điểm (BR-007, BR-012).
- `listJobs` sắp theo `chance` rồi `score`. Admin nhận job không có `match`.
- Mỗi câu trong `TailoredCv` có `provenance` (`ORIGINAL`, `REWRITTEN`, `INFERRED`) và danh sách `evidence`; câu `needsReview = true` không được dùng khi nộp (BR-009, BR-010).
- Mỗi yêu cầu và nhận định trong `JobDetail` có `quote` trỏ vào đoạn JD (BR-009).
- `createApplication` trả `409` khi đã nộp job đó (BR-018), hoặc khi bản CV chưa `READY` / chưa được duyệt ở chế độ `REVIEW_FIRST`.
- **Thư trả lời chỉ được gửi qua `confirmReplyDraft`.** Không có thao tác nào khác gửi thư thay người dùng (BR-022).
- `updateAutomation` trả `409` nếu bật tự động khi chưa kết nối hộp thư. Các điều kiện đều có mặc định (BR-017, BR-019).
- `getMarketInsights` trả `enoughData = false` cho phần dưới ngưỡng dữ liệu; các câu tóm tắt do AI viết chỉ dùng con số trong cùng phản hồi (BR-006).
- Hệ thống chỉ nộp qua kênh công khai; job cần CAPTCHA có trạng thái `MANUAL_REQUIRED` kèm `manualReason` (BR-020).

## Operations

| Tag | Method | Path | operationId | Purpose | Allowed roles |
|---|---|---|---|---|---|
| Health | `GET` | `/health` | `getHealth` | Health check of API, database and worker | Public |
| Auth | `POST` | `/auth/register` | `register` | Create a candidate account (UC01) | Public |
| Auth | `POST` | `/auth/login` | `login` | Log in (UC02) | Public |
| Auth | `POST` | `/auth/logout` | `logout` | Log out (UC02) | Candidate, Admin |
| Account | `GET` | `/account` | `getAccount` | Own account (SCR-50) | Candidate, Admin |
| Account | `PUT` | `/account` | `updateAccount` | Update name and language; the role cannot be changed here | Candidate, Admin |
| Account | `DELETE` | `/account` | `deleteAccount` | Delete the account; all personal data is purged within 30 days (BR-023) | Candidate |
| Account | `POST` | `/account/password` | `changePassword` | Change own password | Candidate, Admin |
| Mailbox | `GET` | `/account/mailbox` | `getMailbox` | Connected mailbox, if any | Candidate |
| Mailbox | `DELETE` | `/account/mailbox` | `disconnectMailbox` | Disconnect the mailbox and revoke tokens; automation pauses | Candidate |
| Mailbox | `POST` | `/account/mailbox/connect` | `startMailboxConnection` | Start OAuth with Gmail or Outlook; returns the provider URL | Candidate |
| Mailbox | `POST` | `/account/mailbox/callback` | `completeMailboxConnection` | Finish OAuth; tokens are stored encrypted (NFR-SEC-006) | Candidate |
| CVs | `GET` | `/cvs` | `listCvs` | Own CVs (SCR-10) | Candidate |
| CVs | `POST` | `/cvs` | `uploadCv` | Upload a PDF, DOCX or image; AI extraction runs in the background (UC03, UC04) | Candidate |
| CVs | `POST` | `/cvs/template` | `createCvFromTemplate` | Create a CV from a template, filled by hand or drafted by AI from raw information (UC05, UC06) | Candidate |
| CVs | `GET` | `/cvs/{cvId}` | `getCv` | CV with its facts and extraction status (SCR-11, SCR-13) | Candidate |
| CVs | `PATCH` | `/cvs/{cvId}` | `updateCv` | Set targets (role, seniority, location, work mode, salary) or make it the primary CV | Candidate |
| CVs | `PUT` | `/cvs/{cvId}/facts` | `replaceCvFacts` | Save the reviewed facts; matching and tailoring are recomputed | Candidate |
| CVs | `GET` | `/cvs/{cvId}/pdf` | `getCvPdf` | Signed link to the CV as PDF, valid 15 minutes (NFR-PRIV-003) | Candidate |
| Attachments | `GET` | `/attachments` | `listAttachments` | Own certificates (TOEIC, IELTS…) | Candidate |
| Attachments | `POST` | `/attachments` | `uploadAttachment` | Upload a certificate to attach to applications (UC16) | Candidate |
| Market | `GET` | `/market/insights` | `getMarketInsights` | CV compared with the market — demand, salary, skill gaps, roadmap (UC07–UC10, SCR-20) | Candidate |
| Jobs | `GET` | `/jobs` | `listJobs` | Job postings with interview chance for the primary CV, sorted by chance then score (UC12, SCR-30) | Candidate, Admin |
| Jobs | `GET` | `/jobs/{jobId}` | `getJob` | Posting, JD analysis with quotes, and factor values (UC13, SCR-31) | Candidate, Admin |
| Tailored CVs | `GET` | `/jobs/{jobId}/tailored-cv` | `getTailoredCv` | Latest CV tailored for this job, with provenance and evidence per sentence (UC14–UC16, SCR-32) | Candidate |
| Tailored CVs | `POST` | `/jobs/{jobId}/tailored-cv` | `regenerateTailoredCv` | Optimize the CV for this job now (creates a new version) | Candidate |
| Tailored CVs | `PATCH` | `/tailored-cvs/{tailoredCvId}/sentences/{sentenceId}` | `updateTailoredSentence` | Keep, edit or revert one sentence; each revert is also recorded as feedback (UC15) | Candidate |
| Tailored CVs | `POST` | `/tailored-cvs/{tailoredCvId}/approval` | `approveTailoredCv` | Approve a tailored CV in REVIEW_FIRST mode (F05.5) | Candidate |
| Tailored CVs | `GET` | `/tailored-cvs/{tailoredCvId}/preview` | `getTailoredCvPreview` | The PDF the recruiter receives, ATS checks, and what was left out (SCR-33) | Candidate |
| Applications | `GET` | `/applications` | `listApplications` | Own applications (UC21, SCR-40) | Candidate |
| Applications | `POST` | `/applications` | `createApplication` | Apply to one job by hand with its tailored CV (UC17) | Candidate |
| Applications | `GET` | `/applications/{applicationId}` | `getApplication` | Application detail with timeline (SCR-41) | Candidate |
| Applications | `GET` | `/applications/{applicationId}/messages` | `listApplicationMessages` | Mail thread with AI labels on inbound mail (UC19, UC20) | Candidate |
| Applications | `PATCH` | `/applications/{applicationId}/messages/{messageId}/class` | `correctMessageClass` | Fix a wrong AI label; used as eval data (BR-014, UC23) | Candidate |
| Applications | `GET` | `/applications/{applicationId}/reply-draft` | `getReplyDraft` | Reply drafted by AI for the latest interview or offer mail (UC20) | Candidate |
| Applications | `PUT` | `/applications/{applicationId}/reply-draft` | `updateReplyDraft` | Edit the draft before confirming | Candidate |
| Applications | `POST` | `/applications/{applicationId}/reply-draft/confirmation` | `confirmReplyDraft` | Confirm and send the reply from the user's mailbox; the only way a reply is sent (BR-022) | Candidate |
| Automation | `GET` | `/automation` | `getAutomation` | Automation settings and the 8-step pipeline status (UC18, SCR-42) | Candidate |
| Automation | `PUT` | `/automation` | `updateAutomation` | Turn automation on or off and set conditions; defaults work without changes (BR-017, BR-019) | Candidate |
| Automation | `GET` | `/automation/activity` | `listAutomationActivity` | Activity log of the automation (SCR-42) | Candidate |
| Dashboard | `GET` | `/dashboard` | `getDashboard` | To-do items, best jobs, application pipeline, market summary (SCR-03) | Candidate |
| Feedback | `POST` | `/feedback` | `submitFeedback` | Rate an AI result; resubmitting replaces the previous verdict (UC23) | Candidate |
| Notifications | `GET` | `/notifications` | `listNotifications` | Notifications for the topbar panel | Candidate, Admin |
| Notifications | `POST` | `/notifications/{notificationId}/read` | `markNotificationRead` | Mark a notification as read | Candidate, Admin |
| Lookups | `GET` | `/lookups` | `getLookups` | Locations, industries and skill names for forms and filters | Candidate, Admin |
| Admin | `GET` | `/admin/job-sources` | `listJobSources` | Job sources and their collection status (SCR-60) | Admin |
| Admin | `POST` | `/admin/job-sources` | `createJobSource` | Add a job source (UC22) | Admin |
| Admin | `PATCH` | `/admin/job-sources/{sourceId}` | `updateJobSource` | Enable, disable or change rate limit; disabling stops the next collection (BR-005) | Admin |
| Admin | `GET` | `/admin/users` | `listUsers` | Users without CV content (BR-001, SCR-61) | Admin |
| Admin | `PATCH` | `/admin/users/{userId}/status` | `updateUserStatus` | Lock or unlock a user (UC22) | Admin |
| Admin | `GET` | `/admin/ai-quality` | `getAiQuality` | AI quality, latency and cost for a period (UC24, SCR-62) | Admin |
| Admin | `GET` | `/admin/matching-settings` | `getMatchingSettings` | Matching weights and interview-chance thresholds | Admin |
| Admin | `PUT` | `/admin/matching-settings` | `updateMatchingSettings` | Change weights and thresholds; recorded in the audit log and applied on the next scoring (BR-024) | Admin |

## Screen-to-API mapping

| Screen | API operations |
|---|---|
| `SCR-01` Đăng nhập, `SCR-02` Đăng ký | `login`, `register`, `logout` |
| `SCR-03` Tổng quan | `getDashboard`, `listNotifications`, `markNotificationRead`, `getAutomation` (trạng thái ở topbar) |
| `SCR-10`–`SCR-13` CV | `listCvs`, `uploadCv`, `createCvFromTemplate`, `getCv`, `replaceCvFacts`, `updateCv`, `getCvPdf`, `listAttachments`, `uploadAttachment` |
| `SCR-20` Phân tích CV so với thị trường | `getMarketInsights`, `submitFeedback` |
| `SCR-30` Việc làm | `listJobs`, `getLookups`, `submitFeedback` |
| `SCR-31` Chi tiết job | `getJob` |
| `SCR-32` Tối ưu CV cho từng job | `getTailoredCv`, `regenerateTailoredCv`, `updateTailoredSentence`, `approveTailoredCv`, `createApplication` |
| `SCR-33` Xem trước CV gửi đi | `getTailoredCvPreview`, `createApplication` |
| `SCR-40` Hồ sơ ứng tuyển | `listApplications` |
| `SCR-41` Chi tiết hồ sơ | `getApplication`, `listApplicationMessages`, `correctMessageClass`, `getReplyDraft`, `updateReplyDraft`, `confirmReplyDraft` |
| `SCR-42` Tự động ứng tuyển | `getAutomation`, `updateAutomation`, `listAutomationActivity`, `uploadCv` |
| `SCR-50` Tài khoản | `getAccount`, `updateAccount`, `changePassword`, `deleteAccount`, `getMailbox`, `startMailboxConnection`, `completeMailboxConnection`, `disconnectMailbox` |
| `SCR-60` Nguồn job | `listJobSources`, `createJobSource`, `updateJobSource` |
| `SCR-61` Người dùng | `listUsers`, `updateUserStatus` |
| `SCR-62` Chất lượng AI | `getAiQuality`, `getMatchingSettings`, `updateMatchingSettings` |

`getHealth` không thuộc màn nào; dùng cho giám sát (NFR-OBS-001).

## Open items

- Danh sách template CV (`templateId`) chưa chốt.
- Thông báo đang dùng hỏi lại (polling); có thể chuyển sang Server-Sent Events nếu cần thời gian thực.
- Giới hạn tần suất cho từng thao tác chưa định nghĩa, ngoài đăng nhập và hạn mức token AI.
