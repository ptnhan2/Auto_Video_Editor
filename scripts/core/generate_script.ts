import { generateVideoScript } from "../../src/lib/ai-engine/director";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load biến môi trường
dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
const storyText = args[0];

if (!storyText) {
  console.error("❌ Lỗi: Bạn chưa cung cấp nội dung truyện.");
  console.log("Hướng dẫn sử dụng: npx tsx scripts/core/generate_script.ts \"Nội dung câu chuyện của bạn ở đây\"");
  process.exit(1);
}

async function main() {
  try {
    console.log("==========================================");
    console.log("🎬 BẮT ĐẦU QUÁ TRÌNH AI ĐẠO DIỄN PHIM");
    console.log("📜 Câu chuyện đầu vào: ", storyText);
    console.log("==========================================\n");

    // 1. Gọi hàm Đạo diễn AI (Function Calling + Zod Validation)
    // Quá trình này sẽ gọi lên Gemini API, ép nó sinh ra JSON theo đúng Schema chúng ta đã thiết kế.
    const videoScriptJSON = await generateVideoScript(storyText);

    console.log("\n✅ Đã nhận được Kịch bản JSON hoàn chỉnh từ Gemini!");

    // 2. Lưu file draft.json
    const outputDir = path.join(process.cwd(), "public", "scripts");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, "draft.json");
    fs.writeFileSync(outputFile, JSON.stringify(videoScriptJSON, null, 2), "utf-8");

    console.log(`\n💾 Đã lưu file kịch bản tại: ${outputFile}`);
    console.log("\n👀 BƯỚC TIẾP THEO (PREVIEW):");
    console.log("Bạn hãy mở giao diện Remotion Studio (npm run studio) và chọn 'AIStoryCompiler' để xem phim nhé!");

  } catch (error) {
    console.error("\n❌ Lỗi trong quá trình tạo kịch bản:", error);
  }
}

main();