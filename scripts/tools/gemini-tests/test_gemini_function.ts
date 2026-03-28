import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Tải biến môi trường (cần file .env.local chứa GOOGLE_GENERATIVE_AI_API_KEY)
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";

// 1. Khởi tạo SDK
const genAI = new GoogleGenerativeAI(API_KEY);

// 2. ĐỊNH NGHĨA FUNCTION CALL (Đây là "Bản vẽ kỹ thuật" ép Gemini phải tuân theo)
// Thay vì sinh ra text, Gemini sẽ trả về một object JSON khớp với schema này.
const renderSceneDeclaration: any = {
  name: "render_video_scene",
  description: "Tạo cấu trúc dữ liệu JSON để điều khiển hệ thống Remotion render ra một cảnh phim hoạt hình 2D.",
  parameters: {
    type: "object",
    properties: {
      sceneName: {
        type: "string",
        description: "Tên ngắn gọn của cảnh phim (VD: canh_cai_nhau_trong_rung)",
      },
      actors: {
        type: "array",
        description: "Danh sách các nhân vật xuất hiện trong cảnh và hành động của họ",
        items: {
          type: "object",
          properties: {
            characterId: {
              type: "string",
              description: "ID của nhân vật (Ví dụ: char_001, char_002)",
            },
            actionId: {
              type: "string",
              // Đây là các ENUM khắt khe giúp bảo vệ hệ thống khỏi các hành động "ảo"
              enum: ["idle", "walk_cycle", "run_cycle", "talk_sad", "talk_angry", "look_around"],
              description: "Hành động cơ thể mà nhân vật sẽ thực hiện. Tự động chọn hành động phù hợp nhất với đoạn kịch bản.",
            },
            expressionId: {
              type: "string",
              enum: ["neutral", "happy", "sad", "angry", "surprised"],
              description: "Biểu cảm khuôn mặt của nhân vật. Lựa chọn dựa trên cảm xúc của đoạn thoại.",
            },
            facing: {
              type: "string",
              enum: ["left", "right"],
              description: "Hướng nhân vật quay mặt tới. Trái hoặc Phải.",
            },
            dialogue: {
              type: "string",
              description: "Câu thoại mà nhân vật nói (nếu không có thì để trống)",
            },
          },
          required: ["characterId", "actionId", "expressionId", "facing"],
        },
      },
    },
    required: ["sceneName", "actors"],
  },
};

async function runTest() {
  console.log("🚀 Bắt đầu test Gemini Function Calling...\n");

  if (API_KEY === "YOUR_API_KEY_HERE") {
    console.warn("⚠️ CẢNH BÁO: Bạn chưa thiết lập GEMINI_API_KEY. Vui lòng cập nhật API_KEY vào script này để chạy thực tế.\n");
  }

  // 3. Khởi tạo Model và nạp Tool (Function)
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    tools: [
      {
        functionDeclarations: [renderSceneDeclaration],
      },
    ],
  });

  // 4. Kịch bản truyện truyền vào
  const prompt = `
    Phân tích đoạn truyện sau và dựng kịch bản video:
    "Nam chính (char_001) đang rất tức giận, quay mặt sang phải chỉ thẳng mặt nữ chính (char_002).
    Anh lớn tiếng mắng: 'Tại sao cô lại lừa dối tôi?'.
    Nữ chính đứng đối diện quay sang trái, cúi gằm mặt buồn bã, thở dài không nói gì."
  `;

  console.log("📜 Kịch bản đầu vào (Prompt):\n", prompt);
  console.log("--------------------------------------------------");
  console.log("🛠️  BƯỚC 1: Đang gửi Tools (Function Declaration) lên Gemini...");
  console.log("   Hàm được định nghĩa: ", renderSceneDeclaration.name);
  console.log("--------------------------------------------------");
  console.log("⏳ Đang đợi Gemini xử lý và 'ra quyết định' gọi hàm... (Đợi chút nhé)\n");

  try {
    // Ép Gemini phải gọi function thay vì trả lời text tự do
    const chat = model.startChat();
    const result = await chat.sendMessage(prompt);
    
    console.log("📥 Đã nhận phản hồi từ Gemini API.");
    
    // Lấy danh sách các function call từ response (Gemini có thể gọi 1 hoặc nhiều hàm)
    const functionCalls = result.response.functionCalls();
    
    console.log("🔍 Kiểm tra nội dung phản hồi:");
    if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0];
      
      console.log("   ✅ PHÁT HIỆN: Gemini đã bỏ qua việc trả lời văn bản thông thường.");
      console.log("   ✅ QUYẾT ĐỊNH: Gemini chọn thực hiện 'Function Call'!");
      console.log("   ✅ TÊN HÀM ĐƯỢC GỌI: ", functionCall.name);
      console.log("--------------------------------------------------");
      console.log("\n📦 ĐÂY CHÍNH LÀ DỮ LIỆU JSON (ARGUMENTS) GEMINI TỰ SINH RA:");
      
      // Đây chính là cục JSON sẽ được lưu lại và đọc bởi Puppet.tsx
      const jsonOutput = JSON.stringify(functionCall.args, null, 2);
      console.log(jsonOutput);
      
      console.log("\n--------------------------------------------------");
      console.log("🚀 KẾT LUẬN: Bạn thấy đấy, Gemini không 'nói chuyện' với bạn.");
      console.log("Nó đang 'ra lệnh' cho hệ thống của bạn bằng cách truyền các tham số (Arguments) vào hàm.");
      console.log("Hệ thống Puppet.tsx chỉ việc lấy đống data này để vẽ nhân vật lên màn hình.");

    } else {
      console.log("   ❌ Gemini chỉ trả về văn bản thông thường, không gọi hàm:");
      console.log("   Nội dung: ", result.response.text());
    }
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
  }
}

runTest();