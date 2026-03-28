# Cơ chế Graceful Fallback & Auto Asset Backlog

Tài liệu này mô tả cơ chế giải quyết mâu thuẫn giữa việc **"Bắt buộc AI dùng Asset có sẵn"** và **"Cho phép AI đề xuất Asset mới"** trong hệ thống Auto Video Editor.

## Vấn đề thực tiễn

Khi dự án bước vào giai đoạn sản xuất hàng loạt (Mass Production), kịch bản truyện có thể cực kỳ đa dạng. Tuy nhiên, kho tài nguyên (Backgrounds, Props, Actions) ở giai đoạn đầu thường rất hạn chế.
Nếu ép AI dùng `z.enum` tĩnh, nó sẽ phải gượng ép lắp ghép các bối cảnh sai lệch. Nếu nới lỏng sang `z.string()`, AI sẽ bị ảo giác (hallucinate) sinh ra ID không tồn tại làm sập (Crash) toàn bộ luồng render của Remotion.

## Giải pháp: Hệ thống Fallback & Backlog

### 1. Nới lỏng có kiểm soát tại Schema

Trong `src/types/ai-schemas.ts`, thuộc tính `requestedAssets` được thêm vào `SceneSchema`.

```typescript
requestedAssets: z.array(
  z.object({
    type: z.enum(["background", "prop", "action", "sfx"]),
    missingConcept: z.string(),
    reason: z.string().optional(),
  }),
).optional();
```

- Nếu AI không tìm thấy Asset phù hợp, nó **bắt buộc** vẫn phải chọn một Asset tạm bợ (như `bg_city_day`) để hệ thống chạy ổn định.
- Đồng thời, AI dùng mảng `requestedAssets` để gửi "yêu cầu cầu cứu" (SOS Request) lên hệ thống, mô tả chi tiết thứ nó thực sự cần (Ví dụ: "Quán bar Cyberpunk", "Thanh kiếm Lazer").

### 2. Trình kết xuất Smart Placeholder (Remotion)

Khi Remotion render (`SceneCompiler.tsx`), nó sẽ quét và phát hiện mảng `requestedAssets` này.
Thay vì bỏ qua, nó tự động render các thẻ cảnh báo lớn màu đỏ (Red Banners) ngay trên màn hình Preview của video nháp:
`⚠️ CẦN VẼ THÊM [BACKGROUND]: Quán bar Cyberpunk`

Điều này giúp Đạo diễn/Editor dễ dàng nhận diện lỗ hổng trực quan khi xem nháp.

### 3. Auto Asset Backlog Extraction

Script `scripts/tools/extract_missing_assets.ts` được thiết kế để tự động quét file JSON kịch bản ngay khi AI vừa sinh ra.
Nó gom toàn bộ các lời "kêu cứu" của AI, định dạng lại thành bảng Markdown và đẩy vào file `docs/assets_backlog.md`.

Luồng chạy chính (`render_all.ts`) đã được tích hợp mặc định bước này:
**BƯỚC 0:** `extract_missing_assets` -> **BƯỚC 1:** `chunking` -> **BƯỚC 2:** `render` -> **BƯỚC 3:** `stitching`.

## Tiềm năng tương lai

Cơ chế này chính là lõi (Core Engine) cho **Giai đoạn Tự động sinh Tài nguyên**.
File `docs/assets_backlog.md` có thể được nạp vào một Image Gen Agent (Midjourney / Stable Diffusion). Bot sẽ tự động sinh hình ảnh đạo cụ và bối cảnh dựa theo mô tả của `missingConcept`, tự động loại bỏ nền (remove bg), và lưu thẳng vào thư mục `public/assets/` trước khi Remotion thực sự render.
