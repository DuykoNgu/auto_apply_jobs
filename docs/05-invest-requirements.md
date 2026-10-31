# INVEST Requirements — ACAJ

> Design status: TARGET

Mỗi requirement đủ nhỏ để cài đặt và kiểm thử độc lập. Xác thực, phân quyền, validation, audit và xử lý lỗi là ràng buộc nghiệm thu chung, không phải tính năng ẩn.

## INVEST checklist

| Principle | Application in this backlog |
|---|---|
| Independent | Mỗi story cho ra một kết quả demo được và chỉ nêu các tiền đề bắt buộc. |
| Negotiable | Giao diện và chi tiết kỹ thuật có thể đổi, miễn mục tiêu và quyền truy cập giữ nguyên. |
| Valuable | Mỗi story nêu lợi ích cho ứng viên. |
| Estimable | Đầu vào, đầu ra, vai trò và trường hợp lỗi chính được nêu rõ. |
| Small | Mỗi story một khả năng, tách được thành API, xử lý nền, lưu trữ, UI. |
| Testable | Mỗi story liên kết tới tiêu chí nghiệm thu `AC-UC` trong [08-acceptance-criteria.md](08-acceptance-criteria.md). |

## Product backlog

| ID | User story | Value | Dependencies | Use case |
|---|---|---|---|---|
| US01 | Là người mới, tôi muốn đăng ký tài khoản để dùng dịch vụ. | Bắt đầu sử dụng | — | UC01 |
| US02 | Là người dùng, tôi muốn đăng nhập/đăng xuất để truy cập an toàn dữ liệu của mình. | Bảo mật | US01 | UC02 |
| US03 | Là ứng viên, tôi muốn tải CV PDF/DOCX để không phải nhập lại. | Tiết kiệm thời gian | US02 | UC03 |
| US04 | Là ứng viên, tôi muốn tải ảnh chụp CV để dùng cả CV giấy hay file cũ. | Linh hoạt đầu vào | US02 | UC04 |
| US05 | Là ứng viên, tôi muốn tạo CV từ template bằng cách tự điền để có CV chuẩn. | Có CV từ đầu | US02 | UC05 |
| US06 | Là ứng viên, tôi muốn AI soạn CV từ thông tin tôi cung cấp để có CV nhanh. | Nhanh, chất lượng | US05 | UC06 |
| US07 | Là ứng viên, tôi muốn xem nhu cầu tuyển dụng và độ cạnh tranh của vị trí để biết thị trường. | Quyết định đúng | US03 hoặc US05, US11 | UC07 |
| US08 | Là ứng viên, tôi muốn xem mức lương có thể đạt theo vị trí, cấp độ để đặt kỳ vọng. | Kỳ vọng thực tế | US07 | UC08 |
| US09 | Là ứng viên, tôi muốn biết kỹ năng còn thiếu và mức ưu tiên để biết cần học gì. | Định hướng học | US07 | UC09 |
| US10 | Là ứng viên, tôi muốn có lộ trình theo năm gồm khóa học, chứng chỉ, vị trí phù hợp. | Kế hoạch dài hạn | US09 | UC10 |
| US11 | Là hệ thống, tôi cần thu thập và chuẩn hóa JD từ TopCV, LinkedIn và trang công ty. | Có dữ liệu job | — | UC11 |
| US12 | Là ứng viên, tôi muốn xem danh sách job kèm matching score và khả năng trúng tuyển. | Chọn đúng job | US03 hoặc US05, US11 | UC12 |
| US13 | Là ứng viên, tôi muốn xem phân tích JD (điểm nổi bật, điểm yếu) để biết cách trình bày CV. | Hiểu yêu cầu | US11 | UC13 |
| US14 | Là ứng viên, tôi muốn CV được tối ưu theo JD và chuẩn ATS để vượt vòng lọc. | Tăng cơ hội | US12 | UC14 |
| US15 | Là ứng viên, tôi muốn summary và dự án được viết lại theo vị trí. | CV phù hợp từng job | US14 | UC15 |
| US16 | Là ứng viên, tôi muốn có cover letter và chứng chỉ đính kèm cho từng job. | Hồ sơ đầy đủ | US14 | UC16 |
| US17 | Là ứng viên, tôi muốn ứng tuyển thủ công job đã tối ưu để kiểm soát từng hồ sơ. | Kiểm soát | US14 | UC17 |
| US18 | Là ứng viên, tôi muốn bật ứng tuyển hàng loạt với điều kiện tôi đặt để tiết kiệm thời gian. | Tiết kiệm thời gian | US14, US16 | UC18 |
| US19 | Là ứng viên, tôi muốn hệ thống tự nhắc nhà tuyển dụng khi chưa phản hồi để không bị bỏ sót. | Tăng tỉ lệ phản hồi | US17 | UC19 |
| US20 | Là ứng viên, tôi muốn được báo khi có mail trúng tuyển và có thư trả lời soạn sẵn để phản hồi kịp thời. | Không lỡ cơ hội | US17 | UC20 |
| US21 | Là ứng viên, tôi muốn xem trạng thái mọi hồ sơ đã nộp ở một nơi. | Theo dõi dễ | US17 | UC21 |
| US22 | Là Admin, tôi muốn quản lý nguồn job và người dùng để hệ thống vận hành ổn định. | Vận hành | US02 | UC22 |

## Ghi chú review INVEST

| Story | Nhận xét | Cách xử lý |
|---|---|---|
| US07–US10 | Phụ thuộc chất lượng dữ liệu thị trường (US11); nếu ít dữ liệu, chỉ số không đáng tin. | Hiển thị cỡ mẫu; dưới ngưỡng thì báo "chưa đủ dữ liệu" (BR-011). |
| US18 | Lớn nhất: gồm chọn job, tối ưu, nộp, giới hạn. | Có thể tách: cấu hình luật / chạy lô / báo cáo lô khi lên kế hoạch sprint. |
| US20 | Có rủi ro gửi thư sai. | Luôn cần người dùng xác nhận (BR-014). |
