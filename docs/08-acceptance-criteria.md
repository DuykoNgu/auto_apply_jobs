# Acceptance Criteria — ACAJ

> Design status: TARGET
>
> Implementation status: NOT STARTED — tiêu chí được viết để chuyển thành test API và UI

Mỗi tiêu chí quan sát được qua API hoặc UI. Phân quyền luôn kiểm tra ở backend. `BR-xxx` xem [Business Rules](requirements/business-rules.md); `NFR-xxx` xem [Non-Functional Requirements](requirements/non-functional-requirements.md).

## AC-UC01 — Đăng ký

- Email hợp lệ chưa dùng + mật khẩu ≥ 8 ký tự trả về `201`; mật khẩu chỉ lưu dạng hash (NFR-SEC-002).
- Email đã tồn tại trả về `409`; email/mật khẩu sai định dạng trả về `400` kèm lỗi theo trường.
- Tài khoản mới có vai trò `CANDIDATE`.

## AC-UC02 — Đăng nhập / đăng xuất

- Thông tin đúng trả về `200` kèm token và thời hạn 30 phút; sai email hoặc mật khẩu trả về cùng một thông báo `401`.
- Quá 5 lần sai trong 15 phút trả về `429` (NFR-SEC-003).
- Đăng xuất trả về `204`; gọi route bảo vệ sau đó chuyển về trang đăng nhập.

## AC-UC03 — Upload CV PDF/DOCX

- Chấp nhận `.pdf`, `.docx` tối đa 10 MB; định dạng khác hoặc quá cỡ trả về `400` (BR-003).
- Kết quả trích xuất hiển thị theo mục (cá nhân, học vấn, kinh nghiệm, dự án, kỹ năng, chứng chỉ) để người dùng sửa trước khi lưu.
- File hỏng hoặc không đọc được trả về lỗi rõ ràng, không tạo CV rỗng.

## AC-UC04 — Upload ảnh CV

- Chấp nhận JPG, PNG, HEIC tối đa 10 MB; ảnh không đọc được chữ trả về thông báo yêu cầu chụp lại.
- Trường có độ tin cậy OCR thấp được đánh dấu để người dùng xác nhận.

## AC-UC05 — Tạo CV từ template thủ công

- Người dùng chọn template, điền các mục; mục bắt buộc (họ tên, email, ít nhất một mục học vấn hoặc kinh nghiệm) thiếu thì trả về `400`.
- CV lưu được và xuất ra PDF.

## AC-UC06 — AI tạo CV

- Nội dung AI sinh ra dựa trên thông tin người dùng cung cấp; không thêm công ty, vị trí đã làm, bằng cấp, chứng chỉ không có trong đầu vào. Kỹ năng chỉ được thêm theo phả hệ kỹ năng (BR-001).
- Người dùng xem và sửa trước khi lưu; CV có nhãn nguồn `AI_GENERATED`.

## AC-UC07 — Nhu cầu tuyển dụng

- Hiển thị xu hướng theo năm, chỉ số cạnh tranh (số ứng viên cùng ứng tuyển), và phân bổ theo khu vực và hình thức làm việc.
- Mọi chỉ số kèm cỡ mẫu và thời điểm cập nhật; dưới ngưỡng dữ liệu thì hiển thị "chưa đủ dữ liệu" (BR-011).

## AC-UC08 — Mức lương

- Hiển thị khoảng lương (thấp – trung vị – cao) theo vị trí và cấp độ, và so sánh theo ngành.
- Chỉ dùng các JD có công bố lương; hiển thị số JD đã dùng.

## AC-UC09 — Skill gaps

- Liệt kê kỹ năng được yêu cầu nhiều nhất, kỹ năng ứng viên còn thiếu, mỗi kỹ năng có mức ưu tiên `HIGH/MEDIUM/LOW`.
- Kỹ năng đã có trong CV không xuất hiện trong danh sách thiếu.

## AC-UC10 — Lộ trình theo năm

- Hiển thị theo mốc năm: khóa học/chứng chỉ nên lấy và các vị trí có thể hướng tới.
- Mỗi gợi ý cho biết lý do (kỹ năng thiếu hoặc yêu cầu thị trường) mà nó giải quyết.

## AC-UC11 — Thu thập JD

- Mỗi JD lưu `source`, `externalId`/URL; cùng JD thu thập lại không tạo bản trùng (BR-007).
- JD hết hạn được đánh dấu `EXPIRED` và không xuất hiện trong gợi ý.
- Một nguồn lỗi không làm dừng các nguồn khác; lỗi được ghi lại.

## AC-UC12 — Danh sách job và matching

- Job sắp xếp theo matching score (0–100) giảm dần, kèm khả năng trúng tuyển (`HIGH/MEDIUM/LOW`) và lý do theo từng yếu tố.
- Bộ lọc theo vị trí, khu vực, lương, hình thức, điểm tối thiểu hoạt động đúng; phân trang.
- Người dùng chưa có CV nhận hướng dẫn tải/tạo CV.

## AC-UC13 — Phân tích JD

- Hiển thị kỹ năng cốt lõi, từ khóa lặp lại, điểm nổi bật và điểm yếu/mơ hồ của JD.
- Mỗi nhận định trỏ về đoạn JD là căn cứ.

## AC-UC14 — Tối ưu CV theo job

- Việc sửa CV chạy tự động, không cần người dùng chỉnh tay (BR-017); ở chế độ duyệt trước thì chờ người dùng duyệt.
- Tạo phiên bản CV mới gắn với job; CV gốc không đổi (BR-002).
- Kỹ năng JD yêu cầu chỉ được thêm khi người dùng có kỹ năng đó hoặc kỹ năng liên quan trong phả hệ kỹ năng; kỹ năng suy ra mang nhãn "suy ra", được lưu lại để người dùng xem lại và hoàn tác (BR-001). Kỹ năng không liên quan không được thêm.
- Bản tối ưu đạt kiểm tra ATS: văn bản có thể trích xuất, không bảng/cột phức tạp, tiêu đề mục chuẩn.

## AC-UC15 — Viết lại nội dung

- Summary được viết lại theo vị trí, dự án liên quan được đưa lên trước; hiển thị so sánh với bản gốc.
- Người dùng có thể chấp nhận, sửa hoặc bỏ từng thay đổi.

## AC-UC16 — Cover letter và giấy tờ

- Cover letter nêu đúng tên công ty, vị trí từ JD; người dùng sửa được.
- Chỉ đính kèm chứng chỉ người dùng đã tải lên (ví dụ TOEIC, IELTS).

## AC-UC17 — Ứng tuyển thủ công

- Chỉ ứng tuyển được job đã có CV tối ưu; chế độ duyệt trước thì cần người dùng duyệt, chế độ tự động thì không.
- Nộp lần hai cùng một job bị chặn kèm thông báo (BR-009).
- Sau khi nộp, hồ sơ có trạng thái `SUBMITTED` kèm thời điểm và CV/cover letter đã dùng.

## AC-UC18 — Ứng tuyển hàng loạt

- Chỉ chạy với điều kiện người dùng đã đặt: điểm tối thiểu, hạn mức mỗi ngày, công ty loại trừ (BR-010).
- Không nộp vượt hạn mức, không nộp trùng, không nộp công ty bị loại trừ.
- Job không tự nộp được (CAPTCHA, cần đăng nhập) chuyển vào danh sách "cần nộp thủ công", không bị bỏ qua im lặng (BR-013).
- Kết thúc lô gửi thông báo tổng kết: số đã nộp, số cần thủ công, số lỗi.
- Người dùng tạm dừng/tắt được bất kỳ lúc nào; lệnh dừng có hiệu lực trước hồ sơ kế tiếp.

## AC-UC19 — Mail nhắc

- Chỉ gửi khi quá N ngày (mặc định 5) chưa có phản hồi và chưa vượt số lần nhắc tối đa (mặc định 1) (BR-012).
- Mail gửi từ hộp thư đã kết nối của người dùng, trong cùng chuỗi mail ứng tuyển.
- Có phản hồi thì không gửi nhắc.

## AC-UC20 — Mail trúng tuyển

- Phản hồi được phân loại `INTERVIEW`, `OFFER`, `REJECTED`, `UNKNOWN`; `UNKNOWN` chỉ thông báo, không soạn thư.
- Người dùng nhận thông báo trong vòng 15 phút (NFR-TIME-002).
- Thư trả lời chỉ gửi sau khi người dùng xác nhận (BR-014); lịch sử ghi lại ai xác nhận và khi nào.

## AC-UC21 — Theo dõi hồ sơ

- Danh sách hồ sơ có bộ lọc theo trạng thái; mở chi tiết thấy CV/cover letter đã dùng và chuỗi mail.
- Người dùng chỉ thấy hồ sơ của mình; truy cập hồ sơ người khác trả về `404`.

## AC-UC22 — Quản trị

- Chỉ `ADMIN` truy cập được; vai trò khác nhận `403`.
- Admin bật/tắt nguồn job, khóa/mở người dùng; không có API đọc nội dung CV của người dùng.
