import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import * as readline from 'readline';
import dotenv from 'dotenv';

// Đọc biến môi trường từ .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Định nghĩa schema trả về cho POI
const PoiSchema = z.object({
  pois: z.array(z.object({
    id: z.string().describe("Tên định danh ngắn gọn cho POI (vd: rooftop, bus_stop, street, sidewalk, door, tree, bench)"),
    x: z.number().describe("Tọa độ X tương đối (0 đến 100), 0 là lề trái, 100 là lề phải."),
    y: z.number().describe("Tọa độ Y tương đối (0 đến 100), 0 là trên cùng, 100 là dưới cùng mặt đất."),
    scale: z.number().describe("Hệ số scale gợi ý ở vị trí này để nhân vật trông hợp lý với phối cảnh (vd: ở xa thì scale nhỏ 0.3, ở gần thì scale 1.0)."),
    description: z.string().describe("Mô tả ngắn gọn về vị trí này.")
  }))
});

async function processImage(imagePath: string) {
  const fullPath = path.resolve(imagePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Không tìm thấy file: ${fullPath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(fullPath);

  console.log('\n⏳ Đang phân tích hình ảnh bằng Gemini Vision (gemini-3-flash-preview)...');

  try {
    const { object } = await generateObject({
      model: google('gemini-3-flash-preview'), // gemini-3-flash-preview
      schema: PoiSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Bạn là chuyên gia quy hoạch không gian 2D cho game/phim hoạt hình. Hãy phân tích hình ảnh nền (background) này và xác định các điểm nhấn (Point of Interest - POI) có thể tương tác được (ví dụ: mặt đất đứng được, nóc nhà, ghế đá, trạm xe buýt, lối đi...). Với mỗi điểm, cung cấp tọa độ x, y (0-100) và scale dự kiến cho nhân vật đứng tại đó.',
            },
            {
              type: 'image',
              image: imageBuffer,
            },
          ],
        },
      ],
    });

    console.log('✅ Phân tích thành công!\n');
    console.log(JSON.stringify(object, null, 2));

    const jsonPath = fullPath.replace(/\.[^/.]+$/, "") + ".json";
    
    // Nếu file json chưa tồn tại hoặc ta muốn ghi đè
    fs.writeFileSync(jsonPath, JSON.stringify(object, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu kết quả (danh sách POI) vào file: ${jsonPath}`);
    console.log(`\n👉 Bước tiếp theo: Hãy mở UI Tool (/bg-editor) để kiểm tra trên giao diện trực quan nhé.\n`);
  } catch (error) {
    console.error('❌ Lỗi khi phân tích bằng Gemini:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let imagePath = args[0];

  if (!imagePath) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Vui lòng kéo thả hoặc dán đường dẫn file ảnh nền (Background) vào đây: ', async (answer) => {
      // Xóa dấu nháy kép (nếu có khi người dùng copy path trên Windows)
      imagePath = answer.trim().replace(/^"|"$/g, '');
      rl.close();
      if (!imagePath) {
        console.error('❌ Đường dẫn không được để trống.');
        process.exit(1);
      }
      await processImage(imagePath);
    });
  } else {
    await processImage(imagePath);
  }
}

main();
