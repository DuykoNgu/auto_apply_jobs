# Cost Estimate — AWS EC2 và OpenAI (MVP)

> Design status: TARGET
>
> Đây là **ước tính**, không phải báo giá. Đơn giá lấy từ bảng giá công khai (us-east-1, on-demand) theo hiểu biết tại thời điểm viết; phải đối chiếu lại tại [aws.amazon.com/ec2/pricing](https://aws.amazon.com/ec2/pricing/) và [openai.com/api/pricing](https://openai.com/api/pricing) trước khi chốt ngân sách. Đặt ở `ap-southeast-1` thì cộng thêm khoảng 20–25% phần EC2. Chưa tính nhân công phát triển.

Phạm vi: **MVP, tối đa khoảng 20 người dùng**. Quy mô lớn hơn chưa được tính.

## 1. Mô hình triển khai

Hai máy EC2 chạy Docker, không dùng ALB, RDS hay NAT gateway ([C2 — Container](architecture/c4/02-container.md)):

| Máy | Chạy | Cấu hình MVP |
|---|---|---|
| A | Frontend (Next.js), Backend API (FastAPI), PostgreSQL + pgvector | t3.medium (2 vCPU, 4 GB) |
| B | Automation Worker: Playwright, OCR, `acaj_ai`, gọi OpenAI | t3.medium (2 vCPU, 4 GB) |

Quy tắc mạng và vận hành:

- Máy A mở cổng 80 và 443 ra ngoài (Caddy hoặc Nginx làm HTTPS). Cổng 5432 chỉ mở cho security group của máy B, qua IP riêng trong cùng VPC.
- Máy B không mở cổng vào công khai.
- Worker lấy việc từ job table bằng `FOR UPDATE SKIP LOCKED` và có hạn khóa (lease), nên máy B restart hoặc bị thu hồi thì tác vụ được chạy lại (NFR-REL-002).
- Khóa OpenAI lưu ở AWS SSM Parameter Store hoặc Secrets Manager, không để trong file `.env` trên máy.

## 2. Chi phí AWS mỗi tháng (USD)

| Hạng mục | Chi phí |
|---|---|
| Máy A, t3.medium | 30 |
| Máy B, t3.medium | 30 |
| EBS gp3 (A 50 GB, B 30 GB) | 6 |
| Snapshot EBS hằng ngày | 2 |
| Elastic IP công khai (2 × 3,65) | 7 |
| Data transfer ra ngoài, S3, CloudWatch Logs, Route53 | ~7 |
| **Cộng AWS** | **~80** |

Tên miền tính riêng, khoảng 12 USD mỗi năm.

## 3. Chi phí OpenAI

Mỗi lần tối ưu một job: khoảng 5k token đầu vào (CV 2k, JD 1,5k, prompt và schema 1,5k) và 1,5k token đầu ra. Đơn giá giả định, USD mỗi 1M token (đầu vào / đầu ra):

| Model | Giá |
|---|---|
| GPT-5 | 1,25 / 10 |
| GPT-4.1 | 2 / 8 |
| GPT-5-mini | 0,25 / 2 |
| GPT-4.1-mini | 0,40 / 1,60 |
| text-embedding-3-small | 0,02 |

| Tác vụ | Model | Giá (USD) |
|---|---|---|
| Viết lại CV và cover letter, mỗi job | GPT-4.1 | ~0,022 |
| Viết lại CV và cover letter, mỗi job | GPT-4.1-mini / GPT-5-mini | ~0,005–0,006 |
| Phân tích JD, mỗi job | GPT-4.1-mini | ~0,0016 |
| Trích xuất CV, mỗi CV | GPT-4.1-mini | ~0,004 |
| Phân loại email | GPT-4.1-mini | ~0,0003 |
| Embedding CV và JD | text-embedding-3-small | gần như 0 |

Cả hai phương án dưới đây đều nằm dưới trần 0,05 USD mỗi job của NFR-AI-010. Giả định mỗi người dùng tối ưu khoảng 150 job mỗi tháng.

| Phương án | Giá mỗi job | Mỗi user mỗi tháng | 20 user mỗi tháng |
|---|---|---|---|
| A, lai: GPT-4.1 viết lại CV, còn lại bản mini | ~0,025 | ~3,75 | ~75 |
| B, toàn bản mini | ~0,007 | ~1,05 | ~21 |

**Khuyến nghị MVP:** bắt đầu bằng phương án B. Chỉ nâng bước viết lại CV lên GPT-4.1 nếu eval cho thấy chưa đạt ngưỡng "100% câu có căn cứ" và "0 trường hợp bịa" ([Acceptance criteria](08-acceptance-criteria.md)).

## 4. Tổng chi phí MVP mỗi tháng

| | AWS | OpenAI | Tổng (USD) | Quy đổi VND (tỷ giá ~25.500) |
|---|---|---|---|---|
| Phương án B | ~80 | ~21 | **~100** | ~2,6 triệu |
| Phương án A | ~80 | ~75 | **~155** | ~4,0 triệu |
| Phương án B, worker chạy Spot | ~60 | ~21 | **~80** | ~2,0 triệu |

Spot cho máy B giảm khoảng 60–70% phần máy đó (từ 30 xuống khoảng 10 USD), chỉ nên bật sau khi đã kiểm thử cơ chế khóa tác vụ.

## 5. Cách giữ chi phí thấp

- Prompt caching cho phần CV gốc (lặp lại ở mọi job của cùng người dùng) giảm khoảng 50–90% phần đầu vào được cache.
- Batch API (giảm 50%) cho phân tích JD và thống kê thị trường, vì worker chạy bất đồng bộ.
- Cache kết quả phân tích JD dùng chung giữa các người dùng; mỗi job chỉ phân tích một lần.
- Giữ trần mặc định 20 hồ sơ mỗi ngày ([Business rules](requirements/business-rules.md)).
- Không dùng ALB (tiết kiệm 16–20 USD), RDS, NAT gateway (tiết kiệm khoảng 32 USD). Không gắn Elastic IP cho máy B nếu worker không cần địa chỉ cố định (tiết kiệm 3,65 USD).

## 6. Bắt buộc dù là MVP

- Đặt hard limit chi tiêu hằng tháng trên dashboard OpenAI, ví dụ 50 USD.
- Bật snapshot EBS hằng ngày cho máy A và `pg_dump` định kỳ lên S3.
- Che thông tin nhạy cảm trước khi gọi OpenAI (BR-015).
- Theo dõi `CPUCreditBalance` của dòng t3 trong vài ngày đầu; nếu credit cạn do Playwright chạy liên tục thì chuyển sang c6i hoặc m6i.

## 7. Rủi ro làm lệch ngân sách

- **IP datacenter của AWS bị chặn:** nhiều nguồn job và Cloudflare chặn IP EC2, khi đó cần proxy dân cư, chi phí có thể vượt mức trên nhiều lần. Một số trang còn cấm bot trong điều khoản sử dụng.
- **Token suy luận của GPT-5:** được tính vào đầu ra và khó đoán, nên bước viết lại CV ưu tiên GPT-4.1.
- **Retry tối đa 3 lần** (NFR-REL-002) có thể cộng thêm 10–20% token.
- **Eval live** mỗi lần đổi model hoặc prompt tốn thêm khoảng 5–30 USD (NFR-MAINT-002).
- **Rate limit OpenAI** ở tài khoản mới có thể chặn khi nhiều worker chạy đồng thời.
- **Điểm hỏng đơn:** mỗi máy là một điểm hỏng. Máy A chết thì mất web, API và DB; máy B chết thì tự động nộp dừng. Chấp nhận được ở MVP.
