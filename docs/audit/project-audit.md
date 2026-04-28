# Project Audit — Auto Video Editor

> **Mục đích:** Kiểm kê toàn diện codebase, xác nhận tiến độ thực tế, phát hiện code rác & doc drift.
> **Cơ chế:** Cột "Tôi đoán" do AI điền → Cột "Xác nhận" do bạn sửa/xác nhận → File này trở thành single source of truth.
> **Ngày audit:** 2026-04-27

## Ký hiệu trạng thái
| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Đã hoàn thành, hoạt động tốt |
| 🔄 | Đang làm dở |
| 🔴 | Chưa làm / cần làm |
| 🗑️ | Code rác / không dùng / cần xoá |
| 📄 | Chỉ là tài liệu tham khảo |
| ⚠️ | Có vấn đề cần xem xét |

---

## DOMAIN 1: `src/services/ai-director/` — AI Director (Đạo diễn AI)

| # | File | Tôi đoán mục đích | Trạng thái | ❓ Xác nhận |
|---|---|---|---|---|
| 1.1 | `director.ts` | Gửi kịch bản thô lên Gemini (gemini-3-flash-preview) dùng Vercel AI SDK `generateObject()` → sinh JSON `VideoScriptData`. Nhúng asset registry vào system prompt. | ✅ | ⚠️ |
| 1.2 | `generate_actions.py` | Script Python tạo file JSON keyframe cho 10 Waddle animation (run, walk, sneak, talk_angry/sad, strike...). Output → `public/animations/`. | ✅ (chạy 1 lần) | ⚠️ |

**❓ Câu hỏi xác nhận:**
- A. `director.ts` còn dùng không hay đã bị pipeline stations thay thế?
Tôi không nhớ rõ nữa, chỉ nhớ là hiện tại mọi thứ liên quan đến kịch bản đang xoay quanh các trạm, vẫn chưa có mvp vì hiện tại chỉ mới tạo được kịch bản thông qua các trạm, còn việc chuyển nó thành video thì vẫn chưa có cơ chế lắp ghép cụ thể. Nói chung là ký ức của tôi thực sự chỉ nhớ được là tôi đang làm/test phần các trạm trong pipeline, và chưa xong, những thứ khác không nhớ rõ.
- B. `generate_actions.py` còn cần không hay đã có cách khác tạo actions?
cái generate_action.py này là thuộc về tàn dư cũ, lúc đó dự định tạo chuyển động dựa trên rig animation luôn, tức là có chuyển động tay chân rõ ràng, nhưng sau này tôi quyết định đổi thành kiểu chuyển động đơn gian hơn, mình chỉ cần xoá nền cho ảnh nhân vật, rồi để cả cái ảnh đã xoá nền đó chuyển động theo kiểu waddle, mà tôi chỉ mới định ra phương hướng, chưa thực sự test code xem có phù hợp chưa, nên phần này vẫn phải làm lại á.
- C. Thiếu file/thứ gì trong domain này không?
File thì không thiếu, folder chỉ có 2 file đó thôi

**→ Kết luận D1:** `director.ts` ⚠️ tàn dư pre-pipeline, `generate_actions.py` 🗑️ rác (rig-animation cũ).

---

## DOMAIN 2: `src/services/character/` — Character Pipeline

| # | File | Tôi đoán | Trạng thái | Xác nhận |
|---|---|---|---|---|
| 2.1 | `character-pipeline.ts` | SAM → vectorization → rigging. Gọi Modal endpoint. Import bể. | ⚠️ | 🗑️ Archive |
| 2.2 | `core-rigger.ts` (657 dòng) | TF pose detection + green screen BG removal + cắt parts. CLI tool. | ⚠️ | 🗑️ Archive (logic hữu ích, cần xây lại) |
| 2.3 | `rigger.ts` | `generateSkeleton()` — hierarchy khớp xương humanoid. | ⚠️ | 🗑️ Archive |
| 2.4 | `action-factory.ts` (224 dòng) | Factory keyframe animation từng body part. | ⚠️ | 🗑️ Archive |
| 2.5 | `rig-anatomy.ts` | 10 body parts humanoid (torso→head, arms, legs). | ✅ | 🗑️ Archive |
| 2.6 | `auto-detect-pivots.ts` | Detect chin/crotch/armpits từ ảnh green screen. | ⚠️ | 🗑️ Archive |
| 2.7 | `vectorizer.ts` | Mask PNG → SVG qua potrace CLI. | ⚠️ | 🗑️ Archive |
| 2.8 | `character-store.ts` | Zustand store quản lý character library. Import bể. | ⚠️ | 🗑️ Archive |
| 2.9 | `character-pipeline.test.ts` | Vitest test cho CharacterPipeline. | ⚠️ | 🗑️ Archive |
| 2.10 | `rigging.ts` | Config constant cho core-rigger. | ✅ | 🗑️ Archive |

**→ Kết luận D2:** Toàn bộ 10 file thuộc kiến trúc rig-animation cũ, không dùng. Sẽ chuyển vào `.archive/` sau audit (giữ tham khảo).

---

## DOMAIN 3: `src/services/asset-manager/` — Asset Registry & Management

| # | File | Tôi đoán | Trạng thái | Xác nhận |
|---|---|---|---|---|
| 3.1 | `sync_registry.ts` (176 dòng) | Auto-scan `public/assets/` → sinh `src/config/asset-registry.ts`. Quét characters, backgrounds, actions, expressions, audio, effects. | ✅ | |
| 3.2 | `asset-registry.ts` (222 dòng) | File auto-generated, chứa mảng CHARACTERS, ACTIONS, EXPRESSIONS, BACKGROUNDS, AUDIO_TRACKS, EFFECTS. | ✅ | |
| 3.3 | `asset_ingestor.py` (300 dòng) | Đọc XML FLA file + asset_types.json → extract assets vào project. Tool 1-lần import Flash assets? | ⚠️ | ✅ |
| 3.4 | `extract_missing_assets.ts` | Đọc VideoScriptData JSON → trích `requestedAssets` → lưu `missing_assets_backlog.json`. **Import bể** (`../../src/types/ai-schemas`). | ⚠️ | ⚠️ |
| 3.5 | `process_assets_backlog.py` | Đọc `missing_assets_backlog.json` → sinh `asset_generation_plan.md`. | ⚠️ | ⚠️ |
| 3.6 | `core-asset-gen.ts` | CLI sinh character asset dùng nano-banana-v3 + blueprint + green screen prompt. | ⚠️ | ⚠️ |
| 3.7 | `asset_factory.ts` (127 dòng) | Gắn nhãn "WADDLE MIGRATION". Đọc script → trích characters/backgrounds → sinh asset profiles. | ⚠️ | |
| 3.8 | `asset_types.json` | Config prefix + folder cho 5 loại asset (expression, character_part, item, background, effect). | ✅ | |

**❓ Câu hỏi xác nhận:**
- A. `sync_registry.ts` + `asset-registry.ts` — đây là core đang dùng cho Station 0, đúng không?
Tôi không biết, vì tôi đang test từ station 1 đến 6, còn station 0 từ khi chuyển sang cơ chế station thì cho mới cho AI tạo code station 0 chứ chưa chạy thử nữa. 
- B. `asset_ingestor.py` 300 dòng — tool cũ import Flash/XML, còn cần không?
Tôi cũng không nhớ, chỉ nhớ là có 1 file nào đó tôi sẽ dùng để đọc xml và chuyển nó thành json, mục tiêu là chuyển xml + spritesheet thành json có thể trích xuất được các ảnh trong spritesheet.
- C. `core-asset-gen.ts` + `asset_factory.ts` — cái nào đang dùng để generate asset? Cả 2 có vẻ chồng lấn?
Tôi cũng không nhớ đang dùng cái nào luôn, khả năng cao là vẫn phải làm lại nội dung này, vì tôi vừa migrate code base sang cơ chế các station, và những gì tôi đã làm là chạy test thử từ trạm 1 đến trạm 6, các thứ khác hầu hết đều không còn phù hợp, mà phải chỉnh sửa thêm.
- D. `extract_missing_assets.ts` import bể — code bỏ hoang?
Không nhớ luôn... Nếu các station có dùng tới thì có nghĩa là nó có dùng, còn không thì nghĩa là nó đang bị bỏ hoang

**→ Kết luận D3:** `asset_ingestor.py` ✅ còn dùng. `sync_registry.ts` cho S0 chưa test. Còn lại ⚠️ cần audit lại sau khi station hoàn thiện.

---

## DOMAIN 4: `src/services/video-builder/` — Video Builder & Render

| # | File | Tôi đoán | Trạng thái | Xác nhận |
|---|---|---|---|---|
| 4.1 | `render_all.ts` (69 dòng) | Orchestrator: extract missing → chunk → Remotion CLI render → stitch. **Gọi script đường dẫn cũ** (`scripts/tools/...`). | ⚠️ | |
| 4.2 | `chunk_script.ts` (58 dòng) | Chia script thành chunk MAX 2 scenes. **Import bể** (`../../src/types/ai-schemas`). | ⚠️ | |
| 4.3 | `stitch_video.ts` (53 dòng) | FFmpeg concat nối MP4 chunks → final. Đơn giản, không import bể. | ⚠️ | |
| 4.4 | `render_with_subtitles.py` (187 dòng) | WhisperX transcribe → sequence matching align subtitle timing → burn-in. Logic phức tạp. | ⚠️ | |

**Nhận xét nhanh:** Toàn bộ domain này viết cho kiến trúc file-based cũ. `render_all.ts` gọi đường dẫn `scripts/tools/` đã không còn tồn tại. Bạn cũng nói "chưa có cơ chế lắp ghép cụ thể" — code này chưa được port sang DB-driven pipeline.

**1 câu hỏi:** Domain này có cần audit kỹ không, hay ghi nhận là ⚠️ cần viết lại toàn bộ theo station mới và chuyển sang domain tiếp theo (pipeline stations)?

**→ Kết luận D4:** Toàn bộ 4 file viết cho kiến trúc file-based cũ, đường dẫn & import bể. ⚠️ Cần viết lại khi có cơ chế lắp ghép video từ DB-driven pipeline.

---

## DOMAIN 5: `src/pipeline/` — 7 Pipeline Stations (CỐT LÕI)

| # | File | Dòng | Model | Test? | Xác nhận |
|---|---|---|---|---|---|
| 5.0 | `station_0_indexer.py` | 38 | — | Chưa | Cần thiết, chưa test, cần sửa |
| 5.1 | `station_1_script_rewriter.py` | 226 | gemini-3-flash | Chạy mượt, chưa đánh giá chất lượng | 🔄 |
| 5.2 | `station_2_extractor.py` | 300 | gemini-3-flash | Chạy mượt, chưa đánh giá chất lượng | 🔄 |
| 5.3 | `station_3_storyboard_breaker.py` | 183 | gemini-3-flash | Chạy mượt, chưa đánh giá chất lượng | 🔄 |
| 5.4 | `station_4_audio_generator.py` | 120 | — (TTS) | Chạy mượt, chưa đánh giá chất lượng | 🔄 |
| 5.5 | `station_5_visual_director.py` | 290 | gemini-2.5-flash | **Đang làm** | 🔄 Bug: `camera_concept` trong prompt ≠ `camera_motion` trong tool |
| 5.6 | `station_6_sound_vfx_engineer.py` | 135 | gemini-2.5-flash | Chưa test | 🔴 |

**⚠️ Station 5 — 4 bất nhất Code vs Doc:**
1. Prompt bảo AI chọn `camera_concept` nhưng tool chỉ nhận `camera_motion` → **bug gọi tool sai**
2. Code: `asset_dynamics` ≠ Doc: `paper_dynamics`
3. Code: `characters_state` ≠ Doc: `layout_positions`
4. Doc có `pacing_speed` — Code thiếu

**→ Hành động:** Sửa code khớp doc, đồng thời tạo task làm rõ docs (phân loại khả thi/chưa khả thi).

---

## DOMAIN 6: `src/shared/` — Shared Utilities

| # | Vấn đề | Chi tiết |
|---|---|---|
| 6.1 | **TRÙNG LẶP** `api-clients/` vs `api_clients/` | 2 thư mục giống hệt file, khác dấu gạch. `api_clients/` có thêm `__init__.py` → đây là bản Python-standard. Station 4 import từ `api_clients`. Cần xoá `api-clients/`. |
| 6.2 | `logger.py`, `id_generator.py` | ✅ Utilities chung, đang dùng bởi pipeline stations |
| 6.3 | `types/ai-schemas.ts`, `animation.ts`, `script.ts` | ✅ TypeScript types dùng chung |
| 6.4 | TTS providers trùng lặp | `scripts/core/tts/providers/` chứa bản sao của `src/shared/api_clients/providers/` → cần xoá `scripts/core/tts/` |

Xác nhận giống như bạn xác định.

## DOMAIN 7: `src/config/` — Configuration

| # | File | Trạng thái |
|---|---|---|
| 7.1 | `ai_models.py` | ✅ Map model cho từng station. Đang dùng |
| 7.2 | `asset-registry.ts` | ✅ Auto-generated bởi sync_registry. Đang dùng |
| 7.3 | `voice-profiles.ts` | ⚠️ Config giọng TTS. Cần xác nhận còn dùng không |

7.3 voice-profiles.ts không còn dùng

## DOMAIN 8: `remotion/` — Video Rendering

| # | File | Trạng thái |
|---|---|---|
| 8.1 | `WaddleSprite.tsx` | ✅ Đã xây dựng Engine Waddle generic (Issue #35) | ✅ |
| 8.2 | `ExpressionLayer.tsx` | ✅ Đã đồng bộ với Waddle Sprite | ✅ |
| 8.3 | `InteractionEffect.tsx` | ✅ Hoạt động tốt | ✅ |
| 8.4 | `Subtitle.tsx` | 🔄 Đang dọn dẹp | |
| 8.5 | `SceneCompiler.tsx` | ✅ Đã cập nhật cho Waddle Engine | ✅ |
| 8.6 | `DraftVideoPreview.tsx` | ✅ Đã cập nhật cho Waddle Engine | ✅ |
| 8.7 | `PuppetPreview.tsx` | ✅ Đã cập nhật cho Waddle Engine | ✅ |
| 8.8 | `ActionSequence.tsx` | 🔄 Đang làm | |

Gần như là phải xây lại từ đầu hết vì những cái này dựa trên flow cũ. Và lúc đó tôi lạm dụng AI quá, không hiểu cấu trúc của nó gì cả.

## DOMAIN 9: `docs/` — Critical Docs

| # | File | Vai trò |
|---|---|---|
| 9.1 | `station_5_comprehensive_visual_standard.md` | 📄 Spec mong muốn cho S5 (code chưa khớp) |
| 9.2 | `PIPELINE_ARCHITECTURE_V2.md` | 📄 Kiến trúc DB-Driven chính thức |
| 9.3 | `ROADMAP_PIPELINE_IMPROVEMENTS.md` | 📄 Đã superseded bởi V2 |
| 9.4 | `SYSTEM_ARCHITECTURE.md` | 📄 Tổng quan hệ thống |

SYSTEM_ARCHITECTURE cũng đã bị thay thế bởi PIPELINE_ARCHITECTURE_V2
Những thông tin còn lại  thì chính xác. 
## DOMAIN 10: Files cần xem xét đặc biệt

| # | File | Vấn đề |
|---|---|---|
| 10.1 | `scripts/migrate_storyboard_v2.py` | 🔴 **Chưa tồn tại** — cần tạo |
| 10.2 | `refactor.js` ở root | ⚠️ Script một lần, có thể xoá |
| 10.3 | `entities.json`, `mempalace.yaml` ở root | ⚠️ Không rõ mục đích |
| 10.4 | `src/shared/database/` | 🗑️ Chỉ có `__pycache__`, trùng với `src/db/` → xoá |

10.1 scripts/migrate_storyboard_v2.py cái này là gì? Sao phải tạo? 
10.2 refactor.js đúng là có thể xoá
10.3 entities.json`, `mempalace.yaml có thể xoá, vì nó đang áp dụng 1 cái cơ chế ghi nhớ cho AI tên là memory palace, mà tôi cài xong thì không dùng nữa nên nó thừa ra. 
10.4 Đồng ý
---

## TỔNG KẾT AUDIT

### Trạng thái thực của dự án

```
Pipeline stations:    S1-S4 chạy mượt (chất lượng chưa đánh giá), S5 đang sửa, S0+S6 chưa test
Services (4 domain):  1 domain archive (character), 3 domain cần viết lại cho DB-driven
Remotion:             8 components/compositions đang làm dở
Shared:               Trùng lặp api-clients/api_clients, cần dọn
Docs:                 Doc S5 là spec mong muốn, code chưa khớp
```

## TỔNG KẾT CUỐI CÙNG (AUDIT COMPLETE — 2026-04-27)

### PHẦN 1: Dọn dẹp & Sửa chữa (Cleanup — 12 actions)

| # | Hành động | Domain | Prio |
|---|---|---|---|
| C1 | Sửa bug `camera_concept` ≠ `camera_motion` trong S5 | pipeline | 🔴 |
| C2 | Xoá `api-clients/` duplicate (giữ `api_clients/`) | shared | 🔴 |
| C3 | Move `character/` (10 file) → `.archive/` | character | 🟡 |
| C4 | Làm rõ docs S5 (phân loại khả thi / chưa khả thi) | docs | 🟡 |
| C5 | Sửa code S5 khớp doc: thêm `pacing_speed`, đổi `camera_concept`, `paper_dynamics`, `layout_positions` | pipeline | 🟡 |
| C6 | Xoá `scripts/core/tts/` (trùng shared) | scripts | 🟢 |
| C7 | Xoá `refactor.js` | root | 🟢 |
| C8 | Xoá `entities.json`, `mempalace.yaml` | root | 🟢 |
| C9 | Xoá `src/shared/database/` (chỉ __pycache__) | shared | 🟢 |
| C10 | Xoá `voice-profiles.ts` (không dùng) | config | 🟢 |
| C11 | Xoá `SYSTEM_ARCHITECTURE.md` (superseded bởi V2) | docs | 🟢 |
| C12 | Remotion 8 files: xây lại từ đầu (code AI sinh, không hiểu cấu trúc) | remotion | 🟢 |

### PHẦN 2: Xây mới — GAP Analysis (7 modules còn thiếu)

| # | Module | Mô tả | Prio |
|---|---|---|---|
| G1 | **Station 7: Video Compiler** | Đọc storyboard từ DB → map visual params → JSON input cho Remotion | 🔴 |
| G2 | **Waddle Animation Engine** | ✅ Hoàn thành: Xoá nền green screen + engine rotate/bounce/squash&stretch (Issue #35) | ✅ |
| G3 | **Rendering Orchestrator** | Nhận `episode_id` → gọi Remotion CLI → stitch chunks → output MP4 | 🔴 |
| G4 | **Audio Mixing** | Trộn 3 track: voice TTS + BGM + SFX → 1 audio track | 🟡 |
| G5 | **Word-Level Subtitle Sync** | Sync subtitle từ TTS timing (không dùng WhisperX đoán lại) | 🟡 |
| G6 | **E2E CLI** | `python run_pipeline.py <episode_id>` chạy S0→S6→Compile→Render | 🟡 |
| G7 | **Sample/Test Data** | Drama + episode mẫu trong DB để test end-to-end | 🟢 |

### Bức tranh MVP

```
ĐÃ CÓ (S0-S6, đang test dở):
  S0[chưa test] → S1[chạy] → S2[chạy] → S3[chạy]
  → S4[chạy] → S5[đang sửa, bug camera_concept] → S6[chưa test]
  → DB (Storyboard đủ cột visual) ✓

CÒN THIẾU để ra MP4:
  G1[Compiler] → G2[Waddle] → G3[Render] → G4[Audio Mix]
  → G5[Subtitle] → G6[CLI] → G7[Test Data]
```

## NHẬT KÝ PHIÊN LÀM VIỆC (WORKING SESSIONS)

### Phiên làm việc thứ 2 (2026-04-28) - Waddle Engine Implementation
**Nội dung:** Hoàn tất Issue #35 - Xây dựng cốt lõi cho hệ thống animation Waddle.

- [x] **Xây dựng WaddleSprite.tsx**: Triển khai thuật toán nảy (Bounce) và xoay (Rotation) theo đúng spec Paper Mario.
- [x] **Nâng cấp Squash & Stretch**: Thêm hiệu ứng co dãn cơ thể khi chuyển động để tăng độ mềm mại.
- [x] **Chroma Key Integration**: Tích hợp bộ lọc SVG Matrix tách nền xanh trực tiếp cho asset AI.
- [x] **Refactoring & Fix Imports**: 
    - Đổi tên `WaddleSprite` cũ thành `HumanoidSprite`.
    - Sửa toàn bộ lỗi import bể trong `Root.tsx`, `useActionStore.ts`, `DraftVideoPreview.tsx`.
    - Fix version `zod@3.22.3` cho Remotion.
- [x] **CLI Restoration**: Tạo hệ thống CLI Wrapper trong `scripts/core/` để khôi phục các lệnh `npm run studio`.
- [x] **Visual Verification**: Tạo composition `WaddleEngineTest` để kiểm tra thị giác 3 cấp độ chuyển động.

---
**Tiếp theo:** Triển khai **G1 (Station 7: Video Compiler)** để kết nối dữ liệu từ Database vào Remotion.
