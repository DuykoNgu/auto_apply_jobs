# Business Rules — ACAJ

> Design status: TARGET
>
> Implementation status: NOT STARTED

Mỗi luật nêu nguồn gốc. Các số đánh dấu *configurable* là mặc định, có thể đổi trong cấu hình.

## Nội dung CV

### BR-001 — Thông tin trong CV và phả hệ kỹ năng
- **Source:** [01-scope.md](../01-scope.md) (Non-goals), AC-UC06, AC-UC14
- **Rule:**
  - Công ty, vị trí đã làm, bằng cấp, chứng chỉ: AI không được thêm; chỉ viết lại, sắp xếp và nhấn mạnh thông tin có trong dữ liệu người dùng.
  - Kỹ năng: AI được thêm hoặc nhấn mạnh một kỹ năng khi người dùng có kỹ năng đó, hoặc có kỹ năng liên quan trong **phả hệ kỹ năng** (cây quan hệ cha–con–anh em giữa các kỹ năng). Ví dụ: có MySQL thì thêm SQL; có React thì thêm JavaScript; có Docker thì thêm containerization.
  - Phạm vi suy ra: kỹ năng cùng nhánh trong phả hệ, tối đa 2 bậc (*configurable*). Không có kỹ năng liên quan thì không thêm; kỹ năng đó vào danh sách skill gaps (UC09).
  - Kỹ năng suy ra mang nhãn "suy ra", hiển thị trong phần so sánh với bản gốc, và người dùng xem lại, hoàn tác được (ở chế độ duyệt trước thì phải duyệt trước khi dùng). Nhãn này chỉ dùng trong ACAJ, không in lên CV.
- **Open question (Q6):** phả hệ kỹ năng lấy từ đâu (tự xây hay dùng bộ phân loại như ESCO/O*NET) và ai bảo trì.

### BR-002 — Phiên bản CV
- **Source:** F05, AC-UC14
- **Rule:** CV gốc không bị ghi đè. Mỗi lần tối ưu cho một job tạo một phiên bản riêng, gắn với job đó.

### BR-003 — Giới hạn file
- **Source:** AC-UC03, AC-UC04
- **Rule:** CV tải lên là PDF, DOCX, JPG, PNG hoặc HEIC, tối đa 10 MB (*configurable*).

## Dữ liệu job

### BR-007 — Không trùng job
- **Source:** AC-UC11
- **Rule:** Một job được nhận diện bằng (`source`, `externalId`) hoặc URL chuẩn hóa; thu thập lại không tạo bản mới.

### BR-008 — Job hết hạn
- **Source:** AC-UC11
- **Rule:** JD quá hạn nộp hoặc không còn truy cập được là `EXPIRED`; không gợi ý và không nộp.

### BR-011 — Ngưỡng dữ liệu thị trường
- **Source:** AC-UC07, AC-UC08
- **Rule:** Chỉ số thị trường cần tối thiểu 30 JD cho nhóm (vị trí × khu vực) (*configurable*); dưới ngưỡng hiển thị "chưa đủ dữ liệu". Mọi chỉ số kèm cỡ mẫu và ngày cập nhật.

### BR-015 — Matching score
- **Source:** F04.3
- **Rule:** Điểm 0–100 là tổng có trọng số của ba yếu tố: kỹ thuật/kỹ năng, kinh nghiệm/cấp độ, địa điểm/hình thức làm việc (trọng số ban đầu 50/30/20, *configurable*). Khả năng trúng tuyển: `HIGH` ≥ 75, `MEDIUM` ≥ 50, còn lại `LOW`. Điểm chỉ là ước lượng; công thức chi tiết ở phần thuật toán.

## Ứng tuyển

### BR-017 — Tự động hóa là mặc định
- **Source:** F05.4, F06
- **Rule:** Phân tích JD, sửa CV, tạo cover letter, chọn job, nộp hồ sơ, nhắc mail đều chạy tự động, người dùng không phải thao tác từng bước. Mọi bản CV, thay đổi và hồ sơ đã nộp được lưu lại để xem và hoàn tác. Người dùng có thể bật chế độ duyệt trước cho từng bước (sửa CV, nộp hồ sơ). Riêng thư trả lời trúng tuyển luôn cần xác nhận (BR-014).

### BR-009 — Không nộp trùng
- **Source:** AC-UC17, AC-UC18
- **Rule:** Mỗi người dùng chỉ nộp một lần cho một job. Nộp lại cần người dùng chủ động và xác nhận.

### BR-010 — Điều kiện ứng tuyển hàng loạt
- **Source:** UC18
- **Rule:** Chỉ nộp job có điểm khớp ≥ ngưỡng người dùng đặt (mặc định 70), tối đa 20 hồ sơ/ngày (*configurable*), bỏ qua công ty trong danh sách loại trừ. Chế độ mặc định là tự động: hệ thống tự sửa CV theo từng JD và nộp ngay, không chờ duyệt từng hồ sơ. Người dùng có thể bật chế độ duyệt trước (BR-017).

### BR-013 — Không vượt cơ chế chống bot
- **Source:** [01-scope.md](../01-scope.md) (Non-goals)
- **Rule:** Hệ thống không giải CAPTCHA hay vượt xác thực của trang đích; job như vậy chuyển sang nộp thủ công.

### BR-012 — Mail nhắc
- **Source:** UC19
- **Rule:** Nhắc sau 5 ngày không phản hồi, tối đa 1 lần cho mỗi hồ sơ (*configurable*). Chỉ gửi trong giờ làm việc của nhà tuyển dụng (8:00–18:00, thứ Hai đến thứ Sáu).

### BR-014 — Xác nhận thư trả lời
- **Source:** UC20
- **Rule:** Thư trả lời trúng tuyển/mời phỏng vấn do hệ thống soạn, chỉ gửi sau khi người dùng xác nhận. Phản hồi phân loại `UNKNOWN` không soạn thư tự động.

## Dữ liệu và tuân thủ

### BR-004 — Cô lập dữ liệu
- **Source:** [03-use-cases.md](../03-use-cases.md)
- **Rule:** Người dùng chỉ đọc/ghi dữ liệu của chính mình; Admin không đọc nội dung CV.

### BR-005 — Bảo vệ dữ liệu cá nhân
- **Source:** NFR-SEC
- **Rule:** Khi gọi LLM chỉ gửi phần nội dung cần thiết cho tác vụ; không gửi mật khẩu, token, thông tin liên hệ khi không cần.

### BR-006 — Xóa dữ liệu
- **Source:** NFR-PRIV-001
- **Rule:** Khi người dùng xóa tài khoản, toàn bộ CV, file, hồ sơ ứng tuyển và liên kết hộp thư bị xóa trong 30 ngày.

### BR-016 — Nguồn dữ liệu job
- **Source:** Open question Q4
- **Rule:** Chỉ thu thập từ nguồn được phép theo điều khoản sử dụng và robots; tôn trọng giới hạn tần suất. Nguồn bị cấm phải tắt được bởi Admin ngay lập tức.
