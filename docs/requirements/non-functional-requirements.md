# Non-Functional Requirements — ACAJ

> Design status: PROPOSED BASELINE
>
> Implementation status: TARGET; verification is PLANNED

Các mục tiêu dưới đây là mức khởi điểm hợp lý cho sản phẩm giai đoạn đầu, không phải cam kết SLA. Mỗi yêu cầu chỉ hoàn thành khi bước kiểm chứng đạt trong khối lượng tham chiếu (cuối file). Chỉ số chất lượng AI được đo bằng bộ eval của AI package: chế độ stub chạy trong CI, chế độ live chạy với LLM thật.

## Performance and timeliness

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-PERF-001 | API đọc có phân trang: P95 ≤ 500 ms. | Thời gian phía server | `PERF-READ-001` |
| NFR-PERF-002 | API ghi: P95 ≤ 800 ms (không tính tác vụ nền). | Thời gian phía server | `PERF-WRITE-001` |
| NFR-PERF-003 | Danh sách job kèm matching: P95 ≤ 2 s. Điểm đã được tính trước, không gọi LLM trong request. | Thời gian mỗi request | `PERF-MATCH-001` |
| NFR-PERF-004 | Trích xuất CV 3 trang (PDF/DOCX) đạt trạng thái cuối trong ≤ 30 s; ảnh ≤ 60 s. | Từ upload đến `READY`/`FAILED` | `INT-CV-001` với LLM stub |
| NFR-PERF-005 | Tối ưu CV cho một job (CV + cover letter + kiểm chứng) đạt trạng thái cuối trong ≤ 60 s. | Từ yêu cầu đến `READY`/`FAILED` | `INT-OPT-001` với LLM stub |
| NFR-TIME-001 | JD mới từ nguồn xuất hiện trong hệ thống tối đa 24 giờ sau khi đăng. | Thời gian đăng vs thời gian lưu | `INT-CRAWL-001` |
| NFR-TIME-002 | Phản hồi tuyển dụng được phân loại và thông báo ứng viên trong ≤ 15 phút. | Thời gian mail đến vs thông báo | `INT-MAIL-001` |
| NFR-TIME-003 | Matching score của JD mới được tính trong ≤ 10 phút sau khi JD được lưu. | Thời gian lưu JD vs thời gian có điểm | `INT-MATCH-002` |

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
| NFR-SEC-005 | Mật khẩu, token hộp thư, `LLM_API_KEY` và khóa API khác không xuất hiện trong log ứng dụng hay prompt gửi LLM. | Kiểm tra mẫu log và prompt đã ghi lại | `SEC-LOG-001` |
| NFR-SEC-006 | Token truy cập hộp thư lưu mã hóa, chỉ cấp quyền gửi và đọc thư ứng tuyển. | Kiểm tra lưu trữ và scope | `SEC-MAIL-001` |
| NFR-PRIV-001 | Xóa tài khoản xóa toàn bộ dữ liệu cá nhân và kết quả AI trong 30 ngày. | Kiểm tra sau xóa | `INT-PRIV-001` |
| NFR-PRIV-002 | Masking che 100% mẫu thông tin nhạy cảm (số điện thoại, email, địa chỉ, số giấy tờ) trong bộ kiểm thử ≥ 300 CV và email mẫu trước khi gửi LLM. | Số mẫu còn sót sau masking | `UNIT-MASK-001`, eval `masking` |
| NFR-PRIV-003 | File CV truy cập bằng đường dẫn có chữ ký, hết hạn sau 15 phút. | Thử truy cập sau hạn | `SEC-FILE-001` |

## AI quality and safety

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-AI-001 | Trích xuất CV đạt ≥ 90% trường đúng trên bộ mẫu PDF/DOCX; ≥ 80% trên ảnh. | Độ chính xác theo trường so với nhãn vàng | eval `cv-parse` |
| NFR-AI-002 | Trích xuất kỹ năng từ JD đạt F1 ≥ 0.85 so với nhãn vàng. | Precision, recall, F1 | eval `jd-extract` |
| NFR-AI-003 | 100% câu trong bản CV tối ưu và cover letter đã lưu có ít nhất một căn cứ hợp lệ. | Truy vấn câu và căn cứ | `INT-AI-001`, eval `grounding` |
| NFR-AI-004 | 0 trường hợp thêm công ty, vị trí, bằng cấp, chứng chỉ, hoặc kỹ năng không có trong dữ liệu và không suy ra được theo phả hệ, trên bộ kiểm thử. | Số vi phạm | eval `hallucination` |
| NFR-AI-005 | Phân loại email: precision ≥ 0.95 cho `OFFER` và `INTERVIEW`; email không chắc chắn rơi vào `UNKNOWN`. | Precision, recall theo nhãn | eval `reply-classify` |
| NFR-AI-006 | 0 trường hợp hệ thống làm theo chỉ dẫn chèn trong JD/email trên bộ ≥ 50 mẫu prompt injection. | Số hành vi lệch | eval `injection` |
| NFR-AI-007 | LLM ngừng hoạt động không làm thay đổi hay chậm matching score, thống kê thị trường, lịch nhắc mail. | Chạy với LLM stub luôn lỗi | `INT-AI-002` |
| NFR-AI-008 | Lời giải thích thị trường do AI viết không chứa con số nào khác với kết quả thống kê. | Số con số lệch | eval `number-consistency` |
| NFR-AI-009 | Mục tiêu theo dõi: ≥ 30% job trong top 10 gợi ý được người dùng ứng tuyển hoặc đánh dấu hữu ích. | Báo cáo tháng từ phản hồi (UC23) | `OPS-QUALITY-001` (dùng để chỉnh trọng số) |
| NFR-AI-010 | Chi phí AI trung bình ≤ 0.05 USD cho mỗi job được tối ưu CV; token mỗi lượt được ghi lại. | Token × bảng giá provider | eval `cost`, báo cáo UC24 |

## Reliability, operations, maintainability, usability

| ID | Statement | Measurement | Verification |
|---|---|---|---|
| NFR-REL-001 | Dịch vụ sẵn sàng ≥ 99% mỗi tháng, không tính bảo trì có kế hoạch. | Số phút health-check thành công | `OPS-AVAIL-001` |
| NFR-REL-002 | Tác vụ nền lỗi được thử lại tối đa 3 lần với giãn cách tăng dần; hai worker không chạy cùng một tác vụ. | Trạng thái bảng job | `INT-JOB-001` |
| NFR-REL-003 | Sao lưu cơ sở dữ liệu hằng ngày, giữ 30 ngày; RPO ≤ 24 giờ, RTO ≤ 4 giờ. | Thời điểm sao lưu, khôi phục thử | `OPS-RESTORE-001` |
| NFR-OBS-001 | API và worker ghi log JSON có trace id; mỗi lời gọi LLM ghi model, phiên bản prompt, độ trễ, token, trạng thái (không ghi nội dung CV). | Schema log | `INT-OBS-001` |
| NFR-MAINT-001 | Unit coverage ≥ 80% cho service và AI package; ≥ 90% cho `MatchScorer`, `GroundingValidator`, `PiiMasker`, policy. | Báo cáo coverage | CI |
| NFR-MAINT-002 | Lint, type check, test, migration và toàn bộ eval ở chế độ stub chạy trong CI không lỗi. Đổi model hoặc prompt phải chạy eval live và không làm giảm chỉ số NFR-AI. | Trạng thái CI, báo cáo eval | CI, eval live |
| NFR-UX-001 | Giao diện tiếng Việt và tiếng Anh; thời gian lưu UTC và hiển thị theo múi giờ người xem. | Danh sách chuỗi, kiểm tra API | `UI-I18N-001` |
| NFR-UX-002 | Mọi màn hình xử lý đủ trạng thái loading, rỗng, lỗi, đang lưu, thành công, và trạng thái AI (`PENDING`, `NEEDS_REVIEW`, `FAILED`). | Review màn hình | `UI-STATE-001` |
| NFR-UX-003 | Dùng được trên Chrome, Safari, Edge bản mới và màn hình ≥ 360 px. | Kiểm thử trình duyệt | `UI-COMPAT-001` |
| NFR-UX-004 | Đáp ứng WCAG 2.1 AA ở các tiêu chí áp dụng: tương phản, bàn phím, nhãn form; trạng thái không chỉ thể hiện bằng màu. | Audit | `UI-A11Y-001` |

## Reference workload

- Cơ sở dữ liệu seed theo NFR-CAP-001: 1.000 người dùng, 200.000 JD đang lưu, phả hệ kỹ năng đầy đủ cho các ngành mẫu.
- 50 virtual users chạy 80% đọc, 20% ghi; thu thập JD và ứng tuyển hàng loạt chạy song song.
- LLM provider được thay bằng stub có độ trễ cố định 3 giây cho test hiệu năng; độ trễ của provider thật nằm ngoài kiểm soát của hệ thống và không thuộc NFR-PERF.
- Bộ eval gồm tối thiểu: 200 CV có nhãn vàng (150 PDF/DOCX, 50 ảnh), 300 JD có nhãn kỹ năng, 200 email phản hồi có nhãn, 50 mẫu prompt injection.
