# Kiến trúc Scale Hệ thống cho Production (Scaling Architecture)

_Tài liệu này ghi chú các quyết định kiến trúc nhằm giải quyết các bài toán khi dự án phình to (Sản xuất hàng ngàn truyện, mỗi truyện hàng ngàn cảnh)._

## 1. Bài toán Di chuyển và Nhận thức Không gian (Locomotion & Spatial Context)

**Vấn đề:**

- Các action như `walk_cycle` chỉ là diễn hoạt bước chân tại chỗ (Treadmill effect).
- Nếu chỉ cho AI dịch chuyển trái/phải 1D, hệ thống sẽ rất cứng nhắc, không có trục Y (lên/xuống) hay trục Z (chiều sâu).
- Quan trọng nhất: AI không nhìn thấy Background, nó không biết chỗ nào là "mặt đất", chỗ nào là "cái bàn" để bước lên hay tránh né.

**Giải pháp đột phá (Hybrid NavMesh + Affordance Tags):**
Hệ thống không còn chấm điểm POI ngẫu nhiên mà được chuẩn hóa thành 2 lớp:

1. **Quy tắc Sàn Nhà Vô Hình (The Invisible Floor Rule) & Phối cảnh Phẳng (Flat 2.5D):**
   - Không dùng NavMesh 3D hay Tự động Scale (Auto-Scaling) phức tạp để tránh lỗi lơ lửng. Nhân vật chủ yếu trượt ngang (trục X) với Scale cố định (thường là 1.0).
   - Hệ thống mặc định **khu vực từ 60% đến 100% chiều cao màn hình (từ dưới lên) là Sàn Nhà** (Walkable Area) dành cho cảnh phim thông thường.
   - Hệ thống cung cấp sẵn một "Lưới 9 ô" (9-Point Grid: `front_left`, `mid_center`, `back_right`...) sinh ra trên Vùng Sàn Nhà này. AI Director chỉ cần gọi nhân vật di chuyển cơ bản bằng lưới này.

2. **Xử lý Cảnh Phức tạp (Đa Lớp & Custom Paths):**
   - **Đa lớp (Multi-plane Backgrounds):** Bối cảnh phức tạp (trong ô tô, lấp ló góc tường, nằm trên giường) sẽ gồm nhiều lớp Z-index (Foreground PNG đè lên Background JPG). Khi nhân vật tương tác, hệ thống đổi thứ tự Z-order của nhân vật cho lọt vào giữa 2 lớp này.
   - **Đường dẫn tùy chỉnh (Custom Paths):** Khi đi lên/xuống cầu thang, hệ thống dùng 2-3 điểm Neo (POI) nối thành đường chéo tuyến tính (Linear Path). Nhân vật trượt chéo trên màn hình, không mô phỏng bước chân nhấp nhô.

3. **Semantic Anchors & Affordance Tags (Điểm tương tác):**
   - AI Vision (Gemini 3 Flash Preview) lúc này chỉ có 1 nhiệm vụ: Tìm **Vật thể tương tác** (Props/Objects).
   - Hệ thống sử dụng **Khả năng tương tác (Affordance Tags)** thay vì tên vật thể. Ví dụ: `sit_able`, `lean_able`, `hide_able`, `place_on_able`.
   - AI Director khi lên kịch bản gọi Action `sit_down` sẽ bị Zod Schema ép buộc phải truyền vào một POI có chứa thẻ `sit_able`.
   - **Quy trình:** Text -> AI Vision quét đồ vật có Affordances -> Gắn ID (`wooden_bench_1`) -> AI Director khớp lệnh Action với POI ID.

## 2. Bài toán Quản lý Asset & Namespacing

**Vấn đề:** Khi có 100 truyện, nhồi tất cả nhân vật vào 1 mảng `CHARACTERS` gửi cho Gemini sẽ gây quá tải Token và loạn ngữ cảnh (Cross-universe).

**Giải pháp:** Áp dụng mô hình Khu vực tên (Namespacing).

- `public/assets/global/`: Chứa bối cảnh, đạo cụ chung, nhân vật quần chúng dùng cho mọi truyện.
- `public/assets/projects/{story_id}/`: Chứa tài nguyên độc quyền của truyện đó.
- Lệnh CLI `sync_registry.ts` quét và phân loại. Khi AI Director hoạt động, chỉ ghép mảng `Global` + `Story_ID` của truyện đang xử lý vào Context Prompt.

## 3. Bài toán Scale: Giai đoạn 5.4 (Chunking & Stitching cho hàng vạn Scenes) - [Đã hoàn thành]

**Vấn đề:** Một file JSON chứa 10,000 cảnh sẽ làm sập Gemini (vượt giới hạn Output Token) và làm sập Remotion (Tràn RAM khi render một timeline quá dài).

**Giải pháp:** Chia để trị (Chunking & Stitching).

- **Khâu AI Generate:** Script `chunk_script.ts` tự động băm nhỏ kịch bản dài thành từng Chương (Chapters) (VD: `chap_01.json`, `chap_02.json`...) dựa trên số cảnh tối đa mỗi file.
- **Khâu Remotion:** Render độc lập từng file JSON ra thành clip mp4 ngắn (`chap_01.mp4`). Giải phóng RAM ngay sau đó.
- **Khâu Thành phẩm:** Viết script Node.js `stitch_video.ts` gọi **FFmpeg** để nối (concatenate) toàn bộ các clip ngắn lại thành video dài hoàn chỉnh (1 giờ, 2 tiếng) một cách nhanh chóng mà không dùng RAM.

## 4. Khả năng "Đạo diễn" Nâng cao: Giai đoạn 5.3 (Pacing, Audio & Camera) - [Đã hoàn thành]

**Vấn đề:** Phim hiện tại chỉ có hình ảnh khô khan, chưa có "nhịp điệu" điện ảnh.

**Giải pháp đã triển khai:** Cập nhật VideoScriptSchema để AI có quyền kiểm soát 3 luồng độc lập:

1. **Auto Pacing (Nhịp độ):** Hàm `calculateSceneDuration` tự động nội suy thời lượng cảnh dựa trên độ dài thoại.
2. **Audio SFX (Âm thanh):** Thêm mảng `sfx` vào cấu trúc Actor, sử dụng thẻ `<Audio>` của Remotion để căn chỉnh âm thanh khớp tới từng frame.
3. **Camera Work (Góc máy):** Hỗ trợ các thuộc tính `static`, `pan`, `zoom` tại cấp độ Scene để nội suy thẻ `AbsoluteFill` tổng.

---

_Cập nhật lần cuối: Tháng 3/2026 - Tầm nhìn Xưởng Phim AI Tự Động._
