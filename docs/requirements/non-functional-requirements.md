# Non-Functional Requirements — ACAJ

> Design status: PROPOSED BASELINE
>
> Implementation status: TARGET; verification is PLANNED

Các mục tiêu dưới đây là mức khởi điểm hợp lý cho sản phẩm giai đoạn đầu, không phải cam kết SLA. Mỗi yêu cầu chỉ hoàn thành khi bước kiểm chứng đạt trong khối lượng tham chiếu.

**Khối lượng tham chiếu:** 1.000 người dùng, 200.000 JD đang lưu, 5.000 ứng viên hoạt động trong tháng, 50 người dùng đồng thời.

## Performance and timeliness

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-PERF-001 | API đọc có phân trang: P95 ≤ 500 ms. | Thời gian phía server | `PERF-READ-001` |
| NFR-PERF-002 | API ghi: P95 ≤ 800 ms (không tính tác vụ nền). | Thời gian phía server | `PERF-WRITE-001` |
| NFR-PERF-003 | Danh sách job kèm matching: P95 ≤ 2 s. | Thời gian mỗi request | `PERF-MATCH-001` |
| NFR-PERF-004 | Trích xuất CV 3 trang (PDF/DOCX) xong trong ≤ 30 s; ảnh ≤ 60 s. | Từ upload đến có kết quả | `INT-CV-001` |
| NFR-PERF-005 | Tối ưu CV cho một job (CV + cover letter) xong trong ≤ 60 s. | Từ yêu cầu đến có kết quả | `INT-OPT-001` |
| NFR-TIME-001 | JD mới từ nguồn xuất hiện trong hệ thống tối đa 24 giờ sau khi đăng. | Thời gian đăng vs thời gian lưu | `INT-CRAWL-001` |
| NFR-TIME-002 | Phản hồi tuyển dụng được phát hiện và thông báo ứng viên trong ≤ 15 phút. | Thời gian mail đến vs thông báo | `INT-MAIL-001` |

## Capacity

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-CAP-001 | Hỗ trợ 200.000 JD, 5.000 CV, 100.000 hồ sơ ứng tuyển. | Cỡ dữ liệu seed | `PERF-CAP-001` |
| NFR-CAP-002 | 50 người dùng đồng thời mà vẫn đạt NFR-PERF-001 đến 003. | 50 virtual users | `PERF-CONC-001` |
| NFR-CAP-003 | Ứng tuyển hàng loạt xử lý tối thiểu 500 hồ sơ/giờ cho toàn hệ thống, tuân thủ hạn mức từng người dùng. | Hồ sơ/giờ | `PERF-APPLY-001` |

## Security and privacy

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-SEC-001 | Token truy cập hết hạn sau 30 phút. | `exp − iat` | `INT-AUTH-001` |
| NFR-SEC-002 | Mật khẩu ≥ 8 ký tự, lưu bằng hash có salt (bcrypt hoặc Argon2). | Validation và định dạng lưu | `UNIT-AUTH-001` |
| NFR-SEC-003 | Tối đa 5 lần đăng nhập sai/15 phút/tài khoản, sau đó `429`. | Bộ đếm giới hạn | `SEC-AUTH-001` |
| NFR-SEC-004 | Mọi thao tác kiểm tra quyền và chủ sở hữu dữ liệu ở backend. | Ma trận endpoint × role | `INT-RBAC-*` |
| NFR-SEC-005 | Token hộp thư, mật khẩu, khóa API không xuất hiện trong log ứng dụng hay prompt gửi LLM. | Kiểm tra mẫu log và prompt | `SEC-LOG-001` |
| NFR-SEC-006 | Token truy cập hộp thư lưu mã hóa, chỉ cấp quyền gửi và đọc thư ứng tuyển. | Kiểm tra lưu trữ và scope | `SEC-MAIL-001` |
| NFR-PRIV-001 | Xóa tài khoản xóa toàn bộ dữ liệu cá nhân trong 30 ngày. | Kiểm tra sau xóa | `INT-PRIV-001` |
| NFR-PRIV-002 | File CV truy cập bằng đường dẫn có chữ ký, hết hạn sau 15 phút. | Thử truy cập sau hạn | `SEC-FILE-001` |

## Reliability and operations

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-REL-001 | Dịch vụ sẵn sàng ≥ 99% mỗi tháng (giờ cao điểm). | Uptime | Giám sát |
| NFR-REL-002 | Tác vụ nền lỗi được thử lại tối đa 3 lần với giãn cách tăng dần; sau đó đánh dấu `FAILED` và thông báo. | Số lần thử, trạng thái | `INT-JOB-001` |
| NFR-REL-003 | LLM hoặc nguồn job lỗi không làm hỏng dữ liệu hiện có; người dùng thấy thông báo lỗi rõ ràng. | Chèn lỗi giả | `INT-FAULT-001` |
| NFR-REL-004 | Sao lưu cơ sở dữ liệu hằng ngày, khôi phục thử thành công mỗi quý. | Bản sao lưu, biên bản | Quy trình |

## Usability and compatibility

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-UX-001 | Giao diện tiếng Việt và tiếng Anh. | Danh sách chuỗi | `UI-I18N-001` |
| NFR-UX-002 | Mọi màn hình xử lý đủ trạng thái loading, rỗng, lỗi, đang lưu, thành công. | Review màn hình | `UI-STATE-001` |
| NFR-UX-003 | Dùng được trên Chrome, Safari, Edge bản mới và màn hình ≥ 360 px. | Kiểm thử trình duyệt | `UI-COMPAT-001` |
| NFR-UX-004 | Đáp ứng cơ bản WCAG 2.1 AA: tương phản, bàn phím, nhãn form. | Audit | `UI-A11Y-001` |

## Explainability and AI quality

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-AI-001 | Mỗi matching score hiển thị lý do theo từng yếu tố. | Kiểm tra giao diện | `UI-EXPLAIN-001` |
| NFR-AI-002 | Bản CV tối ưu không chứa kỹ năng không có trong dữ liệu người dùng và cũng không có kỹ năng liên quan trong phả hệ; không chứa công ty, bằng cấp, chứng chỉ ngoài dữ liệu (tỉ lệ vi phạm 0 trên bộ kiểm thử). | Bộ test có nhãn vàng | `EVAL-HALLU-001` |
| NFR-AI-003 | Trích xuất CV đạt ≥ 90% trường đúng trên bộ mẫu PDF/DOCX; ≥ 80% trên ảnh. | Độ chính xác theo trường | `EVAL-PARSE-001` |
