// ✏️ EDIT ZONE START
import type React from "react";

/**
 * Định nghĩa metadata của một Remotion composition, bao gồm kích thước,
 * frame rate, duration, và hàm lazy-import component tương ứng.
 */
export interface CompositionDef {
  /** Unique identifier trùng với id trong remotion/Root.tsx */
  id: string;
  /** Label hiển thị trong CompositionSelector dropdown */
  label: string;
  /** Chiều rộng composition (pixel) */
  width: number;
  /** Chiều cao composition (pixel) */
  height: number;
  /** Frame rate (frames per second) */
  fps: number;
  /** Tổng số frame của composition */
  durationInFrames: number;
  /** Dynamic import function cho React.lazy — trả về { default: ComponentType<any> } */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any — Remotion Player requires ComponentType<any> for dynamic compositions
  component: () => Promise<{ default: React.ComponentType<any> }>;
}

/**
 * Danh sách hardcode các Remotion composition có sẵn trong dự án.
 * Dữ liệu lấy từ remotion/Root.tsx — khi thêm composition mới, append vào đây.
 *
 * Open-Closed: chỉ APPEND, không sửa/xóa entry cũ (Rule B).
 */
export const COMPOSITIONS: CompositionDef[] = [
  {
    id: "AutoVideoEditor",
    label: "Main (1920×1080)",
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    component: () =>
      import("@/../remotion/Main").then((m) => ({ default: m.Main })),
  },
  {
    id: "PuppetPreview",
    label: "Puppet Preview (1080×1920)",
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 300,
    component: () =>
      import("@/../remotion/compositions/PuppetPreview").then((m) => ({
        default: m.PuppetPreview,
      })),
  },
  {
    id: "ActionSequence",
    label: "Action Sequence (1080×1920)",
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 600,
    component: () =>
      import("@/../remotion/compositions/ActionSequence").then((m) => ({
        default: m.ActionSequence,
      })),
  },
  {
    id: "ExpressionTest",
    label: "Expression Test (500×500)",
    width: 500,
    height: 500,
    fps: 30,
    durationInFrames: 150,
    component: () =>
      import("@/components/ExpressionPlayer").then((m) => ({
        default: m.ExpressionPlayer,
      })),
  },
  {
    id: "AIStoryCompiler",
    label: "AI Story Compiler (1920×1080)",
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 600,
    component: () =>
      import("@/../remotion/compositions/DraftVideoPreview").then((m) => ({
        default: m.DraftVideoPreview,
      })),
  },
  {
    id: "WaddleEngineTest",
    label: "Waddle Engine Test (1920×1080)",
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    component: () =>
      import("@/../remotion/compositions/WaddleEngineTest").then((m) => ({
        default: m.WaddleEngineTest,
      })),
  },
];
// ✏️ EDIT ZONE END
