import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { VideoScriptSchema, VideoScriptData } from "../../types/ai-schemas";
import { CHARACTERS, ACTIONS, EXPRESSIONS, BACKGROUNDS, AUDIO_TRACKS, EFFECTS } from "../../config/asset-registry";

/**
 * Hàm này chịu trách nhiệm gửi kịch bản thô (text) lên Gemini
 * và yêu cầu Gemini đóng vai Đạo diễn (AI Director),
 * sinh ra cấu trúc dữ liệu JSON chuẩn xác 100% để nạp vào Remotion.
 */
export async function generateVideoScript(storyText: string): Promise<VideoScriptData> {
  
  // Chuẩn bị thông tin "Từ điển tài nguyên" để nhắc nhở AI trong System Prompt
  const contextPrompt = `
    Bạn là một Đạo diễn Phim Hoạt Hình 2D chuyên nghiệp.
    Nhiệm vụ của bạn là chuyển đổi kịch bản truyện sau đây thành một chuỗi các cảnh quay (Scenes) chi tiết.
    Hệ thống render (Remotion) chỉ hiểu được một cấu trúc JSON đặc biệt.

    QUAN TRỌNG NHẤT: Bạn KHÔNG ĐƯỢC PHÉP "sáng tạo" ra bất kỳ tài nguyên nào (nhân vật, hành động, biểu cảm, âm thanh, bối cảnh) không có trong danh sách dưới đây.
    
    TÀI NGUYÊN HIỆN CÓ TRONG HỆ THỐNG:
    - Nhân vật (Characters): ${CHARACTERS.map(c => `${c.id} (${c.name}: ${c.description})`).join(", ")}
    - Hành động (Actions): ${ACTIONS.map(a => `${a.id} (${a.description})`).join(", ")}
    - Biểu cảm (Expressions): ${EXPRESSIONS.map(e => `${e.id} (${e.description})`).join(", ")}
    - Bối cảnh (Backgrounds): ${BACKGROUNDS.map(b => `${b.id} (${b.description})`).join(", ")}
    - Nhạc nền (BGM): ${AUDIO_TRACKS.filter(a => a.type === "bgm").map(a => `${a.id} (${a.description})`).join(", ")}
    - Hiệu ứng âm thanh (SFX): ${AUDIO_TRACKS.filter(a => a.type === "sfx").map(a => `${a.id} (${a.description})`).join(", ")}
    - Góc máy/Kỹ xảo (Camera/VFX): ${EFFECTS.map(e => `${e.id} (${e.description})`).join(", ")}

    YÊU CẦU ĐẠO DIỄN:
    1. Bóc tách câu chuyện thành từng phân cảnh nhỏ (Scenes). Mỗi cảnh khoảng 3-10 giây.
    2. Chọn bối cảnh (backgroundId) phù hợp.
    3. Đặt các nhân vật (actors) vào cảnh.
    4. Chỉ định hành động (actionId) và biểu cảm (expressionId) phù hợp với ngữ cảnh câu thoại.
    5. Chỉ định hướng mặt (facing) để hai nhân vật nói chuyện nhìn vào nhau. Ví dụ nam bên trái (facing right), nữ bên phải (facing left).
    6. Trích xuất chính xác câu thoại (dialogue) của nhân vật.
    7. Thêm nhạc nền (bgmId) hoặc hiệu ứng âm thanh (sfxId) nếu thấy phù hợp để tăng cảm xúc.
  `;

  console.log("🎬 [AI Director] Đang phân tích kịch bản và dựng cấu trúc phim...");

  try {
    // Sử dụng Vercel AI SDK 'generateObject'
    // Hàm này tự động wrap Zod Schema thành JSON Schema và ép model trả về đúng format.
    // Nó cũng tích hợp sẵn cơ chế auto-retry (thử lại) nếu model trả về sai JSON.
    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: VideoScriptSchema,
      system: contextPrompt,
      prompt: `Kịch bản truyện cần đạo diễn:\n\n"""\n${storyText}\n"""`,
      // Mặc định Vercel AI SDK có cơ chế maxRetries để tự sửa lỗi JSON
    });

    console.log("✅ [AI Director] Dựng phim hoàn tất!");
    return object;

  } catch (error) {
    console.error("❌ [AI Director] Thất bại trong việc sinh kịch bản JSON:", error);
    throw error;
  }
}