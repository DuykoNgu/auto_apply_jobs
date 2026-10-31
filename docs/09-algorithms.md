# Algorithms — Skill taxonomy, Matching, Interview chance, Market, Automation

> Design status: TARGET
>
> Validation: các công thức matching đã được chạy bằng một script Python tham chiếu trên 4 job mẫu của prototype (mục 9); số trong tài liệu lấy từ lần chạy đó.

Các thuật toán ở đây là **luật và thống kê, giải thích được**. LLM không quyết định điểm khớp, khả năng đậu phỏng vấn, con số thị trường hay việc nộp hồ sơ (BR-012). LLM chỉ chạy sau, để viết lại CV trên căn cứ có sẵn ([AI pipeline](architecture/ai-pipeline.md)).

## 1. Parameters

| Parameter | Default | Where | Meaning |
|---|---|---|---|
| `weight_skill`, `weight_semantic`, `weight_experience`, `weight_location` | 40, 20, 25, 15 | `system_settings` | Trọng số 4 yếu tố của điểm khớp |
| `chance_high_min`, `chance_medium_min` | 75, 50 | `system_settings` | Ngưỡng điểm cho mức Cao, Trung bình |
| `skill_gate_cap` | 39 | `system_settings` | Điểm tối đa khi yếu tố kỹ năng bằng 0 |
| `inference_max_depth` | 2 | `system_settings` | Số bậc tối đa khi suy ra kỹ năng |
| `market_min_sample` | 30 | `system_settings` | Số JD tối thiểu để hiện một chỉ số thị trường |
| `reply_confidence_min` | 0,80 | `system_settings` | Dưới ngưỡng này, thư phản hồi là `UNKNOWN` |
| `REQ_WEIGHT` | MUST 2, NICE 1 | code constant | Trọng số yêu cầu bắt buộc / nên có |
| `INFER_CREDIT` | có 1,0 · bậc 1 0,9 · bậc 2 0,7 | code constant | Mức tính điểm cho kỹ năng có sẵn và kỹ năng suy ra |
| `PREFILTER_K` | 300 | code constant | Số job gần nghĩa nhất đưa vào chấm điểm cho mỗi CV |
| `ALIAS_SIMILARITY_MIN` | 0,85 | code constant | Ngưỡng embedding để ghép một tên kỹ năng lạ vào kỹ năng có sẵn |
| `COMPETITION_HIGH` | > 50 ứng viên mỗi tin | code constant | Ngưỡng cạnh tranh cao |
| `min_match_score`, `daily_limit`, `follow_up_after_days`, `max_follow_ups` | 70, 20, 5, 1 | `automation_settings` | Điều kiện tự động của từng người dùng |

## 2. Skill normalization and inference

### 2.1 Normalization

Mỗi tên kỹ năng đọc được từ CV hoặc JD đi qua 3 bước, dừng ở bước đầu tiên khớp:

1. **Khớp chính xác** với `skills.name` hoặc `skill_aliases.alias` (không phân biệt hoa thường). Ví dụ: "ReactJS", "React.js" → React.
2. **Khớp gần nghĩa:** embedding của tên lạ so với embedding tên kỹ năng; độ tương đồng cosine ≥ `ALIAS_SIMILARITY_MIN` thì ghép, và thêm vào `skill_aliases` ở trạng thái chờ Admin duyệt.
3. **Không khớp:** giữ nguyên chữ gốc trong fact, không gắn kỹ năng; ghi vào danh sách "kỹ năng chưa có trong phả hệ" để Admin bổ sung.

### 2.2 Inference closure

`skill_relations` chứa hai loại cạnh:

- `PARENT_OF`: ví dụ `SQL → MySQL`. **Có kỹ năng con thì suy ra kỹ năng cha:** biết MySQL thì suy ra SQL.
- `RELATED_TO`: ví dụ `Docker ↔ containerization`, dùng hai chiều. **Chỉ dùng cho hai kỹ năng gần như cùng nghĩa.** Hai kỹ năng chỉ hay đi cùng nhau (Docker và Kubernetes) không được nối `RELATED_TO`, nếu không "có Docker" sẽ bị suy ra "có Kubernetes". Admin duyệt mọi cạnh mới ở màn Nguồn job.

`skill_inferences` được tính lại toàn bộ mỗi khi `skill_relations` đổi:

```sql
WITH RECURSIVE edges AS (            -- "from" có thì suy ra "to"
  SELECT to_skill_id AS from_id, from_skill_id AS to_id FROM skill_relations WHERE type = 'PARENT_OF'
  UNION
  SELECT from_skill_id, to_skill_id FROM skill_relations WHERE type = 'RELATED_TO'
  UNION
  SELECT to_skill_id, from_skill_id FROM skill_relations WHERE type = 'RELATED_TO'
),
walk AS (
  SELECT from_id, to_id, 1 AS depth, NULL::uuid AS via FROM edges
  UNION ALL
  SELECT w.from_id, e.to_id, w.depth + 1, w.to_id
  FROM walk w JOIN edges e ON e.from_id = w.to_id
  WHERE w.depth < :max_depth AND e.to_id <> w.from_id
)
SELECT DISTINCT ON (from_id, to_id) from_id, to_id, depth, via
FROM walk
ORDER BY from_id, to_id, depth;       -- giữ đường ngắn nhất
```

Một kỹ năng của ứng viên có **mức tính** (`credit`): 1,0 nếu có trực tiếp trong fact; 0,9 nếu suy ra bậc 1; 0,7 nếu suy ra bậc 2; 0 nếu không có. Đây cũng là luật quyết định câu `INFERRED` nào được phép xuất hiện trong CV đã tối ưu (BR-008).

## 3. Matching score

### 3.1 Prefilter

Mỗi khi CV chính đổi, hoặc mỗi ngày với job mới, worker lấy `PREFILTER_K` (300) job `OPEN` gần nghĩa nhất với CV bằng pgvector:

```sql
SELECT id FROM job_postings
WHERE status = 'OPEN'
  AND (location_id = :target_location OR work_mode = 'REMOTE')
ORDER BY embedding <=> :cv_embedding
LIMIT 300;
```

Rồi cộng thêm mọi job có ít nhất một yêu cầu `MUST` trùng kỹ năng của ứng viên (để không lỡ job dùng từ ngữ khác). Chỉ các job này được chấm điểm.

### 3.2 Factors (mỗi yếu tố trong [0, 1])

```text
skill      = Σ REQ_WEIGHT(r) × credit(skill(r)) / Σ REQ_WEIGHT(r)        trên các yêu cầu có gắn kỹ năng
             (JD không có yêu cầu kỹ năng nào → 1)

semantic   = clamp((cosine(cv_embedding, job_embedding) − 0,5) / 0,4, 0, 1)

experience = 0,6 × level_match + 0,4 × min(1, months_relevant / months_required)
             level_match = 1 nếu cùng cấp; 0,5 nếu lệch 1 cấp; 0 nếu lệch hơn
             months_relevant = tổng tháng của các fact EXPERIENCE có ít nhất một kỹ năng trùng JD
             months_required = years_min × 12 của JD (không ghi → 0 → phần này = 1)

location   = 1   nếu job làm từ xa và ứng viên chấp nhận làm từ xa
             1   nếu cùng khu vực và hình thức làm việc nằm trong mong muốn
             0,5 nếu cùng khu vực nhưng hình thức khác mong muốn
             0   nếu khác khu vực và không làm từ xa
```

### 3.3 Score

```text
score = round(100 × Σ weight_i × factor_i / Σ weight_i)
nếu skill = 0  →  score = min(score, skill_gate_cap)          (39: job không có kỹ năng nào trùng không bao giờ đạt mức Trung bình)
```

Mỗi lần tính lưu `weights_version`, nên khi Admin đổi trọng số, điểm cũ được tính lại ở lần chạy sau và lịch sử vẫn đọc được (BR-024).

## 4. Interview chance

Khả năng đậu phỏng vấn là **chỉ số chính** hiện cho người dùng. Nó được suy ra từ điểm khớp rồi điều chỉnh theo hai rủi ro mà điểm trung bình che mất:

```text
level = HIGH   nếu score ≥ chance_high_min (75)
        MEDIUM nếu score ≥ chance_medium_min (50)
        LOW    còn lại
hạ 1 mức nếu thiếu một yêu cầu MUST (không có và không suy ra được)
hạ 1 mức nếu cạnh tranh của nhóm (vị trí × khu vực) là HIGH
không thấp hơn LOW
```

Lý do hạ mức: một job khớp 79 điểm nhưng bắt buộc Docker mà ứng viên không có thường bị loại ngay ở vòng lọc. Hiển thị "Cao" sẽ làm người dùng hiểu sai.

### 4.1 Calibration

Hằng tháng, worker gom `application_outcomes` theo `applications.chance_at_apply`:

```text
interview_rate(level) = (số hồ sơ INTERVIEW hoặc OFFER) / (số hồ sơ đã có kết quả, kể cả NO_RESPONSE sau 30 ngày)
```

Báo cáo hiện ở màn Chất lượng AI (UC24). Điều kiện "khả năng đậu phỏng vấn đáng tin":

- Mỗi mức có ít nhất 30 kết quả.
- `rate(HIGH) > rate(MEDIUM) > rate(LOW)`.

Nếu thứ tự bị đảo, hệ thống không tự đổi ngưỡng; Admin xem số liệu và chỉnh `chance_high_min`, `chance_medium_min` (BR-024). Hồ sơ không có phản hồi sau 30 ngày được ghi `NO_RESPONSE`.

## 5. Market statistics

Tính hằng ngày cho mỗi nhóm (vị trí chuẩn hóa × cấp độ × khu vực), chỉ trên JD trong 12 tháng gần nhất.

| Chỉ số | Cách tính |
|---|---|
| Xu hướng | Số JD mới mỗi tháng; thay đổi so với cùng kỳ năm trước = (12 tháng gần nhất − 12 tháng trước đó) / 12 tháng trước đó |
| Cạnh tranh | Trung vị số ứng viên mỗi tin, lấy từ nguồn có công bố số người nộp. LOW < 20, MEDIUM 20–50, HIGH > 50 |
| Khu vực, hình thức | Tỉ lệ JD theo `location_id` và `work_mode` |
| Lương | Mỗi JD có lương lấy điểm giữa khoảng (min, max); bỏ 2,5% thấp nhất và cao nhất; tính phân vị 25, 50, 75. Cùng cách cho từng cấp độ và từng ngành |
| Mức đề nghị | Từ phân vị 25 tới trung vị của cấp ứng viên; nếu skill coverage trung bình trên các job khớp ≥ 0,8 thì dịch lên tới phân vị 25 – phân vị 60 |
| Tần suất kỹ năng | Tỉ lệ JD có yêu cầu kỹ năng đó (MUST hoặc NICE) |

Nhóm có ít hơn `market_min_sample` JD hiện "chưa đủ dữ liệu" (BR-006). Câu tóm tắt do AI viết chỉ được dùng các số trong cùng phản hồi; trình kiểm tra so từng số trong câu với số liệu, sai thì bỏ câu (NFR-AI-008).

### 5.1 Skill gaps and priority

Kỹ năng thiếu là kỹ năng có tần suất ≥ 15% mà ứng viên có `credit = 0`.

| Priority | Điều kiện |
|---|---|
| HIGH | Tần suất ≥ 50%, hoặc là yêu cầu MUST trong ít nhất 30% job đang khớp |
| MEDIUM | Tần suất 30–50% |
| LOW | Tần suất 15–30% |

### 5.2 Roadmap by year

1. Sắp kỹ năng thiếu theo priority, rồi theo tần suất.
2. Chia vào các năm, mỗi năm tối đa 2 kỹ năng HIGH/MEDIUM hoặc 3 kỹ năng LOW.
3. Mỗi kỹ năng nối `course_skills` để lấy khóa học trong danh mục. Không có thì LLM gợi ý một khóa học, gắn nhãn "gợi ý của AI" (`in_catalog = false`).
4. **Bảng ngạch nghề:** mỗi ngạch (Backend, Fullstack, DevOps, Data Engineer) có một bộ yêu cầu tiêu biểu, là tần suất kỹ năng của ngạch đó. Khả năng đậu phỏng vấn được tính hai lần:
   - với kỹ năng hiện tại;
   - với kỹ năng hiện tại cộng kỹ năng của năm thứ nhất.

## 6. Tailoring checks

### 6.1 Grounding check (per sentence)

`GroundingValidator` nhận câu kèm danh sách ID căn cứ do LLM trả về:

1. **ID hợp lệ:** mỗi ID phải có trong `EvidenceBundle` của lần gọi này. ID lạ → bỏ ID đó.
2. **Còn căn cứ:** câu `REWRITTEN` cần ít nhất một fact; câu `INFERRED` cần một dòng `skill_inferences`. Không còn → **bỏ câu**.
3. **Không thêm sự thật:** trích các "thực thể cứng" trong câu (tên công ty, trường, chứng chỉ, con số, năm, kỹ năng). Thực thể nào không có trong các fact được trích và không phải kỹ năng suy ra hợp lệ → **bỏ câu**. Đây là luật chặn việc bịa công ty, bằng cấp, số liệu (BR-009).
4. **Mức hỗ trợ:** tỉ lệ từ có nghĩa của câu xuất hiện trong căn cứ (sau khi bỏ từ dừng). Dưới 0,3 → giữ câu nhưng gắn `needs_review` (ví dụ "Quen làm việc nhóm theo quy trình Agile" chỉ dựa vào "nhóm 3 người").

Câu `ORIGINAL` giữ nguyên văn bản của fact nên chỉ cần bước 1.

### 6.2 ATS check

| Check | Đạt khi |
|---|---|
| Văn bản đọc được | PDF tạo ra chọn và sao chép được toàn bộ chữ |
| Bố cục | Một cột, không bảng lồng, không chữ trong ảnh |
| Tiêu đề mục | Dùng tên thông dụng: Giới thiệu, Kinh nghiệm, Dự án, Học vấn, Kỹ năng, Chứng chỉ |
| Từ khóa | Ít nhất 80% kỹ năng MUST của JD xuất hiện trong CV dưới dạng có hoặc suy ra được |

Không đạt thì bản CV vẫn lưu nhưng `ats_passed = false`; ở chế độ tự động, job đó không được nộp tự động mà chuyển vào danh sách cần xem.

## 7. Automation

### 7.1 Choosing what to apply to

Mỗi lần chạy (sau khi chấm điểm và tối ưu CV), với mỗi người dùng đang bật tự động:

```text
remaining = daily_limit − số hồ sơ đã nộp hôm nay (giờ Việt Nam)
candidates = matches của CV chính
  where score ≥ min_match_score
    and chance ≠ LOW
    and job OPEN, chưa nộp, công ty không bị loại trừ
    and tailored CV status ∈ {READY, NEEDS_REVIEW}, ats_passed
    and (mode = AUTO or tailored CV đã được duyệt)
order by chance desc, score desc, posted_at desc
take remaining
```

- Với `NEEDS_REVIEW`, chỉ các câu không cần xem lại được dùng.
- Kênh `MANUAL_ONLY`, hoặc trang có CAPTCHA hay bắt đăng nhập → `MANUAL_REQUIRED` kèm lý do (BR-020).
- Lỗi khi nộp được thử lại tối đa 3 lần, sau đó `FAILED`.

### 7.2 Follow-up

Gửi một thư nhắc khi đủ cả 3 điều kiện:

- Hồ sơ `SUBMITTED` hoặc `FOLLOWED_UP`.
- Không có thư đến nào sau thời điểm nộp.
- `now − max(submitted_at, last_follow_up_at) ≥ follow_up_after_days` và `follow_up_count < max_follow_ups`.

Chỉ gửi từ 8:00 tới 18:00, thứ Hai tới thứ Sáu, giờ Việt Nam; ngoài giờ thì dời tới khung gần nhất (BR-021).

### 7.3 Reply classification

`ReplyClassifier` trả nhãn và độ tin cậy. Độ tin cậy < `reply_confidence_min` → `UNKNOWN`: chỉ thông báo, không soạn thư (BR-014). `INTERVIEW` và `OFFER` đổi trạng thái hồ sơ, tạo `reply_drafts` và ghi `application_outcomes`. Nhãn người dùng sửa được dùng làm dữ liệu eval.

## 8. Edge cases and tuning

| Trường hợp | Xử lý |
|---|---|
| JD không có yêu cầu kỹ năng nào trích được | `skill = 1`, nhưng `analysis_status` phải là `READY`; JD đang `PENDING` thì chưa chấm điểm |
| CV chưa có embedding (LLM lỗi) | `semantic = 0,5` (trung lập) và đánh dấu để tính lại; các yếu tố khác vẫn tính |
| JD không ghi số năm kinh nghiệm | Phần tháng kinh nghiệm = 1, chỉ còn so cấp độ |
| Phả hệ đổi | Tính lại `skill_inferences`, rồi tính lại điểm cho các CV có kỹ năng bị ảnh hưởng |
| Ứng viên đổi điều kiện tự động | Áp dụng từ lần chạy tiếp theo; hồ sơ đã nộp không đổi |
| Trọng số mới | Tăng `weights_version`; điểm được tính lại dần, giao diện hiện điểm theo phiên bản mới nhất có sẵn |

## 9. Worked example (prototype data)

Ứng viên: Junior, 6 tháng thực tập backend; có REST API, Node.js, MySQL, Git, React; suy ra SQL (bậc 1, từ MySQL); ở TP.HCM, chấp nhận mọi hình thức làm việc.

| Job | Yêu cầu (MUST / NICE) | Kỹ năng | Gần nghĩa | Kinh nghiệm | Địa điểm | Điểm | Thiếu MUST | Khả năng đậu phỏng vấn |
|---|---|---|---|---|---|---|---|---|
| Backend Developer, Công ty ABC | MUST REST API, Node.js, SQL, Git · NICE Docker | 87 | 80 | 80 | 100 | **86** | Không | **Cao** |
| Junior API Engineer, Fintech XYZ | MUST REST API, Node.js, SQL, Docker · NICE Git | 76 | 70 | 80 | 100 | **79** | Docker | **Trung bình** (hạ từ Cao) |
| Software Engineer Platform, Công ty DEF | MUST Node.js · NICE SQL, Redis, CI/CD | 58 | 55 | 73 | 100 | **68** | Không | **Trung bình** |
| DevOps Engineer, Công ty JKL | MUST Docker, Kubernetes · NICE CI/CD | 0 | 80 | 70 | 100 | **39** (chặn) | Docker, Kubernetes | **Thấp** |

Cách tính dòng đầu:

```text
skill      = (2×1 + 2×1 + 2×0,9 + 2×1 + 1×0) / (2+2+2+2+1) = 7,8 / 9 = 0,867
semantic   = (0,82 − 0,5) / 0,4 = 0,80
experience = 0,6 × 1 + 0,4 × min(1, 6/12) = 0,80
location   = 1 (cùng TP.HCM, hybrid nằm trong mong muốn)
score      = round(100 × (40×0,867 + 20×0,80 + 25×0,80 + 15×1) / 100) = round(85,67) = 86 → Cao
```

Dòng cuối có điểm thô 46 nhưng yếu tố kỹ năng bằng 0 nên bị chặn ở 39. Đó là lý do job DevOps không được tối ưu CV và không được nộp tự động.
