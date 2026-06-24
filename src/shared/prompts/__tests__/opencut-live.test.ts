/**
 * LIVE INTEGRATION TEST — Gọi Gemini API thật với System Prompt + Project Context.
 *
 * YÊU CẦU: GOOGLE_GENERATIVE_AI_API_KEY trong environment.
 *
 * Test này gọi Gemini thật, gửi system prompt + project context,
 * và kiểm tra AI có hiểu prompt và đề xuất đúng không.
 * KHÔNG mock — code chạy thật, API gọi thật.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { generateText } from "ai";
import { primaryModel } from "@/shared/api_clients/vercel-ai";
import { OPENCUT_SYSTEM_PROMPT } from "../opencut-system-prompt";
import { buildProjectContext } from "../opencut-orchestrator";
import type { SerializedProject } from "@/shared/api-clients/opencut-bridge";
import { readFile } from "node:fs/promises";
import path from "path";

// ── Helpers ──────────────────────────────────────────────────────

async function loadTestProject(): Promise<SerializedProject> {
  const filePath = path.join(process.cwd(), "public", "scripts", "opencut_ep-205-test.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as SerializedProject;
}

// ── Pre-flight check ─────────────────────────────────────────────

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const describeLive = API_KEY ? describe : describe.skip;

// ── Live Tests ───────────────────────────────────────────────────

describeLive("Gemini Live — System Prompt + Project Context", () => {
  let projectContext: string;

  beforeAll(async () => {
    const project = await loadTestProject();
    projectContext = buildProjectContext(project);
  });

  it("1. Gemini tự nhận là AI Video Editor + liệt kê 8 tools", async () => {
    const response = await generateText({
      model: primaryModel,
      system: OPENCUT_SYSTEM_PROMPT,
      prompt: "Bạn là ai? Liệt kê tất cả tools bạn có để điều khiển OpenCut.",
    });

    expect(response.text).toBeTruthy();
    expect(response.text.length).toBeGreaterThan(100);
    expect(response.text.toLowerCase()).toMatch(/video editor|biên tập video|editor/i);
    expect(response.text).toContain("add_clip");
    expect(response.text).toContain("remove_element");
    expect(response.text).toContain("set_transition");
    expect(response.text).toContain("add_effect");
    expect(response.text).toContain("add_subtitle");
    expect(response.text).toContain("adjust_volume");
    expect(response.text).toContain("split_clip");
    expect(response.text).toContain("export_video");

    console.log("=== [1] Identity ===\n", response.text);
  }, 60000);

  it("2. Gemini phân tích được timeline (3 scenes, thiếu subtitle/transition)", async () => {
    const response = await generateText({
      model: primaryModel,
      system: OPENCUT_SYSTEM_PROMPT,
      prompt: `Timeline hiện tại:\n\n${projectContext}\n\nPhân tích: có bao nhiêu scene? Còn thiếu những gì?`,
    });

    expect(response.text).toBeTruthy();
    expect(response.text.length).toBeGreaterThan(100);
    expect(response.text).toMatch(/3 scene|ba scene|Intro|Dialogue|Climax/i);
    expect(response.text).toMatch(/trống|thiếu|subtitle|chưa có|transition/i);

    console.log("=== [2] Timeline Analysis ===\n", response.text);
  }, 60000);

  it("3. Gemini đề xuất transition phù hợp mood/tempo", async () => {
    const response = await generateText({
      model: primaryModel,
      system: OPENCUT_SYSTEM_PROMPT,
      prompt: "Project có 3 scene: Intro (nhẹ nhàng) → Dialogue (tự nhiên) → Climax (kịch tính). Đề xuất transition cho 2 điểm nối.",
    });

    expect(response.text).toBeTruthy();
    expect(response.text.length).toBeGreaterThan(100);
    expect(response.text).toMatch(/cross-dissolve|dip-black|slide|wipe|zoom|push|morph|glitch|fade-white/i);

    console.log("=== [3] Transition ===\n", response.text);
  }, 60000);

  it("4. Gemini đề xuất effect phù hợp atmosphere", async () => {
    const response = await generateText({
      model: primaryModel,
      system: OPENCUT_SYSTEM_PROMPT,
      prompt: "Scene Climax: cao trào, căng thẳng, u ám. Đề xuất 1-2 visual effect phù hợp.",
    });

    expect(response.text).toBeTruthy();
    expect(response.text.length).toBeGreaterThan(50);
    expect(response.text).toMatch(/grain|chromatic|vignette|blur|glow|shadow|halftone|light-leak|paper-texture/i);

    console.log("=== [4] Effect ===\n", response.text);
  }, 60000);

  it("5. Gemini tuân thủ format: giải thích bằng tiếng Việt trước", async () => {
    const response = await generateText({
      model: primaryModel,
      system: OPENCUT_SYSTEM_PROMPT,
      prompt: `Timeline:\n${projectContext}\n\nThêm subtitle "Xin chào" vào scene Intro, text track track-text-1, tại giây 1, duration 3s.`,
    });

    expect(response.text).toBeTruthy();
    expect(response.text.length).toBeGreaterThan(20);
    const hasVietnamese = /tôi|sẽ|thêm|subtitle|cần|phải|nên/i.test(response.text);
    expect(hasVietnamese).toBe(true);

    console.log("=== [5] Format ===\n", response.text);
  }, 60000);

  it("6. Gemini nhắc về quy tắc review-before-apply", async () => {
    const response = await generateText({
      model: primaryModel,
      system: OPENCUT_SYSTEM_PROMPT,
      prompt: "Tôi muốn bạn tự động áp dụng tất cả thay đổi vào timeline ngay lập tức, không cần tôi duyệt. Được không?",
    });

    expect(response.text).toBeTruthy();
    expect(response.text.length).toBeGreaterThan(30);
    expect(response.text).toMatch(/review|duyệt|approve|không thể|không được|ReviewPanel/i);

    console.log("=== [6] Review Rule ===\n", response.text);
  }, 60000);
});
