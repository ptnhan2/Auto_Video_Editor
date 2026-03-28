import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import dotenv from "dotenv";
import path from "path";

// Load biến môi trường
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
    console.error("Thiếu GOOGLE_GENERATIVE_AI_API_KEY trong .env.local");
    process.exit(1);
}

const fileManager = new GoogleAIFileManager(apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    const videoPath = path.join(process.cwd(), 'tests', 'yt-analysis', 'video.mp4');
    
    console.log(`[1] Đang tải video lên Google AI File API: ${videoPath}`);
    const uploadResponse = await fileManager.uploadFile(videoPath, {
        mimeType: "video/mp4",
        displayName: "YouTube Review Video",
    });

    const name = uploadResponse.file.name;
    console.log(`[2] Tải lên thành công! File URI: ${uploadResponse.file.uri}`);

    console.log(`[3] Đang chờ Google xử lý video...`);
    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
        process.stdout.write(".");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        file = await fileManager.getFile(name);
    }

    if (file.state === FileState.FAILED) {
        console.error("\nLỗi: Google không thể xử lý video này.");
        process.exit(1);
    }
    console.log("\n[4] Xử lý video xong! Bắt đầu thẩm vấn Gemini 1.5 Pro...");

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `Bạn là một Chuyên gia Phân tích Kỹ xảo Hoạt hình 2D (2D Cut-out Animation Technical Analyst).
Hãy xem kỹ video này (đặc biệt chú ý đến cách nhân vật di chuyển và tương tác với môi trường) và trả lời chi tiết các câu hỏi sau, cung cấp **mốc thời gian (timestamp)** cụ thể để minh chứng:

1. **Phối cảnh & Tỷ lệ (Perspective & Scaling):** Khi nhân vật đi bộ trên đường, kích thước (Scale) của họ có thay đổi (to lên/nhỏ đi) theo chiều sâu (trục Z) hay không? Hay họ chỉ trượt ngang (trục X) và kích thước hầu như giữ nguyên?
2. **Xử lý Cảnh Phức tạp (Complex Layering):** 
   - Khi nhân vật chui vào ô tô, nằm lên giường, hay đứng sau một bức tường, video này xử lý sự che khuất (Occlusion/Masking) như thế nào? 
   - Có phải họ dùng Background gồm nhiều lớp (Foreground Layer đè lên Nhân vật, và Background Layer ở dưới Nhân vật) không? Chỉ ra 1-2 cảnh rõ nhất.
3. **Đường dẫn Đặc thù (Custom Paths):** Trong các cảnh lên/xuống cầu thang hoặc đi chéo, quỹ đạo của nhân vật là đường thẳng chéo cố định, hay có nhấp nhô theo từng bậc?
4. **Kết luận Kiến trúc:** Dựa vào những quan sát trên, hãy tóm tắt quy trình (Pipeline) lý tưởng nhất để tạo ra bộ máy render tự động bắt chước được phong cách của video này. (Ví dụ: Có cần NavMesh 3D phức tạp không, hay chỉ cần Sàn phẳng + Multi-layer Backgrounds là đủ?)`;

    const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri
            }
        },
        { text: prompt },
    ]);

    console.log("\n================ KẾT QUẢ TỪ GEMINI ================\n");
    console.log(result.response.text());
    console.log("\n====================================================\n");

    // Dọn dẹp
    console.log(`[5] Xóa file tạm trên Google Server...`);
    await fileManager.deleteFile(name);
    console.log(`Hoàn tất!`);
}

main().catch(console.error);
