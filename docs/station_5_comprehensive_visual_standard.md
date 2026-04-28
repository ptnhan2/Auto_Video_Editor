# Trạm 5: Tiêu chuẩn Sáng tạo Toàn diện cho AI Video Editor (Paper Cutout & Motion Graphics)

Tài liệu này định nghĩa "bộ não" của Trạm 5. Không phải là một đạo diễn máy quay vật lý, Trạm 5 là một **Senior Motion Graphics Editor**. Nhiệm vụ của nó là sử dụng ngôn ngữ thiết kế (Design Language), phép ẩn dụ thị giác (Visual Metaphors) và nhịp điệu (Rhythm) để biến các mảnh giấy 2D thành một tác phẩm kể chuyện cuốn hút, không giới hạn bởi không gian thực tế.

### Chú giải mức Khả thi

| Ký hiệu | Mức | Ý nghĩa |
|---------|-----|---------|
| 🟢 **Rất khả thi** | Có thể code ngay | Triển khai bằng Remotion/CSS pattern chuẩn, không phụ thuộc asset đặc biệt hay R&D. |
| 🟡 **Khả thi, phức tạp** | Cần thêm thời gian | Code được nhưng cần xử lý layout phức tạp, cần asset pre-made, hoặc cần benchmark performance. |
| 🔴 **Chưa khả thi** | Cần R&D | Yêu cầu pipeline asset chưa tồn tại, kỹ thuật CSS 3D chưa verify trên Remotion Chromium, hoặc nguy cơ performance cao. |

### Bảng Tổng kết Phân loại (đã chốt 28/04/2026)

| Trục | 🟢 Rất khả thi | 🟡 Khả thi | 🔴 Chưa khả thi |
|------|:---:|:---:|:---:|
| 1. Narrative Layouts | 7 | 0 | 0 |
| 2. Paper Dynamics | 4 | 0 | 2 |
| 3. Camera Work | 7 | 1 | 0 |
| 4. Visual Metaphors | 3 | 2 | 0 |
| 5. Transitions | 2 | 0 | 3 |
| 6. Textures & Compositing | 4 | 2 | 0 |
| **Tổng (37)** | **27** | **5** | **5** |

---

## TRỤC 1: BỐ CỤC KỂ CHUYỆN (NARRATIVE LAYOUTS)

Editor không chỉ đặt nhân vật vào giữa màn hình. Họ sắp xếp không gian để thể hiện ý đồ.

| Kỹ thuật Layout           | Khả thi                | Mô tả & Khả năng Áp dụng                                                            | Hướng Triển khai bằng Remotion (React/CSS)                                                                                                                 |
| :------------------------ | :--------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Diorama / Multi-plane** | 🟢 Rất khả thi         | Xếp lớp giấy theo trục Z (tiền-trung-hậu) tạo chiều sâu 3D giả lập.                | Dùng nhiều `<AbsoluteFill>`. Truyền `z_index` và dùng hàm `interpolate()` nối với `frame` để tạo hiệu ứng Parallax (lớp gần dịch chuyển nhanh hơn lớp xa). |
| **Collage / Scrapbook**   | 🟢 Rất khả thi         | Chắp vá lộn xộn các hình ảnh, giấy tờ chồng chéo lên nhau.                         | Random tọa độ `x, y` và góc `rotate(deg)` cho các `<img>`. Có thể dùng `random(seed)` của Remotion để giữ vị trí cố định mỗi lần render.                   |
| **Dynamic Split-Screen**  | 🟢 Rất khả thi         | Chia cắt màn hình thành nhiều phần.                                                 | Sử dụng CSS Flexbox/Grid hoặc thuộc tính `clip-path: polygon()` để cắt khung hình.                                                                         |
| **Frame-in-Frame**        | 🟢 Rất khả thi         | Đặt hành động chính bên trong một khung hình khác (qua lỗ khóa).                    | Dùng SVG `<mask>` hoặc CSS `clip-path` đè lên lớp nền để khoét một "lỗ hổng" hiển thị Composition bên dưới.                                                |
| **Isometric / Top-Down**  | 🟢 Rất khả thi         | Góc nhìn từ trên xuống mặt bàn.                                                     | Áp dụng CSS `transform: rotateX(60deg) rotateZ(-45deg)` lên một Container tổng để tạo góc nhìn phối cảnh cơ bản.                                           |
| **Matchbox / Shadowbox**  | 🟢 Rất khả thi         | Không gian hộp kín, các yếu tố trượt vào từ mép.                                    | Một `div` có `overflow: hidden` và `box-shadow` inset để tạo bóng đổ bên trong hộp.                                                                        |
| **Continuous Scroll**     | 🟢 Rất khả thi         | Màn hình cuộn ngang/dọc liên tục không ngừng.                                       | Dùng `interpolate(frame, [0, durationInFrames], [0, -2000])` truyền vào thuộc tính `translateX` của một Container dài.                                     |

---

## TRỤC 2: CHUYỂN ĐỘNG & VẬT LÝ CHẤT LIỆU (PAPER DYNAMICS & MOTION)

Các mảnh giấy không di chuyển mượt mà như video 60fps, chúng có tính chất vật lý riêng.

| Kỹ thuật Chuyển động       | Khả thi                        | Mô tả & Khả năng Áp dụng                                                                    | Hướng Triển khai bằng Remotion (React/CSS)                                                                                                  |
| :------------------------- | :----------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stop-Motion Stutter**    | 🟢 Rất khả thi                 | Giảm fps animation (8fps-12fps) tạo cảm giác giật cục thủ công.                             | Viết một Hook làm tròn frame, VD: `const steppedFrame = Math.floor(frame / 3) * 3;` và dùng nó thay thế `frame` gốc để tính CSS properties. |
| **Spring & Overshoot**     | 🟢 Rất khả thi                 | Nảy quá đà khi xuất hiện rồi dừng lại ở đích.                                               | Tích hợp hoàn hảo với hàm `spring()` tích hợp sẵn của Remotion. Điều chỉnh `damping`, `mass` để điều khiển độ nảy.                          |
| **Wobble / Jitter**        | 🟢 Rất khả thi                 | Các mảnh giấy rung lắc nhẹ liên tục ở rìa.                                                  | Dùng `Math.sin(frame * speed) * amplitude` để cập nhật CSS `transform: rotate()` và `translate()` nhẹ nhàng theo từng frame.                |
| **Float & Drift**          | 🟢 Rất khả thi                 | Vật thể trôi bồng bềnh như mây, khinh khí cầu.                                              | Dùng sóng Sin trên cả hai trục X và Y với tần số lệch nhau (Phase shift) để tạo đường đi zigzag cong mềm mại.                               |
| **Hinge / Puppet Rigging** | 🔴 Chưa khả thi (cần R&D)      | Xoay tay, chân xung quanh một "chốt" cố định. Cần pipeline asset tách bộ phận riêng.        | Cần tách rời bộ phận trên Figma/Photoshop. Áp dụng CSS `transform-origin: x% y%` để đặt tâm xoay chính xác tại khớp nối.                    |
| **Smear Frames (2D)**      | 🔴 Chưa khả thi (cần R&D)      | Vật thể kéo dãn khi di chuyển tốc độ cao để nhấn mạnh quán tính. Cần velocity tracking.     | Có thể mô phỏng bằng CSS `filter: blur(x)` kết hợp với `transform: scaleX()` dựa trên vector vận tốc.                                       |

---

## TRỤC 3: CAMERA ĐỒ HỌA KỂ CHUYỆN (GRAPHIC CAMERA WORK)

Camera trong môi trường 2D Editor linh hoạt và phi thực tế.

| Kỹ thuật Camera                   | Khả thi                | Mô tả                                                                                                                     | Hướng Triển khai                                                                                                                                        |
| :-------------------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endless Canvas (Pan liên tục)** | 🟢 Rất khả thi         | Chuyển động `translateX` cho thẻ bọc container cao nhất của cảnh quay.                                                    | `interpolate()` → `translateX` tuyến tính trên container.                                                                                               |
| **Micro-Macro Zoom**              | 🟢 Rất khả thi         | Thay đổi `scale` của toàn bộ container theo hàm Exponential để duy trì tốc độ zoom mượt mà.                               | `interpolate()` với hàm mũ → `scale`.                                                                                                                   |
| **Whip Pan (Chuyển cảnh vút)**    | 🟢 Rất khả thi         | Thay đổi `translateX` với `spring` tốc độ cực cao, kết hợp blur chớp nhoáng ở giữa hành trình.                            | `spring()` tốc độ cao + `filter: blur(10px)` tại midpoint.                                                                                              |
| **Camera Shake (Impact)**         | 🟢 Rất khả thi         | Bắt nhịp với Frame âm thanh, cập nhật tọa độ gốc bằng `random(seed)` biên độ lớn và giảm dần về 0.                        | `random(seed)` với biên độ giảm dần (decay).                                                                                                            |
| **Crash Zoom**                    | 🟢 Rất khả thi         | Gọi `spring()` với `stiffness` rất cao và `damping` thấp để bật `scale` to ra tức thì.                                    | `spring({ stiffness: 200, damping: 5 })` → `scale`.                                                                                                     |
| **Dutch Angle / Roll**            | 🟢 Rất khả thi         | Đặt `transform: rotate()` cho Container tổng từ góc A về góc B.                                                            | `interpolate()` → `rotate()` trên container gốc. CSS thuần, không phức tạp.                                                                            |
| **Dolly Zoom (Vertigo Effect 2D)**| 🟡 Khả thi             | `scale` dương cho foreground + `scale` âm cho background đồng thời, tạo ảo giác chóng mặt 2D. Cần tách biệt 2 layer rõ.   | `scale` dương (foreground) + `scale` âm (background) đồng thời. Yêu cầu tách layer rõ ràng.                                                             |
| **Scanline Tracking**             | 🟢 Rất khả thi         | Thay đổi `translateY` tuyến tính từ trên xuống dưới trên một hình ảnh văn bản dài.                                        | `interpolate()` → `translateY` tuyến tính.                                                                                                              |

---

## TRỤC 4: ẨN DỤ THỊ GIÁC & HIỆU ỨNG NHẤN MẠNH (VISUAL METAPHORS & EMPHASIS)

Cách Editor làm nổi bật thông tin quan trọng mà không cần nhân vật phải nói ra.

| Kỹ thuật                  | Khả thi                        | Mô tả                                                                 | Hướng Triển khai bằng Remotion (React/CSS)                                                                                                                                                                           |
| :------------------------ | :----------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The Red String**        | 🟡 Khả thi, phức tạp           | Kẻ đường gạch nối/sợi chỉ giữa hai ảnh.                              | Dùng thẻ SVG `<path stroke="red">` với thuộc tính `stroke-dasharray` và `stroke-dashoffset` animate bằng `interpolate` để tạo cảnh "vẽ dần" đường nối đỏ. Cần thuật toán toán học nếu khoảng cách điểm nối thay đổi. |
| **Highlight & Redact**    | 🟢 Rất khả thi                 | Bôi đen tài liệu (mật) hoặc bôi vàng dạ quang.                       | Đặt một `<div>` hoặc SVG hình chữ nhật đè lên ảnh. Phóng to chiều rộng của `div` (dùng `scaleX` với `transformOrigin: 'left'`) và đặt CSS `mix-blend-mode: multiply` (dạ quang).                                     |
| **Kinetic Typography**    | 🟡 Khả thi                     | Chữ bay nhấp nhô như ghép từ mẩu báo (Ransom note).                  | Tách chuỗi chữ thành từng `<span style={{display: 'inline-block'}}>`, bọc mỗi ký tự trong 1 component và animate `rotate`, `scale`, `translate` ngẫu nhiên. Cần xử lý word-wrap/layout khi tách ký tự.               |
| **The Blueprint Overlay** | 🟢 Rất khả thi                 | Biến hình màu thành nét chì kỹ thuật.                                | Áp dụng CSS filter mạnh lên hình gốc: `filter: grayscale(1) invert(1) contrast(5)`, hoặc sử dụng Blend Mode lồng thêm file ảnh blueprint texture pre-rendered.                                                       |
| **Polaroid Framing**      | 🟢 Rất khả thi                 | Đóng băng vào khung hình Polaroid rớt xuống.                         | Wrap tấm ảnh gốc vào giữa một `<AbsoluteFill>` có hình viền trắng, thêm caption text bên dưới, animate cả khối rơi xuống bằng `spring`.                                                                              |

---

## TRỤC 5: NGHỆ THUẬT CHUYỂN CẢNH (CREATIVE TRANSITIONS)

Chuyển cảnh trong Editor Graphic phải mượt mà và mang tính liên kết ý tưởng (Match Cut).

| Kỹ thuật Chuyển cảnh                      | Khả thi                        | Mô tả                                                                                                                                 | Hướng Triển khai                                                                                                                                                                            |
| :---------------------------------------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Paper Tear / Ink Bleed / Burn Reveal**  | 🔴 Chưa khả thi (cần R&D)      | Hiệu ứng Luma Matte (Track Matte). Cần mặt nạ video đen trắng `transition_matte.mp4`.                                                 | Cần pre-rendered matte asset hoặc SVG `<mask>` phức tạp. Chưa có sẵn asset pipeline cho matte video.                                                                                        |
| **Object Wipe**                           | 🟢 Rất khả thi                 | Animate một Asset đồ họa (đám mây, bàn tay) trượt qua màn hình. Lợi dụng khoảnh khắc Asset che khuất camera để swap scene.            | `translateX` từ `-100vw` → `100vw`. Swap Render Tree khi asset che phủ toàn bộ viewport. Pattern đơn giản.                                                                                 |
| **Page Flip / Turn**                      | 🔴 Chưa khả thi (cần R&D)      | Đòi hỏi kỹ thuật 3D CSS phức tạp (`transform-style: preserve-3d` và `rotateY(180deg)`). Dễ vỡ layout trong Remotion.                  | Cần pre-built React component hoặc thư viện ngoài. Chưa được verify trong môi trường Remotion Chromium.                                                                                    |
| **Graphic Match Cut**                     | 🟢 Rất khả thi                 | Quyết định 100% bằng Prompts và Metadata của LLM. Remotion chỉ việc hard-cut giữa 2 scene có vật thể giống nhau về hình dạng.         | Không cần code animation. AI Trạm 5 chọn vật thể A khớp vật thể B, Remotion thực hiện `Hard Cut` cơ bản.                                                                                    |
| **Grid Mosaic Flip**                      | 🔴 Chưa khả thi (cần R&D)      | Cắt toàn cảnh thành lưới N×N, lật tuần tự 3D từng mảnh. Rất nặng về performance — mỗi ô là 1 component riêng, dễ drop frame.         | Cần benchmark với N×N component `<div>` dùng `background-position` + `rotateY` stagger. Nguy cơ performance cao trong Remotion Chromium.                                                    |

---

## TRỤC 6: CHẤT LIỆU & KHÍ QUYỂN (TEXTURES & COMPOSITING)

Giúp tổng thể video không bị "phẳng" và nhàm chán.

| Kỹ thuật Textures & Compositing          | Khả thi                        | Mô tả                                                                                                                                 | Hướng Triển khai                                                                                                                                                                            |
| :--------------------------------------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Drop Shadows (Bóng đổ)**               | 🟢 Rất khả thi                 | Sử dụng `filter: drop-shadow(x y blur color)`. Khoảng cách `x/y` giãn theo `z_index` để nhấn mạnh độ chênh lệch tầng giấy.           | `filter: drop-shadow()` với tham số nội suy từ `z_index`. CSS thuần, không phụ thuộc asset.                                                                                                |
| **Halftone / Riso Print Filter**         | 🟡 Khả thi, phức tạp           | Đắp ảnh vân Halftone với `mix-blend-mode: overlay` hoặc SVG `feColorMatrix`. Cần pre-made halftone texture.                           | `<AbsoluteFill>` chứa texture halftone.png + `mix-blend-mode: overlay`. Phần code đơn giản, nhưng cần asset texture sẵn.                                                                   |
| **Paper Texture Overlay**                | 🟢 Rất khả thi                 | Một thẻ `<Img src="texture.png">` đặt lên cao nhất, chỉnh `mix-blend-mode: multiply` và xoay góc ngẫu nhiên mỗi 4 frames.            | `<Img>` + `mix-blend-mode: multiply` + `random(seed)` cho góc xoay mỗi 4 frames. Pattern đơn giản.                                                                                         |
| **Light Leaks & Film Burns / Dust**      | 🟢 Rất khả thi                 | Gọi video MP4 hiệu ứng nền đen, đặt vào cảnh và thêm `mix-blend-mode: screen` để "tẩy" phần đen, giữ lại vệt sáng và hạt bụi.        | `<Video>` hoặc `<Img>` + `mix-blend-mode: screen`. Cần asset video hiệu ứng pre-made. Pattern đơn giản.                                                                                    |
| **Chromatic Aberration (RGB Shift)**     | 🟡 Khả thi, phức tạp           | Đặt cùng một Composition 3 lần, mỗi lần trộn một filter SVG riêng biệt (R, G, B) và dịch `translateX` 2-3 pixels. Nặng gấp 3 render. | 3 bản sao composition + SVG filter per-channel + `translateX` offset. Cần benchmark performance do render gấp 3 lần.                                                                       |
| **Stop-Motion Lighting Flicker**         | 🟢 Rất khả thi                 | `random(floor(frame/5))` để lấy giá trị 0.95-1.05 → `filter: brightness()`, khiến khung hình sáng/tối tinh tế.                      | `random(Math.floor(frame / 5))` → `brightness()`. Một dòng code.                                                                                                                           |

---

## 7. SCHEMA DATABASE TỔNG HỢP CHO TRẠM 5 (AI COMPILER)

AI Trạm 5 phải được tự do "Mix & Match" các trục trên để tạo ra parameters cho Remotion. Bằng việc mở rộng các giá trị trong chuỗi JSON, Remotion có vô số cách kết hợp để tạo ra những tác phẩm "1-0-2".

### Cập nhật `src/db/schema.py` (Bổ sung bảng/cột linh hoạt hơn)

Thay vì hardcode từng cột, chúng ta gom nhóm chúng theo tư duy Editor:

| Tên cột (JSON/String) | Vai trò              | Ví dụ dữ liệu mà AI tạo ra                                                            |
| :-------------------- | :------------------- | :------------------------------------------------------------------------------------ |
| `layout_config`       | Định hình không gian | `{ "style": "split_circle_3", "z_depth": "diorama", "perspective": "forced" }`        |
| `camera_motion`       | Di chuyển tầm nhìn   | `{ "type": "map_zoom_to_pin", "easing": "spring", "crash_zoom": true }`               |
| `asset_dynamics`      | Vật lý của mẩu giấy  | `{ "fps_override": 12, "wobble": true, "entry": "crumple_flatten", "rig": "puppet" }` |
| `visual_metaphor`     | Hiệu ứng kể chuyện   | `["red_string_connect", "highlight_keyword", "puzzle_assembly"]`                      |
| `transition_in`       | Cách vào cảnh        | `"paper_tear_center"`, `"whip_pan_right"`, `"burn_reveal"`                            |
| `atmosphere_fx`       | Xử lý chất liệu      | `{ "drop_shadow": "deep", "overlay": "halftone_paper", "flicker": "stop_motion" }`    |

### Cấu trúc Tool `update_storyboard_visuals` cho AI Creative Editor:

```python
def update_storyboard_visuals(
    storyboard_id: str,
    # 1. Bố cục & Nhịp điệu
    layout_style: str,       # diorama, scrapbook, split_grid, matchbox, top_down...
    pacing_speed: str,       # fast_rhythmic, slow_continuous, dynamic_sync...

    # 2. Camera & Chuyển cảnh
    camera_concept: str,     # micro_macro_zoom, endless_pan, crash_zoom, dutch_roll...
    transition_in: str,      # paper_tear, ink_bleed, object_wipe, page_flip, mosaic_flip...

    # 3. Kỹ xảo & Ẩn dụ (Tùy chọn, dùng để tạo điểm nhấn)
    visual_metaphor: str,    # red_string, magnifying_glass, blueprint_overlay, polaroid_frame, none
    paper_dynamics: str,     # stutter_12fps, smooth_spring, float, crumple, smear...
    atmosphere_fx: str,      # halftone_grain, vintage_vignette, light_leaks, stop_motion_flicker...

    # 4. Mapping Asset thực tế (Mảnh ghép)
    action_id: str,
    expression_tag: str,
    background_id: str,
    layout_positions: str    # Mô tả tọa độ/cách xếp lớp (VD: char_A left_front, prop_B right_back)
) -> dict:
    pass
```
