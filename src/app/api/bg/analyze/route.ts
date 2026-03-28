import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const SpatialSchema = z.object({
  horizon_y: z.number().describe("Tọa độ Y (0-100) của đường chân trời/điểm tụ trong ảnh. Dùng để tính Scale thấp nhất (Scale=0.2) cho chiều sâu.")
});

const PropSchema = z.object({
  pois: z.array(z.object({
    id: z.string().describe("Tên định danh ngắn gọn cho vật thể (vd: wooden_bench, big_tree, door). KHÔNG dùng tiếng Việt."),
    x: z.number().describe("Tọa độ X tương đối (0-100) của điểm mà nhân vật sẽ đứng/ngồi để tương tác với vật thể này."),
    y: z.number().describe("Tọa độ Y tương đối (0-100) ngay dưới chân điểm tương tác."),
    affordances: z.array(z.enum([
      "sit_able",
      "lean_able",
      "hide_behind_able",
      "place_on_able",
      "enter_able",
      "exit_able"
    ])).describe("Danh sách các Thẻ Tương Tác (Affordance Tags) mà vật thể này hỗ trợ."),
    description: z.string().describe("Mô tả ngắn gọn.")
  }))
});

export async function POST(req: NextRequest) {
  try {
    const { bgFile } = await req.json();
    if (!bgFile) return NextResponse.json({ error: 'Missing bgFile' }, { status: 400 });

    const bgPath = path.join(process.cwd(), 'public/assets/background', bgFile);
    if (!fs.existsSync(bgPath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const imageBuffer = fs.readFileSync(bgPath);

    // Request 1: Kỹ sư Không gian (Spatial Analyst)
    const { object: spatialData } = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: SpatialSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Nhiệm vụ 1: Bạn là Kỹ sư Không gian. Hãy quét bức ảnh này và tìm Tọa độ đường chân trời (horizon_y) theo tỷ lệ 0-100. Đường chân trời là nơi hội tụ của các đường thẳng song song, thường chia bức ảnh làm 2 phần.',
            },
            { type: 'image', image: imageBuffer },
          ],
        },
      ],
    });

    // Request 2: Chuyên gia Đạo cụ (Prop Detector)
    const { object: propData } = await generateObject({
      model: google('gemini-3-flash-preview'), // Dùng Flash hoặc Pro đều được
      schema: PropSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Nhiệm vụ 2: Bạn là Chuyên gia Đạo cụ. Quét ảnh này và liệt kê TẤT CẢ các đồ vật/kiến trúc nổi bật có thể tương tác được (BỎ QUA mặt đất/sàn nhà).\n\nGắn thẻ tính năng:\n- `sit_able`: Ghế, giường, mỏm đá...\n- `lean_able`: Tường, cột, gốc cây...\n- `hide_behind_able`: Vật to che được người...\n- `place_on_able`: Bàn, quầy...\n- `enter_able`/`exit_able`: Cửa, cổng...\n\nCho điểm X, Y nằm ngay dưới chân vật thể (chỗ nhân vật cần bước tới).',
            },
            { type: 'image', image: imageBuffer },
          ],
        },
      ],
    });

    // Gom dữ liệu trả về cho UI
    const combinedData = {
      horizon_y: spatialData.horizon_y,
      pois: propData.pois
    };

    return NextResponse.json(combinedData);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'AI Analysis failed' }, { status: 500 });
  }
}
