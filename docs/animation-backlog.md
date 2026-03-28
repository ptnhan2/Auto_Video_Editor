# Thư Viện Hành Động (Action Library Backlog)

_Tài liệu này lưu trữ danh sách các hành động (animations) cần thiết để minh họa truyện Audio 2D._

## Nguyên tắc: "Ít nhưng Đa năng" (Versatility over Quantity)

Không cần tạo quá nhiều chuyển động phức tạp. Sử dụng các hành động cốt lõi dưới đây kết hợp với hiệu ứng âm thanh và CSS Translation (bay vào/bay ra) để kể chuyện.

**⚠️ Quan trọng: Thiết kế xoay quanh AI (AI-First / Function Calling Centric)**

- "User" cuối cùng sử dụng thư viện này là **Gemini (thông qua Function Calling)** chứ không phải con người.
- **Bắt buộc:** Tên ID của Action (vd: `walk_cycle`, `talk_sad`) phải rõ ràng, mang tính ngữ nghĩa (Semantic) để AI có thể tự động hiểu và gán đúng hành động dựa trên diễn biến câu chuyện/kịch bản. Không đặt tên vô nghĩa kiểu `action_1`, `anim_A`.
- Các API và tham số điều khiển (nếu có) phải dùng Enum khắt khe (vd: `facing: 'left' | 'right'`) thay vì bắt AI tự tính toán CSS hay tọa độ Pixel.

---

### 1. Nhóm Di chuyển (Locomotion)

Dùng để miêu tả cảnh nhân vật di chuyển, chuyển cảnh.

- [x] **`walk_cycle`** (Đi bộ thư thả): Đã hoàn thành (Tham khảo `action-factory.ts`).
- [x] **`run_cycle`** (Chạy/Bỏ trốn): Bước chân dài, thân người chúi về phía trước (Torso rotate âm), tay vung cao và nhanh.
- [x] **`sneak_cycle`** (Rón rén/Lén lút): Trọng tâm hạ thấp (Torso dịch Y xuống), bước chân ngắn, ngập ngừng.

### 2. Nhóm Cảm xúc & Hội thoại (Emotion & Dialogue)

Dùng trong các phân đoạn đối thoại, miêu tả nội tâm.

- [x] **`idle`** (Thở nhẹ/Nghỉ ngơi): Thân nhấp nhô nhẹ, đầu xoay trái/phải một xíu (trục Y). Đã hoàn thành.
- [x] **`talk_angry`** (Tức giận/Chỉ trích): Một tay chỉ thẳng ra trước (hoặc vung mạnh), thân người chồm lên phía trước, đầu gật mạnh theo nhịp.
- [x] **`talk_sad`** (Buồn bã/Tuyệt vọng): Cúi gập người (Torso rotate dương), đầu cúi gầm, hai tay buông thõng, chuyển động chậm (thở dài).
- [x] **`surprise_fear`** (Giật mình/Sợ hãi): Người ngửa giật lùi ra sau, hai tay giơ lên che mặt hoặc ngực, đầu ngẩng lên.
- [x] **`wave_hello`** (Vẫy tay chào/Vui vẻ): Giơ tay phải vẫy, kèm nhịp gật đầu nhẹ. Đã hoàn thành.

### 3. Nhóm Tương tác vật lý (Physical Interaction)

Dùng khi nhân vật tương tác với môi trường hoặc đồ vật.

- [x] **`reach_out`** (Với tay/Đưa đồ): Một tay vươn thẳng ra phía trước, giữ im khoảng 1-2 giây rồi thu về. Dùng cho cảnh trao kiếm, đưa thư, nhặt đồ.
- [x] **`look_around`** (Tìm kiếm): Kết hợp xoay `rotationY` của đầu sang trái -> phải với biên độ rộng (45 đến -45 độ), tay che trán hoặc xoa cằm.

### 4. Nhóm Hành động/Chiến đấu (Action/Combat)

Dùng cho các cảnh xung đột. (Thường chỉ cần tạo Pose tĩnh và hold frame).

- [x] **`combat_stance`** (Thủ thế): Hạ thấp trọng tâm, một chân lùi lại, hai tay đưa lên ngang mặt sẵn sàng.
- [x] **`strike`** (Đòn đánh/Chém/Phép thuật): Vung tay mạnh từ trên xuống hoặc từ ngoài vào, thân người lao theo.

---

## 🚀 Quy trình tạo Action mới (Reverse Flow Workflow)

1.  **AI Phác thảo:** Copy `walk_cycle.json` (từ `action-factory.ts`) cho AI. Yêu cầu AI viết code JSON cho một hành động trong Backlog này (VD: `run_cycle`).
2.  **Dịch ngược (Import):** Copy đoạn code JSON mà AI vừa sinh ra.
3.  **Vào phòng Lab:** Mở trình duyệt tại `http://localhost:3000/action-builder`. Bấm nút **Import Action** và dán code vào.
4.  **Tinh chỉnh (Fine-tuning):** Dùng các Sliders để sửa lại các góc quay chưa hợp lý cho đến khi mượt mà.
5.  **Xuất xưởng (Export):** Bấm Export, lấy đoạn code chuẩn xác dán ngược lại vào `src/lib/action-factory.ts`.
6.  **Cập nhật Backlog:** Đánh dấu `[x]` vào danh sách trên tài liệu này.
