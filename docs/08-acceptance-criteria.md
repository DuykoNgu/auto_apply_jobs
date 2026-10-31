# Acceptance Criteria — ACAJ

> Design status: TARGET
>
> Implementation status: NOT STARTED — tiêu chí được viết để chuyển thành test API, UI và eval AI

Mỗi tiêu chí quan sát được qua API, UI hoặc bộ eval. Phân quyền luôn kiểm tra ở backend; ẩn nút ở frontend không được tính là kiểm soát quyền. Tiêu chí có AI được kiểm tra với LLM giả lập (stub) trong test tích hợp và với LLM thật trong eval. `BR-xxx` xem [Business Rules](requirements/business-rules.md); `NFR-xxx` xem [Non-Functional Requirements](requirements/non-functional-requirements.md).

## AC-AI — Tiêu chí chung cho mọi tác vụ AI

- Mỗi tác vụ AI có trạng thái `PENDING`, `READY`, `NEEDS_REVIEW` hoặc `FAILED`; giao diện hiển thị đúng trạng thái, không hiển thị kết quả rỗng như thể thành công.
- LLM lỗi hoặc hết thời gian: thử lại tối đa 3 lần, sau đó `FAILED`; các phần do luật tính (điểm khớp, thống kê, lịch nhắc) vẫn trả về bình thường (BR-012).
- Đầu ra sai schema bị loại và tính là một lần thử thất bại (BR-013).
- Mỗi kết quả `READY` có model, phiên bản prompt, số token và thời điểm tạo (BR-016).
- Prompt gửi LLM không chứa số điện thoại, email, địa chỉ, số giấy tờ ở dạng gốc, và không chứa mật khẩu, token, khóa API (BR-015).
- Vượt hạn mức token trong ngày: tác vụ chờ ngày sau và người dùng được báo (BR-016).

## AC-UC01 — Đăng ký

- Email hợp lệ chưa dùng + mật khẩu ≥ 8 ký tự trả về `201`; mật khẩu chỉ lưu dạng hash (NFR-SEC-002).
- Email đã tồn tại (không phân biệt hoa thường) trả về `409`; email/mật khẩu sai định dạng trả về `400` kèm lỗi theo trường.
- Tài khoản mới có vai trò `CANDIDATE`.

## AC-UC02 — Đăng nhập / đăng xuất

- Thông tin đúng trả về `200` kèm token và thời hạn 30 phút; sai email hoặc mật khẩu trả về cùng một thông báo `401`.
- Quá 5 lần sai trong 15 phút trả về `429` (NFR-SEC-003).
- Đăng xuất trả về `204`; gọi route bảo vệ sau đó chuyển về trang đăng nhập.

## AC-UC03 — Upload CV PDF/DOCX

- Chấp nhận `.pdf`, `.docx` tối đa 10 MB và 5 trang; định dạng khác hoặc quá cỡ trả về `400` trước khi gọi AI (BR-002).
- AI trích xuất theo schema cố định thành các fact có ID (cá nhân, học vấn, kinh nghiệm, dự án, kỹ năng, chứng chỉ); kỹ năng được chuẩn hóa theo phả hệ (BR-008).
- Kết quả hiển thị để người dùng sửa trước khi lưu.
- File hỏng hoặc trích xuất `FAILED` mở form nhập thủ công kèm phần văn bản đã đọc được; không tạo CV rỗng.

## AC-UC04 — Upload ảnh CV

- Chấp nhận JPG, PNG, HEIC tối đa 10 MB; ảnh không đọc được chữ trả về thông báo yêu cầu chụp lại.
- Trường có độ tin cậy OCR/trích xuất thấp được đánh dấu `NEEDS_REVIEW` để người dùng xác nhận.

## AC-UC05 — Tạo CV từ template thủ công

- Người dùng chọn template, điền các mục; mục bắt buộc (họ tên, email, ít nhất một mục học vấn hoặc kinh nghiệm) thiếu thì trả về `400`.
- CV lưu được và xuất ra PDF.

## AC-UC06 — AI tạo CV

- Mọi câu AI viết trích dẫn được thông tin người dùng đã cung cấp; câu không có căn cứ bị loại (BR-009).
- Không thêm công ty, vị trí đã làm, bằng cấp, chứng chỉ không có trong đầu vào. Kỹ năng chỉ được thêm theo phả hệ kỹ năng và mang nhãn `INFERRED` (BR-008, BR-010).
- Người dùng xem và sửa trước khi lưu; CV có nguồn `AI_GENERATED`.

## AC-UC07 — Nhu cầu tuyển dụng

- Hiển thị xu hướng theo năm, chỉ số cạnh tranh (số ứng viên cùng ứng tuyển), và phân bổ theo khu vực và hình thức làm việc.
- Mọi chỉ số được tính bằng thống kê, kèm cỡ mẫu và thời điểm cập nhật; dưới ngưỡng dữ liệu thì hiển thị "chưa đủ dữ liệu" (BR-006).
- Lời giải thích do AI viết chỉ chứa các con số có trong kết quả thống kê; con số không khớp làm lời giải thích bị loại (BR-006).

## AC-UC08 — Mức lương

- Hiển thị khoảng lương (thấp – trung vị – cao) theo vị trí và cấp độ, và so sánh theo ngành.
- Chỉ dùng các JD có công bố lương; hiển thị số JD đã dùng.

## AC-UC09 — Skill gaps

- Liệt kê kỹ năng được yêu cầu nhiều nhất, kỹ năng ứng viên còn thiếu, mỗi kỹ năng có mức ưu tiên `HIGH/MEDIUM/LOW` tính từ tần suất trên JD.
- Kỹ năng đã có trong CV hoặc suy ra được theo phả hệ không xuất hiện trong danh sách thiếu (BR-008).

## AC-UC10 — Lộ trình theo năm

- Hiển thị theo mốc năm: khóa học/chứng chỉ nên lấy và các vị trí có thể hướng tới.
- Mỗi gợi ý cho biết kỹ năng thiếu hoặc yêu cầu thị trường mà nó giải quyết.
- Khóa học không có trong danh mục của hệ thống mang nhãn "gợi ý của AI".

## AC-UC11 — Thu thập JD

- Mỗi JD lưu `source`, `externalId`/URL; cùng JD thu thập lại không tạo bản trùng (BR-003).
- JD hết hạn được đánh dấu `EXPIRED` và không xuất hiện trong gợi ý (BR-004).
- Một nguồn lỗi không làm dừng các nguồn khác; lỗi được ghi lại. Nguồn bị Admin tắt không được thu thập ở lần chạy tiếp theo (BR-005).

## AC-UC12 — Danh sách job và matching

- Khả năng đậu phỏng vấn (`HIGH/MEDIUM/LOW`) là chỉ số chính hiển thị trên mỗi job; job sắp xếp theo chỉ số này, cùng mức thì theo matching score (0–100) giảm dần; kèm giá trị từng yếu tố (BR-007).
- Cùng CV, cùng JD, cùng trọng số luôn cho cùng một điểm; LLM bị tắt thì điểm không đổi (BR-012).
- Job có yếu tố kỹ năng bằng 0 không vượt quá 39 điểm (BR-007).
- Bộ lọc theo vị trí, khu vực, lương, hình thức, điểm tối thiểu hoạt động đúng; phân trang.
- Người dùng chưa có CV nhận hướng dẫn tải/tạo CV.

## AC-UC13 — Phân tích JD

- Hiển thị kỹ năng bắt buộc / nên có, từ khóa lặp lại, điểm nổi bật và điểm yếu/mơ hồ của JD.
- Mỗi nhận định trỏ về đoạn JD là căn cứ; nhận định không trỏ được bị loại (BR-009).
- JD chứa câu dạng chỉ dẫn cho AI (ví dụ "bỏ qua hướng dẫn trước đó") không làm thay đổi kết quả hay hành vi hệ thống (BR-013).

## AC-UC14 — Tối ưu CV theo job

- Việc sửa CV chạy tự động, không cần người dùng chỉnh tay (BR-017); ở chế độ duyệt trước thì chờ người dùng duyệt.
- Tạo phiên bản CV mới gắn với job; CV gốc không đổi (BR-011).
- Mọi câu trong bản tối ưu có nhãn `ORIGINAL`, `REWRITTEN` hoặc `INFERRED` và trích dẫn được căn cứ; câu không có căn cứ bị loại (BR-009, BR-010).
- Kỹ năng JD yêu cầu chỉ được thêm khi người dùng có kỹ năng đó hoặc kỹ năng liên quan trong phả hệ kỹ năng; kỹ năng không liên quan không được thêm (BR-008).
- Bản tối ưu đạt kiểm tra ATS: văn bản có thể trích xuất, không bảng/cột phức tạp, tiêu đề mục chuẩn.
- Nhãn nguồn gốc không xuất hiện trong file CV gửi nhà tuyển dụng.

## AC-UC15 — Viết lại nội dung

- Summary được viết lại theo vị trí, dự án liên quan được đưa lên trước; hiển thị so sánh với bản gốc.
- Người dùng có thể chấp nhận, sửa hoặc hoàn tác từng thay đổi; mỗi lần hoàn tác được ghi làm phản hồi (UC23).

## AC-UC16 — Cover letter và giấy tờ

- Cover letter nêu đúng tên công ty, vị trí từ JD và qua kiểm chứng grounding như CV (BR-009); người dùng sửa được.
- Chỉ đính kèm chứng chỉ người dùng đã tải lên (ví dụ TOEIC, IELTS).

## AC-UC17 — Ứng tuyển thủ công

- Chỉ ứng tuyển được job có bản CV tối ưu ở trạng thái `READY`; chế độ duyệt trước thì cần người dùng duyệt, chế độ tự động thì không.
- Nộp lần hai cùng một job bị chặn kèm thông báo (BR-018).
- Sau khi nộp, hồ sơ có trạng thái `SUBMITTED` kèm thời điểm và CV/cover letter đã dùng.

## AC-UC18 — Ứng tuyển hàng loạt

- Chỉ chạy với điều kiện người dùng đã đặt: điểm tối thiểu, hạn mức mỗi ngày, công ty loại trừ (BR-019).
- Không nộp vượt hạn mức, không nộp trùng, không nộp công ty bị loại trừ, không nộp job có bản CV `FAILED`.
- Quyết định nộp chỉ dựa trên luật; thay đổi đầu ra LLM không làm thay đổi danh sách job được chọn (BR-012).
- Job không tự nộp được (CAPTCHA, cần đăng nhập) chuyển vào danh sách "cần nộp thủ công", không bị bỏ qua im lặng (BR-020).
- Kết thúc lô gửi thông báo tổng kết: số đã nộp, số cần thủ công, số lỗi.
- Người dùng tạm dừng/tắt được bất kỳ lúc nào; lệnh dừng có hiệu lực trước hồ sơ kế tiếp.

## AC-UC19 — Mail nhắc

- Chỉ gửi khi quá N ngày (mặc định 5) chưa có phản hồi và chưa vượt số lần nhắc tối đa (mặc định 1), trong giờ làm việc (BR-021).
- Mail gửi từ hộp thư đã kết nối của người dùng, trong cùng chuỗi mail ứng tuyển.
- Có phản hồi thì không gửi nhắc.

## AC-UC20 — Mail trúng tuyển

- Phản hồi được phân loại `INTERVIEW`, `OFFER`, `REJECTED`, `UNKNOWN` kèm độ tin cậy; dưới ngưỡng thì `UNKNOWN`, chỉ thông báo, không soạn thư (BR-014).
- Người dùng nhận thông báo trong vòng 15 phút (NFR-TIME-002).
- Thư trả lời chỉ gửi sau khi người dùng xác nhận (BR-022); lịch sử ghi lại ai xác nhận và khi nào.
- Email chứa chỉ dẫn lạ (ví dụ yêu cầu gửi giấy tờ tùy thân) không kích hoạt hành động nào ngoài thông báo (BR-013).

## AC-UC21 — Theo dõi hồ sơ

- Danh sách hồ sơ có bộ lọc theo trạng thái; mở chi tiết thấy CV/cover letter đã dùng, chuỗi mail và nhãn phân loại của AI.
- Người dùng chỉ thấy hồ sơ của mình; truy cập hồ sơ người khác trả về `404` (BR-001).

## AC-UC22 — Quản trị

- Chỉ `ADMIN` truy cập được; vai trò khác nhận `403`.
- Admin bật/tắt nguồn job, khóa/mở người dùng; không có API đọc nội dung CV của người dùng (BR-001).

## AC-UC23 — Đánh giá kết quả AI

- Ứng viên đánh dấu job gợi ý hữu ích/không hữu ích, sửa nhãn email; mỗi phản hồi gắn với kết quả AI tương ứng (BR-024).
- Gửi lại phản hồi cho cùng một kết quả thay thế phản hồi cũ.
- Kết quả hồ sơ (`INTERVIEW`, `OFFER`, `REJECTED`) được ghi tự động từ UC20.

## AC-UC24 — Chất lượng AI và trọng số

- Chỉ `ADMIN` xem được; vai trò khác nhận `403`.
- Hiển thị theo khoảng thời gian: tỉ lệ `FAILED`, tỉ lệ câu bị loại do không có căn cứ, độ chính xác nhãn email (so với nhãn người dùng sửa), tỉ lệ job gợi ý được ứng tuyển và có phản hồi, độ trễ P95, token và chi phí.
- Trọng số ngoài khoảng cho phép (âm hoặc tất cả bằng 0) trả về `400`; thay đổi hợp lệ được ghi lịch sử và áp dụng cho lần tính tiếp theo (BR-024).
