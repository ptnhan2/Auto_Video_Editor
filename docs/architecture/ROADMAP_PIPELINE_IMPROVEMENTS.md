# Roadmap Cải Tiến Kiến Trúc AI Video Pipeline

> **✅ COMPLETED & SUPERSEDED / ĐÃ HOÀN THÀNH & THAY THẾ ✅**
>
> Các hạng mục trong Roadmap này đã được thảo luận, phân tích và thống nhất giải pháp toàn diện. Tài liệu này hiện đóng vai trò như biên bản (Archive) ghi nhận quá trình đối chiếu.
>
> Vui lòng tham khảo **Kết quả cuối cùng và Thiết kế kiến trúc chính thức** tại: [`docs/architecture/PIPELINE_ARCHITECTURE_V2.md`](PIPELINE_ARCHITECTURE_V2.md).

_Tài liệu này đối chiếu kiến trúc hiện tại của dự án (`src/pipeline`) với mô hình mã nguồn mở (`.archive/opensource-spec`) để đề xuất các cải tiến kỹ thuật nhằm nâng cấp xưởng phim AI._

---

## 1. So Sánh & Đánh Giá Tổng Quan

### Kiến trúc của chúng ta (Data-Oriented Pipeline)

- **Thế mạnh:** Cấu trúc cực kỳ chặt chẽ (JSON/Zod), Single Source of Truth (Master JSON), hệ thống Tool Calling RAG (tìm kiếm Asset) rất tốt, vòng lặp Auto-Feedback cho Missing Assets ấn tượng. Pipeline chia trạm rõ ràng, focus vào tính đồng bộ thời gian (syncDependency) chuẩn xác.
- **Điểm yếu:** Đang tiếp cận theo hướng "Tiểu thuyết trực quan" (Visual Novel / 2D Vtuber). `Ingestor` cắt shot quá đơn giản (chỉ dựa trên thoại: 1 câu thoại = 1 shot). Bỏ qua hoàn toàn các yếu tố điện ảnh (góc máy phức tạp, chuyển cảnh, hành động không lời, âm thanh môi trường).

### Kiến trúc OpenSource-Spec (Cinematic & Generative Pipeline)

- **Thế mạnh:** Tính điện ảnh rất cao. Có bước trung gian biến văn bản thô thành **Kịch bản phân cảnh chuẩn** (Script Rewriter). Tách bạch rõ mô tả cho người đọc và `video_prompt` cho máy. Sử dụng hệ thống tagging XML (`<location>`, `<role>`, `<n>3-6s`) để ép AI sinh video chính xác. Quản lý âm thanh đa lớp (BGM, SFX).

---

## 2. Roadmap Cải Tiến (Technical Action Plan)

Dựa trên những ưu điểm của dự án OpenSource, dưới đây là lộ trình 3 Giai đoạn để nâng cấp hệ thống của chúng ta từ "2D Visual Novel" lên chuẩn "Cinematic Video Generator".

### Phase 1: Bổ Sung Cơ Chế Xử Lý "Truyện Dài" & Trạm Tiền Xử Lý (Script Adapter)

Hiện tại, Trạm 1 (`1_ingestor.py`) đang phải nhai trực tiếp "Truyện chữ thô" và cố gắng trích xuất JSON ngay lập tức. Điều này gây ra 2 rủi ro lớn khi xử lý truyện dài: mất ngữ cảnh (Context Loss) và ảo giác (Hallucination) do ép LLM làm quá nhiều việc cùng lúc.

Trong `opensource-spec`, họ giải quyết bài toán input dài qua 3 chiến lược cốt lõi mà dự án chúng ta cần học hỏi:

- **Action 1: Chia Nhỏ Theo Cấp Độ (Episode Chunking)**
  - _Tham chiếu Code:_ Phân cấp cấu trúc rõ ràng trong `backend/src/routes/dramas.ts` và `backend/src/routes/episodes.ts`.
  - _Cơ chế của opensource:_ Quản lý theo mô hình `Drama (Bộ) -> Episodes (Tập)`. Họ không nạp toàn bộ truyện vào LLM. Thay vào đó, truyện dài được cắt thành nhiều tập khi tạo dự án (người dùng truyền `total_episodes`). Pipeline chỉ được gọi và xử lý dữ liệu ở phạm vi 1 Episode mỗi lần (như route `GET /episodes/:id/pipeline-status` chỉ rõ tiến trình cho từng tập).
  - _Áp dụng vào dự án:_ Pipeline `1_ingestor.py` không nên nhận 1 file `chuong_2.txt` dài hàng vạn chữ. Cần viết một script pre-processor để băm nhỏ truyện thành các đoạn ngắn (Episodes/Chunks). Pipeline sẽ lặp qua từng chunk.

- **Action 2: Trạm 0.5 - Chuẩn hóa Kịch bản (The Script Rewriter)**
  - _Tham chiếu Code:_ Nằm trong `backend/src/agents/tools/script-tools.ts` (công cụ `rewrite_to_screenplay` và `save_script`) và `skills/script_rewriter/SKILL.md`.
  - _Cơ chế của opensource:_ Họ không yêu cầu LLM trích xuất JSON (Tên nhân vật, Thoại, Tone) trực tiếp từ truyện chữ. Thay vào đó, tool `rewriteToScreenplay` ép LLM làm một bước trung gian: Viết lại văn bản thô thành **Kịch bản điện ảnh chuẩn (Screenplay)**.
    - Cú pháp khắt khe (bơm thẳng vào Prompt): `## S[Số thứ tự] | Nội/Ngoại cảnh · Địa điểm | Khoảng thời gian`.
    - Quy tắc: LLM tự động lược bỏ lời dẫn chuyện dài dòng, chuyển hóa tâm lý thành hành động, và ép nhịp độ mỗi cảnh là 30-60 giây.
  - _Áp dụng vào dự án:_ Bổ sung **Trạm 0.5**. Kết quả trả về của trạm này là một file text (Screenplay Format), làm đầu vào "sạch" và chuẩn xác cho Trạm `1_ingestor.py`. Nó giải quyết triệt để vấn đề mất mát hành động không lời.

- **Action 3: Quản Lý Nhất Quán (Global Entity Consistency)**
  - _Tham chiếu Code:_ Hướng dẫn nằm tại `skills/extractor/SKILL.md` (yêu cầu gọi tool `read_existing_characters`, `save_dedup_characters`, `read_existing_scenes`, `save_dedup_scenes`).
  - _Cơ chế của opensource:_ **Không hề có một trạm riêng biệt nào tạo "Database tổng"**. Chính trạm **Extractor** đóng vai trò vừa xây dựng, vừa sử dụng Database này theo cơ chế "Deduplication Cuốn chiếu" (Incremental Deduplication).
    - Tập 1: Extractor đọc thấy DB rỗng -> Trích xuất nhân vật -> Gọi `save_dedup_characters` để lưu vào DB của Bộ phim (Drama) và liên kết với Tập 1.
    - Tập 2: Extractor gọi `read_existing_characters` và thấy nhân vật "Minh" từ Tập 1. Khi quét kịch bản Tập 2, AI nhận diện "Minh" này là người cũ -> Không đẻ ID mới mà tự động link ID cũ của "Minh" vào Tập 2. (Nếu gặp "Lan" mới thì nó tạo mới).
  - _Áp dụng vào dự án:_ Dự án của chúng ta cũng không cần tạo thêm Trạm. Nhưng khi Trạm `1_ingestor.py` chạy trên một Chunk mới, thay vì chỉ xuất ra 1 file `core_script.json` độc lập, nó phải đọc và ghi (Upsert) vào một file `global_story_state.json` dùng chung cho toàn bộ Project. Bằng cơ chế Deduplication này, nhân vật "Minh" ở Chunk 10 sẽ giữ nguyên định danh với "Minh" ở Chunk 1 mà không cần quét lại toàn bộ truyện.

- **Action 4: Nâng cấp `1_ingestor.py`**
  - Thay vì bóc tách kiểu `1 Shot = 1 Câu thoại` (giống phong cách Visual Novel), Ingestor mới phải nhận diện được **Action Shots** (Cảnh hành động không thoại) dựa vào Kịch bản Screenplay từ Trạm 0.5.
  - Schema `Shot` cần bổ sung trường: `action_description` (hành động đang diễn ra).

### Phase 2: Nâng Cấp Hệ Sinh Thái Cảnh Quay (Cinematic Visuals)

Trạm 4 (`4_visual_director.py`) hiện tại chỉ có `cameraWork` rất cơ bản (pan, zoom) và `positionGrid`. Để hướng tới chất lượng cao hơn (dù là dùng 2D assets hay AI Video Gen), cần mở rộng Schema.

- **Action 1:** Mở rộng `VideoTracks.Visual` Schema.
  - Bổ sung: `shotType` (Toàn cảnh/Cận cảnh/Đặc tả), `cameraAngle` (Góc cao/Góc thấp), `lighting` (Tông màu/Ánh sáng).
- **Action 2:** Bổ sung Trạm Âm Thanh Đa Lớp (Foley & Score).
  - Trong `opensource-spec`, mỗi shot đều sinh ra `bgm_prompt` và `sound_effect`.
  - Nâng cấp `3_audio_engine.py` (hoặc tạo Trạm mới) để parse các trường `tone`, `action_description` thành ID hiệu ứng âm thanh (SFX) và Nhạc nền (BGM), sau đó thêm track `soundEffects` vào Master JSON.

### Phase 3: Tối Ưu Hóa "Vòng Lặp Missing Assets" (Prompt Engineering)

Hệ thống Auto-Feedback (`request_missing_asset`) của chúng ta rất hay, nhưng `visual_prompt` truyền cho họa sĩ/AI hiện tại đang thiếu cấu trúc. Hãy học hỏi cách `opensource-spec` dùng thẻ tag.

- **Action 1:** Áp dụng hệ thống XML Tagging cho Prompt sinh tài nguyên.
  - Khi Trạm 2 hoặc 4 không tìm thấy asset, thay vì pass một câu prompt chung chung, hãy format nó:
  - Nhân vật: `[appearance], [personality], cinematic portrait, <role>{Tên}</role>`
  - Video/Animation: `<location>{Nơi chốn}</location>, <role>{Nhân vật}</role> đang thực hiện {action_id}...`
- **Action 2:** Tách biệt ngôn ngữ tự nhiên và ngôn ngữ AI.
  - Lưu trữ riêng biệt `human_description` (để dev/người duyệt kịch bản đọc) và `generation_prompt` (chuỗi đã được tối ưu hóa bằng keyword tiếng Anh cho AI model) trong `missing_features_backlog.json`.

---

## 3. Cấu trúc JSON Lõi (Đề xuất Nâng cấp)

```json
{
  "documentId": "story_xyz",
  "castingMap": { ... },
  "videoTracks": {
    "audio": [ ... ], // Giữ nguyên, có wordTimestamps
    "sfx": [
      {
        "id": "sfx_01",
        "soundType": "door_open",
        "syncDependency": ["aud_01"] // Neo theo audio hoặc visual
      }
    ],
    "visual": [
      {
        "id": "vis_01",
        "backgroundId": "Phong_Ngu",
        "cinematography": {
          "shotType": "close_up",
          "cameraAngle": "eye_level",
          "movement": "zoom_in"
        },
        "syncDependency": ["aud_01"]
      }
    ],
    "persona": [ ... ] // Giữ nguyên
  }
}
```

## Tổng Kết

Kiến trúc của chúng ta ưu việt hơn ở khía cạnh **Kỹ thuật phần mềm** (Software Engineering) với Pipeline ổn định, Error Recovery, RAG Casting và JSON Validation.
Tuy nhiên, chúng ta cần học hỏi **Tư duy Điện ảnh** (Cinematography Thinking) từ OpenSource Spec bằng cách nâng cấp khâu xử lý kịch bản gốc và đa dạng hóa siêu dữ liệu hình ảnh/âm thanh trong Master JSON.
