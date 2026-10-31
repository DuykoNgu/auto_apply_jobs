# Feature Catalog

> Design status: TARGET

Product: **ACAJ — AI CV Auto Apply Jobs**. Các feature bám theo 6 nhánh của [mindmap](mindmap.png).

| ID | Name | Mindmap branch | Priority |
|---|---|---|---|
| F01 | Authentication | Đăng nhập / Đăng ký | Must |
| F02 | CV Input and Builder | Tạo / Nhập & Phân tích CV | Must |
| F03 | Market and Career Analysis | Phân tích so với thị trường | Should |
| F04 | Job Discovery and Matching | Tìm kiếm cơ hội và khớp việc làm | Must |
| F05 | CV Optimization per Job | Tối ưu CV theo Jobs | Must |
| F06 | Job Application Automation | Tự động ứng tuyển công việc | Should |

## F01 Authentication

- F01.1 Đăng ký tài khoản (email, mật khẩu, họ tên)
- F01.2 Đăng nhập, đăng xuất
- F01.3 Mỗi người dùng chỉ truy cập dữ liệu của chính mình (backend kiểm tra)
- F01.4 Hồ sơ cá nhân và đổi mật khẩu

## F02 CV Input and Builder

Ba đường đầu vào, cùng cho ra một CV có cấu trúc:

- F02.1 Upload CV PDF hoặc DOCX; hệ thống trích xuất nội dung thành các mục (thông tin cá nhân, học vấn, kinh nghiệm, dự án, kỹ năng, chứng chỉ).
- F02.2 Chụp/upload ảnh CV nhiều định dạng; OCR rồi trích xuất như F02.1.
- F02.3 Tạo CV theo template có sẵn:
  - **Thủ công**: người dùng tự điền từng mục.
  - **AI tạo**: người dùng cung cấp thông tin thô, AI soạn nội dung vào template.
- F02.4 Xem trước và chỉnh sửa kết quả trích xuất trước khi lưu; xuất CV ra PDF.

## F03 Market and Career Analysis

Phân tích CV đã lưu so với thị trường theo ngành nghề và vị trí.

| Nhóm | Nội dung |
|---|---|
| F03.1 Nhu cầu tuyển dụng | Xu hướng nghề nghiệp trong năm · số ứng viên cùng ứng tuyển để ra **chỉ số cạnh tranh** · phân bổ theo khu vực và hình thức làm việc |
| F03.2 Mức lương | Mức lương theo vị trí và cấp độ · so sánh theo ngành và khoảng lương của công ty |
| F03.3 Skill gaps | Kỹ năng được yêu cầu nhiều nhất · kỹ năng người dùng còn thiếu · mức độ ưu tiên cần bổ sung |
| F03.4 Lộ trình | Khóa học/chứng chỉ nên thu thập · các vị trí phù hợp theo nhiều ngạch khác nhau, theo năm |

## F04 Job Discovery and Matching

- F04.1 Thu thập JD từ TopCV, LinkedIn và các nguồn tuyển dụng chính thống của công ty; chuẩn hóa và loại trùng.
- F04.2 Phân tích JD: điểm nổi bật (kỹ năng cốt lõi, từ khóa), điểm yếu của JD để chọn cách trình bày CV có cơ hội cao nhất.
- F04.3 Matching: tính điểm theo trọng số kỹ thuật, kỹ năng, địa điểm; hiển thị **matching score** kèm **khả năng trúng tuyển**.
- F04.4 Danh sách job với bộ lọc (vị trí, khu vực, lương, hình thức, điểm khớp).

## F05 CV Optimization per Job

Tạo một **phiên bản CV riêng cho từng job**, CV gốc không bị ghi đè.

- F05.1 Tối ưu theo yêu cầu JD: thêm kỹ năng JD yêu cầu nếu người dùng đã có kỹ năng đó **hoặc kỹ năng liên quan trong phả hệ kỹ năng** (ví dụ có MySQL thì thêm SQL); chuẩn định dạng ATS.
- F05.2 Viết lại nội dung: summary theo vị trí; nhấn mạnh dự án liên quan.
- F05.3 Giấy tờ đi kèm: cover letter; chứng chỉ (TOEIC, IELTS).
- F05.4 **Tự động sửa**: toàn bộ F05.1–F05.3 chạy tự động cho từng job, không cần người dùng chỉnh tay. Hệ thống lưu so sánh bản gốc và bản tối ưu để người dùng xem lại, sửa hoặc hoàn tác.
- F05.5 Chế độ **duyệt trước** (tùy chọn): bật thì bản tối ưu chỉ được dùng sau khi người dùng duyệt; mặc định là chế độ tự động.

## F06 Job Application Automation

- F06.1 Ứng tuyển thủ công các job phù hợp sau khi đã tối ưu CV.
- F06.2 Ứng tuyển hàng loạt tự động theo luồng 4 bước (nhập → phân tích → khớp → tối ưu) với điều kiện do người dùng đặt (điểm khớp tối thiểu, hạn mức mỗi ngày, danh sách công ty loại trừ).
- F06.3 Tự động gửi mail nhắc nhà tuyển dụng khi chưa có phản hồi sau N ngày (mặc định 5).
- F06.4 Phát hiện mail trúng tuyển/mời phỏng vấn, soạn thư trả lời và **báo về người dùng**; thư chỉ gửi khi người dùng xác nhận.
- F06.5 Bảng theo dõi trạng thái từng hồ sơ đã nộp.
