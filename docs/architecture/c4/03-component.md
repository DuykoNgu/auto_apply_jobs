# C3 — Component

> **Purpose:** cho thấy hai container ứng dụng (Backend API, Automation Worker) và AI package `acaj_ai` được chia thành những thành phần nào.

## C3.1 Backend API

```mermaid
flowchart TB
    web["Web Frontend<br/><i>[Container]</i>"]
    db[("PostgreSQL<br/><i>[Container]</i>")]
    files[("File Storage<br/><i>[Container]</i>")]

    subgraph api["Backend API [Container]"]
        direction TB
        http["HTTP API<br/><i>[Component]</i><br/>FastAPI routers, Pydantic validation,<br/>problem+json error mapping"]
        identity["Identity & Access<br/><i>[Component]</i><br/>Đăng ký, đăng nhập, JWT,<br/>kiểm tra chủ sở hữu, vai trò"]
        cv["CV Management<br/><i>[Component]</i><br/>Nhận file, sửa fact,<br/>CV gốc và xuất PDF"]
        insights["Market Insights Query<br/><i>[Component]</i><br/>Đọc thống kê nhu cầu, lương,<br/>skill gaps, lộ trình"]
        jobsq["Job & Match Query<br/><i>[Component]</i><br/>Danh sách job, phân tích JD,<br/>khả năng đậu phỏng vấn"]
        review["Tailored CV Review<br/><i>[Component]</i><br/>Bản CV theo job, nhãn nguồn gốc,<br/>căn cứ, sửa, hoàn tác, duyệt"]
        automation["Automation & Applications<br/><i>[Component]</i><br/>Điều kiện tự động, nộp tay,<br/>theo dõi hồ sơ, xác nhận thư"]
        mailbox["Mailbox Connection<br/><i>[Component]</i><br/>Kết nối OAuth,<br/>mã hóa token"]
        feedback["AI Feedback<br/><i>[Component]</i><br/>Hữu ích / không, sửa nhãn,<br/>ghi kết quả hồ sơ"]
        admin["Administration<br/><i>[Component]</i><br/>Nguồn job, người dùng,<br/>chỉ số AI, trọng số"]
        jobs["Job Requests<br/><i>[Component]</i><br/>Ghi việc vào job table"]
        audit["Audit Log<br/><i>[Component]</i><br/>Ghi hành động quan trọng"]
        persistence["Persistence<br/><i>[Component]</i><br/>Repositories, transactions,<br/>SQL mapping"]
    end

    web --> http
    http --> identity
    http --> cv
    http --> insights
    http --> jobsq
    http --> review
    http --> automation
    http --> mailbox
    http --> feedback
    http --> admin
    cv --> files
    cv --> jobs
    review --> jobs
    automation --> jobs
    cv --> persistence
    insights --> persistence
    jobsq --> persistence
    review --> persistence
    automation --> persistence
    mailbox --> persistence
    feedback --> persistence
    admin --> persistence
    jobs --> persistence
    automation -.->|"xác nhận gửi thư"| audit
    admin -.->|"đổi trọng số, nguồn"| audit
    review -.->|"duyệt, hoàn tác"| audit
    audit --> persistence
    persistence --> db

    style http fill:#1168bd,color:#fff
    style identity fill:#1168bd,color:#fff
    style cv fill:#1168bd,color:#fff
    style insights fill:#1168bd,color:#fff
    style jobsq fill:#1168bd,color:#fff
    style review fill:#0b4f9e,color:#fff
    style automation fill:#0b4f9e,color:#fff
    style mailbox fill:#1168bd,color:#fff
    style feedback fill:#0b4f9e,color:#fff
    style admin fill:#1168bd,color:#fff
    style jobs fill:#1168bd,color:#fff
    style audit fill:#1168bd,color:#fff
    style persistence fill:#1168bd,color:#fff
```

## C3.2 Automation Worker

```mermaid
flowchart TB
    db[("PostgreSQL<br/><i>[Container]</i>")]
    files[("File Storage<br/><i>[Container]</i>")]
    sources["Nguồn tuyển dụng<br/><i>[External System]</i>"]
    mail["Nhà cung cấp email<br/><i>[External System]</i>"]
    ai["acaj_ai<br/><i>[Package]</i><br/>xem C3.3"]

    subgraph worker["Automation Worker [Container]"]
        direction TB
        runner["Job Runner<br/><i>[Component]</i><br/>Lịch chạy, lấy việc từ job table,<br/>khóa, thử lại, hạn mức token"]
        reader["CV Reader<br/><i>[Component]</i><br/>Gọi OCR và trích xuất,<br/>lưu fact và kỹ năng"]
        collector["Job Collector<br/><i>[Component]</i><br/>Thu thập JD, chuẩn hóa,<br/>loại trùng, đánh dấu hết hạn"]
        jd["JD Analyzer Runner<br/><i>[Component]</i><br/>Gọi phân tích JD,<br/>lưu yêu cầu kèm trích dẫn"]
        stats["Market Statistics<br/><i>[Component]</i><br/>Xu hướng, cạnh tranh, phân vị lương,<br/>tần suất kỹ năng (thống kê)"]
        scorer["Match Scorer<br/><i>[Component]</i><br/>Điểm khớp 0–100 theo công thức,<br/>khả năng đậu phỏng vấn"]
        optimizer["CV Optimizer<br/><i>[Component]</i><br/>Gom căn cứ, gọi viết lại,<br/>kiểm chứng, kiểm tra ATS, lưu bản"]
        sender["Application Sender<br/><i>[Component]</i><br/>Chọn job theo luật, nộp form hoặc email,<br/>hạn mức, công ty loại trừ, CAPTCHA → nộp tay"]
        follow["Follow-up Scheduler<br/><i>[Component]</i><br/>Thư nhắc sau N ngày,<br/>trong giờ làm việc"]
        inbox["Inbox Watcher<br/><i>[Component]</i><br/>Đọc thư phản hồi, gọi phân loại,<br/>soạn thư trả lời, thông báo"]
        persistence["Persistence<br/><i>[Component]</i><br/>Repositories và SQL mapping"]
    end

    runner --> reader
    runner --> collector
    runner --> stats
    runner --> sender
    runner --> follow
    runner --> inbox
    collector --> jd
    reader --> scorer
    jd --> scorer
    scorer --> optimizer
    optimizer --> sender
    reader --> ai
    jd --> ai
    scorer --> ai
    optimizer --> ai
    inbox --> ai
    reader --> files
    optimizer --> files
    collector --> sources
    sender --> sources
    sender --> mail
    follow --> mail
    inbox --> mail
    reader --> persistence
    collector --> persistence
    jd --> persistence
    stats --> persistence
    scorer --> persistence
    optimizer --> persistence
    sender --> persistence
    follow --> persistence
    inbox --> persistence
    runner --> persistence
    persistence --> db

    style runner fill:#1168bd,color:#fff
    style reader fill:#0b4f9e,color:#fff
    style collector fill:#1168bd,color:#fff
    style jd fill:#0b4f9e,color:#fff
    style stats fill:#1168bd,color:#fff
    style scorer fill:#1168bd,color:#fff
    style optimizer fill:#0b4f9e,color:#fff
    style sender fill:#1168bd,color:#fff
    style follow fill:#1168bd,color:#fff
    style inbox fill:#0b4f9e,color:#fff
    style persistence fill:#1168bd,color:#fff
    style ai fill:#7b3fbf,color:#fff
    style sources fill:#999,color:#fff
    style mail fill:#999,color:#fff
```

Màu xanh đậm là thành phần có gọi AI; xanh thường là luật, thống kê hoặc tích hợp.

## C3.3 AI package `acaj_ai`

```mermaid
flowchart TB
    caller["Automation Worker<br/><i>[Container]</i><br/>truyền dữ liệu vào, nhận kết quả đã kiểm chứng"]
    llm["LLM Provider<br/><i>[External System]</i>"]

    subgraph pkg["acaj_ai [Python package]"]
        direction TB
        masker["PiiMasker<br/><i>[Component]</i><br/>Che SĐT, email, địa chỉ, số giấy tờ;<br/>điền lại sau khi nhận kết quả"]
        ocr["OcrEngine<br/><i>[Component]</i><br/>Ảnh → văn bản,<br/>độ tin cậy theo dòng"]
        cvx["CvExtractor<br/><i>[Component]</i><br/>Văn bản CV → fact có ID<br/>theo schema cố định"]
        jdx["JdAnalyzer<br/><i>[Component]</i><br/>JD → yêu cầu, từ khóa, điểm nổi bật,<br/>mỗi mục kèm đoạn trích"]
        skills["SkillNormalizer<br/><i>[Component]</i><br/>Đưa kỹ năng về phả hệ,<br/>suy ra kỹ năng liên quan ≤ 2 bậc"]
        embed["Embedder<br/><i>[Component]</i><br/>Embedding CV và JD<br/>cho yếu tố gần nghĩa"]
        tailor["CvTailor<br/><i>[Component]</i><br/>Viết lại CV và cover letter,<br/>mỗi câu trích ID căn cứ"]
        ground["GroundingValidator<br/><i>[Component]</i><br/>Loại câu không có căn cứ,<br/>gắn ORIGINAL / REWRITTEN / INFERRED"]
        ats["AtsChecker<br/><i>[Component]</i><br/>Luật: định dạng, tiêu đề mục,<br/>độ phủ từ khóa"]
        classify["ReplyClassifier<br/><i>[Component]</i><br/>INTERVIEW / OFFER / REJECTED / UNKNOWN<br/>kèm độ tin cậy"]
        draft["ReplyDrafter<br/><i>[Component]</i><br/>Soạn thư trả lời<br/>(luôn chờ người dùng xác nhận)"]
        schema["OutputSchemaValidator<br/><i>[Component]</i><br/>Loại đầu ra sai schema,<br/>tách dữ liệu khỏi chỉ dẫn"]
        client["LLMClient<br/><i>[Component]</i><br/>Gọi provider, thử lại,<br/>ghi model, prompt version, token"]
        evals["Evals CLI<br/><i>[Component]</i><br/>cv-parse, jd-extract, grounding,<br/>hallucination, injection, cost"]
    end

    caller --> masker
    masker --> cvx
    masker --> jdx
    masker --> tailor
    masker --> classify
    ocr --> cvx
    cvx --> skills
    jdx --> skills
    tailor --> ground --> ats
    classify --> draft
    cvx --> client
    jdx --> client
    tailor --> client
    classify --> client
    draft --> client
    embed --> client
    client --> schema
    client --> llm
    evals -.->|"chạy với stub hoặc LLM thật"| client

    style ground fill:#2e7d32,color:#fff
    style schema fill:#2e7d32,color:#fff
    style masker fill:#2e7d32,color:#fff
    style ats fill:#1168bd,color:#fff
    style skills fill:#1168bd,color:#fff
    style client fill:#7b3fbf,color:#fff
    style llm fill:#999,color:#fff
```

`acaj_ai` không bao giờ chạm database hay gọi email, nguồn job. Worker truyền dữ liệu vào và lưu kết quả đã kiểm chứng; nhờ vậy package test được độc lập và chạy eval trong CI với LLM giả lập (NFR-MAINT-002). Màu xanh lá là các lớp bảo vệ: che dữ liệu, kiểm tra schema, kiểm chứng căn cứ.

## Component catalog

| Container | Component | Responsibility | Features / use cases |
|---|---|---|---|
| Backend API | HTTP API | Endpoint, validation, ánh xạ lỗi | Tất cả |
| Backend API | Identity & Access | Đăng ký, đăng nhập, JWT, kiểm tra chủ sở hữu và vai trò | F01 · UC01, UC02 |
| Backend API | CV Management | Nhận file CV, sửa fact, CV gốc, xuất PDF | F02 · UC03–UC06 |
| Backend API | Market Insights Query | Đọc thống kê đã tính sẵn cho SCR-20 | F03 · UC07–UC10 |
| Backend API | Job & Match Query | Danh sách job, phân tích JD, khả năng đậu phỏng vấn, giá trị từng yếu tố | F04 · UC12, UC13 |
| Backend API | Tailored CV Review | Bản CV theo job, nhãn nguồn gốc, căn cứ, sửa, hoàn tác, duyệt (chế độ duyệt trước) | F05 · UC14–UC16 |
| Backend API | Automation & Applications | Điều kiện tự động, nộp tay, theo dõi hồ sơ, xác nhận thư trả lời | F06 · UC17, UC18, UC20, UC21 |
| Backend API | Mailbox Connection | Kết nối OAuth, lưu token mã hóa | F06 · tiền đề UC18–UC20 |
| Backend API | AI Feedback | Ghi phản hồi về kết quả AI | F07 · UC23 |
| Backend API | Administration | Nguồn job, người dùng, chỉ số AI, trọng số matching | F07 · UC22, UC24 |
| Backend API | Job Requests | Ghi việc `PARSE_CV`, `OPTIMIZE_CV`, `SEND_REPLY`… vào job table | Tất cả tác vụ nền |
| Backend API | Audit Log | Ghi đăng nhập, xác nhận thư, duyệt, hoàn tác, đổi cấu hình | Tất cả |
| Automation Worker | Job Runner | Chạy việc theo lịch và theo yêu cầu, khóa, thử lại, hạn mức | Tất cả tác vụ nền |
| Automation Worker | CV Reader | Gọi OCR và trích xuất, lưu fact và kỹ năng chuẩn hóa | F02 · UC03, UC04, UC06 |
| Automation Worker | Job Collector | Thu thập, chuẩn hóa, loại trùng, hết hạn | F04.1 · UC11 |
| Automation Worker | JD Analyzer Runner | Phân tích JD, lưu yêu cầu kèm trích dẫn | F04.2 · UC13 |
| Automation Worker | Market Statistics | Thống kê nhu cầu, cạnh tranh, lương, kỹ năng (không dùng LLM cho con số) | F03 · UC07–UC10 |
| Automation Worker | Match Scorer | Điểm khớp theo công thức, khả năng đậu phỏng vấn | F04.3 · UC12 |
| Automation Worker | CV Optimizer | Gom căn cứ, gọi viết lại, kiểm chứng, ATS, lưu bản CV | F05 · UC14–UC16 |
| Automation Worker | Application Sender | Chọn job theo luật, nộp, hạn mức, loại trừ, chuyển nộp tay | F06.2 · UC17, UC18 |
| Automation Worker | Follow-up Scheduler | Thư nhắc theo lịch | F06.3 · UC19 |
| Automation Worker | Inbox Watcher | Đọc phản hồi, phân loại, soạn thư, thông báo | F06.4 · UC20 |
| acaj_ai | PiiMasker, OcrEngine, CvExtractor, JdAnalyzer, SkillNormalizer, Embedder | Đọc hiểu đầu vào | F02, F04 |
| acaj_ai | CvTailor, GroundingValidator, AtsChecker | Viết lại có căn cứ và kiểm tra | F05 |
| acaj_ai | ReplyClassifier, ReplyDrafter | Phân loại và soạn thư | F06.4 |
| acaj_ai | OutputSchemaValidator, LLMClient, Evals CLI | An toàn đầu ra, truy vết, đo chất lượng | F07 · NFR-AI |

## Dependency Flow

- **Backend API:** HTTP API → thành phần tính năng → Persistence → PostgreSQL. Thành phần tính năng (module) gọi nhau chỉ qua service của module sở hữu dữ liệu, không đọc repository hay bảng của nhau; việc cần chạy nền thì ghi vào job table qua Job Requests.
- **Automation Worker:** Job Runner → CV Reader / Job Collector → JD Analyzer Runner → Match Scorer → CV Optimizer → Application Sender → Follow-up Scheduler / Inbox Watcher → Persistence.
- Match Scorer chạy xong và lưu điểm trước khi CV Optimizer gọi LLM, nên điểm khớp không phụ thuộc LLM (BR-012).
- Application Sender chỉ nộp khi bản CV của job ở trạng thái `READY` và job thỏa điều kiện người dùng (BR-019). LLM lỗi thì job đó không được nộp, các job khác vẫn chạy.
- Inbox Watcher chỉ soạn thư; việc gửi thư trả lời là một việc `SEND_REPLY` riêng, chỉ được tạo khi Backend API ghi nhận xác nhận của người dùng (BR-022).
