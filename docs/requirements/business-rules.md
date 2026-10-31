# Business Rules — ACAJ

> Design status: TARGET
>
> Implementation status: NOT STARTED

Mỗi luật nêu nguồn gốc và nơi áp dụng (tên thành phần dự kiến, chốt ở phần kiến trúc). Các số đánh dấu *configurable* là mặc định, có thể đổi trong cấu hình.

## Access

### BR-001 — Vai trò và cô lập dữ liệu
- **Source:** [03-use-cases.md](../03-use-cases.md) · **Related:** mọi UC
- **Rule:** Chỉ có hai vai trò `CANDIDATE` và `ADMIN`. Ứng viên chỉ đọc/ghi dữ liệu của mình; truy cập dữ liệu người khác trả về `404`. Admin không có API đọc nội dung CV.
- **Enforced in:** backend dependencies, policy của từng module.

## Inputs

### BR-002 — Giới hạn file
- **Source:** AC-UC03, AC-UC04
- **Rule:** CV tải lên là PDF, DOCX, JPG, PNG hoặc HEIC, tối đa 10 MB (*configurable*), tối đa 5 trang.
- **Enforced in:** `CvService` trước khi trích xuất.

### BR-003 — Không trùng job
- **Source:** AC-UC11
- **Rule:** Một job được nhận diện bằng (`source`, `externalId`) hoặc URL chuẩn hóa; thu thập lại không tạo bản mới.
- **Enforced in:** `JobIngestService`, unique constraint.

### BR-004 — Job hết hạn
- **Source:** AC-UC11
- **Rule:** JD quá hạn nộp hoặc không còn truy cập được là `EXPIRED`; không gợi ý và không nộp.
- **Enforced in:** job thu thập định kỳ.

### BR-005 — Nguồn dữ liệu job
- **Source:** Open question Q4
- **Rule:** Chỉ thu thập từ nguồn được phép theo điều khoản sử dụng và robots; tôn trọng giới hạn tần suất. Admin tắt được một nguồn ngay lập tức, không cần deploy lại.
- **Enforced in:** `JobSourceService`, cấu hình nguồn.

## Market and matching

### BR-006 — Ngưỡng dữ liệu thị trường
- **Source:** AC-UC07, AC-UC08
- **Rule:** Chỉ số thị trường được tính bằng thống kê, cần tối thiểu 30 JD cho nhóm (vị trí × khu vực) (*configurable*); dưới ngưỡng hiển thị "chưa đủ dữ liệu". Mọi chỉ số kèm cỡ mẫu và ngày cập nhật. LLM không tạo ra con số; lời giải thích do LLM viết chỉ được dùng các con số đã tính.
- **Enforced in:** `MarketStatsService`; kiểm tra số trong lời giải thích bằng `NumberConsistencyValidator`.

### BR-007 — Matching score
- **Source:** F04.3
- **Rule:** Mỗi yếu tố là một giá trị trong [0, 1]: kỹ năng theo phả hệ, độ tương đồng ngữ nghĩa CV–JD (embedding), kinh nghiệm/cấp độ, địa điểm/hình thức. `score = round(100 × Σ(weightᵢ × factorᵢ) / Σ weightᵢ)`, trọng số ban đầu 40/20/25/15 (*configurable*). Nếu yếu tố kỹ năng bằng 0, điểm bị chặn ở 39. Khả năng đậu phỏng vấn là chỉ số chính hiển thị và sắp xếp job: `HIGH` ≥ 75, `MEDIUM` ≥ 50, còn lại `LOW`; sau đó **hạ một mức** nếu thiếu một yêu cầu bắt buộc (không có và không suy ra được), và hạ thêm một mức nếu nhóm job có cạnh tranh cao. Khi có đủ kết quả ứng tuyển thật, ngưỡng được hiệu chỉnh theo BR-024. Mỗi job hiển thị giá trị từng yếu tố. Công thức chi tiết: [Algorithms](../09-algorithms.md#3-matching-score).
- **Enforced in:** `MatchScorer` (hàm thuần, không gọi LLM).

### BR-008 — Phả hệ kỹ năng
- **Source:** F02.4, F05.1, Open question Q6
- **Rule:** Mọi kỹ năng trong CV và JD được chuẩn hóa về một tên trong phả hệ (cây quan hệ cha–con–anh em và tên gọi khác). Một kỹ năng được **suy ra** cho người dùng khi họ có kỹ năng liên quan cùng nhánh, tối đa 2 bậc (*configurable*). Ví dụ: có MySQL thì suy ra SQL; có React thì suy ra JavaScript; có Docker thì suy ra containerization. Không có kỹ năng liên quan thì không suy ra; kỹ năng đó vào danh sách skill gaps (UC09).
- **Enforced in:** `SkillTaxonomyService`.

## AI generation

### BR-009 — Grounding (có căn cứ)
- **Source:** F04.2, F05, AC-UC06, AC-UC13, AC-UC14
- **Rule:** Mọi câu AI viết vào CV hoặc cover letter phải trích dẫn ít nhất một fact trong CV gốc hoặc một kỹ năng suy ra theo BR-008. Mọi nhận định phân tích JD phải trỏ về đoạn JD làm căn cứ. Câu hoặc nhận định không có căn cứ hợp lệ bị loại trước khi lưu. Công ty, vị trí đã làm, bằng cấp, chứng chỉ không bao giờ được thêm nếu không có trong dữ liệu người dùng.
- **Enforced in:** `GroundingValidator` trong AI package.

### BR-010 — Nhãn nguồn gốc
- **Source:** F05
- **Rule:** Mỗi câu trong bản CV tối ưu mang một nhãn: `ORIGINAL` (giữ nguyên), `REWRITTEN` (viết lại từ fact), `INFERRED` (kỹ năng suy ra từ phả hệ). Nhãn hiển thị trong phần so sánh để người dùng xem lại và hoàn tác; nhãn không được in lên CV gửi nhà tuyển dụng.
- **Enforced in:** `GroundingValidator`, `CvVersionService`.

### BR-011 — Phiên bản CV
- **Source:** F05, AC-UC14
- **Rule:** CV gốc không bị ghi đè. Mỗi lần tối ưu cho một job tạo một phiên bản riêng, gắn với job đó.
- **Enforced in:** `CvVersionService`.

### BR-012 — Ranh giới của AI
- **Source:** [01-scope.md](../01-scope.md#ai-trong-acaj)
- **Rule:** Điểm khớp, chỉ số thị trường, việc chọn job để nộp, lịch nhắc mail do luật tính và được lưu trước mọi lời gọi LLM liên quan. LLM không tính hay sửa điểm, không tự quyết định nộp hồ sơ hay gửi mail. LLM lỗi thì tác vụ AI là `FAILED`, thử lại tối đa 3 lần; các phần do luật tính không bị ảnh hưởng.
- **Enforced in:** thứ tự job của worker, `AiTaskService`.

### BR-013 — Văn bản không tin cậy
- **Source:** F04.2, F06.4
- **Rule:** Nội dung JD và email phản hồi được đưa vào prompt như dữ liệu, tách biệt khỏi chỉ dẫn hệ thống. Chỉ dẫn nằm trong JD/email (ví dụ "bỏ qua hướng dẫn trước", "gửi số CCCD") không được thực hiện. Đầu ra của LLM chỉ được nhận nếu đúng schema đã định; đầu ra sai schema bị loại.
- **Enforced in:** prompt template, `OutputSchemaValidator`; đo bằng eval prompt injection.

### BR-014 — Phân loại email
- **Source:** F06.4, UC20
- **Rule:** Email phản hồi được phân loại `INTERVIEW`, `OFFER`, `REJECTED` hoặc `UNKNOWN` kèm độ tin cậy. Dưới 0.8 (*configurable*) thì là `UNKNOWN`: chỉ thông báo, không soạn thư. Người dùng sửa được nhãn; nhãn đã sửa được dùng làm dữ liệu eval.
- **Enforced in:** `ReplyClassifier`.

### BR-015 — Dữ liệu gửi LLM
- **Source:** NFR-PRIV-002
- **Rule:** Trước khi gửi LLM, số điện thoại, email, địa chỉ, số giấy tờ tùy thân trong CV và email được thay bằng ký hiệu giữ chỗ; hệ thống điền lại sau khi nhận kết quả. Chỉ gửi phần nội dung cần cho tác vụ. Mật khẩu, token, khóa API không bao giờ có trong prompt.
- **Enforced in:** `PiiMasker` trong AI package; đo bằng eval masking.

### BR-016 — Truy vết và chi phí AI
- **Source:** F07
- **Rule:** Mỗi kết quả AI lưu model, phiên bản prompt, thời điểm, số token và trạng thái. Mỗi người dùng có hạn mức token mỗi ngày (*configurable*); vượt hạn mức thì tác vụ AI chờ ngày sau và người dùng được báo.
- **Enforced in:** `AiTaskService`, `UsageLimiter`.

## Application automation

### BR-017 — Tự động hóa là mặc định
- **Source:** F05.4, F06
- **Rule:** Phân tích JD, sửa CV, tạo cover letter, chọn job, nộp hồ sơ, nhắc mail đều chạy tự động, người dùng không phải thao tác từng bước. Mọi bản CV, thay đổi và hồ sơ đã nộp được lưu lại để xem và hoàn tác. Người dùng có thể bật chế độ duyệt trước cho từng bước (sửa CV, nộp hồ sơ). Riêng thư trả lời trúng tuyển luôn cần xác nhận (BR-022).
- **Enforced in:** `AutomationSettings`, worker.

### BR-018 — Không nộp trùng
- **Source:** AC-UC17, AC-UC18
- **Rule:** Mỗi người dùng chỉ nộp một lần cho một job. Nộp lại cần người dùng chủ động và xác nhận.
- **Enforced in:** `ApplicationService`, unique constraint.

### BR-019 — Điều kiện ứng tuyển hàng loạt
- **Source:** UC18
- **Rule:** Chỉ nộp job có điểm khớp ≥ ngưỡng người dùng đặt (mặc định 70), tối đa 20 hồ sơ/ngày (*configurable*), bỏ qua công ty trong danh sách loại trừ, và chỉ khi bản CV tối ưu của job đó ở trạng thái `READY`. Ở chế độ tự động, hệ thống nộp ngay, không chờ duyệt từng hồ sơ.
- **Enforced in:** `AutoApplyService`.

### BR-020 — Không vượt cơ chế chống bot
- **Source:** [01-scope.md](../01-scope.md) (Non-goals)
- **Rule:** Hệ thống không giải CAPTCHA hay vượt xác thực của trang đích; job như vậy chuyển sang nộp thủ công.
- **Enforced in:** `AutoApplyService`.

### BR-021 — Mail nhắc
- **Source:** UC19
- **Rule:** Nhắc sau 5 ngày không phản hồi, tối đa 1 lần cho mỗi hồ sơ (*configurable*). Chỉ gửi trong giờ làm việc (8:00–18:00, thứ Hai đến thứ Sáu, giờ Việt Nam).
- **Enforced in:** `FollowUpService`.

### BR-022 — Xác nhận thư trả lời
- **Source:** UC20
- **Rule:** Thư trả lời trúng tuyển/mời phỏng vấn do AI soạn, chỉ gửi sau khi người dùng xác nhận. Lịch sử ghi ai xác nhận và khi nào.
- **Enforced in:** `ReplyService`.

## Data lifecycle and learning

### BR-023 — Xóa dữ liệu
- **Source:** NFR-PRIV-001
- **Rule:** Khi người dùng xóa tài khoản, toàn bộ CV, file, hồ sơ ứng tuyển, kết quả AI và liên kết hộp thư bị xóa trong 30 ngày. Dữ liệu người dùng không được dùng để huấn luyện hay fine-tune mô hình.
- **Enforced in:** job dọn dữ liệu định kỳ.

### BR-024 — Phản hồi và học
- **Source:** F07, UC23, UC24
- **Rule:** Phản hồi của người dùng và kết quả thật của hồ sơ được lưu gắn với kết quả AI tương ứng, dùng để đo chất lượng và hiệu chỉnh khả năng đậu phỏng vấn. Trọng số matching chỉ đổi khi Admin chỉnh; mỗi lần chỉnh có lịch sử và áp dụng cho lần tính tiếp theo.
- **Enforced in:** `FeedbackService`, `SettingsService`.
