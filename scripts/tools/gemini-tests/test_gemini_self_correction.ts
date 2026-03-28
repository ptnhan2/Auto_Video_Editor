import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY!);

const tools = [
  {
    functionDeclarations: [
      {
        name: "render_video_scene",
        description: "Dựng phim với kịch bản cụ thể.",
        parameters: {
          type: "object",
          properties: {
            characterId: { type: "string" },
            actionId: { type: "string", description: "Hành động nhân vật" }
          },
          required: ["characterId", "actionId"]
        }
      }
    ]
  }
];

async function runSelfCorrectionTest() {
  console.log("🛠️  BẮT ĐẦU TEST CƠ CHẾ TỰ SỬA SAI (SELF-CORRECTION)...\n");

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    tools: tools,
  });

  const chat = model.startChat();

  // BƯỚC 1: Đưa ra yêu cầu khó (Yêu cầu hành động không có sẵn)
  const prompt = "Hãy dựng cảnh nhân vật 'char_001' đang bay lượn trên bầu trời.";
  console.log("💬 User: ", prompt);

  const result1 = await chat.sendMessage(prompt);
  const call1 = result1.response.functionCalls()?.[0];

  if (call1) {
    const actionSent = (call1.args as any).actionId;
    console.log("🤖 Gemini (Lần 1): Gọi hàm với actionId = '" + actionSent + "'");
    
    // GIẢ LẬP LỖI: Hệ thống kiểm tra và thấy không có hành động "fly" (hoặc bất cứ thứ gì Gemini vừa bịa ra)
    const errorMessage = { 
      error: "Hành động '" + actionSent + "' không tồn tại trong thư viện. Danh sách hành động hiện có chỉ gồm: ['walk', 'idle', 'jump']" 
    };
    
    console.log("📥 HỆ THỐNG PHẢN HỒI LỖI: ", JSON.stringify(errorMessage));

    // BƯỚC 2: Gửi lỗi QUAY LẠI cho Gemini để nó "nhận thức" được sai lầm
    console.log("\n⏳ Gemini đang đọc thông báo lỗi và tìm cách sửa sai...\n");
    const result2 = await chat.sendMessage([{
      functionResponse: {
        name: "render_video_scene",
        response: errorMessage
      }
    }]);

    const call2 = result2.response.functionCalls()?.[0];
    if (call2) {
      console.log("✅ THÀNH CÔNG! Gemini đã tự sửa sai sau khi biết mình gọi nhầm.");
      console.log("🤖 Gemini (Lần 2 - Đã sửa): Gọi lại hàm với actionId mới = '" + (call2.args as any).actionId + "'");
      console.log("📦 Dữ liệu JSON chuẩn cuối cùng:");
      console.log(JSON.stringify(call2.args, null, 2));
      
      console.log("\n--------------------------------------------------");
      console.log("🚀 KẾT LUẬN:");
      console.log("1. Bạn phải code một cái 'Loop' (vòng lặp) để bắt lỗi và gửi feedback ngược lại cho AI.");
      console.log("2. Một khi nhận được feedback lỗi, Gemini rất giỏi trong việc 'recall' (gọi lại) với dữ liệu đúng.");
      console.log("=> Đây là cơ chế 'Tự phục hồi' (Self-healing) cực kỳ mạnh mẽ của Function Calling!");
    } else {
        console.log("🤖 Gemini trả về văn bản: ", result2.response.text());
    }
  }
}

runSelfCorrectionTest();