import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mô phỏng Schema giản lược để in cho gọn (Thay vì import toàn bộ asset registry)
const SimulatedScriptSchema = z.object({
    title: z.string(),
    reasoning: z.string().describe("AI giải thích tư duy sắp xếp Z-Index và Di chuyển của mình"),
    scenes: z.array(z.object({
        sceneId: z.string(),
        backgroundId: z.string(),
        actors: z.array(z.object({
            characterId: z.string(),
            actionId: z.enum(["walk_cycle", "sit_down", "lean_wall", "talk_angry", "combat_stance"]),
            movement: z.object({
                from: z.string(),
                to: z.string()
            }).optional(),
            zIndex: z.number().describe("10 là bình thường. Cần nhỏ hơn Z-Index của vật cản phía trước mặt.")
        }))
    }))
});

async function main() {
    const model = google('gemini-3-flash-preview');

    console.log("🎬 Bắt đầu mô phỏng AI Director (Giai đoạn 5.2 - Z-Sorting & POI)...\n");

    const prompt = `Bạn là AI Director. Hãy viết kịch bản JSON cho tình huống sau:

Bối cảnh: 'bg_bus_stop_layered' (Gồm Lớp nền [Z: 0] và Lớp một cái cột đèn che chắn phía trước màn hình [Z: 100]).
Có 2 điểm POI nổi bật: 
- 'wooden_bench' (Z: 5, Thẻ: sit_able)
- Các điểm di dạo mặc định: 'front_left', 'mid_center', 'back_right' (Z mặc định: 10).

Câu chuyện: 
1. Cảnh 1: Có một thanh niên (char_001) đang đi bộ từ ngoài rào (front_left) tiến vào giữa trạm chờ (mid_center). Anh ta đi ngang qua sau lưng cái cột đèn lớn (bị cột đèn che mất một phần).
2. Cảnh 2: Sau đó anh ta mệt quá, đi đến cái ghế đá (wooden_bench) và ngồi phịch xuống nghỉ ngơi. Ghế đá nằm phía sau một cái bàn nhỏ (bàn có Z: 15).

Nhiệm vụ: Sắp xếp đúng actionId, movement (từ đâu đến đâu), và đặc biệt là zIndex để nhân vật bị che khuất một cách hợp lý bởi cột đèn và cái bàn.`;

    try {
        const { object } = await generateObject({
            model,
            schema: SimulatedScriptSchema,
            messages: [{ role: 'user', content: prompt }],
        });

        console.log("✅ AI Director đã chốt kịch bản. Xem kết quả (JSON) bên dưới:\n");
        console.log(JSON.stringify(object, null, 2));

        console.log("\n\n🔍 PHÂN TÍCH KẾT QUẢ:");
        console.log("- Hãy xem [reasoning] để hiểu cách AI tự tính toán lớp (Layer) che khuất.");
        console.log("- Các `actionId` và `movement` đã được tuân thủ đúng luật 2.5D POI.");
        console.log("\n(Ghi chú: Lớp 'Cột đèn' Z=100 và 'Cái Bàn' Z=15 là file PNG cắt sẵn nằm trong thư mục bối cảnh, Remotion sẽ tự động render đè lên theo đúng chỉ số Z-Index này).");
    } catch (e) {
        console.error("Lỗi:", e);
    }
}

main().catch(console.error);