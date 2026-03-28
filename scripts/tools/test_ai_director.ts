import { generateVideoScript } from '../../src/lib/ai-engine/director';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  const inputFile = process.argv[2];
  let story = '';

  if (inputFile && fs.existsSync(inputFile)) {
    console.log(`Đang đọc kịch bản từ file: ${inputFile}`);
    story = fs.readFileSync(inputFile, 'utf-8');
  } else {
    console.log(`Không tìm thấy file input, sử dụng kịch bản mẫu.`);
    story = `
Một anh chàng đang đi bộ thong dong trên đường thì tự nhiên vấp phải cục đá ngã sõng soài. 
Anh ta đứng dậy, phủi quần áo và cười trừ "Ôi xui quá", trong khi tiếng chim hót vẫn vang lên ríu rít.
Cảnh quay tiếp theo camera zoom vào mặt anh ta đang nhăn nhó vì đau.
    `;
  }

  console.log("=== TRÍCH ĐOẠN STORY ===");
  console.log(story.substring(0, 200) + '...\n');
  
  try {
    const result = await generateVideoScript(story);
    console.log("\n\n=== KẾT QUẢ TỪ AI DIRECTOR ===\n");
    console.log(JSON.stringify(result, null, 2));
    
    // Save to a draft file
    const outputFileName = 'public/scripts/draft_ai.json';
    fs.writeFileSync(outputFileName, JSON.stringify(result, null, 2));
    console.log(`\n✅ Đã lưu kết quả vào ${outputFileName}`);
    
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

main();