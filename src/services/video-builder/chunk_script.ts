import fs from 'fs';
import path from 'path';
import { VideoScriptData } from '../../shared/types/ai-schemas';

const MAX_SCENES_PER_CHUNK = 2; // Số lượng scene tối đa mỗi chunk để test nhanh

function chunkScript(inputFile: string, outputDir: string) {
  try {
    console.log(`Đang đọc file: ${inputFile}`);
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const script: VideoScriptData = JSON.parse(rawData);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Đã tạo thư mục output: ${outputDir}`);
    } else {
      // Dọn dẹp chunk cũ
      const oldFiles = fs.readdirSync(outputDir);
      for (const file of oldFiles) {
        if (file.startsWith('chunk_') && file.endsWith('.json')) {
          fs.unlinkSync(path.join(outputDir, file));
        }
      }
      console.log(`Đã dọn dẹp thư mục output: ${outputDir}`);
    }

    const scenes = script.scenes;
    let chunkIndex = 1;
    
    for (let i = 0; i < scenes.length; i += MAX_SCENES_PER_CHUNK) {
      const chunkScenes = scenes.slice(i, i + MAX_SCENES_PER_CHUNK);
      
      const chunkData: VideoScriptData = {
        title: `${script.title} (Part ${chunkIndex})`,
        description: script.description,
        scenes: chunkScenes
      };
      
      const chunkFileName = `chunk_${String(chunkIndex).padStart(3, '0')}.json`;
      const outputPath = path.join(outputDir, chunkFileName);
      
      fs.writeFileSync(outputPath, JSON.stringify(chunkData, null, 2));
      console.log(`✅ Đã tạo chunk: ${chunkFileName} (${chunkScenes.length} scenes)`);
      chunkIndex++;
    }
    
    console.log(`\n🎉 Hoàn tất chia nhỏ script thành ${chunkIndex - 1} chunks!`);
    
  } catch (error) {
    console.error("❌ Lỗi khi chunk script:", error);
    process.exit(1);
  }
}

// Chạy trực tiếp từ CLI: npx tsx scripts/tools/chunk_script.ts <inputFile> [outputDir]
const inputFile = process.argv[2] || 'public/scripts/draft_ai.json';
const outputDir = process.argv[3] || 'public/scripts/chunks';
chunkScript(inputFile, outputDir);
