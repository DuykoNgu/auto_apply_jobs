# ADR 0001 — Port UI prototype sang `src/frontend`

- Trạng thái: Chấp nhận (cập nhật 2026-11-03: chuyển toàn bộ style sang Tailwind CSS v4)
- Ngày: 2026-11-03

## Bối cảnh

UI được thiết kế dưới dạng HTML/CSS/JS (`AI-CV-Auto-Apply-App/`: `index.html` landing, `app.html` workspace). Cần chuyển sang Next.js theo [07-folder-structure](../07-folder-structure.md) trong khi backend chưa có. `DESIGN-HANDOFF.md` yêu cầu khớp pixel với bản thiết kế.

## Quyết định

1. **Tailwind CSS v4** cho toàn bộ style. Token thiết kế (màu, font, cỡ chữ px, radius, breakpoint 600/900/1060/1180/1240) nằm trong `app/theme.css` (`@theme`). Bảng màu và cỡ chữ mặc định của Tailwind bị xóa để chỉ dùng được giá trị của thiết kế.
2. **Primitive dùng chung** trong `components/ui/`: `buttonClass`, `linkClass`, `inputClass`/`textareaClass`, `StatusLabel`, `Bar`, `Chip`, `Section`, `H1`… Không dùng `@apply`. Không có `tailwind-merge`, nên primitive nhận tham số (ví dụ `inputClass({ width })`) thay vì để caller truyền class trùng thuộc tính.
3. Trạng thái phụ thuộc phần tử cha dùng variant của Tailwind: `in-data-[density=compact]:`, `group-open:`, `group-has-checked:`, `aria-pressed:`, `aria-[current=true]:`, `motion-reduce:`. CSS thuần chỉ còn `@keyframes` và một ít base style (~110 dòng, trước đây ~1.100 dòng).
4. **Hai root layout**: `(public)` và `(workspace)` mỗi nhóm có `<html>` và file CSS riêng. Không có `app/layout.tsx` / `app/providers.tsx` chung.
5. **Dữ liệu demo phía client** trong `lib/demo/` (React context, mất khi reload). Feature hook đọc từ store này thay cho `api.ts` + TanStack Query.
6. Route và feature theo đúng IA: `dashboard`, `auto-apply`, `cv`, `insights`, `jobs/[jobId]`, `applications/[applicationId]`, `account`; tailored CV hiển thị trong chi tiết job.

## Hệ quả

- Giao diện khớp prototype (đã so ảnh chụp các màn chính ở 1456px).
- Thêm component shadcn/ui sau này: map biến của shadcn (`--primary`, `--border`…) sang token trong `app/theme.css`.
- Lệch so với target: chưa có shadcn/ui, TanStack Query, react-hook-form + zod, `lib/api-client.ts`, `proxy.ts`, login/register, admin.
- Khi có API: thay từng hook đọc `lib/demo/store` bằng `features/<f>/api.ts` + TanStack Query, rồi xóa `lib/demo/`.
