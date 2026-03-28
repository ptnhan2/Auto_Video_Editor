import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY!);

// 1. Định nghĩa các hàm (Tools)
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_available_animations",
        description: "Lấy danh sách các hành động (animations) hiện có trong thư viện của hệ thống.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "Lọc theo nhóm (vd: locomotion, combat)" }
          }
        }
      },
      {
        name: "render_video_scene",
        description: "Dựng phim với kịch bản cụ thể.",
        parameters: {
          type: "object",
          properties: {
            characterId: { type: "string" },
            actionId: { type: "string", description: "Phải lấy từ danh sách trả về của hàm get_available_animations" },
            dialogue: { type: "string" }
          },
          required: ["characterId", "actionId"]
        }
      }
    ]
  }
];

// 2. Mock Database (Giả lập thư viện animation trên ổ cứng của bạn)
const ANIMATION_LIBRARY = [
  { id: "walk_slow", category: "locomotion" },
  { id: "moonwalk", category: "locomotion" },
  { id: "sword_slash", category: "combat" },
  { id: "fireball_cast", category: "combat" }
];

async function runMultiTurnTest() {
  console.log("🎬 BẮT ĐẦU TEST TƯƠNG TÁC 2 CHIỀU (MULTI-TURN)...\n");

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    tools: tools,
  });

  const chat = model.startChat();

  // LẦN 1: Gửi yêu cầu "mơ hồ"
  const prompt1 = "Tôi muốn nhân vật di chuyển theo kiểu đi bộ chậm rãi.";
  console.log("💬 User: ", prompt1);
  console.log("⏳ Gemini đang suy nghĩ...\n");

  const result1 = await chat.sendMessage(prompt1);
  console.log("==================================================");
  console.log("🔍 RAW RESPONSE TỪ GEMINI (LẦN 1):");
  console.log(JSON.stringify(result1.response, null, 2));
  console.log("==================================================\n");

  const call1 = result1.response.functionCalls()?.[0];

  if (call1 && call1.name === "get_available_animations") {
    console.log("🤖 Gemini: Tôi cần kiểm tra thư viện xem có chiêu tấn công nào không...");
    console.log("🛠️  HÀNH ĐỘNG: Gemini gọi hàm 'get_available_animations' với tham số:", call1.args);

    // FIX: Dùng đúng category mà Gemini yêu cầu thay vì hard-code
    const requestedCategory = (call1.args as any).category;
    const toolResponse = ANIMATION_LIBRARY.filter(a => a.category === requestedCategory);
    console.log("📥 HỆ THỐNG TRẢ LỜI GEMINI: ", JSON.stringify(toolResponse));

    // LẦN 2: Gửi kết quả của hàm QUAY LẠI cho Gemini để nó học
    console.log("\n⏳ Gemini đang phân tích kết quả và ra quyết định cuối cùng...\n");
    const result2 = await chat.sendMessage([{
      functionResponse: {
        name: "get_available_animations",
        response: { animations: toolResponse }
      }
    }]);

    console.log("==================================================");
    console.log("🔍 RAW RESPONSE TỪ GEMINI (LẦN 2):");
    console.log(JSON.stringify(result2.response, null, 2));
    console.log("==================================================\n");

    console.log(" Đã nhận phản hồi lần 2 từ Gemini.");
    const call2 = result2.response.functionCalls()?.[0];
    if (call2) {
      console.log("🤖 Gemini quyết định gọi hàm: ", call2.name);
      if (call2.name === "render_video_scene") {
        console.log("🤖 Gemini: Đã tìm thấy! Tôi sẽ dùng chiêu '" + (call2.args as any).actionId + "'");
        console.log("✅ KẾT QUẢ CUỐI CÙNG (JSON DỰNG PHIM):");
        console.log(JSON.stringify(call2.args, null, 2));
      }
    } else {
      console.log("🤖 Gemini trả về văn bản: ", result2.response.text());
    }
  }
}

runMultiTurnTest();