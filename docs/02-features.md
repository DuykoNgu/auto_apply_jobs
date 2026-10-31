# Feature Catalog

> Design status: TARGET

Product: **ACAJ — AI CV Auto Apply Jobs**. F01–F06 bám theo 6 nhánh của [mindmap](mindmap.png); F07 được bổ sung để đo và cải thiện chất lượng AI.

| ID | Name | Mindmap branch | AI | Priority |
|---|---|---|---|---|
| F01 | Authentication | Đăng nhập / Đăng ký | — | Must |
| F02 | CV Input and Builder | Tạo / Nhập & Phân tích CV | OCR, LLM extraction, LLM generation | Must |
| F03 | Market and Career Analysis | Phân tích so với thị trường | Thống kê; LLM chỉ viết giải thích | Should |
| F04 | Job Discovery and Matching | Tìm kiếm cơ hội và khớp việc làm | LLM extraction, embedding; điểm do luật | Must |
| F05 | CV Optimization per Job | Tối ưu CV theo Jobs | LLM generation có grounding | Must |
| F06 | Job Application Automation | Tự động ứng tuyển công việc | LLM classification, LLM drafting; quyết định do luật | Should |
| F07 | AI Quality and Feedback | (bổ sung) | Eval, feedback loop | Should |

## Quy ước chung cho mọi tác vụ AI

- **Trạng thái:** `PENDING` → `READY` hoặc `NEEDS_REVIEW` (độ tin cậy thấp) hoặc `FAILED` (LLM lỗi sau khi thử lại).
- **Nhãn nguồn gốc** cho mỗi câu trong CV do AI tạo: `ORIGINAL` (giữ nguyên từ CV gốc), `REWRITTEN` (viết lại từ một fact có trong CV), `INFERRED` (kỹ năng suy ra từ phả hệ kỹ năng).
- **Truy vết:** mỗi kết quả AI lưu model, phiên bản prompt và thời điểm tạo.
- **Văn bản không tin cậy:** JD và email chỉ được đọc như dữ liệu; chỉ dẫn nằm trong đó bị bỏ qua.
- **Fallback:** LLM lỗi không chặn các phần do luật tính; giao diện báo lỗi rõ ràng và cho thao tác thủ công.

## F01 Authentication

- F01.1 Đăng ký tài khoản (email, mật khẩu, họ tên)
- F01.2 Đăng nhập, đăng xuất
- F01.3 Mỗi người dùng chỉ truy cập dữ liệu của chính mình (backend kiểm tra)
- F01.4 Hồ sơ cá nhân và đổi mật khẩu

## F02 CV Input and Builder

Ba đường đầu vào, cùng cho ra một CV có cấu trúc gồm các **fact** có ID.

- F02.1 Upload CV PDF hoặc DOCX → trích văn bản → LLM trích xuất theo schema cố định (thông tin cá nhân, học vấn, kinh nghiệm, dự án, kỹ năng, chứng chỉ).
- F02.2 Chụp/upload ảnh CV → OCR → trích xuất như F02.1. Trường có độ tin cậy thấp được đánh dấu để người dùng xác nhận.
- F02.3 Tạo CV theo template có sẵn:
  - **Thủ công**: người dùng tự điền từng mục.
  - **AI tạo**: người dùng cung cấp thông tin thô, AI soạn nội dung vào template; chỉ dùng thông tin người dùng đưa ra.
- F02.4 Kỹ năng trong CV được chuẩn hóa về tên trong phả hệ kỹ năng.
- F02.5 Xem trước và chỉnh sửa kết quả trước khi lưu; xuất CV ra PDF.

## F03 Market and Career Analysis

Phân tích CV đã lưu so với thị trường theo ngành nghề và vị trí. **Con số do thống kê tính**; LLM chỉ viết lời giải thích và phải dùng đúng các con số đó.

| Nhóm | Nội dung | Cách tính |
|---|---|---|
| F03.1 Nhu cầu tuyển dụng | Xu hướng nghề nghiệp trong năm · số ứng viên cùng ứng tuyển để ra **chỉ số cạnh tranh** · phân bổ theo khu vực và hình thức làm việc | Đếm và tổng hợp JD |
| F03.2 Mức lương | Mức lương theo vị trí và cấp độ · so sánh theo ngành và khoảng lương của công ty | Phân vị trên JD có công bố lương |
| F03.3 Skill gaps | Kỹ năng được yêu cầu nhiều nhất · kỹ năng người dùng còn thiếu · mức độ ưu tiên cần bổ sung | Tần suất kỹ năng trên JD, so với phả hệ |
| F03.4 Lộ trình | Khóa học/chứng chỉ nên thu thập · các vị trí phù hợp theo nhiều ngạch khác nhau, theo năm | Luật trên phả hệ; LLM gợi ý thêm, gắn nhãn "gợi ý của AI" |

## F04 Job Discovery and Matching

- F04.1 Thu thập JD từ TopCV, LinkedIn và các nguồn tuyển dụng chính thống của công ty; chuẩn hóa và loại trùng.
- F04.2 Phân tích JD bằng LLM: kỹ năng bắt buộc / nên có, cấp độ, từ khóa, điểm nổi bật, điểm yếu hoặc mơ hồ của JD. **Mỗi nhận định trỏ về đoạn JD làm căn cứ**; nhận định không có căn cứ bị loại.
- F04.3 Matching score 0–100 do **công thức có trọng số** tính từ các yếu tố: kỹ năng (theo phả hệ), độ tương đồng ngữ nghĩa CV–JD (embedding), kinh nghiệm/cấp độ, địa điểm/hình thức. Hiển thị lý do theo từng yếu tố và **khả năng trúng tuyển**. LLM không tính và không sửa điểm.
- F04.4 Danh sách job với bộ lọc (vị trí, khu vực, lương, hình thức, điểm khớp).

## F05 CV Optimization per Job

Tạo một **phiên bản CV riêng cho từng job**, CV gốc không bị ghi đè. Luồng AI cho mỗi job:

1. **Thu thập căn cứ:** fact trong CV gốc, kết quả phân tích JD (F04.2), kỹ năng liên quan theo phả hệ.
2. **Sinh bản nháp bằng LLM:** chọn và viết lại nội dung theo JD.
3. **Kiểm chứng (grounding):** mọi câu phải trích dẫn ít nhất một fact hoặc kỹ năng suy ra; câu không có căn cứ bị loại. Gắn nhãn `ORIGINAL` / `REWRITTEN` / `INFERRED`.
4. **Kiểm tra ATS bằng luật:** định dạng, tiêu đề mục, từ khóa JD.
5. **Lưu phiên bản** kèm bản so sánh với CV gốc.

Các tính năng:

- F05.1 Tối ưu theo yêu cầu JD: thêm kỹ năng JD yêu cầu nếu người dùng đã có kỹ năng đó **hoặc kỹ năng liên quan trong phả hệ kỹ năng** (ví dụ có MySQL thì thêm SQL); chuẩn định dạng ATS.
- F05.2 Viết lại nội dung: summary theo vị trí; nhấn mạnh dự án liên quan.
- F05.3 Giấy tờ đi kèm: cover letter (cũng qua bước kiểm chứng); chứng chỉ (TOEIC, IELTS) người dùng đã tải lên.
- F05.4 **Tự động sửa**: toàn bộ F05.1–F05.3 chạy tự động cho từng job, không cần người dùng chỉnh tay. Người dùng xem lại, sửa hoặc hoàn tác sau.
- F05.5 Chế độ **duyệt trước** (tùy chọn): bật thì bản tối ưu chỉ được dùng sau khi người dùng duyệt; mặc định là chế độ tự động.

## F06 Job Application Automation

- F06.1 Ứng tuyển thủ công các job phù hợp sau khi đã tối ưu CV.
- F06.2 Ứng tuyển hàng loạt tự động theo luồng 4 bước (nhập → phân tích → khớp → tối ưu). **Việc chọn job và nộp do luật quyết định** theo điều kiện người dùng đặt (điểm khớp tối thiểu, hạn mức mỗi ngày, danh sách công ty loại trừ).
- F06.3 Tự động gửi mail nhắc nhà tuyển dụng khi chưa có phản hồi sau N ngày (mặc định 5); nội dung theo mẫu, LLM chỉ cá nhân hóa tên vị trí và công ty.
- F06.4 AI phân loại email phản hồi (`INTERVIEW`, `OFFER`, `REJECTED`, `UNKNOWN`) kèm độ tin cậy; soạn thư trả lời và **báo về người dùng**; thư chỉ gửi khi người dùng xác nhận.
- F06.5 Bảng theo dõi trạng thái từng hồ sơ đã nộp.

## F07 AI Quality and Feedback

- F07.1 Người dùng đánh giá kết quả AI: job gợi ý hữu ích / không hữu ích; chỉnh sửa CV giữ lại / hoàn tác; nhãn email đúng / sai.
- F07.2 Ghi nhận kết quả thật của hồ sơ (có phản hồi, phỏng vấn, trúng tuyển) để đo độ chính xác của matching và hiệu chỉnh khả năng trúng tuyển.
- F07.3 Bộ eval offline cho từng tác vụ AI (trích xuất CV, trích xuất JD, grounding, phân loại email, chất lượng gợi ý job), chạy được bằng LLM giả lập trong CI và LLM thật khi đánh giá.
- F07.4 Admin xem chỉ số chất lượng AI, tỉ lệ lỗi, độ trễ, token và chi phí; chỉnh trọng số matching dựa trên số liệu (không tự động đổi ngầm).
