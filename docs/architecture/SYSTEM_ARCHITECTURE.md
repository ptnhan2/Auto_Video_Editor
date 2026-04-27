# System Architecture & Development Plan

> **⚠️ DEPRECATION NOTICE / LƯU Ý LỖI THỜI ⚠️**
>
> Kiến trúc Data-Oriented Pipeline được mô tả trong tài liệu này **đã bị loại bỏ (deprecated)** và không còn là chuẩn thiết kế của dự án.
>
> Vui lòng chuyển sang đọc tài liệu kiến trúc mới nhất tại: [`docs/architecture/PIPELINE_ARCHITECTURE_V2.md`](PIPELINE_ARCHITECTURE_V2.md) (Kiến trúc Database-Driven Multi-Agent Pipeline) để xem luồng dữ liệu và thiết kế mới nhất của hệ thống.

This document defines the core architecture, pipeline stations, and data contracts for the Auto Video Editor project.

_Phiên bản: Data-Oriented Pipeline (Assembly Line) - Cập nhật Tháng 4/2026_

---

## 1. Triết lý Cốt lõi (Core Philosophy)

Dự án đã chính thức loại bỏ kiến trúc nguyên khối (Monolithic Script) nơi một siêu AI (God-prompt) phải xử lý mọi tác vụ cùng lúc.

Thay vào đó, hệ thống vận hành theo **Data-Oriented Pipeline (Đường ống định hướng dữ liệu)**.

- **Sản phẩm truyền qua dây chuyền:** Không phải văn bản (text), mà là các tệp JSON có cấu trúc chặt chẽ (Zod Schemas).
- **Single Source of Truth (Nguồn sự thật duy nhất):** Dữ liệu của video (Audio, Visual, Persona) được lưu trữ tập trung ở file Master JSON. Các trạm (Stations) chỉ được phép "đọc" và "đắp thêm" (enrich) dữ liệu vào file này.
- **Tách biệt mối quan tâm (Separation of Concerns):** Mỗi AI Agent chỉ thực hiện đúng một nhiệm vụ siêu nhỏ (Casting, Audio, Visual) với prompt cực ngắn để triệt tiêu hoàn toàn rủi ro "ảo giác" (hallucination).

---

## 2. Kiến trúc Dây chuyền Xưởng phim AI (The AI Studio Pipeline)

Toàn bộ quy trình sản xuất video được chia thành 6 trạm (Stations) độc lập. Việc kết nối giữa các trạm được điều phối bởi `run_pipeline.py`.

### Trạm 0: Lập chỉ mục Tài nguyên (The Indexer)

- **Module:** `scripts/core/sync_registry.ts`
- **Nhiệm vụ:** Quét toàn bộ thư mục `public/assets/` (humanoid, background, props, audio). Phân tích (Vision AI) và chuẩn hóa tên file thành các **Semantic IDs** (VD: `char_male_glasses_01`).
- **Output:** File `asset_registry.json`. Đây là "bản đồ kho" bắt buộc phải có để các trạm sau hoạt động.

### Trạm 1: Bóc tách kịch bản (The Ingestor)

- **Module:** `src/pipeline/0_ingestor.py`
- **Input:** Truyện chữ thô (Raw Text).
- **Nhiệm vụ:** Một AI đọc hiểu sẽ phân tách đoạn văn thành các Scene. Nó chỉ giải quyết: Ai đang nói? Nói câu gì? Ở đâu?
- **Output:** File `core_script.json` chứa danh sách nhân vật thô (Nam, Lan), bối cảnh thô (Nhà kho), và lời thoại.

### Trạm 2: Phân bổ tài nguyên (The Casting Director)

- **Module:** `src/pipeline/1_caster.py`
- **Cơ chế:** Áp dụng **RAG Casting** & **Controlled Loosening**.
- **Nhiệm vụ:** Đọc `core_script.json` và "search" trong `asset_registry.json` để tìm Semantic ID chính xác cho nhân vật và bối cảnh. AI Director thực hiện Tool Calling (VD: `search_character(gender="male", tags=["glasses"])`).
- _Lưu ý:_ Nếu không tìm thấy tài nguyên, AI được phép gọi `request_missing_asset` để đẩy yêu cầu cho tổ họa sĩ (Auto-Asset Feedback Loop).
- **Output:** Cập nhật file JSON với bảng `casting_map` (Từ điển phân vai chốt cứng ID).

### Trạm 3: Xử lý Âm thanh & Thời gian (The Audio Engineer)

- **Module:** `src/pipeline/2_audio_engine.py` (Kế thừa từ `tts_manager` & `render_with_subtitles`)
- **Nhiệm vụ:** Đọc lời thoại và Voice Profile từ `casting_map`. Gọi API TTS (ElevenLabs/Edge). Chạy công cụ canh giờ (WhisperX) để bóc tách thời gian đến từng chữ (word-level timestamps).
- **Output:** Cập nhật file JSON với mảng `audio_timeline` (Có chính xác `actualDuration` cho từng câu thoại và liên kết file `.mp3`).

### Trạm 4: Đạo diễn Hình ảnh & Diễn xuất (The Visual & Persona Director)

- **Module:** `src/pipeline/3_visual_director.py`
- **Nhiệm vụ:** Trạm mang tính quyết định để ghép hình.
  - **Visual Layer:** Nhận background ID (từ Trạm 1) và thời gian (từ Trạm 2), thực hiện "xếp gạch" background lên Timeline và cấu hình Camera (Pan, Zoom).
  - **Persona Layer (Chỉ đạo diễn xuất):** Dựa trên âm điệu (Tone) của Audio, gán chính xác `actionId` (Hành động cơ thể) và `expressionTag` (Biểu cảm khuôn mặt) cho nhân vật ngay tại frame mà thoại vang lên.
- **Output:** `final_render_script.json` hoàn chỉnh với cấu trúc Video Tracks (Audio, Visual, Persona). Mọi timing đều neo (`syncDependency`) vào Audio, không cần AI đoán số giây.

### Trạm 5: Kiểm duyệt & Kết xuất (The QA & Remotion Engine)

- **Module:** `npx remotion render` & `services/video-builder/chunk_script.ts`
- **Nhiệm vụ:** Chạy script QA rà soát file rác. Nếu kịch bản dài, tự động băm nhỏ (Chunking) thành nhiều file JSON ngắn để chống tràn RAM. Remotion lúc này hoàn toàn "dumb" (chỉ đọc JSON để render ra MP4), sau đó dùng FFmpeg nối lại (Stitching).

---

## 3. Hệ thống Cốt lõi Kế thừa (The Heart of the System)

Dù thay đổi toàn bộ luồng chạy thành Pipeline, dự án vẫn bảo tồn và phát huy **3 "Đặc sản" của kiến trúc cũ**:

1.  **Tool Calling & Strict Schemas:** Mọi tương tác của AI ở các trạm (đặc biệt Trạm 1 và Trạm 3) đều phải thông qua việc gọi Hàm với cấu trúc ép kiểu bằng Zod Schema / Pydantic. Đảm bảo tính toán học và chuẩn xác 100%.
2.  **Self-Reflection (Tự sửa sai):** Nếu AI gọi một Action hoặc Expression không tồn tại trong Registry, hệ thống Validation sẽ không crash mà báo lỗi lại cho AI kèm Gợi ý (Hints) để AI tự điều chỉnh ở lần gọi (Retry) kế tiếp.
3.  **Auto-Evolving Feedback Loop (Vòng lặp tiến hóa tự động):** Khi Trạm 1 hoặc Trạm 3 không thể tìm thấy Asset phù hợp, nó gọi tool ghi nhận lỗi vào `output/missing_features_backlog.json`. Các AI Agents chuyên biệt (Image Gen, Spine Animator, SFX) sẽ tự động đọc file này để sản xuất tài nguyên mới và nạp vào kho `public/assets/`.

---

## 4. Cấu trúc JSON Lõi (The Video Manifest Contract)

Kiến trúc dữ liệu bắt buộc tuân thủ 3 lớp (tracks) độc lập để làm Single Source of Truth, kế thừa ý tưởng phân lớp tốt nhưng rũ bỏ hoàn toàn cái tên cũ để tránh hiểu nhầm:

```json
{
  "documentId": "story_xyz",
  "castingMap": {
    "Nam_Chinh": "char_male_01",
    "Phong_Ngu": "bg_bedroom_night"
  },
  "videoTracks": {
    "audio": [
      {
        "id": "aud_01",
        "speakerId": "Nam_Chinh",
        "text": "Quá mệt mỏi rồi!",
        "actualDuration": 2.45,
        "media": {
          "audioUrl": "/tts/aud_01.mp3",
          "wordTimestamps": [
            { "word": "Quá", "start": 0.0, "end": 0.3 },
            { "word": "mệt", "start": 0.3, "end": 0.8 }
          ]
        }
      }
    ],
    "visual": [
      {
        "id": "vis_01",
        "backgroundId": "Phong_Ngu",
        "cameraWork": { "type": "zoom_in", "duration": 2.45 },
        "syncDependency": ["aud_01"]
      }
    ],
    "persona": [
      {
        "id": "per_01",
        "characterId": "Nam_Chinh",
        "actionId": "sigh_heavy",
        "expressionTag": "exhausted",
        "syncDependency": ["aud_01"]
      }
    ]
  }
}
```

_Lưu ý:_ `syncDependency` là cốt lõi của tính đồng bộ. Visual và Persona không bao giờ lưu thời lượng tĩnh, chúng sẽ tự động stretch (co giãn) trên Timeline của Remotion theo độ dài thực tế của file Audio `aud_01` sinh ra ở Trạm 2.
