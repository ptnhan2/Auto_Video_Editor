import { z } from "zod";
import {
  CHARACTERS,
  ACTIONS,
  EXPRESSIONS,
  BACKGROUNDS,
  AUDIO_TRACKS,
  EFFECTS,
  PROPS
} from "../config/asset-registry";

// Helper để trích xuất mảng ID từ các mảng Object trong registry
const getIds = (arr: readonly { id: string }[]) => arr.map(item => item.id) as [string, ...string[]];

// 1. Định nghĩa Zod Enums dựa trên Asset Registry thực tế
export const CharacterIdEnum = z.enum(getIds(CHARACTERS));
export const ActionIdEnum = z.enum(getIds(ACTIONS));
export const ExpressionIdEnum = z.enum(getIds(EXPRESSIONS));
export const BackgroundIdEnum = z.enum(getIds(BACKGROUNDS));

// Phân loại Audio và Effects nếu cần (tùy chọn)
const bgmIds = AUDIO_TRACKS.filter(a => a.type === "bgm").map(a => a.id) as [string, ...string[]];
const sfxIds = AUDIO_TRACKS.filter(a => a.type === "sfx").map(a => a.id) as [string, ...string[]];
export const BgmIdEnum = bgmIds.length > 0 ? z.enum(bgmIds) : z.string();
export const SfxIdEnum = sfxIds.length > 0 ? z.enum(sfxIds) : z.string();

const cameraIds = EFFECTS.filter(e => e.type === "camera").map(e => e.id) as [string, ...string[]];
const vfxIds = EFFECTS.filter(e => e.type === "vfx").map(e => e.id) as [string, ...string[]];
export const CameraIdEnum = cameraIds.length > 0 ? z.enum(cameraIds) : z.string();
export const VfxIdEnum = vfxIds.length > 0 ? z.enum(vfxIds) : z.string();

export const PropIdEnum = z.enum(getIds(PROPS));

export const PositionEnum = z.enum([
  'back_left', 'back_center', 'back_right',
  'mid_left', 'mid_center', 'mid_right',
  'front_left', 'front_center', 'front_right'
]);

// 2. Định nghĩa Schema cấu trúc cho một Actor (Nhân vật) trong khung hình
export const ActorSchema = z.object({
  characterId: CharacterIdEnum.describe("ID của nhân vật xuất hiện trong cảnh."),
  actionId: ActionIdEnum.describe("Hành động cơ thể của nhân vật."),
  expressionId: ExpressionIdEnum.describe("Biểu cảm khuôn mặt của nhân vật."),
  expressionTag: z.string().optional().describe("Tag cảm xúc (ví dụ: talking_angry) do AI sinh ra."),
  facing: z.enum(["left", "right"]).default("left").describe("Hướng nhân vật quay mặt tới."),
  position: PositionEnum.optional().describe("Vị trí đứng của nhân vật trên khung hình 9-grid (vd: mid_center)."),
  moveToPosition: PositionEnum.optional().describe("Vị trí nhân vật sẽ di chuyển tới trong quá trình diễn ra cảnh."),
  dialogue: z.string().optional().describe("Câu thoại mà nhân vật nói. Bỏ trống nếu không nói gì."),
  isSpeaking: z.boolean().optional().describe("Cờ đánh dấu nhân vật đang nói trong cảnh."),
  audioId: z.string().optional().describe("ID file âm thanh đã được render (vd: ch1_s1_line_01)."),
  audioDuration: z.number().optional().describe("Thời lượng audio tính bằng giây."),
  propId: PropIdEnum.optional().describe("Đạo cụ nhân vật cầm trên tay (nếu có)."),
  movement: z.object({
    from: z.string().describe("Điểm bắt đầu di chuyển (ID của POI, hoặc các điểm Grid như: front_left, mid_center, back_right)."),
    to: z.string().describe("Điểm kết thúc di chuyển (ID của POI, hoặc các điểm Grid).")
  }).optional().describe("Thông tin di chuyển (nếu nhân vật đang di chuyển từ điểm này sang điểm khác). Bỏ trống nếu đứng yên."),
  isEnteringFrom: z.enum(['left', 'right']).optional().describe("Nhân vật đi bộ vào từ ngoài màn hình (TH1: cùng background). Cần action: walk."),
  isExitingTo: z.enum(['left', 'right']).optional().describe("Nhân vật đi bộ ra khỏi màn hình (TH1: cùng background). Cần action: walk."),
  zIndex: z.number().default(10).describe("Lớp hiển thị (Z-Index). Số càng lớn càng nằm đè lên trên (Gần camera hơn). Các lớp Foreground của bối cảnh thường có Z-Index rất lớn (vd: 100) để che khuất nhân vật."),
  sfx: z.array(z.object({
    assetId: z.string().describe("Tên file hiệu ứng âm thanh (vd: footstep.mp3)"),
    startFrame: z.number().describe("Frame bắt đầu phát âm thanh tương đối so với lúc action bắt đầu")
  })).optional().describe("Danh sách hiệu ứng âm thanh gắn với hành động của nhân vật"),
  wordTimings: z.array(z.object({
    text: z.string(),
    start: z.number(),
    end: z.number()
  })).optional().describe("Dữ liệu timing chính xác cho từng từ (Word-level timestamps)")
});

// 3. Định nghĩa Schema cấu trúc cho một Cảnh quay (Scene)
export const SceneSchema = z.object({
  sceneId: z.string().describe("Tên ngắn gọn cho cảnh quay, dùng để nhận diện (vd: sc01_trong_rung)"),
  backgroundId: BackgroundIdEnum.describe("Bối cảnh nền của cảnh quay."),
  durationSeconds: z.number().min(1).optional().describe("Thời lượng dự kiến của cảnh quay (tính bằng giây). Có thể để trống để tự động tính dựa trên thoại."),
  actors: z.array(ActorSchema).min(1).describe("Danh sách các nhân vật xuất hiện trong cảnh."),
  bgmId: BgmIdEnum.optional().describe("Nhạc nền (Background Music) cho cảnh này."),
  sfxId: SfxIdEnum.optional().describe("Hiệu ứng âm thanh chung của cảnh."),
  camera: z.object({
    type: z.enum(["static", "pan_left", "pan_right", "zoom_in", "zoom_out"]).describe("Loại hiệu ứng camera"),
    targetX: z.number().optional().describe("Tọa độ X (%) mục tiêu (vd: 20 là front_left, 50 là giữa)"),
    intensity: z.number().optional().describe("Độ zoom (vd: 1.2 là zoom in 120%)")
  }).optional().describe("Chuyển động của camera (Zoom/Pan) trong cảnh"),
  vfxId: VfxIdEnum.optional().describe("Kỹ xảo hình ảnh (VFX) xuất hiện trên màn hình."),
  requestedAssets: z.array(z.object({
    type: z.enum(["background", "prop", "action", "sfx"]).describe("Loại tài nguyên còn thiếu"),
    missingConcept: z.string().describe("Mô tả chi tiết thứ mà kịch bản yêu cầu (vd: Quán bar Cyberpunk, Thanh kiếm Lazer, hành động nhào lộn)"),
    reason: z.string().optional().describe("Lý do tại sao cần thiết")
  })).optional().describe("Danh sách các Asset KHÔNG có sẵn trong thư viện nhưng kịch bản lại rất cần. AI điền vào đây để hệ thống báo lại cho họa sĩ vẽ thêm (Fallback mechanism).")
});

// 4. Định nghĩa Schema cấu trúc Kịch bản Tổng thể (Video Script)
export const VideoScriptSchema = z.object({
  title: z.string().describe("Tiêu đề của đoạn video."),
  description: z.string().describe("Tóm tắt nội dung câu chuyện."),
  scenes: z.array(SceneSchema).min(1).describe("Chuỗi các cảnh quay (Scenes) nối tiếp nhau tạo thành một bộ phim hoàn chỉnh.")
});

// Xuất các kiểu TypeScript (Types) tương ứng từ Zod Schema để dùng trong code React
export type ActorData = z.infer<typeof ActorSchema>;
export type SceneData = z.infer<typeof SceneSchema>;
export type VideoScriptData = z.infer<typeof VideoScriptSchema>;
