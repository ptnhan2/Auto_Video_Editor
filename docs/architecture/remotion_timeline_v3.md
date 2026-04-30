# Remotion Timeline Architecture V3 (Per-Shot Mapping)

## Tổng quan
Tài liệu này mô tả cấu trúc Render Component Tree của Remotion Engine trong **Auto Video Editor** sau khi nâng cấp lên JSON Schema V3. Mục tiêu là để đảm bảo Remotion đọc hiểu chuẩn xác cấu trúc `Scene -> Shots -> Actors` từ các kịch bản do AI Director sinh ra (Station 5).

## 1. Dữ Liệu Đầu Vào (Schema V3)
Cấu trúc kịch bản (`VideoScriptSchema`) giờ đây được lồng 3 cấp:
- **VideoScript**: Chứa mảng `scenes`.
  - **Scene**: Đại diện cho 1 bối cảnh lớn (Background không đổi). Chứa mảng `shots`.
  - **Shot**: Đại diện cho 1 góc máy (duration cụ thể). Chứa mảng `actors`.
  - **Actor**: Đại diện cho 1 nhân vật hoặc prop (Action, Expression, Position, Dialogue).

## 2. Cấu trúc Component Tree
Remotion Timeline được tổ chức qua các vòng lặp Component (`<Series>` và `<Series.Sequence>`) tương ứng với từng cấp dữ liệu:

### Cấp 1: Cấu trúc toàn thư mục Video (`DraftVideoPreview`)
Loop qua `scriptData.scenes` và render từng `SceneCompiler` thành chuỗi nối tiếp.
- Sử dụng thẻ `<Series>`
- `durationInFrames` của từng Sequence được tính tổng từ `scene.totalDurationSeconds` hoặc tổng thời gian của các `shots` cộng lại.
- Dữ liệu rác hoặc cấu trúc TTS cũ (không có shots) sẽ được tính fallback thời gian cẩn thận để tránh sập engine.

### Cấp 2: Biên dịch Scene (`SceneCompiler`)
Mỗi `SceneCompiler` nhận prop `scene` và chịu trách nhiệm thiết lập không gian.
- **BackgroundLayer**: Render một `<AbsoluteFill>` tĩnh từ đầu đến cuối Scene bằng `scene.backgroundId`.
- **Shots Timeline**: Sử dụng một thẻ `<Series>` nằm trên BackgroundLayer để render các góc máy tuần tự.
  - Vòng lặp `shots.map()` trả về `<Series.Sequence durationInFrames={shot.durationSeconds * fps}>`.

### Cấp 3: Biên dịch Shot (Bên trong `Series.Sequence` của SceneCompiler)
Mỗi Shot có khung thời gian cố định. Mọi đối tượng bên trong đều tự động mount/unmount khi play qua Sequence.
- `<AbsoluteFill>` lót nền để bọc Actors.
- Render từng nhân vật qua vòng lặp `shot.actors.map()`.
- Component `SingleActor` được sử dụng để điều khiển logic (Movement, Grab/Drop, Expression). Vì `SingleActor` chỉ sống bằng tuổi thọ của Shot, nhân vật tự động biến mất khi chuyển góc máy nếu không được truyền tiếp sang Shot sau.
- Tương tự, `ShotAudioSub` render giọng nói TTS và SFX đồng bộ chặt chẽ với timeline của Shot.

## 3. Quản lý Thời Gian (Timing & Duration)
- **Base FPS**: Khóa ở 30.
- Nếu thiếu duration (như từ API sinh kịch bản chưa hoàn thiện), hệ thống fallback mặc định `durationSeconds = 5` giây hoặc dùng hàm `calculateSceneDuration` tính tay.
- Mọi giá trị render Frame được kẹp `Math.max(..., 30)` để đảm bảo mọi sequence dù hỏng data vẫn có tối thiểu 1 giây tồn tại (chống vỡ layout Remotion root).
- `<Composition>` tại `remotion/Root.tsx` tính tổng `durationInFrames` dựa trên tổng duration của toàn bộ các Scene cộng lại (cơ chế tính Metadata).

## 4. Ràng buộc Tương lai (Phase 2 & Camera)
- Hiện tại Phase 1 **bỏ qua `CameraWrapper`** để đơn giản hoá gốc.
- Ở Phase 2 (Cinematic Camera), CameraWrapper sẽ cần được lồng bên ngoài Shot hoặc Scene. 
  - Nếu lồng Camera quanh Scene: Chuyển động panning chậm xuyên suốt.
  - Nếu lồng Camera quanh Shot: Cú máy giật/zoom in bám theo nhân vật.
- Khi triển khai, cần cẩn thận gắn lại `CameraWrapper` mà không làm vỡ `BackgroundLayer` hiện tại (Background cần nằm trong Camera để có cảm giác Parallax/Zoom thực).
