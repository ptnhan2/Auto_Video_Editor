# Quality Audit Rubric — Chẩn đoán chất lượng toàn hệ thống

Tài liệu này là công cụ chẩn đoán và đánh giá chất lượng (QA) dành cho toàn bộ pipeline sản xuất video (từ S1 đến S7). 
Mục tiêu là cho phép **BẤT KỲ AI (không cần kiến thức lập trình hay điện ảnh)** cũng có thể xem một video thành phẩm (hoặc dữ liệu trung gian), phát hiện lỗi, và **chỉ điểm chính xác Trạm (Station) nào đang gây lỗi**.

---

## 🧭 Hướng dẫn sử dụng

1. **Xem video/đọc script** với tư cách một khán giả bình thường.
2. Nếu thấy điều gì "kỳ lạ", "khó chịu", "phi logic", hãy đối chiếu với **Checklist chẩn đoán** bên dưới.
3. Đánh giá điểm (Barem 1-5). Nếu đạt **điểm 1 hoặc 2 (FAIL)**, hãy nhìn vào mục `Nguyên nhân có thể` để giao ticket sửa lỗi cho đúng Station.
4. Có thể tra cứu nhanh bằng **Bảng Troubleshooting Cheatsheet** ở cuối tài liệu.

---

## 📝 PHẦN 1: CHECKLIST & BAREM ĐIỂM CHI TIẾT

### 📖 S1 — Script Pipeline (Chuyển thể kịch bản)

#### S1 — Hội thoại & Chuyển thể (Dialogue & Screenplay Adaptation)
**Triệu chứng:** Nhân vật nói chuyện như đang đọc văn xuôi, đọc luôn cả lời dẫn truyện ("Anh ta nói", "Hắn nghĩ"), hoặc lời thoại khô khan, không tự nhiên.
**Barem:**
- 1 = Bê nguyên xi văn bản gốc vào thoại, đọc luôn cả lời dẫn. Nghe như máy đọc sách.
- 3 = Đã chuyển thành thoại nhưng còn cứng, hơi giống kịch bản văn học.
- 5 = Thoại tự nhiên, đúng văn phong giao tiếp hàng ngày, giữ được cá tính nhân vật.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S1 (`rewrite_to_screenplay` prompt không đủ mạnh để ép LLM loại bỏ lời dẫn và chuyển sang format hội thoại thuần túy).

#### S1 — Mức độ giữ thông tin (Information Retention)
**Triệu chứng:** Người xem không hiểu chuyện gì đang xảy ra vì mạch truyện bị đứt quãng, thiếu context quan trọng từ truyện gốc.
**Barem:**
- 1 = Lược bỏ tình tiết cốt lõi, câu chuyện trở nên vô lý.
- 3 = Giữ được plot chính nhưng mất đi vài chi tiết làm nền (có thể chấp nhận được).
- 5 = Tóm tắt xuất sắc, câu chuyện liền mạch, không thừa không thiếu.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S1 (Prompt summarization/adaptation quá gắt gao làm mất dữ kiện).

#### S1 — Hành động & Mô tả khung cảnh (Action & Scene Description)
**Triệu chứng:** Hành động của nhân vật quá chung chung ("đánh nhau") hoặc thiếu bối cảnh không gian, dẫn đến các trạm sau không biết render thế nào.
**Barem:**
- 1 = Không có mô tả hành động hoặc bối cảnh, chỉ có lời thoại trần trụi.
- 3 = Có hành động cơ bản nhưng thiếu chi tiết trực quan (không rõ đang cầm vũ khí gì, ở đâu).
- 5 = Mô tả hành động (action tags) sắc nét, rõ ràng bối cảnh, dễ dàng parse thành video prompt.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S1 (LLM không trích xuất hoặc generate đủ `action_description` và `scene_context`).

---

### 👥 S2 — Character Pipeline (Thiết kế nhân vật)

#### S2 — Định danh nhân vật (Character Consistency & Dedup)
**Triệu chứng:** Cùng một nhân vật nhưng lúc tên này lúc tên khác (Vd: "Ông Lão", "Lão Hạc", "Ông Cụ"). Nhân vật bị nhân bản vô lý.
**Barem:**
- 1 = Một nhân vật bị tách thành 2-3 nhân vật khác nhau.
- 3 = Tên nhân vật thỉnh thoảng không nhất quán nhưng người xem vẫn đoán ra được.
- 5 = Định danh chuẩn xác 100%, reuse character asset hoàn hảo.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S2 (`dedup` logic fail, không check kỹ existing characters trong registry, hoặc vector search bị lỗi).

#### S2 — Đa dạng diện mạo (Visual Variety & Casting)
**Triệu chứng:** Tất cả các nhân vật quần chúng đều trông giống hệt nhau (cùng một template), không phân biệt được ai với ai.
**Barem:**
- 1 = Dùng chung 1-2 model avatar cho 10 nhân vật khác nhau.
- 3 = Có phân biệt nam/nữ, già/trẻ nhưng quần áo, tóc tai còn na ná nhau.
- 5 = Mỗi nhân vật có nét đặc trưng riêng, dễ dàng nhận diện bằng mắt thường.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S2 (Generator prompt thiếu tính ngẫu nhiên, hoặc asset library quá nghèo nàn).

#### S2 — Nhất quán đặc điểm (Trait & Wardrobe Continuity)
**Triệu chứng:** Ở đầu truyện nhân vật đội mũ đỏ, giữa truyện thành mũ xanh, cuối truyện mất mũ mà không có lý do logic.
**Barem:**
- 1 = Đặc điểm nhận dạng biến đổi liên tục qua từng phân cảnh.
- 3 = Giữ được khuôn mặt/vóc dáng nhưng thỉnh thoảng sai màu áo, phụ kiện.
- 5 = Đúng 100% chi tiết tạo hình từ đầu đến cuối trừ khi kịch bản yêu cầu thay đồ.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S2 (Không lưu trữ và áp dụng thẻ `visual_traits` xuyên suốt khi lookup asset).

---

### 🎬 S3 — Storyboard & Pacing (Phân cảnh & Nhịp độ)

#### S3 — Nhịp độ cắt cảnh (Pacing & Shot Length)
**Triệu chứng:** Cảnh chuyển không tự nhiên, phân bổ số lượng câu thoại trong một cảnh quá dồn dập hoặc quá lê thê.
**Barem:**
- 1 = Nhịp độ hoàn toàn hỏng, 1 shot chứa 10 câu thoại hoặc 1 câu thoại bị cắt vụn ra 3 shot.
- 3 = Một vài shot hơi dài/ngắn so với nhịp hành động, nhưng tổng thể xem được.
- 5 = Pacing hoàn hảo, số lượng thoại trên mỗi shot hợp lý với nhịp điệu.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S3 (Thuật toán phân chia `sentences_per_shot` quá dày hoặc quá mỏng).

#### S3 — Liên tục hành động (Action Continuity)
**Triệu chứng:** Shot trước nhân vật đang chạy bên trái, shot sau đột nhiên đứng yên bên phải mà không có sự kiện chuyển tiếp.
**Barem:**
- 1 = Hành động nhảy cóc, đứt gãy phi logic giữa các shot liên tiếp.
- 3 = Có cảm giác hơi sượng giữa các cảnh hành động nhưng vẫn hiểu được.
- 5 = Luồng hành động mượt mà, hợp logic vật lý và vị trí.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S3 (Thiếu cơ chế lưu trạng thái `previous_shot_action` để duy trì continuity).

#### S3 — Lựa chọn cỡ cảnh (Shot Type/Framing Logic)
**Triệu chứng:** Đoạn cao trào cảm xúc cần quay cận cảnh (Close-up) mặt diễn viên rơi nước mắt thì lại dùng toàn cảnh (Wide shot) từ xa.
**Barem:**
- 1 = Sai hoàn toàn mục đích cỡ cảnh (Wide shot cho nội tâm, Close-up cho đại cảnh chiến đấu).
- 3 = Cỡ cảnh an toàn (toàn Medium shot), thiếu sự nhấn nhá điện ảnh.
- 5 = Lựa chọn cỡ cảnh đúng ngôn ngữ điện ảnh, tôn lên được nội dung của phân đoạn.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S3 (Quy tắc suy diễn `shot_type` từ `action/emotion` bị lỏng lẻo).

---

### 🎙️ S4 — Audio & Text-To-Speech (Âm thanh & Giọng đọc)

#### S4 — Phù hợp nhân vật (Character-Voice Mapping)
**Triệu chứng:** Giọng đọc sai giới tính, sai độ tuổi, hoặc sai tone (ông lão giọng trẻ con, thanh niên giang hồ giọng e thẹn).
**Barem:**
- 1 = Sai hoàn toàn giới tính/độ tuổi (Nữ đọc vai nam).
- 3 = Đúng giới tính nhưng tone chưa hợp lắm (Vd: Nhân vật giận dữ nhưng giọng đều đều).
- 5 = Giọng điệu hoàn toàn ăn khớp với tính cách, trạng thái cảm xúc.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S4 (`voice_id` mapping sai, logic match thẻ tag của nhân vật với database giọng TTS bị lỗi).

#### S4 — Chất lượng âm thanh (Audio Quality & Robot Voice)
**Triệu chứng:** Giọng đọc đều đều như Google Translate đời cũ, bị vấp chữ, hoặc có tiếng nhiễu/noise.
**Barem:**
- 1 = Giọng robot rõ rệt, vấp nhiều từ, rất khó chịu khi nghe.
- 3 = Nghe rõ chữ nhưng thiếu cảm xúc (Monotone), thỉnh thoảng ngắt nhịp sai.
- 5 = Rõ ràng, tự nhiên, ngắt nghỉ đúng chỗ, có cảm xúc.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S4 (Model TTS lỗi, provider bị gián đoạn, hoặc không truyền param `emotion` vào prompt TTS).

#### S4 — Timing & Word Stamps (Độ khớp Subtitle)
**Triệu chứng:** Chữ hiện lên trước hoặc sau khi tiếng phát ra quá lâu (Lệch sub).
**Barem:**
- 1 = Lệch hoàn toàn (trên 1 giây), không thể xem.
- 3 = Lệch nhẹ ở một số từ nhanh (vẫn chấp nhận được).
- 5 = Chữ hiện ra khớp 100% với từng âm tiết phát ra.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S4 (`word_timings` do TTS provider trả về bị sai lệch, hoặc logic parse file âm thanh hỏng).

---

### 🎬 S5 — Visual Director (Đạo diễn hình ảnh)

#### S5 — Quy tắc trục & Hướng nhìn (180-Degree Rule & Facing)
**Triệu chứng:** Hai nhân vật đang nói chuyện với nhau nhưng lại cùng nhìn về một hướng (như đang nhìn ra ngoài khung hình).
**Barem:**
- 1 = Cùng nhìn 1 hướng trong 100% cảnh đối thoại. Lỗi trục nghiêm trọng.
- 3 = Lỗi hướng nhìn ở 1-2 shot phụ.
- 5 = Các nhân vật luôn nhìn vào nhau khi giao tiếp (1 người left, 1 người right).
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S5 phase 2 (`facing` direction tính toán sai, thiếu bước flip ngang asset của 1 actor).

#### S5 — Bố cục & Điểm lấy nét (Composition & Focal Point)
**Triệu chứng:** Camera chĩa vào khoảng trống, cắt mất đầu nhân vật, hoặc nhân vật đứng lệch hẳn ra rìa một cách vô lý.
**Barem:**
- 1 = Cắt mất phần quan trọng (đầu, mặt) hoặc camera chĩa vào tường.
- 3 = Bố cục hơi lỏng lẻo nhưng vẫn nhìn rõ nhân vật chính.
- 5 = Bố cục chuẩn Rule of Thirds, lấy nét đúng nhân vật đang nói.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S5 phase 1 (`focal_point` = (0,0) hoặc tính sai toạ độ), S5 phase 2 (`layout_positions` vượt ngoài visible area).

#### S5 — Bối cảnh phù hợp (Background Context)
**Triệu chứng:** Nhân vật đang đi ngoài biển nhưng phông nền là trong phòng ngủ.
**Barem:**
- 1 = Sai bối cảnh hoàn toàn, vô lý.
- 3 = Bối cảnh tạm chấp nhận được, không quá vô lý nhưng cũng không xuất sắc.
- 5 = Bối cảnh mô tả chính xác không gian được nhắc đến trong truyện.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S5 phase 1 (Thuật toán search `background_id` dựa trên context bị sai lệch).

#### S5 — Biểu cảm nhân vật (Expression Context)
**Triệu chứng:** Nhân vật đang khóc/đang giận dữ trong thoại nhưng mặt lại cười tươi.
**Barem:**
- 1 = Biểu cảm sai hoàn toàn so với cảm xúc lời thoại.
- 3 = Biểu cảm trung tính (Neutral) cho mọi tình huống.
- 5 = Biểu cảm thay đổi linh hoạt khớp với mood của shot.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S5 phase 1/2 (Logic map `emotion/mood` từ S1 sang `expression_id` bị hỏng hoặc thiếu default fallback).

---

### 🎵 S6 — Sound/VFX Engineer (Âm thanh & Kỹ xảo)

#### S6 — Cân bằng âm lượng (Audio Mixing)
**Triệu chứng:** Nhạc nền lấn át tiếng nói, hoặc tiếng SFX (tiếng súng, tiếng đấm) làm đứt tai, tiếng nói quá nhỏ.
**Barem:**
- 1 = Không nghe được thoại do nhạc/SFX quá to.
- 3 = Nghe được thoại nhưng nhạc hơi ồn, chưa mượt mà.
- 5 = Cân bằng hoàn hảo: Nhạc tự động nhỏ lại (ducking) khi có thoại, SFX vừa đủ nhấn.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S6 (Thiếu logic audio ducking, hoặc không set cứng mức volume ratio an toàn giữa voice/bgm/sfx).

#### S6 — Chọn nhạc nền (BGM Selection)
**Triệu chứng:** Cảnh đám tang buồn thảm nhưng nhạc nền EDM quẩy cực sung.
**Barem:**
- 1 = Nhạc nền phá hỏng hoàn toàn không khí cảnh phim.
- 3 = Nhạc an toàn (không có cũng được), hơi nhạt nhoà.
- 5 = Nhạc tôn lên được cảm xúc của phân cảnh.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S6 (`bgm_type` không khớp với `mood/genre` của tổng thể hoặc shot).

#### S6 — Hiệu ứng âm thanh & Kỹ xảo (SFX & VFX Matching)
**Triệu chứng:** Nhân vật nổ súng nhưng không có tiếng động, hoặc có tiếng súng nhưng lại hiện VFX trái tim bay lên.
**Barem:**
- 1 = SFX/VFX sai bét hoặc hoàn toàn biến mất trong cảnh hành động cường độ cao.
- 3 = Có SFX nhưng delay (chậm/sớm 1s) hoặc VFX hơi mờ nhạt.
- 5 = Điểm nhấn xuất sắc, hình ảnh và âm thanh khớp nhau từng frame.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S6 (Chọn VFX từ registry nhưng file missing không được log vào `missing_assets_backlog`, hoặc time-sync logic bị sai).

---

### 🖥️ S7 — Video Compiler & Render (Tổng hợp & Xuất file)

#### S7 — Đồng bộ Hình/Tiếng/Chữ (A/V Sync)
**Triệu chứng:** Nhân vật A đang nói nhưng mồm nhân vật B lại nhép (Lipsync sai người).
**Barem:**
- 1 = Lipsync sai nhân vật, chữ chạy trước âm thanh quá xa.
- 3 = Lệch vài frame nhỏ.
- 5 = Lipsync chính xác cho đúng nhân vật, chữ chạy theo đúng tiếng.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S7 (Speaker mapping `actorId` bị sai trong bước compile, lỗi bind `syncDependency`).

#### S7 — Cắt cảnh cưỡng bức (Duration vs Dialogue Validation)
**Triệu chứng:** Cảnh phim chuyển qua cảnh mới cái rụp trong khi diễn viên chưa nói hết câu, hoặc chữ chưa hiện xong.
**Barem:**
- 1 = Rất nhiều cảnh bị cắt cụt đuôi (câu thoại bị cắn mất phần cuối).
- 3 = Thi thoảng bị cắt vội ở vài chữ cuối của câu dài.
- 5 = Thời lượng cảnh luôn ôm trọn 100% thời lượng âm thanh thoại cộng thêm một chút padding.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S7 (Logic `duration_ms` cấp cho shot quá ngắn so với độ dài thực tế của file âm thanh, không overwrite lại duration từ S3).

#### S7 — Tính toàn vẹn của Video (Video Integrity)
**Triệu chứng:** Video output đang xem bị màn hình đen giữa chừng, thiếu một số cảnh (shot bị drop), hoặc crash không render ra file mp4.
**Barem:**
- 1 = Render lỗi, file hỏng, hoặc mất trắng shot ở giữa.
- 3 = Bị khựng nhẹ ở đoạn chuyển cảnh.
- 5 = Video trơn tru từ đầu đến cuối.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S7 (Compile bỏ sót shot trong file JSON config, schema input bị lỗi làm Remotion fail, hoặc RAM leak).

#### S7 — Đọc phụ đề (Subtitle Readability)
**Triệu chứng:** Chữ quá bé, màu chữ trùng với màu nền, bị che khuất bởi nhân vật hoặc quá nhiều chữ trên 1 dòng.
**Barem:**
- 1 = Không thể đọc được sub.
- 3 = Đọc được nhưng hơi mỏi mắt.
- 5 = Sub to, rõ ràng, có viền/stroke chống lấp, độ dài hợp lý.
**Nếu FAIL → nguyên nhân có thể → trạm gây lỗi:** S7 (Thiếu UI layer config cho subtitle trong template Remotion, không bẻ dòng khi text quá dài).

---

## 🚑 PHẦN 2: BẢNG CHẨN ĐOÁN NHANH (TROUBLESHOOTING CHEATSHEET)

Sử dụng bảng này để tra cứu nhanh từ "Cái bạn nhìn/nghe thấy" -> "Nơi cần gọi dev fix".

| 🔴 Triệu chứng (Cái bạn thấy/nghe) | 🔍 Nguyên nhân kỹ thuật có thể | 🛠️ Trạm chịu trách nhiệm |
| :--- | :--- | :--- |
| **THOẠI & KỊCH BẢN** | | |
| Lời thoại có kèm: "anh ta bước tới và nói" | LLM bê nguyên text thay vì diễn đạt lại | **S1** (Script) |
| Lão Hạc lúc thì tên Lão, lúc tên Hạc | Vector search / dedup nhân vật bị hụt | **S2** (Character) |
| Cảnh phim phân bố thoại dày mỏng bất thường | Thuật toán chia `sentences_per_shot` sai lệch | **S3** (Pacing) |
| Cảnh bị cắt rụp khi người xem chưa kịp nghe/đọc | `duration_ms` bị overwrite sai, bé hơn audio length | **S7** (Video Compiler) |
| **ÂM THANH & GIỌNG ĐỌC** | | |
| Nữ nhi lên tiếng bằng giọng ông lão khàn | Map sai `voice_id` theo gender/age | **S4** (Audio/TTS) |
| Chữ hiện xong 1 lúc âm thanh mới phát | Lệch `word_timings` | **S4** (Audio/TTS) |
| Tiếng nhạc lấn át không nghe được diễn viên nói | Thiếu ducking, chia volume ratio sai | **S6** (Sound/VFX) |
| Khóc lóc thảm thiết mà nhạc EDM giật đùng đùng | Map `bgm_type` lệch pha với `mood` | **S6** (Sound/VFX) |
| **HÌNH ẢNH & ĐẠO DIỄN** | | |
| 2 người nói chuyện nhưng quay mặt cùng hướng | Không flip (lật ngang) hình ảnh 1 actor | **S5** (Visual Director) |
| Camera chĩa vào bụi cây thay vì diễn viên | `focal_point` tính sai toạ độ (0,0) | **S5** (Visual Director) |
| Nhân vật A nói nhưng mồm B nhấp nháy | Gắn nhầm `actorId` vào track âm thanh | **S7** (Video Compiler) |
| Nhân vật đang buồn mà mặt cười tươi rói | Thiếu mapping `emotion` sang `expression` | **S5** (Visual Director) |
| Cảnh ngoài đường nhưng nền là phòng vệ sinh | Sai `background_id` search | **S5** (Visual Director) |
| **KỸ THUẬT RENDER** | | |
| Chữ phụ đề trắng bị chìm vào nền trời trắng | Subtitle thiếu viền (stroke) hoặc nền đen | **S7** (Video Compiler) |
| Chữ dài tràn ra khỏi màn hình video | Không có logic bẻ dòng (word-wrap) | **S7** (Video Compiler) |
| Màn hình đen, mất hình vài giây ở giữa video | JSON schema đẩy vào Remotion thiếu shot | **S7** (Video Compiler) |
| Remotion văng lỗi crash khi chạy | Input JSON hỏng, type mismatch | **S7** (Video Compiler) |
