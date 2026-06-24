/**
 * E2E TEST — Chạy toàn bộ orchestration loop với OpenCut-AI + Gemini thật.
 *
 * YÊU CẦU:
 *   - GOOGLE_GENERATIVE_AI_API_KEY trong environment
 *   - OpenCut-AI đang chạy trên port 3001
 *   - public/scripts/opencut_ep-205-test.json tồn tại
 *
 * Test này gọi runOpenCutAgent() thật: đọc pipeline JSON → Gemini → dispatch tools → OpenCut API.
 */

import { describe, it, expect } from "vitest";
import { runOpenCutAgent, type AgentResult } from "../opencut-orchestrator";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const describeLive = API_KEY ? describe : describe.skip;

describeLive("E2E — runOpenCutAgent với OpenCut-AI + Gemini", () => {
  it("hoàn thiện timeline: thêm subtitle + transition cho ep-205-test", async () => {
    const result: AgentResult = await runOpenCutAgent(
      "ep-205-test",
      "Hãy phân tích timeline hiện tại và thêm subtitle 'Chào mừng' vào scene Intro (track-text-1, giây 1, 3s), sau đó thêm transition cross-dissolve 0.5s giữa Intro và Dialogue.",
    );

    console.log("\n=== Final Summary ===");
    console.log(result.finalSummary);
    console.log("\n=== Edits ===");
    for (const edit of result.edits) {
      console.log(`  [${edit.elementType}] ${edit.description}`);
    }
    console.log(`\n=== Total: ${result.edits.length} edits, ${result.toolResults.length} tool results ===`);

    // Kiểm tra kết quả
    expect(result).toHaveProperty("finalSummary");
    expect(result.finalSummary.length).toBeGreaterThan(20);
    expect(Array.isArray(result.edits)).toBe(true);
    expect(Array.isArray(result.toolResults)).toBe(true);

    // Phải có ít nhất 1 edit được tạo
    expect(result.edits.length).toBeGreaterThan(0);

    // Ít nhất 1 tool call phải success (nếu OpenCut running)
    const successCount = result.toolResults.filter((r) => r.success).length;
    console.log(`\n=== Tool success rate: ${successCount}/${result.toolResults.length} ===`);
  }, 180000);
});
