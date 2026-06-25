# Lộ trình Tích hợp Đạo diễn AI (AI Director Roadmap)

_Tài liệu này lưu trữ lộ trình phát triển cốt lõi để biến Auto_Video_Editor từ công cụ dựng hình thủ công thành **Xưởng phim AI tự động hoàn toàn** bằng cơ chế **Gemini Function Calling**._

## Triết lý cốt lõi (AI-First)

Hệ thống được thiết kế để "Người dùng" cuối cùng là **AI (Gemini)**, không phải con người. Mọi component, schema, và API đều phải rõ ràng (Semantic Naming), khắt khe (Strict Enums), và có cơ chế báo lỗi ngược (Self-correction Feedback Loop) để AI tự sửa sai.

---

## 📍 Lộ trình Phát triển (Roadmap)

### 🎬 GIAI ĐOẠN 1: Chuẩn hóa Dữ liệu & Bức tường Phòng thủ (Foundation)

Mục tiêu: Đảm bảo AI biết hệ thống có gì và ép AI phải trả về đúng định dạng.

- [x] **1.1. Xây dựng Asset Registry (`src/config/asset-registry.ts`)**
  - Thu thập danh sách toàn bộ nhân vật, action (từ `animation-backlog.md`), expression.
  - Đóng vai trò là "Từ điển" để nạp vào prompt/công cụ cho Gemini.
- [x] **1.2. Định nghĩa Zod Schemas (`src/types/ai-schemas.ts`)**
  - Khai báo cấu trúc chuẩn của `Scene`, `Actor`, `Action` bằng thư viện Zod.
  - **Mục đích:** Bắt lỗi cấu trúc JSON (nếu có) và làm cơ sở cho tính năng Self-correction.

### 🧠 GIAI ĐOẠN 2: Lắp Não cho Hệ thống (The AI Director Engine)

Mục tiêu: Viết module kết nối Gemini, xử lý vòng lặp Multi-turn.

- [x] **2.1. Viết AI Director Loop (`src/lib/ai-engine/director.ts`)**
  - Nhận kịch bản truyện chữ (Text).
  - Gọi Gemini API (với `generateObject` của Vercel AI SDK).
  - Tương tác 2 chiều (Multi-turn) được SDK hỗ trợ ngầm (Auto-retry với Zod schema).
- [x] **2.2. Tích hợp cơ chế Tự sửa sai (Self-correction Loop)**
  - Gửi lỗi từ Zod hoặc lỗi không tìm thấy Asset quay lại cho Gemini.
  - Ép Gemini tự "recall" hàm với dữ liệu đúng. Chốt file `final_script.json`.

### 🎥 GIAI ĐOẠN 3: Lắp Cơ bắp cho Hệ thống (The Remotion Compiler)

Mục tiêu: Dựng Component React (Remotion) có khả năng đọc hiểu `final_script.json`.

- [x] **3.1. Xây dựng Trình biên dịch Cảnh phim (`remotion/compositions/SceneCompiler.tsx`)**
  - Sử dụng thẻ `<Sequence>` của Remotion để đọc JSON và rải các `<Puppet>` lên Timeline.
  - Xử lý hội thoại (Audio + Vietsub Text).
- [x] **3.2. Hệ thống Phiên dịch Không gian (Spatial Mapper)**
  - Viết logic chuyển đổi Enum của AI (vd: `facing: "right"`) thành CSS Transform (`scaleX(-1)`) cho Component.

### 🚀 GIAI ĐOẠN 4: Khép kín Dây chuyền (CLI & Preview)

Mục tiêu: Tách bạch luồng Generate Draft và Render để Human-in-the-loop có thể kiểm duyệt.

- [x] **4.1. Lệnh CLI Generate Draft (`scripts/core/generate_script.ts`)**
  - Lệnh: `npx tsx scripts/core/generate_script.ts "Nội dung truyện..."`.
  - Luồng tự động: Text -> AI Director (Gemini) -> Validated JSON (`draft.json`).
- [x] **4.2. Preview trên Studio (`remotion/compositions/DraftVideoPreview.tsx`)**
  - Remotion load thẳng `draft.json` để người dùng xem trước và chỉnh sửa bằng tay nếu AI làm sai.

### 📈 GIAI ĐOẠN 5: Scale hệ thống cho Production (MỚI BỔ SUNG)

Mục tiêu: Xử lý bài toán hàng ngàn Scene và tự động hóa quản lý Asset.
Chi tiết xem tại: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — Pipeline Architecture section

- [ ] **5.1. Auto-Sync Asset Registry (`scripts/core/sync_registry.ts`)**
  - Viết script quét tự động thư mục `public/` (Animations, Humanoids) để sinh ra file `src/config/asset-registry.ts` trước mỗi lần build. Loại bỏ việc nhập tay.
- [x] **5.2. Nâng cấp Di chuyển với POI (Locomotion & Spatial Context)**
  - Kết hợp Gemini Vision và Tool UI để gắn Point of Interest (Tọa độ X, Y, Scale) cho các file Background.
  - Tách bạch Animation xương và Dịch chuyển tổng thể. Bổ sung `movement: { from: POI, to: POI }` vào AI Schema để nội suy 3D.
- [ ] **5.3. Bổ sung Tư duy Đạo diễn Nâng cao (Pacing, Audio, Camera)**
  - Cập nhật Schema cho phép AI tự tính duration qua dialogue, rải SFX theo frame và thêm camera movements.
- [ ] **5.4. Chunking & Stitching cho hệ thống Render**
  - Viết script CLI chia nhỏ truyện ra nhiều `chapter.json`. Render từng file MP4 và dùng FFmpeg nối lại để tránh quá tải RAM & Token.

---

## 📝 Nhật ký & Trạng thái hiện tại

- **Tháng 3/2026:**
  - Chốt kiến trúc AI-First và Function Calling.
  - Hoàn thành Giai đoạn 1 đến Giai đoạn 4. Cốt lõi của AI Director và SceneCompiler đã hoạt động thực tế.
  - Thảo luận và chốt phương án Scale hệ thống (Giai đoạn 5).
  - **Việc cần làm ngay (Next Action):** Bắt tay vào làm **GIAI ĐOẠN 5.1** (Auto-Sync Asset Registry).
