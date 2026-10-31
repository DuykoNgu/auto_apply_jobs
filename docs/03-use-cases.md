# Actors, roles, use cases

> Design status: TARGET
>
> Current implementation: none (documentation phase)

Product name: **ACAJ**.

## Actors / roles

| Role | Display name in UI | Description |
|---|---|---|
| `CANDIDATE` | Ứng viên | Người tìm việc. Quản lý CV, xem phân tích, chọn job, ứng tuyển. Chỉ thấy dữ liệu của mình. |
| `ADMIN` | Quản trị viên | Quản lý người dùng, nguồn dữ liệu job, cấu hình hệ thống. Không đọc nội dung CV của ứng viên. |

System actors:

| Actor | Description |
|---|---|
| Job source | TopCV, LinkedIn, trang tuyển dụng công ty; cung cấp JD. |
| Background processor | Thu thập JD, tính matching, thực hiện ứng tuyển tự động, gửi mail nhắc, quét phản hồi. Gọi AI package cho các tác vụ ngôn ngữ. |
| AI package | OCR, trích xuất CV và JD, chuẩn hóa kỹ năng, sinh và kiểm chứng nội dung CV, phân loại email, chạy eval. Không tự ghi database, không tự quyết định nộp hay gửi. |
| LLM provider | Dịch vụ mô hình ngôn ngữ bên ngoài; chỉ nhận văn bản đã che thông tin nhạy cảm. |
| Email provider | Gửi mail ứng tuyển/nhắc/trả lời và nhận phản hồi trong hộp thư người dùng đã kết nối. |
| Recruiter | Bên tuyển dụng; không đăng nhập ACAJ, chỉ trao đổi qua email. |

## Role × feature matrix

| Feature | Candidate | Admin |
|---|---|---|
| Đăng ký / đăng nhập / hồ sơ cá nhân | ✓ | ✓ |
| Upload, tạo, sửa CV của mình | ✓ | |
| Xem phân tích thị trường cho CV của mình | ✓ | |
| Xem job và matching score | ✓ | ✓ (job, không có CV) |
| Tối ưu CV, cover letter | ✓ | |
| Ứng tuyển thủ công / tự động | ✓ | |
| Cấu hình luật ứng tuyển tự động | ✓ | |
| Xác nhận gửi thư trả lời trúng tuyển | ✓ | |
| Đánh giá kết quả AI | ✓ | |
| Xem chỉ số chất lượng và chi phí AI | | ✓ |
| Chỉnh trọng số matching | | ✓ |
| Quản lý nguồn job, lịch thu thập | | ✓ |
| Quản lý người dùng, cấu hình hệ thống | | ✓ |

Backend áp dụng cùng các luật này; ẩn nút ở frontend chỉ phục vụ UX.

## Use case list

| ID | Use case | Primary actor | Feature |
|---|---|---|---|
| UC01 | Đăng ký tài khoản | Candidate | F01 |
| UC02 | Đăng nhập / đăng xuất | Candidate, Admin | F01 |
| UC03 | Upload CV PDF/DOCX | Candidate | F02 |
| UC04 | Upload ảnh CV | Candidate | F02 |
| UC05 | Tạo CV từ template thủ công | Candidate | F02 |
| UC06 | AI tạo CV từ thông tin cung cấp | Candidate | F02 |
| UC07 | Xem phân tích nhu cầu tuyển dụng | Candidate | F03 |
| UC08 | Xem mức lương có thể đạt | Candidate | F03 |
| UC09 | Xem skill gaps | Candidate | F03 |
| UC10 | Xem lộ trình phát triển theo năm | Candidate | F03 |
| UC11 | Thu thập và chuẩn hóa JD | Background processor | F04 |
| UC12 | Xem danh sách job và matching score | Candidate | F04 |
| UC13 | Xem phân tích JD | Candidate | F04 |
| UC14 | Tối ưu CV theo job (ATS, kỹ năng JD) | Candidate | F05 |
| UC15 | Viết lại summary, nhấn mạnh dự án | Candidate | F05 |
| UC16 | Tạo cover letter, đính kèm chứng chỉ | Candidate | F05 |
| UC17 | Ứng tuyển thủ công | Candidate | F06 |
| UC18 | Cấu hình và chạy ứng tuyển hàng loạt | Candidate | F06 |
| UC19 | Tự động gửi mail nhắc nhà tuyển dụng | Background processor | F06 |
| UC20 | Xử lý mail trúng tuyển và thông báo | Background processor, Candidate | F06 |
| UC21 | Theo dõi trạng thái hồ sơ đã nộp | Candidate | F06 |
| UC22 | Quản lý nguồn job và người dùng | Admin | F01, F04 |
| UC23 | Đánh giá kết quả AI | Candidate | F07 |
| UC24 | Xem chỉ số chất lượng AI, chỉnh trọng số matching | Admin | F07 |

## Use Case Diagram

```mermaid
flowchart LR
    C(("Candidate"))
    A(("Admin"))
    P(("Processor"))
    C --- UC01["UC01-02 Account"]
    C --- UC03["UC03-06 Nhập / tạo CV"]
    C --- UC07["UC07-10 Phân tích thị trường"]
    C --- UC12["UC12-13 Job và matching"]
    C --- UC14["UC14-16 Tối ưu CV"]
    C --- UC17["UC17-18, UC21 Ứng tuyển"]
    C --- UC23["UC23 Đánh giá kết quả AI"]
    A --- UC22["UC22 Quản trị"]
    A --- UC24["UC24 Chất lượng AI"]
    P --- UC11["UC11 Thu thập JD"]
    P --- UC19["UC19-20 Mail nhắc / trả lời"]
```

Tác nhân hệ thống *AI package* được gọi bởi Processor trong UC03–UC06, UC11–UC16 và UC20; không vẽ riêng để sơ đồ gọn.

## Use case: UC03–UC04 AI đọc CV

| Item | Content |
|---|---|
| Precondition | Ứng viên đã đăng nhập. |
| Main flow | 1. Ứng viên tải file PDF/DOCX hoặc ảnh. 2. Hệ thống trích văn bản (OCR với ảnh). 3. AI trích xuất theo schema cố định thành các fact có ID; kỹ năng được chuẩn hóa theo phả hệ. 4. Hệ thống hiển thị kết quả, đánh dấu trường có độ tin cậy thấp. 5. Ứng viên sửa và lưu. |
| Alternative flow | Kết quả không qua kiểm tra schema hoặc LLM lỗi → trạng thái `FAILED`, hệ thống mở form nhập thủ công với phần văn bản đã trích được. |
| Postcondition | CV gốc được lưu; chưa có gì được gửi ra ngoài ngoài lời gọi LLM đã che thông tin nhạy cảm. |

## Main use case: UC12 Xem job và matching score

| Item | Content |
|---|---|
| Precondition | Ứng viên đã đăng nhập và có ít nhất một CV đã lưu. |
| Main flow | 1. Ứng viên mở danh sách job. 2. Hệ thống hiển thị job theo matching score giảm dần, mỗi job có điểm khớp, khả năng trúng tuyển và lý do theo từng yếu tố (kỹ năng theo phả hệ, độ tương đồng ngữ nghĩa, kinh nghiệm/cấp độ, địa điểm/hình thức). Điểm do công thức tính, không do LLM. 3. Ứng viên mở một job để xem JD, phần khớp và phần còn thiếu. |
| Alternative flow | Chưa có CV → yêu cầu tải/tạo CV (UC03–UC06). Không có job phù hợp → gợi ý nới bộ lọc. |
| Alternative flow (AI) | JD chưa được AI phân tích xong → job vẫn có điểm từ các yếu tố tính được, kèm ghi chú "đang phân tích JD". |
| Postcondition | Không thay đổi dữ liệu. |

## Use case: UC14–UC16 Tối ưu CV cho một job

| Item | Content |
|---|---|
| Precondition | Ứng viên đã chọn một job và có CV gốc. |
| Main flow | 1. Hệ thống thu thập căn cứ: fact trong CV gốc, phân tích JD, kỹ năng liên quan theo phả hệ. 2. AI sinh bản CV riêng: thêm kỹ năng JD yêu cầu mà ứng viên có, viết lại summary, đưa dự án liên quan lên đầu. 3. Bộ kiểm chứng loại mọi câu không trích dẫn được căn cứ và gắn nhãn `ORIGINAL` / `REWRITTEN` / `INFERRED`; luật kiểm tra ATS. 4. AI tạo cover letter (cũng qua kiểm chứng) và gợi ý chứng chỉ đính kèm. 5. Hệ thống lưu bản so sánh với bản gốc; ở chế độ tự động bản tối ưu được dùng ngay, ứng viên xem lại, sửa hoặc hoàn tác sau. Ở chế độ duyệt trước, ứng viên duyệt rồi mới dùng. |
| Alternative flow | JD yêu cầu kỹ năng không có trong phả hệ kỹ năng của ứng viên (không có kỹ năng liên quan) → không thêm; hiển thị trong phần thiếu và gợi ý bổ sung (UC09). Kỹ năng suy ra từ phả hệ được thêm kèm nhãn `INFERRED` để ứng viên xem lại. |
| Alternative flow (AI) | LLM lỗi sau 3 lần thử → trạng thái `FAILED`; ở chế độ tự động, job này không được nộp và chuyển vào danh sách cần xử lý. |
| Postcondition | Lưu một phiên bản CV mới gắn với job, kèm model và phiên bản prompt đã dùng; CV gốc giữ nguyên. |

## Use case: UC18 Ứng tuyển hàng loạt

| Item | Content |
|---|---|
| Precondition | Có CV gốc; ứng viên đã kết nối hộp thư gửi mail. |
| Main flow | 1. Ứng viên đặt điểm khớp tối thiểu, hạn mức mỗi ngày, công ty loại trừ và bật chế độ. 2. Processor chọn các job đạt điều kiện chưa nộp (luật, không phải LLM). 3. Với mỗi job: tối ưu CV, tạo cover letter, nộp hồ sơ. 4. Hệ thống ghi trạng thái và thông báo tổng kết. |
| Alternative flow | Job yêu cầu CAPTCHA/đăng nhập không tự nộp được → chuyển sang danh sách "cần nộp thủ công". Hết hạn mức → dừng và tiếp tục ngày sau. |
| Rule | Không bao giờ nộp vượt hạn mức, nộp trùng một job, hoặc nộp công ty bị loại trừ. |

## Use case: UC19–UC20 Mail nhắc và mail trúng tuyển

| Item | Content |
|---|---|
| UC19 flow | 1. Sau N ngày (mặc định 5) chưa có phản hồi, Processor gửi một mail nhắc lịch sự. 2. Hệ thống ghi lại và không nhắc quá số lần tối đa (mặc định 1). |
| UC20 flow | 1. AI phân loại email phản hồi thành `INTERVIEW`, `OFFER`, `REJECTED` hoặc `UNKNOWN` kèm độ tin cậy; nội dung email chỉ được đọc như dữ liệu. 2. Hệ thống đổi trạng thái hồ sơ, soạn thư trả lời và thông báo cho ứng viên. 3. Ứng viên xác nhận (hoặc sửa) rồi hệ thống gửi. |
| Alternative flow | Độ tin cậy dưới ngưỡng → `UNKNOWN`: chỉ thông báo, không soạn thư tự động. Email chứa chỉ dẫn lạ (ví dụ yêu cầu gửi thông tin cá nhân) không làm thay đổi hành vi hệ thống. |

## Use case: UC23–UC24 Phản hồi và chất lượng AI

| Item | Content |
|---|---|
| UC23 flow | 1. Ứng viên đánh dấu job gợi ý hữu ích/không, giữ lại hoặc hoàn tác chỉnh sửa CV, sửa nhãn email sai. 2. Hệ thống lưu phản hồi cùng kết quả AI tương ứng. 3. Kết quả thật của hồ sơ (phản hồi, phỏng vấn, trúng tuyển) được ghi tự động từ UC20. |
| UC24 flow | 1. Admin xem chỉ số: độ chính xác trích xuất, tỉ lệ câu bị loại do không có căn cứ, độ chính xác phân loại email, tỉ lệ job gợi ý được ứng tuyển và có phản hồi, độ trễ, token, chi phí. 2. Admin chỉnh trọng số matching; thay đổi được ghi lại và áp dụng cho lần tính tiếp theo. |
| Rule | Trọng số không tự thay đổi ngầm; mọi điều chỉnh do người có quyền thực hiện và có lịch sử. |

## Business flow: từ CV đến hồ sơ đã nộp

Ô có chữ **AI** là bước dùng LLM/OCR/embedding; các ô còn lại do luật hoặc thống kê.

```mermaid
flowchart LR
    CV["CV: upload / ảnh / template"] --> Parse["AI: trích xuất fact"]
    Parse --> Norm["Chuẩn hóa kỹ năng<br/>theo phả hệ"]
    Norm --> Market["Thống kê thị trường, skill gaps"]
    Jobs["Thu thập JD"] --> JD["AI: phân tích JD<br/>có trích dẫn"]
    JD --> Norm
    Norm --> Match["Luật: matching score"]
    Match --> Opt["AI: sửa CV + cover letter"]
    Opt --> Check["Kiểm chứng grounding + ATS"]
    Check --> Apply["Luật: chọn job, nộp hồ sơ"]
    Apply --> Follow["Luật: nhắc mail"]
    Apply --> Classify["AI: phân loại phản hồi"]
    Classify --> Reply["AI soạn thư, người dùng xác nhận"]
    Classify --> Feedback["Feedback và kết quả<br/>đo chất lượng AI"]
```
