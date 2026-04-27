# Trạm 5: Tiêu chuẩn Sáng tạo Toàn diện cho AI Video Editor (Paper Cutout & Motion Graphics)

Tài liệu này định nghĩa "bộ não" của Trạm 5. Không phải là một đạo diễn máy quay vật lý, Trạm 5 là một **Senior Motion Graphics Editor**. Nhiệm vụ của nó là sử dụng ngôn ngữ thiết kế (Design Language), phép ẩn dụ thị giác (Visual Metaphors) và nhịp điệu (Rhythm) để biến các mảnh giấy 2D thành một tác phẩm kể chuyện cuốn hút, không giới hạn bởi không gian thực tế.

---

## TRỤC 1: BỐ CỤC KỂ CHUYỆN (NARRATIVE LAYOUTS)

Editor không chỉ đặt nhân vật vào giữa màn hình. Họ sắp xếp không gian để thể hiện ý đồ.

| Kỹ thuật Layout           | Mô tả & Khả năng Áp dụng                                                            | Hướng Triển khai bằng Remotion (React/CSS)                                                                                                                 |
| :------------------------ | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Diorama / Multi-plane** | Xếp lớp giấy theo trục Z (tiền-trung-hậu) tạo chiều sâu 3D giả lập. _(Rất khả thi)_ | Dùng nhiều `<AbsoluteFill>`. Truyền `z_index` và dùng hàm `interpolate()` nối với `frame` để tạo hiệu ứng Parallax (lớp gần dịch chuyển nhanh hơn lớp xa). |
| **Collage / Scrapbook**   | Chắp vá lộn xộn các hình ảnh, giấy tờ chồng chéo lên nhau. _(Rất khả thi)_          | Random tọa độ `x, y` và góc `rotate(deg)` cho các `<img>`. Có thể dùng `random(seed)` của Remotion để giữ vị trí cố định mỗi lần render.                   |
| **Dynamic Split-Screen**  | Chia cắt màn hình thành nhiều phần. _(Khả thi)_                                     | Sử dụng CSS Flexbox/Grid hoặc thuộc tính `clip-path: polygon()` để cắt khung hình.                                                                         |
| **Frame-in-Frame**        | Đặt hành động chính bên trong một khung hình khác (qua lỗ khóa). _(Khả thi)_        | Dùng SVG `<mask>` hoặc CSS `clip-path` đè lên lớp nền để khoét một "lỗ hổng" hiển thị Composition bên dưới.                                                |
| **Isometric / Top-Down**  | Góc nhìn từ trên xuống mặt bàn. _(Rất khả thi)_                                     | Áp dụng CSS `transform: rotateX(60deg) rotateZ(-45deg)` lên một Container tổng để tạo góc nhìn phối cảnh cơ bản.                                           |
| **Matchbox / Shadowbox**  | Không gian hộp kín, các yếu tố trượt vào từ mép. _(Rất khả thi)_                    | Một `div` có `overflow: hidden` và `box-shadow` inset để tạo bóng đổ bên trong hộp.                                                                        |
| **Continuous Scroll**     | Màn hình cuộn ngang/dọc liên tục không ngừng. _(Rất khả thi)_                       | Dùng `interpolate(frame, [0, durationInFrames], [0, -2000])` truyền vào thuộc tính `translateX` của một Container dài.                                     |

---

## TRỤC 2: CHUYỂN ĐỘNG & VẬT LÝ CHẤT LIỆU (PAPER DYNAMICS & MOTION)

Các mảnh giấy không di chuyển mượt mà như video 60fps, chúng có tính chất vật lý riêng.

| Kỹ thuật Chuyển động       | Mô tả & Khả năng Áp dụng                                                                    | Hướng Triển khai bằng Remotion (React/CSS)                                                                                                  |
| :------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stop-Motion Stutter**    | Giảm fps animation (8fps-12fps) tạo cảm giác giật cục thủ công. _(Rất khả thi)_             | Viết một Hook làm tròn frame, VD: `const steppedFrame = Math.floor(frame / 3) * 3;` và dùng nó thay thế `frame` gốc để tính CSS properties. |
| **Spring & Overshoot**     | Nảy quá đà khi xuất hiện rồi dừng lại ở đích. _(Rất khả thi)_                               | Tích hợp hoàn hảo với hàm `spring()` tích hợp sẵn của Remotion. Điều chỉnh `damping`, `mass` để điều khiển độ nảy.                          |
| **Wobble / Jitter**        | Các mảnh giấy rung lắc nhẹ liên tục ở rìa. _(Rất khả thi)_                                  | Dùng `Math.sin(frame * speed) * amplitude` để cập nhật CSS `transform: rotate()` và `translate()` nhẹ nhàng theo từng frame.                |
| **Float & Drift**          | Vật thể trôi bồng bềnh như mây, khinh khí cầu. _(Rất khả thi)_                              | Dùng sóng Sin trên cả hai trục X và Y với tần số lệch nhau (Phase shift) để tạo đường đi zigzag cong mềm mại.                               |
| **Hinge / Puppet Rigging** | Xoay tay, chân xung quanh một "chốt" cố định. _(Khả thi nhưng cần chuẩn bị Asset)_          | Cần tách rời bộ phận trên Figma/Photoshop. Áp dụng CSS `transform-origin: x% y%` để đặt tâm xoay chính xác tại khớp nối.                    |
| **Smear Frames (2D)**      | Vật thể kéo dãn khi di chuyển tốc độ cao để nhấn mạnh quán tính. _(Khả thi nhưng Phức tạp)_ | Có thể mô phỏng bằng CSS `filter: blur(x)` kết hợp với `transform: scaleX()` dựa trên vector vận tốc.                                       |

---

## TRỤC 3: CAMERA ĐỒ HỌA KỂ CHUYỆN (GRAPHIC CAMERA WORK)

Camera trong môi trường 2D Editor linh hoạt và phi thực tế.

- **The Endless Canvas (Pan liên tục)**: _(Rất khả thi)_ Chuyển động `translateX` cho thẻ bọc container cao nhất của cảnh quay.
- **Micro-Macro Zoom**: _(Rất khả thi)_ Thay đổi `scale` của toàn bộ container theo hàm Exponential để duy trì tốc độ zoom mượt mà.
- **Whip Pan (Chuyển cảnh vút)**: _(Rất khả thi)_ Thay đổi `translateX` với `spring` tốc độ cực cao, kết hợp CSS `filter: blur(10px)` chớp nhoáng ở giữa hành trình.
- **Camera Shake (Impact)**: _(Rất khả thi)_ Bắt nhịp với Frame âm thanh (VD: đập bàn tại frame 15), sau đó cập nhật tọa độ gốc bằng `random(seed)` biên độ lớn và giảm dần về 0.
- **Crash Zoom**: _(Rất khả thi)_ Gọi `spring()` với `stiffness` rất cao và `damping` thấp để bật `scale` to ra tức thì.
- **Dutch Angle / Roll**: _(Khả thi)_ Đặt `transform: rotate()` cho Container tổng từ góc A về góc B.
- **Dolly Zoom (Vertigo Effect 2D)**: _(Khả thi)_ Khai báo `scale` dương cho nhân vật (Foreground) và đồng thời chạy `scale` âm (thu nhỏ) cho cảnh nền (Background), tạo ảo giác chóng mặt 2D.
- **Scanline Tracking**: _(Rất khả thi)_ Thay đổi `translateY` tuyến tính từ trên xuống dưới trên một hình ảnh văn bản dài.

---

## TRỤC 4: ẨN DỤ THỊ GIÁC & HIỆU ỨNG NHẤN MẠNH (VISUAL METAPHORS & EMPHASIS)

Cách Editor làm nổi bật thông tin quan trọng mà không cần nhân vật phải nói ra.

| Kỹ thuật                  | Mô tả & Khả năng Áp dụng                                           | Hướng Triển khai bằng Remotion (React/CSS)                                                                                                                                                                           |
| :------------------------ | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The Red String**        | Kẻ đường gạch nối/sợi chỉ giữa hai ảnh. _(Khả thi nhưng Phức tạp)_ | Dùng thẻ SVG `<path stroke="red">` với thuộc tính `stroke-dasharray` và `stroke-dashoffset` animate bằng `interpolate` để tạo cảnh "vẽ dần" đường nối đỏ. Cần thuật toán toán học nếu khoảng cách điểm nối thay đổi. |
| **Highlight & Redact**    | Bôi đen tài liệu (mật) hoặc bôi vàng dạ quang. _(Rất khả thi)_     | Đặt một `<div>` hoặc SVG hình chữ nhật đè lên ảnh. Phóng to chiều rộng của `div` (dùng `scaleX` với `transformOrigin: 'left'`) và đặt CSS `mix-blend-mode: multiply` (dạ quang).                                     |
| **Kinetic Typography**    | Chữ bay nhấp nhô như ghép từ mẩu báo (Ransom note). _(Khả thi)_    | Tách chuỗi chữ thành từng `<span style={{display: 'inline-block'}}>`, bọc mỗi ký tự trong 1 component và animate `rotate`, `scale`, `translate` ngẫu nhiên.                                                          |
| **The Blueprint Overlay** | Biến hình màu thành nét chì kỹ thuật. _(Khả thi)_                  | Áp dụng CSS filter mạnh lên hình gốc: `filter: grayscale(1) invert(1) contrast(5)`, hoặc sử dụng Blend Mode lồng thêm file ảnh blueprint texture pre-rendered.                                                       |
| **Polaroid Framing**      | Đóng băng vào khung hình Polaroid rớt xuống. _(Rất khả thi)_       | Wrap tấm ảnh gốc vào giữa một `<AbsoluteFill>` có hình viền trắng, thêm caption text bên dưới, animate cả khối rơi xuống bằng `spring`.                                                                              |

---

## TRỤC 5: NGHỆ THUẬT CHUYỂN CẢNH (CREATIVE TRANSITIONS)

Chuyển cảnh trong Editor Graphic phải mượt mà và mang tính liên kết ý tưởng (Match Cut).

- **Paper Tear / Ink Bleed / Burn Reveal**: _(Khả thi nhưng Phức tạp)_. Đây là các hiệu ứng đắp Luma Matte (Track Matte). Cần thiết lập Component mặt nạ video (video đen trắng `transition_matte.mp4`), sử dụng Remotion tính năng SVG Mask (`<mask id="tear">`) hoặc CSS `mask-image` đọc ảnh liên tục để lộ cảnh B dưới cảnh A.
- **Object Wipe (Wipe bằng vật thể)**: _(Rất khả thi)_. Animate một Asset đồ họa (đám mây, bàn tay) trượt qua màn hình (`translateX` từ `-100vw` tới `100vw`). Lợi dụng khoảnh khắc Asset che khuất toàn bộ camera để thay thế Render Tree từ Cảnh A thành Cảnh B.
- **Page Flip / Turn**: _(Khả thi)_. Đòi hỏi kỹ thuật 3D CSS phức tạp (`transform-style: preserve-3d` và `rotateY(180deg)`), hoặc sử dụng các React Component mô phỏng trang sách pre-built, bọc composition bên trong lá sách.
- **Graphic Match Cut**: _(Rất khả thi ở Khâu Logic AI)_. Việc này được quyết định 100% bằng Prompts và Metadata của LLM. Trạm 5 tự phân tích vật thể A và chỉ định ID vật thể B giống hình tròn, Remotion chỉ việc `Hard Cut`.
- **Grid Mosaic Flip**: _(Khả thi nhưng nặng máy)_. Cắt `<Sequence>` (toàn cảnh) thành mảng lưới `N x N` các `<div>` (sử dụng CSS `background-position`), đặt delay lật 3D (`rotateY` từ 0->90deg) tuần tự giữa các mảnh để tan biến cảnh A.

---

## TRỤC 6: CHẤT LIỆU & KHÍ QUYỂN (TEXTURES & COMPOSITING)

Giúp tổng thể video không bị "phẳng" và nhàm chán.

- **Drop Shadows (Bóng đổ)**: _(Rất khả thi)_. Sử dụng thuộc tính `filter: drop-shadow(x y blur color)`. Cần lập trình khoảng cách `x/y` giãn ra tùy theo `z_index` để nhấn mạnh độ chênh lệch tầng giấy.
- **Halftone / Riso Print Filter**: _(Khả thi nhưng Phức tạp)_. Có thể giả lập bằng cách đắp một `<AbsoluteFill>` ảnh vân Halftone với CSS `mix-blend-mode: overlay` hoặc sử dụng SVG `feColorMatrix`.
- **Paper Texture Overlay**: _(Rất khả thi)_. Một thẻ `<Img src="texture.png">` đặt lên cao nhất, chỉnh `mix-blend-mode: multiply` và xoay góc ngẫu nhiên mỗi 4 frames để mô phỏng "boil" truyền thống.
- **Light Leaks & Film Burns / Dust & Scratches**: _(Rất khả thi)_. Gọi một tệp video MP4 (Hiệu ứng) có nền đen, đặt nó vào cảnh quay và thêm CSS `mix-blend-mode: screen` để "tẩy" phần màu đen, giữ lại vệt sáng và hạt bụi.
- **Chromatic Aberration (RGB Shift)**: _(Khả thi)_. Đặt cùng một Composition 3 lần, mỗi lần trộn một filter SVG riêng biệt (kênh màu Đỏ, Xanh lục, Xanh dương) và dịch `translateX` đi 2-3 pixels.
- **Stop-Motion Lighting Flicker**: _(Rất khả thi)_. Dùng `random(Math.floor(frame / 5))` để lấy các giá trị từ 0.95 đến 1.05 gắn vào thuộc tính `filter: brightness()`, khiến khung hình sáng lên / tối đi tinh tế.

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
