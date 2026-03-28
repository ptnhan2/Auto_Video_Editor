# Giai đoạn 5.3: Tư duy Đạo diễn Nâng cao (Pacing, Audio, Camera)

Tài liệu này mô tả kiến trúc cốt lõi được triển khai trong Giai đoạn 5.3, nhằm cấp cho AI Director khả năng điều phối nhịp độ, âm thanh và góc máy một cách linh hoạt, bám sát nguyên tắc **AI-First API Design (Function Calling Centric)**.

## 1. Tự động tính toán Pacing (Nhịp độ)

Thay vì buộc AI phải suy luận và cứng nhắc điền `durationSeconds` (đôi khi dẫn đến thoại bị cắt ngang do AI đoán sai thời gian), hệ thống nay cung cấp cơ chế Auto Pacing.

- **Thực thi:** Helper function `calculateSceneDuration` trong `src/lib/audio-timing.ts`.
- **Cơ chế:** Dựa vào độ dài của chuỗi `dialogue` của tất cả các diễn viên trong một cảnh, hệ thống ước tính thời lượng tối thiểu cần thiết để đọc hết câu thoại (trung bình 15 ký tự / giây).
- **Fallback:** Nếu AI không cung cấp `durationSeconds` trong schema (`draft.json`), `SceneCompiler.tsx` sẽ tự động gọi hàm này để gán `durationInFrames` cho `Sequence`.

## 2. Audio SFX (Hiệu ứng Âm thanh chi tiết)

Trước đây, chỉ có `bgmId` và `sfxId` chung chung ở cấp độ Scene. Nay, hệ thống cho phép chèn hiệu ứng âm thanh chính xác ở cấp độ Action.

- **Thực thi:** Cập nhật `ActorSchema` trong `src/types/ai-schemas.ts`.
- **Cơ chế:** Mỗi nhân vật có một mảng `sfx`, chứa `assetId` và `startFrame`.
- **Render:** Trong `SceneCompiler.tsx`, hệ thống dùng thẻ `<Audio>` của Remotion bọc trong một `<Sequence>` với `from={startFrame}` để đảm bảo âm thanh khớp chuẩn với hành động cơ thể tại frame được chỉ định.

## 3. Camera Movements (Góc máy)

AI Director nay có thể điều khiển Camera thông qua các Enum ngữ nghĩa cao thay vì tọa độ ma trận phức tạp.

- **Thực thi:** Thêm object `camera` vào `SceneSchema` trong `src/types/ai-schemas.ts`.
- **Cơ sở:** Các loại chuyển động căn bản gồm `static`, `pan_left`, `pan_right`, `zoom_in`, `zoom_out`. Cùng với thông số `targetX` (tọa độ % trên màn hình) và `intensity` (độ mạnh của Zoom).
- **Render:** Trong `SceneCompiler.tsx`, Component `SceneRenderer` được tách riêng để lấy `useCurrentFrame()` cục bộ của từng `Sequence`. Từ đó sử dụng hàm `interpolate()` để tính toán `scale` và `translateX`, sau đó áp dụng vào thuộc tính `transform` của thẻ `<AbsoluteFill>` bọc lấy nội dung Scene.
