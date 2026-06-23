# OpenCut Project JSON — Integration Guide

> **Version:** 1.0 · **Last updated:** 2026-06-23
> **Target audience:** S7 Video Compiler developer
> **Source:** Reverse-engineered from OpenCut-AI type system (v10 project schema)

---

## 1. Tổng quan cấu trúc

File JSON của OpenCut lưu trữ toàn bộ dữ liệu một project video editor. Dữ liệu được serialize thành ISO string cho các field `Date`, phần còn lại giữ nguyên kiểu dữ liệu gốc.

```
TProject (gốc)
├── metadata              # TProjectMetadata — thông tin nhận diện project
├── scenes[]              # TScene[] — danh sách scene (thường là 1 scene chính)
│   └── tracks[]          # TimelineTrack[] — các track trên timeline
│       ├── VideoTrack    # type:"video" — chứa video clip, image
│       ├── AudioTrack    # type:"audio" — chứa audio clip (upload/library)
│       ├── TextTrack     # type:"text"  — chứa text overlay, subtitle
│       ├── StickerTrack  # type:"sticker" — chứa sticker
│       └── EffectTrack   # type:"effect" — chứa effect element
├── currentSceneId        # string — ID của scene đang active
├── settings              # TProjectSettings — fps, canvas, background
├── version               # number — phiên bản schema (hiện tại: 10)
└── timelineViewState?    # trạng thái view của timeline (zoom, scroll, playhead)
```

### Nguyên tắc thời gian

- **Tất cả thời gian tính bằng giây (second), kiểu `number`.** Không dùng frame number.
- Hệ tọa độ: gốc (0, 0) = **top-left** của canvas.
- `startTime`: thời điểm bắt đầu của element trên timeline (tính từ đầu project).
- `duration`: độ dài hiển thị của element (sau khi trim).
- `trimStart` / `trimEnd`: khoảng cắt từ đầu/cuối của media gốc (second). `trimStart=2, duration=5` nghĩa là lấy từ giây 2 đến giây 7 của file gốc.
- `sourceDuration`: tổng độ dài của file media gốc.

---

## 2. Bảng field — Required vs Optional

### 2.1 TProject (root)

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `metadata` | `TProjectMetadata` | **Yes** | — | Thông tin nhận diện |
| `scenes` | `TScene[]` | **Yes** | — | Ít nhất 1 scene chính |
| `currentSceneId` | `string` | **Yes** | — | Trỏ đến scene đang active |
| `settings` | `TProjectSettings` | **Yes** | — | Cấu hình project |
| `version` | `number` | **Yes** | `10` | Schema version (phải = 10) |
| `timelineViewState` | `TTimelineViewState` | No | — | Trạng thái view |

### 2.2 TProjectMetadata

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Unique project ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `thumbnail` | `string` (data URL) | No | `null` | Ảnh thumbnail PNG base64 |
| `duration` | `number` | **Yes** | `0` | Tổng thời lượng (giây) |
| `createdAt` | `string` (ISO 8601) | **Yes** | — | Thời gian tạo |
| `updatedAt` | `string` (ISO 8601) | **Yes** | — | Thời gian cập nhật cuối |

### 2.3 TProjectSettings

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `fps` | `number` | **Yes** | `30` | Frame rate (24/25/30/60/120) |
| `canvasSize` | `{width, height}` | **Yes** | `{1920, 1080}` | Kích thước canvas (px) |
| `originalCanvasSize` | `{width, height}` | No | `null` | Kích thước gốc (nếu có proxy) |
| `background` | `TBackground` | **Yes** | `{type:"color", color:"#000000"}` | Màu nền / blur |
| `proxyEditing` | `boolean` | No | `false` | Dùng proxy khi edit? |
| `proxyResolution` | `"480p" \| "720p" \| "1080p"` | No | `null` | Độ phân giải proxy |

#### TBackground variants

```json
// Màu nền đơn sắc
{ "type": "color", "color": "#000000" }

// Nền blur từ frame video
{ "type": "blur", "blurIntensity": 8 }
```

### 2.4 TScene

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Unique scene ID |
| `name` | `string` | **Yes** | — | Tên scene |
| `isMain` | `boolean` | **Yes** | `true` | Scene chính? (phải có ≥1) |
| `tracks` | `TimelineTrack[]` | **Yes** | `[]` | Danh sách track |
| `bookmarks` | `Bookmark[]` | **Yes** | `[]` | Đánh dấu thời gian |
| `markers` | `Marker[]` | **Yes** | `[]` | Marker màu trên timeline |
| `createdAt` | `string` (ISO 8601) | **Yes** | — | Thời gian tạo scene |
| `updatedAt` | `string` (ISO 8601) | **Yes** | — | Thời gian cập nhật |

### 2.5 Track Types

#### VideoTrack

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Track ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `color` | `TrackColor` | No | `"default"` | Màu track |
| `type` | `"video"` | **Yes** | — | Track type |
| `elements` | `(VideoElement\|ImageElement)[]` | **Yes** | `[]` | Clip trong track |
| `isMain` | `boolean` | **Yes** | `true` | Là track video chính? |
| `muted` | `boolean` | **Yes** | `false` | Tắt tiếng |
| `hidden` | `boolean` | **Yes** | `false` | Ẩn track |
| `volume` | `number` | No | `1.0` | Âm lượng (0-2) |
| `locked` | `boolean` | No | — | Khóa track |
| `solo` | `boolean` | No | — | Solo mode |

#### AudioTrack

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Track ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `color` | `TrackColor` | No | `"default"` | Màu track |
| `type` | `"audio"` | **Yes** | — | Track type |
| `elements` | `AudioElement[]` | **Yes** | `[]` | Audio clip |
| `muted` | `boolean` | **Yes** | `false` | Tắt tiếng |
| `volume` | `number` | No | `1.0` | Âm lượng (0-2) |
| `pan` | `number` | No | `0` | Pan (-1 left → +1 right) |
| `solo` | `boolean` | No | — | Solo mode |

#### TextTrack

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Track ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `color` | `TrackColor` | No | `"default"` | Màu track |
| `type` | `"text"` | **Yes** | — | Track type |
| `elements` | `TextElement[]` | **Yes** | `[]` | Text overlay |
| `hidden` | `boolean` | **Yes** | `false` | Ẩn track |

### 2.6 Element Types

#### VideoElement

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Element ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `duration` | `number` | **Yes** | — | Độ dài hiển thị (giây) |
| `startTime` | `number` | **Yes** | `0` | Vị trí trên timeline (giây) |
| `trimStart` | `number` | **Yes** | `0` | Trim từ đầu (giây) |
| `trimEnd` | `number` | **Yes** | `0` | Trim từ cuối (giây) |
| `sourceDuration` | `number` | No | — | Độ dài file gốc |
| `type` | `"video"` | **Yes** | — | Element type |
| `mediaId` | `string` | **Yes** | — | Tham chiếu media asset |
| `transform` | `Transform` | **Yes** | `{scale:1, position:{0,0}, rotate:0}` | Biến đổi hình học |
| `opacity` | `number` | **Yes** | `1.0` | Độ mờ (0-1) |
| `muted` | `boolean` | No | `false` | Tắt audio của clip |
| `playbackRate` | `number` | No | `1.0` | Tốc độ phát |
| `blendMode` | `BlendMode` | No | `"normal"` | Chế độ hòa trộn |
| `effects` | `Effect[]` | No | `[]` | Danh sách effect |
| `transitionOut` | `TransitionData` | No | `null` | Transition khi kết thúc |
| `crop` | `CropRect` | No | `null` | Vùng crop |
| `mask` | `MaskShape` | No | `null` | Mask shape |

#### Transform

```json
{
  "scale": 1.0,
  "position": { "x": 0, "y": 0 },
  "rotate": 0
}
```

#### TransitionData

```json
{
  "type": "cross-dissolve",
  "duration": 0.5
}
```

**Transition types có sẵn:** `cross-dissolve`, `dip-black`, `slide-left`, `slide-right`, `wipe-left`, `wipe-right`, `zoom`, `iris-wipe`, `clock-wipe`, `morph`, `glitch`, `film-burn`, `page-peel`, `spin`, `push`, `fade-white`, `checkerboard`, `dissolve-zoom`, `band-slide`, `cube-spin`

#### ImageElement

Giống `VideoElement` nhưng `type: "image"`, không có `muted` và `playbackRate`.

#### AudioElement (Upload)

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Element ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `duration` | `number` | **Yes** | — | Độ dài hiển thị (giây) |
| `startTime` | `number` | **Yes** | `0` | Vị trí trên timeline |
| `trimStart` | `number` | **Yes** | `0` | Trim đầu |
| `trimEnd` | `number` | **Yes** | `0` | Trim cuối |
| `sourceDuration` | `number` | No | — | Độ dài gốc |
| `type` | `"audio"` | **Yes** | — | Element type |
| `sourceType` | `"upload"` | **Yes** | — | Nguồn: file upload |
| `mediaId` | `string` | **Yes** | — | Tham chiếu media asset |
| `volume` | `number` | **Yes** | `1.0` | Âm lượng (0-2) |
| `muted` | `boolean` | No | `false` | Tắt tiếng |
| `playbackRate` | `number` | No | `1.0` | Tốc độ phát |

#### AudioElement (Library)

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `sourceType` | `"library"` | **Yes** | — | Nguồn: thư viện |
| `sourceUrl` | `string` | **Yes** | — | URL đến file audio |

#### TextElement

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | `string` (UUID) | **Yes** | — | Element ID |
| `name` | `string` | **Yes** | — | Tên hiển thị |
| `duration` | `number` | **Yes** | — | Độ dài hiển thị |
| `startTime` | `number` | **Yes** | `0` | Vị trí trên timeline |
| `trimStart` | `number` | **Yes** | `0` | Trim đầu |
| `trimEnd` | `number` | **Yes** | `0` | Trim cuối |
| `type` | `"text"` | **Yes** | — | Element type |
| `content` | `string` | **Yes** | — | Nội dung text |
| `fontSize` | `number` | **Yes** | `48` | Cỡ chữ (px) |
| `fontFamily` | `string` | **Yes** | `"Arial"` | Font chữ |
| `color` | `string` | **Yes** | `"#FFFFFF"` | Màu chữ (hex) |
| `highlightColor` | `string` | No | — | Màu highlight karaoke |
| `wordTimings` | `TextWordTiming[]` | No | — | Timing từng từ (karaoke) |
| `wordPopScale` | `number` | No | `1.0` | Scale pop effect |
| `background` | `TextBackground` | **Yes** | — | Nền text |
| `textAlign` | `"left" \| "center" \| "right"` | **Yes** | `"center"` | Căn lề |
| `fontWeight` | `"normal" \| "bold"` | **Yes** | `"bold"` | Độ đậm |
| `fontStyle` | `"normal" \| "italic"` | **Yes** | `"normal"` | In nghiêng |
| `textDecoration` | `"none" \| "underline" \| "line-through"` | **Yes** | `"none"` | Gạch chân/gạch ngang |
| `letterSpacing` | `number` | No | `0` | Khoảng cách chữ |
| `lineHeight` | `number` | No | `1.2` | Chiều cao dòng |
| `transform` | `Transform` | **Yes** | — | Vị trí, scale, rotate |
| `opacity` | `number` | **Yes** | `1.0` | Độ mờ |
| `blendMode` | `BlendMode` | No | `"normal"` | Blend mode |

#### TextWordTiming

```json
{ "word": "Xin", "start": 0.0, "end": 0.4 }
```
- `start` / `end`: thời gian **tương đối** so với `startTime` của TextElement (không phải absolute!)

#### TextBackground

```json
{
  "enabled": true,
  "color": "#00000080",
  "cornerRadius": 8,
  "paddingX": 12,
  "paddingY": 4
}
```

### 2.7 Effect (gắn vào element)

```json
{
  "id": "eff-001",
  "type": "blur",
  "params": { "intensity": 5 },
  "enabled": true
}
```

### 2.8 Marker

```json
{
  "id": "marker-001",
  "time": 12.0,
  "note": "Chuyển cảnh",
  "color": "yellow",
  "createdAt": 1719144000000
}
```
- `color`: `"red" | "yellow" | "green" | "blue" | "purple"`
- `createdAt`: Unix timestamp (milliseconds)

### 2.9 TrackColor

`"default" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"`

### 2.10 BlendMode

`"normal" | "darken" | "multiply" | "color-burn" | "lighten" | "screen" | "plus-lighter" | "color-dodge" | "overlay" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`

---

## 3. Mapping từ Pipeline S5/S6 sang OpenCut

### 3.1 Kiến trúc tổng quan của pipeline hiện tại

Pipeline V3 hiện tại sinh ra `SceneData[]` với mỗi scene chứa `ShotData[]`:

```
VideoScriptData
└── scenes: SceneData[]
    └── shots: ShotData[]
        ├── durationSeconds: number
        ├── layoutStyle, visualMetaphor, transitionIn, atmosphereFx, assetDynamics, camera
        ├── bgmId, sfxId, vfxId
        ├── backgroundId
        └── actors: ActorData[]
            ├── characterId, actionId, expressionId
            ├── facing, position (9-grid)
            ├── dialogue, isSpeaking, wordTimings
            └── audioId, audioDuration
```

### 3.2 Ánh xạ dữ liệu

#### 3.2.1 Pipeline → OpenCut TProject

| Pipeline Source | OpenCut Target | Ghi chú |
|-----------------|----------------|---------|
| Episode ID | `metadata.id` | Sinh UUID mới |
| Episode title | `metadata.name` | — |
| Tổng duration | `metadata.duration` | `sum(shot.durationSeconds)` |
| `timestamp` | `metadata.createdAt`, `metadata.updatedAt` | ISO 8601 |
| Episode settings | `settings.fps`, `settings.canvasSize` | Default: 30fps, 1920×1080 |
| — | `settings.background` | Mặc định `{type:"color", color:"#000000"}` |
| — | `version` | Luôn là `10` |

#### 3.2.2 Pipeline Scene → OpenCut TScene

| Pipeline Source | OpenCut Target | Ghi chú |
|-----------------|----------------|---------|
| `scene.sceneId` | `scenes[i].id` | UUID |
| Scene name (từ DB) | `scenes[i].name` | — |
| — | `scenes[i].isMain` | Scene đầu tiên = `true` |
| Shots trong scene | `scenes[i].tracks` | Xem mapping bên dưới |

#### 3.2.3 Pipeline Shot → OpenCut Tracks & Elements

Mỗi scene nên có các track sau:

**a) Video Track (Main)**

Mỗi `ShotData` → 1 `VideoElement` (nếu có video render cho shot đó):

```
ShotData                    →  VideoElement
────────────────────────────────────────────────
shot.durationSeconds        →  duration
∑ previous shot durations   →  startTime
0                           →  trimStart, trimEnd
episode video file          →  mediaId (tham chiếu file video đã render cho shot)
shot.transitionIn           →  transitionOut của element TRƯỚC ĐÓ
                                (vì transitionIn của shot N = transition kết thúc của shot N-1)
{scale:1, position:{0,0}, rotate:0}  →  transform
1.0                         →  opacity
```

**b) Audio Track — Nhạc nền (BGM)**

1 `AudioElement` cho toàn bộ scene:

```
ShotData.bgmId              →  AudioElement.mediaId (nếu có file BGM)
Tổng duration scene         →  duration
0                           →  startTime
"upload"                    →  sourceType
0.3                         →  volume (nhạc nền nhỏ hơn lời thoại)
```

**c) Audio Track — Lời thoại (Dialogue)**

Mỗi `ActorData` có `isSpeaking=true` và `dialogue` → 1 `AudioElement`:

```
ActorData.audioId                   →  AudioElement.mediaId (file TTS audio)
ActorData.audioDuration             →  AudioElement.duration
Shot startTime + offset trong shot  →  AudioElement.startTime
"upload"                            →  AudioElement.sourceType
1.0                                 →  AudioElement.volume
```

**d) Audio Track — Hiệu ứng âm thanh (SFX)**

Mỗi `ShotData.sfxId` → 1 `AudioElement`:

```
ShotData.sfxId              →  AudioElement.mediaId
ShotData.durationSeconds    →  AudioElement.duration (hoặc duration file sfx)
Shot startTime              →  AudioElement.startTime
"upload"                    →  AudioElement.sourceType
0.8                         →  AudioElement.volume
```

**e) Text Track — Subtitle**

Mỗi `ActorData` có `dialogue` → 1 `TextElement`:

```
ActorData.dialogue              →  TextElement.content
ActorData.wordTimings[]         →  TextElement.wordTimings[]
AudoData.audioDuration          →  TextElement.duration
Shot startTime + offset         →  TextElement.startTime
"#FFFFFF"                       →  TextElement.color
"#FFD700"                       →  TextElement.highlightColor
48                              →  TextElement.fontSize (tùy chỉnh theo canvas size)
{enabled:true, color:"#00000080", cornerRadius:8, paddingX:12, paddingY:4}
                                →  TextElement.background
"center"                        →  TextElement.textAlign
"bold"                          →  TextElement.fontWeight
{scale:1, position:{x:960, y:920}, rotate:0}
                                →  TextElement.transform (center-bottom của canvas 1920×1080)
```

#### 3.2.4 Pipeline Transition → OpenCut Transition

Pipeline S5 có `transitionIn` cho mỗi shot (các giá trị: `paper_tear`, `ink_bleed`, `object_wipe`, `graphic_match_cut`, `page_flip`, `burn_reveal`).

Trong OpenCut, transition được đặt ở **element trước đó** (`transitionOut`), không phải element hiện tại. Logic mapping:

```
Nếu shot[N].transitionIn là "paper_tear":
  → VideoElement[N-1].transitionOut = mapTransitionToOpenCut("paper_tear")
  → VideoElement[N-1].transitionOut.duration = 0.5
```

Bảng ánh xạ transition (best effort — OpenCut có bộ transition khác pipeline):

| Pipeline Transition | OpenCut Transition | Ghi chú |
|---------------------|-------------------|---------|
| `paper_tear` | `page-peel` | Gần giống nhất |
| `ink_bleed` | `dip-black` | Hiệu ứng tối dần |
| `object_wipe` | `wipe-right` | Wipe cơ bản |
| `graphic_match_cut` | `morph` | Biến hình |
| `page_flip` | `page-peel` | Lật trang |
| `burn_reveal` | `film-burn` | Hiệu ứng cháy |
| *(không có)* | `cross-dissolve` | Fallback mặc định |

#### 3.2.5 Pipeline Layout & Camera → OpenCut Transform & Effects

| Pipeline Field | OpenCut Target | Cách map |
|---------------|----------------|----------|
| `layoutStyle` | `VideoElement.effects[]` | Dùng Effect phù hợp (vd: `split_screen` → chưa có effect tương ứng, bỏ qua) |
| `cameraConcept` | `VideoElement.transform` + `VideoElement.effects[]` | `camera_shake` → Effect shake, `crash_zoom` → keyframe scale |
| `atmosphereFx` | `VideoElement.effects[]` | `film_grain` → Effect grain, `chromatic_aberration` → Effect chromatic |
| `visualMetaphor` | Text overlay hoặc Image overlay | `kinetic_typography` → TextElement |

> ⚠️ **Lưu ý**: OpenCut effects cần được định nghĩa trong registry. Nếu effect không tồn tại, bỏ qua thay vì crash.

### 3.3 Tọa độ nhân vật (9-grid → Transform position)

Pipeline dùng hệ tọa độ 9-grid (`"left" \| "mid_left" \| "right" \| "top_center" \| "mid_center" \| "bottom_center" \| "top_left" \| "top_right" \| "bottom_left" \| "bottom_right"`).

OpenCut dùng tọa độ pixel tuyệt đối với gốc (0,0) = top-left. Bảng quy đổi cho canvas 1920×1080:

| Pipeline Position | OpenCut (x, y) |
|-------------------|----------------|
| `top_left` | (320, 270) |
| `top_center` | (960, 270) |
| `top_right` | (1600, 270) |
| `mid_left` | (320, 540) |
| `mid_center` | (960, 540) |
| `mid_right` | (1600, 540) |
| `bottom_left` | (320, 810) |
| `bottom_center` | (960, 810) |
| `bottom_right` | (1600, 810) |

---

## 4. Ví dụ code Python: Sinh OpenCut JSON từ pipeline output

```python
"""Sinh OpenCut Project JSON từ dữ liệu pipeline S5/S6 đã compile.

Module này nhận VideoScriptData (output của S7 compiler) và tạo ra
SerializedProject JSON tương thích với OpenCut-AI.

Side Effects: Ghi file JSON ra public/scripts/opencut_{episode_id}.json
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Any


# ── Constants ──────────────────────────────────────────────────────

DEFAULT_FPS = 30
DEFAULT_CANVAS_WIDTH = 1920
DEFAULT_CANVAS_HEIGHT = 1080
CURRENT_SCHEMA_VERSION = 10

# Mapping từ pipeline transition sang OpenCut transition
TRANSITION_MAP: dict[str, str] = {
    "paper_tear": "page-peel",
    "ink_bleed": "dip-black",
    "object_wipe": "wipe-right",
    "graphic_match_cut": "morph",
    "page_flip": "page-peel",
    "burn_reveal": "film-burn",
}

# Mapping từ pipeline position (9-grid) sang OpenCut pixel coordinates
POSITION_GRID: dict[str, tuple[float, float]] = {
    "top_left":     (320, 270),
    "top_center":   (960, 270),
    "top_right":    (1600, 270),
    "mid_left":     (320, 540),
    "mid_center":   (960, 540),
    "mid_right":    (1600, 540),
    "bottom_left":  (320, 810),
    "bottom_center": (960, 810),
    "bottom_right": (1600, 810),
}

SUBTITLE_Y_POSITION = 920  # Vị trí Y mặc định cho subtitle


# ── Helpers ────────────────────────────────────────────────────────

def _uid() -> str:
    """Sinh unique ID ngắn gọn hơn UUID để dễ đọc log."""
    return str(uuid.uuid4())[:8]


def _iso_now() -> str:
    """Trả về ISO 8601 timestamp hiện tại."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", ".000Z")


def _make_transform(
    x: float = 0, y: float = 0, scale: float = 1.0, rotate: float = 0.0,
) -> dict[str, Any]:
    """Tạo Transform object cho OpenCut element."""
    return {
        "scale": scale,
        "position": {"x": x, "y": y},
        "rotate": rotate,
    }


def _make_subtitle_background() -> dict[str, Any]:
    """Tạo TextBackground mặc định cho subtitle."""
    return {
        "enabled": True,
        "color": "#00000080",
        "cornerRadius": 8,
        "paddingX": 12,
        "paddingY": 4,
    }


# ── Element Builders ───────────────────────────────────────────────

def build_video_element(
    media_id: str,
    name: str,
    start_time: float,
    duration: float,
    source_duration: float | None = None,
    transition_out: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Tạo VideoElement cho OpenCut video track.

    Args:
        media_id: ID của media asset trong storage.
        name: Tên hiển thị trên timeline.
        start_time: Vị trí bắt đầu trên timeline (seconds).
        duration: Độ dài hiển thị (seconds).
        source_duration: Độ dài file gốc (seconds). Nếu không có, dùng duration.
        transition_out: TransitionData hoặc None.

    Returns:
        VideoElement dict tương thích với OpenCut schema.
    """
    return {
        "id": _uid(),
        "name": name,
        "duration": duration,
        "startTime": start_time,
        "trimStart": 0.0,
        "trimEnd": 0.0,
        "sourceDuration": source_duration or duration,
        "type": "video",
        "mediaId": media_id,
        "muted": False,
        "hidden": False,
        "playbackRate": 1.0,
        "transform": _make_transform(),
        "opacity": 1.0,
        "blendMode": "normal",
        "transitionOut": transition_out,
        "crop": None,
        "mask": None,
        "effects": [],
    }


def build_text_subtitle_element(
    content: str,
    start_time: float,
    duration: float,
    word_timings: list[dict[str, Any]] | None = None,
    font_size: int = 48,
    position_y: float | None = None,
) -> dict[str, Any]:
    """Tạo TextElement cho OpenCut text track (subtitle).

    Args:
        content: Nội dung subtitle.
        start_time: Vị trí bắt đầu (seconds absolute trên timeline).
        duration: Độ dài hiển thị (seconds).
        word_timings: Danh sách word timing cho karaoke highlight.
        font_size: Cỡ chữ (px).
        position_y: Vị trí Y (px). Default là SUBTITLE_Y_POSITION.

    Returns:
        TextElement dict tương thích với OpenCut schema.
    """
    y = position_y if position_y is not None else SUBTITLE_Y_POSITION
    return {
        "id": _uid(),
        "name": f"Sub: {content[:30]}",
        "duration": duration,
        "startTime": start_time,
        "trimStart": 0.0,
        "trimEnd": 0.0,
        "type": "text",
        "content": content,
        "fontSize": font_size,
        "fontFamily": "Arial",
        "color": "#FFFFFF",
        "highlightColor": "#FFD700",
        "wordTimings": word_timings or [],
        "wordPopScale": 1.15,
        "background": _make_subtitle_background(),
        "textAlign": "center",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "textDecoration": "none",
        "letterSpacing": 0,
        "lineHeight": 1.2,
        "hidden": False,
        "transform": _make_transform(x=DEFAULT_CANVAS_WIDTH / 2, y=y),
        "opacity": 1.0,
        "blendMode": "normal",
    }


def build_audio_element(
    media_id: str,
    name: str,
    start_time: float,
    duration: float,
    source_duration: float | None = None,
    volume: float = 1.0,
    source_type: str = "upload",
    source_url: str | None = None,
) -> dict[str, Any]:
    """Tạo AudioElement cho OpenCut audio track.

    Args:
        media_id: ID của media asset (cho sourceType="upload").
        name: Tên hiển thị.
        start_time: Vị trí trên timeline (seconds).
        duration: Độ dài (seconds).
        source_duration: Độ dài file gốc.
        volume: Âm lượng (0.0 - 2.0).
        source_type: "upload" hoặc "library".
        source_url: URL cho library source.

    Returns:
        AudioElement dict tương thích với OpenCut schema.
    """
    element: dict[str, Any] = {
        "id": _uid(),
        "name": name,
        "duration": duration,
        "startTime": start_time,
        "trimStart": 0.0,
        "trimEnd": 0.0,
        "sourceDuration": source_duration or duration,
        "type": "audio",
        "sourceType": source_type,
        "volume": volume,
        "muted": False,
        "playbackRate": 1.0,
    }
    if source_type == "upload":
        element["mediaId"] = media_id
    else:
        element["sourceUrl"] = source_url
    return element


# ── Main Builder ───────────────────────────────────────────────────

def build_opencut_project(
    episode_id: str,
    episode_name: str,
    compiled_scenes: list[dict[str, Any]],
    canvas_width: int = DEFAULT_CANVAS_WIDTH,
    canvas_height: int = DEFAULT_CANVAS_HEIGHT,
    fps: int = DEFAULT_FPS,
) -> dict[str, Any]:
    """Xây dựng SerializedProject JSON từ dữ liệu scene đã compile.

    Nhận output của S7 compiler (VideoScriptData.scenes) và chuyển đổi
    sang định dạng OpenCut-AI project.

    Args:
        episode_id: Episode ID để sinh project ID.
        episode_name: Tên project hiển thị.
        compiled_scenes: Danh sách SceneData từ pipeline.
        canvas_width: Chiều rộng canvas (default 1920).
        canvas_height: Chiều cao canvas (default 1080).
        fps: Frame rate (default 30).

    Returns:
        SerializedProject dict sẵn sàng serialize ra JSON.

    Side Effects: Không có (pure function).
    """
    now_iso = _iso_now()
    opencut_scenes: list[dict[str, Any]] = []
    total_duration = 0.0

    for scene_idx, scene_data in enumerate(compiled_scenes):
        shots = scene_data.get("shots", [])
        video_elements: list[dict[str, Any]] = []
        dialogue_audio: list[dict[str, Any]] = []
        sfx_audio: list[dict[str, Any]] = []
        subtitle_elements: list[dict[str, Any]] = []
        bgm_elements: list[dict[str, Any]] = []

        scene_start_time = total_duration
        current_time = 0.0
        prev_transition: dict[str, Any] | None = None

        for shot in shots:
            duration = float(shot.get("durationSeconds", 0))
            if duration <= 0:
                continue

            # ── Video element cho shot ──
            media_id = f"media-video-{shot.get('shotId', _uid())}"
            transition_out = None
            transition_in = shot.get("transitionIn")
            if transition_in and transition_in in TRANSITION_MAP:
                transition_out = {
                    "type": TRANSITION_MAP[transition_in],
                    "duration": 0.5,
                }

            video_elements.append(build_video_element(
                media_id=media_id,
                name=f"Shot {shot.get('shotId', '?')}",
                start_time=scene_start_time + current_time,
                duration=duration,
                transition_out=transition_out,
            ))

            # ── Audio: BGM (chỉ thêm 1 lần cho cả scene) ──
            bgm_id = shot.get("bgmId")
            if bgm_id and not bgm_elements:
                bgm_elements.append(build_audio_element(
                    media_id=f"media-bgm-{bgm_id}",
                    name=f"BGM: {bgm_id}",
                    start_time=scene_start_time,
                    duration=sum(
                        float(s.get("durationSeconds", 0)) for s in shots
                    ),
                    volume=0.3,
                ))

            # ── Audio: SFX ──
            sfx_id = shot.get("sfxId")
            if sfx_id:
                sfx_audio.append(build_audio_element(
                    media_id=f"media-sfx-{sfx_id}",
                    name=f"SFX: {sfx_id}",
                    start_time=scene_start_time + current_time,
                    duration=duration,
                    volume=0.8,
                ))

            # ── Subtitle & Dialogue audio từ mỗi actor ──
            for actor in shot.get("actors", []):
                dialogue = actor.get("dialogue", "").strip()
                if not dialogue:
                    continue

                audio_id = actor.get("audioId")
                audio_dur = float(actor.get("audioDuration", duration))
                word_timings = actor.get("wordTimings")

                # Subtitle
                subtitle_elements.append(build_text_subtitle_element(
                    content=dialogue,
                    start_time=scene_start_time + current_time,
                    duration=audio_dur,
                    word_timings=word_timings,
                ))

                # Dialogue audio
                if audio_id:
                    dialogue_audio.append(build_audio_element(
                        media_id=f"media-tts-{audio_id}",
                        name=f"Dialogue: {dialogue[:30]}",
                        start_time=scene_start_time + current_time,
                        duration=audio_dur,
                        volume=1.0,
                    ))

            current_time += duration

        # ── Dựng tracks cho scene ──
        tracks: list[dict[str, Any]] = []

        # Video track (main)
        tracks.append({
            "id": _uid(),
            "name": "Main Track",
            "color": "default",
            "type": "video",
            "elements": video_elements,
            "isMain": True,
            "muted": False,
            "hidden": False,
            "volume": 1.0,
        })

        # Audio track: dialogue
        if dialogue_audio:
            tracks.append({
                "id": _uid(),
                "name": "Lời thoại",
                "color": "green",
                "type": "audio",
                "elements": dialogue_audio,
                "muted": False,
                "volume": 1.0,
                "pan": 0,
            })

        # Audio track: SFX
        if sfx_audio:
            tracks.append({
                "id": _uid(),
                "name": "SFX",
                "color": "orange",
                "type": "audio",
                "elements": sfx_audio,
                "muted": False,
                "volume": 1.0,
                "pan": 0,
            })

        # Audio track: BGM
        if bgm_elements:
            tracks.append({
                "id": _uid(),
                "name": "Nhạc nền",
                "color": "blue",
                "type": "audio",
                "elements": bgm_elements,
                "muted": False,
                "volume": 1.0,
                "pan": 0,
            })

        # Text track: subtitle
        if subtitle_elements:
            tracks.append({
                "id": _uid(),
                "name": "Subtitles",
                "color": "yellow",
                "type": "text",
                "elements": subtitle_elements,
                "hidden": False,
            })

        scene_duration = current_time
        total_duration += scene_duration

        opencut_scenes.append({
            "id": scene_data.get("sceneId", _uid()),
            "name": f"Scene {scene_idx + 1}",
            "isMain": scene_idx == 0,
            "tracks": tracks,
            "bookmarks": [],
            "markers": [],
            "createdAt": now_iso,
            "updatedAt": now_iso,
        })

    # ── Dựng TProject ──
    project: dict[str, Any] = {
        "metadata": {
            "id": _uid(),
            "name": episode_name,
            "thumbnail": None,
            "duration": total_duration,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        },
        "scenes": opencut_scenes,
        "currentSceneId": opencut_scenes[0]["id"] if opencut_scenes else "",
        "settings": {
            "fps": fps,
            "canvasSize": {"width": canvas_width, "height": canvas_height},
            "originalCanvasSize": None,
            "background": {"type": "color", "color": "#000000"},
            "proxyEditing": False,
            "proxyResolution": None,
        },
        "version": CURRENT_SCHEMA_VERSION,
    }

    return project


def save_opencut_project(
    project: dict[str, Any],
    output_path: str,
) -> None:
    """Ghi project ra file JSON với định dạng đẹp.

    Args:
        project: SerializedProject dict từ build_opencut_project().
        output_path: Đường dẫn file output (vd: public/scripts/opencut_{id}.json).

    Side Effects:
        Ghi file JSON ra disk. Ghi đè nếu file đã tồn tại.
    """
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(project, f, indent=2, ensure_ascii=False)
```

---

## 5. Import vào OpenCut

OpenCut-AI lưu project trong IndexedDB (không phải file JSON trực tiếp). Để import project JSON:

### Phương pháp 1: Qua IndexedDB adapter (khuyên dùng)

```typescript
// Trong browser console của OpenCut-AI (localhost:3001)
import { storageService } from "@/services/storage/service";

const project = await fetch("/api/opencut-project/xxx").then(r => r.json());

// Serialize dates từ string sang Date nếu cần
project.scenes = project.scenes.map(s => ({
  ...s,
  createdAt: new Date(s.createdAt),
  updatedAt: new Date(s.updatedAt),
}));
project.metadata.createdAt = new Date(project.metadata.createdAt);
project.metadata.updatedAt = new Date(project.metadata.updatedAt);

await storageService.saveProject({ project });
```

### Phương pháp 2: API endpoint

Tạo API endpoint trong Next.js để nhận JSON và gọi `storageService.saveProject()`:

```typescript
// src/app/api/opencut/import/route.ts
import { storageService } from "@/services/storage/service";

export async function POST(req: Request) {
  const project = await req.json();
  await storageService.saveProject({ project });
  return Response.json({ success: true, id: project.metadata.id });
}
```

### Lưu ý về Media Assets

File JSON project chỉ chứa **`mediaId`** tham chiếu đến media asset. Để project hoạt động, các media asset (video, audio, image) phải được tải vào OpenCut storage qua `storageService.saveMediaAsset()` **trước** khi load project.

Quy trình đầy đủ:
1. Upload media files → lưu vào IndexedDB qua `storageService.saveMediaAsset()`
2. Lưu JSON project với `mediaId` khớp với ID đã upload ở bước 1
3. Load project → OpenCut sẽ tự động resolve `mediaId` → file media

---

## 6. Kiểm tra tính hợp lệ

Sau khi sinh JSON, kiểm tra:

- [ ] JSON parse được (không lỗi cú pháp)
- [ ] Tất cả `Date` field là ISO 8601 string
- [ ] Tất cả `id` field là string (UUID hoặc unique string)
- [ ] `version` = 10
- [ ] Có ít nhất 1 scene với `isMain: true`
- [ ] Mỗi scene có `tracks` array (có thể rỗng)
- [ ] Mỗi track có `type` hợp lệ: `"video" | "audio" | "text" | "sticker" | "effect"`
- [ ] VideoTrack có `isMain: true`
- [ ] Tất cả thời gian (`startTime`, `duration`, `trimStart`, `trimEnd`) là `number`, không phải string
- [ ] `transitionOut.duration` ≤ `element.duration` (transition không dài hơn element)
- [ ] `wordTimings[].start` và `wordTimings[].end` là thời gian **tương đối** so với `TextElement.startTime`

---

## 7. Tài liệu tham khảo

- **OpenCut-AI type definitions:** `OpenCut-AI/apps/web/src/types/project.ts`, `timeline.ts`, `effects.ts`, `animation.ts`, `rendering.ts`
- **Serialization format:** `OpenCut-AI/apps/web/src/services/storage/types.ts` (SerializedProject)
- **Transitions registry:** `OpenCut-AI/apps/web/src/lib/transitions/definitions.ts`
- **Sample project JSON:** `docs/architecture/opencut_project_schema.json`
