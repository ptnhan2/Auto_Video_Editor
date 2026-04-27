# Kiến Trúc Hệ Thống & Phương Pháp Luận Triển Khai (System Architecture & Implementation Methodology)

_Tài liệu quy chuẩn kiến trúc kỹ thuật toàn diện cho dự án Auto Video Editor._
_Phiên bản: Database-Driven Multi-Agent Pipeline - Cập nhật Tháng 4/2026_

---

## 1. TỔNG QUAN VÀ TRIẾT LÝ CHUYỂN ĐỔI KIẾN TRÚC (ARCHITECTURAL TRANSITION PHILOSOPHY)

Dự án đã chính thức thực hiện một cuộc đại phẫu kiến trúc, chuyển đổi từ mô hình **"Data-Oriented JSON Pipeline"** (Chuyền tay tệp JSON khổng lồ) sang mô hình **"Database-Driven Multi-Agent Assembly Line"** (Dây chuyền lắp ráp đa tác tử dựa trên Cơ sở dữ liệu quan hệ). Quyết định này được đúc kết từ việc phân tích và tham chiếu sâu sắc mã nguồn của dự án `opensource-spec`.

### 1.1. Phân Tích Điểm Nghẽn Của Kiến Trúc Cũ

Kiến trúc cũ bộc lộ ba điểm nghẽn chí mạng khi phải xử lý các tác phẩm văn học có độ dài lớn (Truyện dài kỳ):

1.  **Tràn Bộ Nhớ Ngữ Cảnh (Context Overflow):** Việc dồn toàn bộ kịch bản, danh sách nhân vật, bối cảnh và mảng hàng trăm phân cảnh (Shots) vào một tệp `master.json` duy nhất khiến biến lưu trữ phình to. Khi nhồi tệp này vào Prompt của các LLM ở các trạm cuối (Visual/Audio), hệ thống nhanh chóng vượt ngưỡng giới hạn Token, dẫn đến sự suy giảm nghiêm trọng về chất lượng suy luận (Degradation of reasoning).
2.  **Ảo Giác Định Danh (ID Hallucination):** Giao phó quyền định danh (cấp phát `char_id`, `scene_id`) cho Mô hình Ngôn ngữ Lớn (LLM) là một rủi ro kiến trúc. LLM thường xuyên đánh mất tính nhất quán, tự ý sinh ra các định danh mới cho các nhân vật cũ, làm gãy vỡ chuỗi liên kết tài nguyên 2D.
3.  **Quá Tải Nhận Thức (Cognitive Overload) tại Trạm Đạo Diễn:** Việc gộp chung các tác vụ phân rã kịch bản, ánh xạ tài nguyên hình ảnh (Visual Registry) và ánh xạ tài nguyên âm thanh (Audio/VFX Registry) vào cùng một Agent (Trạm 4 cũ) khiến AI bị phân tán mục tiêu, gây ra hiện tượng bỏ sót trường dữ liệu hoặc kết hợp sai lệch các tham số (ví dụ: hành động khóc nhưng biểu cảm lại cười).

### 1.2. Lợi Ích Của Giải Pháp Kiến Trúc Mới

Kiến trúc mới giải quyết triệt để các rủi ro trên thông qua các triết lý thiết kế học thuật:

- **Chia để trị (Divide and Conquer) qua Cơ Sở Dữ Liệu:** Áp dụng mô hình chuẩn hóa dữ liệu (Data Normalization). Kịch bản thô không bao giờ được xử lý toàn cục mà bị ép phải chia nhỏ thành các **Tập (Episodes)**.
- **Chống Ảo Giác Bằng Mã Nguồn Đóng (Deterministic Deduplication):** Thu hồi quyền định danh từ AI. AI chỉ thực hiện tác vụ Xử lý Ngôn ngữ Tự nhiên (Natural Language Processing - NLP) như bóc tách Tên và Tính cách. Quá trình đối chiếu chuỗi (String Matching) và cấp phát ID được thực hiện hoàn toàn bằng logic cứng (Hard-code) của ngôn ngữ lập trình.
- **Phân Tách Mối Quan Tâm (Separation of Concerns - SoC) Tuyệt Đối:** Mỗi Agent chỉ sở hữu duy nhất một `System Prompt` hẹp, được truy cập vào duy nhất một Kho tài nguyên (Registry) nhất định. Dữ liệu được lưu trữ tĩnh trong Database, mỗi Agent sẽ lần lượt `UPDATE` (Đổ màu) vào các cột dữ liệu mà nó chịu trách nhiệm.

---

## 2. KIẾN TRÚC DỮ LIỆU CỐT LÕI (CORE DATA ARCHITECTURE)

Lấy cảm hứng trực tiếp từ lược đồ cơ sở dữ liệu [`[.archive/opensource-spec/backend/src/db/schema.ts]`](.archive/opensource-spec/backend/src/db/schema.ts), hệ thống của chúng ta loại bỏ hoàn toàn việc lưu trữ trạng thái qua file JSON thô và thay thế bằng một Relational Database (SQLite/PostgreSQL). Dữ liệu được phân tầng thành 3 nhóm cấu trúc hạt nhân:

### 2.1. Trục Xương Sống Dự Án (Core Hierarchy)

Đây là cấu trúc thiết lập ranh giới (Boundary) giới hạn ngữ cảnh cho AI.

- **Bảng `Dramas` (Dự án):** Quản lý định danh cấp cao nhất của toàn bộ series phim, cấu hình phong cách (Style) và tổng số tập.
- **Bảng `Episodes` (Tập phim / Phân đoạn - Chunking Mechanism):** Một dự án bắt buộc phải phân rã thành nhiều `Episodes`. Cột `content` chứa văn bản chữ thô (Raw text) của riêng phần đó. Cột `script_content` chứa kịch bản điện ảnh đã chuẩn hóa (Screenplay format). **Đường biên ngữ cảnh (Context Boundary)** của AI được rào kín tại bảng này.

### 2.2. Hệ Sinh Thái Thực Thể Toàn Cục (Global Entity Registry)

Giải quyết bài toán "Duy trì Ký ức (Context Retention)" xuyên suốt hàng trăm tập phim mà không cần nhồi dữ liệu vào Prompt.

- **Bảng `Characters` & `Scenes`:** Đây là nguồn sự thật duy nhất (Single Source of Truth) cho các thực thể. Mỗi nhân vật/bối cảnh chỉ tồn tại 1 dòng duy nhất, lưu trữ `name`, `description`, `seed_value` (dành cho Generative AI), hoặc các tham số quy chiếu tĩnh của 2D Assets (`voice_style`, `local_path`).
- **Bảng Pivot (Bảng Liên Kết Nhiều-Nhiều) `Episode_Characters` & `Episode_Scenes`:** Đóng vai trò là "Bộ lọc Ký ức". Chúng định nghĩa chính xác tập phim (Episode) nào được phép truy cập vào nhân vật/bối cảnh nào. Khi AI xử lý một tập phim, nó chỉ được phép "nhìn thấy" các thực thể có liên kết trong bảng Pivot này, triệt tiêu 100% rủi ro AI kéo nhân vật từ tập 1 sang tập 10 một cách phi logic.

### 2.3. Thực Thi Vi Mô (Granular Execution)

- **Bảng `Storyboards` (Phân cảnh / Shot):** Đơn vị thời gian nhỏ nhất (atomic unit) của hệ thống. Kịch bản của một `Episode` sẽ bị đập vỡ thành hàng chục/hàng trăm dòng `Storyboards`.
  - Mỗi dòng chứa toàn bộ tham số để Render: `scene_id`, `action`, `dialogue`, `action_id`, `expression_tag`, `sfx_id`, `vfx_tags`, `camera_angle`, v.v.
- **Bảng Pivot `Storyboard_Characters`:** Chỉ định rõ nhân vật nào xuất hiện trong khung hình (Shot) nào, đảm bảo tính chặt chẽ khi đưa xuống tầng Render 2D.

---

## 3. LUỒNG DỮ LIỆU VÀ CÁC THÀNH PHẦN PIPELINE (MULTI-AGENT ASSEMBLY LINE PIPELINE)

Quy trình sản xuất được phân tách thành các Trạm (Stations) được điều khiển bởi các AI Agents chuyên biệt thông qua cơ chế **Function Calling (Gọi hàm)** tương tác trực tiếp với Database.

### Trạm 1: Script Rewriter Agent (Đại lý Biên kịch)

- **Nguồn cảm hứng:** Kỹ thuật chuyển thể kịch bản tại [`[.archive/opensource-spec/backend/src/agents/tools/script-tools.ts]`](.archive/opensource-spec/backend/src/agents/tools/script-tools.ts).
- **Input:** Tham số `episode_id`. Agent gọi tool `read_episode_script` để lấy dữ liệu văn bản thô từ cột `content`.
- **Tiến trình:** LLM áp dụng tư duy biên kịch điện ảnh, chuyển hóa tự sự thành hành động, phân rã đoạn văn thành cấu trúc Screenplay chuyên nghiệp (Có thẻ `## S[Số thứ tự]`).
- **Output:** Gọi tool `save_script` để thực hiện thao tác `UPDATE episodes SET script_content = X WHERE id = Y`.

### Trạm 2: Extractor Agent (Đại lý Bóc tách Thực thể)

- **Nguồn cảm hứng:** Cấu trúc khử trùng lặp tĩnh tại [`[.archive/opensource-spec/backend/src/agents/tools/extract-tools.ts]`](.archive/opensource-spec/backend/src/agents/tools/extract-tools.ts).
- **Tiến trình:** Agent gọi tool `read_existing_characters` và `read_existing_scenes` để nạp danh sách các thực thể đã tồn tại vào ngữ cảnh. Sau đó nó đọc Screenplay, nhặt ra danh sách nhân vật/bối cảnh xuất hiện trong tập phim đó.
- **Cơ chế Khử Trùng Lặp Chống Ảo Giác (Deterministic Deduplication):** AI gọi tool `save_dedup_characters(characters_array)`. Tại tầng mã nguồn (Python/Node.js), một vòng lặp đối chiếu chuỗi tuyệt đối (Exact String Matching) được kích hoạt:
  - Nếu phát hiện tên trùng khớp với Bảng `Characters` toàn cục: Thực hiện `UPDATE` để gộp (Merge) thêm phần `description` mới, tái sử dụng ID cũ, và `INSERT` ID đó vào bảng Pivot `Episode_Characters`.
  - Nếu là tên mới: `INSERT` vào bảng `Characters`, lấy ID mới, và `INSERT` vào bảng Pivot.
- **Output:** Hoàn thiện Hệ sinh thái thực thể cho `Episode` hiện tại.

### Trạm 3: Storyboard Breaker Agent (Đại lý Phân rã Khung hình)

- **Nguồn cảm hứng:** Kỹ thuật phân mảnh phân cảnh tại [`[.archive/opensource-spec/backend/src/agents/tools/storyboard-tools.ts]`](.archive/opensource-spec/backend/src/agents/tools/storyboard-tools.ts).
- **Tiến trình:** Agent gọi tool `read_storyboard_context`. Mã nguồn thực thi một truy vấn rào lọc cực mạnh: _Chỉ SELECT những nhân vật và bối cảnh có liên kết với `episode_id` hiện tại thông qua bảng Pivot_. Agent nhận vào ngữ cảnh này cùng với Screenplay, sau đó tiến hành "đập vỡ" kịch bản thành mảng các Shots.
- **Xác thực Bảo mật (Validation):** Khi AI gọi tool `save_storyboards`, hệ thống mã nguồn sẽ từ chối ngay lập tức (Throw Error) nếu AI tự ý chèn một `character_id` không tồn tại trong danh sách của tập phim. Nếu hợp lệ, mã nguồn sẽ thực hiện `INSERT` hàng loạt vào bảng `Storyboards` và tạo các liên kết trong bảng `Storyboard_Characters`.

### Trạm 4: Audio Generator Worker (Công nhân Sinh Âm thanh & Đồng bộ Thời gian)

- **Triết lý thiết kế:** "Shift Left" (Dịch trái) luồng Audio. Đối với 2D Remotion, điểm neo thời gian (Time Anchors) là bắt buộc. Do đó, phải tạo Audio trước khi Đạo diễn Hình ảnh làm việc.
- **Tiến trình:** Worker (không dùng Agent) truy vấn các dòng `Storyboards` có chứa `dialogue`. Nó gọi API TTS (Text-to-Speech) và WhisperX để lấy chính xác thời gian phát âm của từng từ (word-level timestamps).
- **Output:** Thực thi lệnh `UPDATE storyboards SET tts_audio_url = X, duration = Y`. Từ lúc này, mỗi Shot đã có một độ dài `duration` cố định tính bằng giây.

### Trạm 5: 2D Visual Director Agent (Đạo diễn Hình ảnh)

- **Triết lý thiết kế:** Tách biệt hoàn toàn khỏi mảng Âm thanh để giảm tải nhận thức (Cognitive Overload).
- **Tiến trình:** Agent đọc từng dòng của bảng `Storyboards`. Nhờ Trạm 4, Agent lúc này đã biết chính xác độ dài `duration` của Shot để thiết lập Keyframe. Nó được cung cấp System Prompt chứa tài liệu hướng dẫn (Registry) về Hoạt ảnh 2D của dự án.
- **Output:** Nó dịch trường `action` thô (Ví dụ: "Nhân vật tức giận") thành các thông số kỹ thuật nội bộ, sau đó gọi hàm thực thi lệnh `UPDATE storyboards SET camera_angle = A, action_id = B, expression_tag = C WHERE id = Z`.

### Trạm 6: Sound & VFX Engineer Agent (Kỹ sư Âm thanh và Kỹ xảo)

- **Tiến trình:** Agent hoạt động độc lập, quét qua các dòng `Storyboards` đã được bổ sung Visual. Nó mang theo System Prompt chứa kho Âm thanh và VFX. Với thông số `duration` có sẵn, nó có thể canh timing chính xác cho các hiệu ứng.
- **Output:** Nó đọc trường `action` và `dialogue`, quyết định các yếu tố môi trường và gọi hàm `UPDATE storyboards SET sfx_id = X, vfx_tags = Y, bgm_track = W WHERE id = Z`.

---

## 4. CHIẾN LƯỢC THỰC THI KIẾT XUẤT (RENDER EXECUTION STRATEGY)

Sự ưu việt cuối cùng của kiến trúc Database-Driven thể hiện ở khâu Kiết xuất (Render/Generation). Quá trình render video (bao gồm Text-to-Speech, 2D Animation Assembly, VFX overlay) không còn là một vòng lặp tuần tự cưỡng bức trên một tệp JSON đồ sộ.

Thay vào đó, hệ thống áp dụng cơ chế **Thực thi Vi mô (Shot-by-Shot Micro-Execution)**:

1.  Hệ thống chạy một Hàng đợi (Message Queue / Worker Pool) trỏ tới bảng `Storyboards`.
2.  Mỗi Worker (Công nhân) bốc đúng 1 dòng (1 Shot) từ Database để xử lý các lệnh gọi API (TTS, Asset Loading, Remotion Rendering).
3.  **Cách ly Lỗi (Fault Isolation):** Nếu quá trình render ở Shot số 45 bị lỗi, trạng thái của dòng số 45 trong Database sẽ chuyển sang `failed`. Kỹ sư chỉ cần kích hoạt chạy lại duy nhất dòng số 45 mà không phải lặp lại tiến trình biên dịch kịch bản, tiết kiệm tối đa thời gian tính toán và tài nguyên hệ thống.

Kiến trúc này không chỉ đảm bảo sự đồng nhất tuyệt đối về tuyến nhân vật qua các tập phim mà còn mở ra nền tảng vững chắc để hệ thống có khả năng mở rộng quy mô (Scale-out) xử lý hàng nghìn tập phim cùng lúc thông qua xử lý song song (Parallelism).
