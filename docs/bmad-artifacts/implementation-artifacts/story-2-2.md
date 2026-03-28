# Story 2.2: Thiết lập Master Blueprint & Nano Banana Pro Integration

## Metadata

- **Epic**: Epic 2: Pipeline Auto-Rigging & Nhân vật (Core Rigging & Characters)
- **Status**: [x] Completed
- **Owner**: Amelia (Dev Agent)

## Description

Là một Creator, tôi muốn tạo ảnh nhân vật dựa trên một khung xương chuẩn (Master Blueprint) qua Nano Banana Pro (Gemini 3 Pro Image Preview), để đảm bảo ảnh đầu vào luôn khớp với các vùng bóc tách đã định nghĩa trước.

## Acceptance Criteria

- [x] **Giả sử** Hệ thống có một file Blueprint (Wireframe) chuẩn do AI tạo ra hoặc cung cấp.
- [x] **Khi** Gọi API Nano Banana Pro (Gemini 3 Pro) kèm theo Blueprint làm Reference.
- [x] **Thì** AI tạo ra nhân vật mới tuân thủ tuyệt đối bố cục của Blueprint (vị trí đầu, tay, chân không thay đổi).
- [x] **Và** Loại bỏ hiện tượng dư khớp tay hoặc loạn góc quay trong ảnh input.

## Tasks

- [x] [TASK-1] Định nghĩa schema/interface cho Nano Banana Pro Integration
- [x] [TASK-2] Viết unit test cho service gọi API Nano Banana Pro
- [x] [TASK-3] Triển khai service gọi API Nano Banana Pro (Gemini 3 Pro) với Blueprint reference
- [x] [TASK-4] Tích hợp Supabase Storage để lưu trữ và cung cấp Blueprint URL cho AI
- [x] [TASK-5] Tạo Master Blueprint SVG chuẩn và kiểm tra kết quả output thực tế

## Dev Agent Record

- 2026-02-11: Khởi tạo story file.
- 2026-02-11: Thiết kế Master Blueprint SVG [`public/blueprints/master-humanoid-v1.svg`](public/blueprints/master-humanoid-v1.svg:1) và metadata JSON.
- 2026-02-11: Triển khai service [`src/lib/nano-banana.ts`](src/lib/nano-banana.ts:1) tích hợp Gemini 3 Pro Image Preview API.
- 2026-02-11: Tích hợp Supabase Storage để upload file local lên cloud tự động.
- 2026-02-11: Chạy Demo `trial-run-nano.ts` thành công với output ảnh thực tế (Base64) từ Gemini.

## File List

- \_bmad-output/implementation-artifacts/story-2-2.md
- src/lib/nano-banana.ts
- public/blueprints/master-humanoid-v1.svg
- public/blueprints/master-humanoid-v1.json
- trial-run-nano.ts
- src/lib/supabase.ts
- .env.local
- package.json
- vitest.config.ts
