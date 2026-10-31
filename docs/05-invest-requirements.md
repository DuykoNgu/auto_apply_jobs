# INVEST Requirements — ACAJ

> Design status: TARGET

Mỗi requirement đủ nhỏ để cài đặt và kiểm thử độc lập. Xác thực, phân quyền, validation, audit và xử lý lỗi là ràng buộc nghiệm thu chung, không phải tính năng ẩn. Với story có AI, ràng buộc chung còn gồm: trạng thái tác vụ AI, fallback khi LLM lỗi, truy vết model/prompt, và kiểm chứng đầu ra.

## INVEST checklist

| Principle | Application in this backlog |
|---|---|
| Independent | Mỗi story cho ra một kết quả demo được và chỉ nêu các tiền đề bắt buộc. Story có AI vẫn demo được với LLM giả lập (stub). |
| Negotiable | Giao diện, model và prompt có thể đổi, miễn mục tiêu, quyền truy cập và luật kiểm chứng giữ nguyên. |
| Valuable | Mỗi story nêu lợi ích cho ứng viên. |
| Estimable | Đầu vào, đầu ra, vai trò và trường hợp lỗi chính (kể cả LLM lỗi, độ tin cậy thấp) được nêu rõ. |
| Small | Mỗi story một khả năng, tách được thành API, xử lý nền, AI package, lưu trữ, UI. |
| Testable | Mỗi story liên kết tới tiêu chí nghiệm thu `AC-UC` trong [08-acceptance-criteria.md](08-acceptance-criteria.md); phần AI còn có chỉ số eval trong [NFR](requirements/non-functional-requirements.md#ai-quality-and-safety). |

## Product backlog

| ID | User story | Value | Dependencies | Use case |
|---|---|---|---|---|
| US01 | Là người mới, tôi muốn đăng ký tài khoản để dùng dịch vụ. | Bắt đầu sử dụng | — | UC01 |
| US02 | Là người dùng, tôi muốn đăng nhập/đăng xuất để truy cập an toàn dữ liệu của mình. | Bảo mật | US01 | UC02 |
| US03 | Là ứng viên, tôi muốn tải CV PDF/DOCX và để AI tự trích xuất thành các mục để không phải nhập lại. | Tiết kiệm thời gian | US02 | UC03 |
| US04 | Là ứng viên, tôi muốn tải ảnh chụp CV và để AI đọc (OCR) để dùng cả CV giấy hay file cũ. | Linh hoạt đầu vào | US03 | UC04 |
| US05 | Là ứng viên, tôi muốn tạo CV từ template bằng cách tự điền để có CV chuẩn. | Có CV từ đầu | US02 | UC05 |
| US06 | Là ứng viên, tôi muốn AI soạn CV từ thông tin tôi cung cấp, không thêm gì tôi không có, để có CV nhanh. | Nhanh, đáng tin | US05 | UC06 |
| US07 | Là ứng viên, tôi muốn xem nhu cầu tuyển dụng và độ cạnh tranh của vị trí, tính từ dữ liệu thật, để biết thị trường. | Quyết định đúng | US03 hoặc US05, US11 | UC07 |
| US08 | Là ứng viên, tôi muốn xem mức lương có thể đạt theo vị trí, cấp độ để đặt kỳ vọng. | Kỳ vọng thực tế | US07 | UC08 |
| US09 | Là ứng viên, tôi muốn biết kỹ năng còn thiếu và mức ưu tiên để biết cần học gì. | Định hướng học | US07 | UC09 |
| US10 | Là ứng viên, tôi muốn có lộ trình theo năm gồm khóa học, chứng chỉ, vị trí phù hợp, với gợi ý của AI được ghi rõ. | Kế hoạch dài hạn | US09 | UC10 |
| US11 | Là hệ thống, tôi cần thu thập, chuẩn hóa và loại trùng JD từ TopCV, LinkedIn và trang công ty. | Có dữ liệu job | — | UC11 |
| US12 | Là ứng viên, tôi muốn xem danh sách job theo khả năng đậu phỏng vấn, kèm matching score có giải thích, để ưu tiên job có cơ hội cao nhất. | Chọn đúng job | US03 hoặc US05, US11 | UC12 |
| US13 | Là ứng viên, tôi muốn xem AI phân tích JD (điểm nổi bật, điểm yếu), mỗi nhận định trỏ về đoạn JD, để biết cách trình bày CV. | Hiểu yêu cầu | US11 | UC13 |
| US14 | Là ứng viên, tôi muốn CV được tự động sửa theo JD và chuẩn ATS, mọi câu đều có căn cứ từ CV của tôi, để vượt vòng lọc. | Tăng cơ hội | US12, US13 | UC14 |
| US15 | Là ứng viên, tôi muốn summary và dự án được viết lại theo vị trí. | CV phù hợp từng job | US14 | UC15 |
| US16 | Là ứng viên, tôi muốn có cover letter và chứng chỉ đính kèm cho từng job. | Hồ sơ đầy đủ | US14 | UC16 |
| US17 | Là ứng viên, tôi muốn ứng tuyển thủ công job đã tối ưu để kiểm soát từng hồ sơ. | Kiểm soát | US14 | UC17 |
| US18 | Là ứng viên, tôi muốn bật ứng tuyển hàng loạt với điều kiện tôi đặt để tiết kiệm thời gian. | Tiết kiệm thời gian | US14, US16 | UC18 |
| US19 | Là ứng viên, tôi muốn hệ thống tự nhắc nhà tuyển dụng khi chưa phản hồi để không bị bỏ sót. | Tăng tỉ lệ phản hồi | US17 | UC19 |
| US20 | Là ứng viên, tôi muốn AI nhận ra mail mời phỏng vấn/trúng tuyển, báo tôi và soạn sẵn thư trả lời để phản hồi kịp thời. | Không lỡ cơ hội | US17 | UC20 |
| US21 | Là ứng viên, tôi muốn xem trạng thái mọi hồ sơ đã nộp ở một nơi. | Theo dõi dễ | US17 | UC21 |
| US22 | Là Admin, tôi muốn quản lý nguồn job và người dùng để hệ thống vận hành ổn định. | Vận hành | US02 | UC22 |
| US23 | Là ứng viên, tôi muốn đánh giá kết quả AI (job gợi ý, chỉnh sửa CV, nhãn email) để AI ngày càng khớp với tôi hơn. | Vòng học | US12, US14, US20 | UC23 |
| US24 | Là Admin, tôi muốn xem chỉ số chất lượng, độ trễ và chi phí AI, và chỉnh trọng số matching, để cải thiện gợi ý dựa trên số liệu. | Chất lượng đo được | US23 | UC24 |

## Per-story INVEST review

`PASS` nghĩa là thiết kế hiện tại đủ thông tin để lập kế hoạch. `PARTIAL` nghĩa là còn một phụ thuộc chưa chốt. Bảng này không khẳng định đã có code hay test.

| Story | I | N | V | E | S | T | Notes |
|---|---|---|---|---|---|---|---|
| US01 | PASS | PASS | PASS | PASS | PASS | PASS | Cơ chế xác thực chốt ở phần kiến trúc. |
| US02 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US03 | PASS | PASS | PASS | PASS | PASS | PASS | Schema trích xuất cố định; chất lượng đo bằng eval trích xuất CV. |
| US04 | PASS | PASS | PASS | PARTIAL | PASS | PASS | Chưa chọn công cụ OCR. |
| US05 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US06 | PASS | PASS | PASS | PASS | PASS | PASS | Dùng chung bộ kiểm chứng với US14. |
| US07 | PASS | PASS | PASS | PARTIAL | PASS | PASS | Phụ thuộc lượng dữ liệu JD (US11); dưới ngưỡng báo "chưa đủ dữ liệu" (BR-006). |
| US08 | PASS | PASS | PASS | PASS | PASS | PASS | Chỉ dùng JD có công bố lương. |
| US09 | PASS | PASS | PASS | PARTIAL | PASS | PASS | Phụ thuộc phả hệ kỹ năng (Q6). |
| US10 | PASS | PASS | PASS | PARTIAL | PASS | PASS | Chưa có danh mục khóa học; gợi ý ngoài danh mục gắn nhãn AI. |
| US11 | PASS | PASS | PASS | PARTIAL | PASS | PASS | Điều khoản thu thập của từng nguồn chưa chốt (Q4). |
| US12 | PASS | PASS | PASS | PASS | PASS | PASS | Công thức điểm là luật; trọng số mặc định ở BR-007. |
| US13 | PASS | PASS | PASS | PASS | PASS | PASS | Nhận định không có trích dẫn bị loại (BR-009). |
| US14 | PASS | PASS | PASS | PASS | PARTIAL | PASS | Lớn nhất phía AI; có thể tách: sinh bản nháp / kiểm chứng / kiểm tra ATS. |
| US15 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US16 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US17 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US18 | PASS | PASS | PASS | PASS | PARTIAL | PASS | Có thể tách: cấu hình luật / chạy lô / báo cáo lô. |
| US19 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US20 | PASS | PASS | PASS | PASS | PASS | PASS | Luôn cần người dùng xác nhận trước khi gửi (BR-022). |
| US21 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US22 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US23 | PASS | PASS | PASS | PASS | PASS | PASS | |
| US24 | PASS | PASS | PASS | PARTIAL | PASS | PASS | Chưa chọn LLM provider nên chưa có bảng giá token (Q7). |
