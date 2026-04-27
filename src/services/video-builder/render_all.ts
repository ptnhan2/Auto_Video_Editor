import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const inputFile = process.argv[2] || 'public/scripts/draft_ai.json';
  const chunksDir = 'public/scripts/chunks';
  const outChunksDir = 'out/chunks';
  const finalOutput = 'out/final_movie.mp4';

  console.log(`\n========================================`);
  console.log(`🎬 GIAI ĐOẠN 5.4: AUTO CHUNKING & STITCHING`);
  console.log(`========================================\n`);

  // 0. Extract Missing Assets
  console.log(`🔍 [BƯỚC 0] Quét yêu cầu bổ sung Asset từ AI...`);
  execSync(`npx tsx scripts/tools/extract_missing_assets.ts "${inputFile}"`, { stdio: 'inherit' });

  // 1. Chunking
  console.log(`\n📦 [BƯỚC 1] Chia nhỏ kịch bản (Chunking)...`);
  execSync(`npx tsx scripts/tools/chunk_script.ts "${inputFile}" "${chunksDir}"`, { stdio: 'inherit' });

  // 2. Rendering
  console.log(`\n🎥 [BƯỚC 2] Bắt đầu render từng chunk...`);
  if (!fs.existsSync(outChunksDir)) {
    fs.mkdirSync(outChunksDir, { recursive: true });
  } else {
    // Dọn dẹp MP4 cũ
    const oldFiles = fs.readdirSync(outChunksDir);
    for (const file of oldFiles) {
      if (file.endsWith('.mp4') || file.endsWith('.txt')) {
        fs.unlinkSync(path.join(outChunksDir, file));
      }
    }
  }

  const chunkFiles = fs.readdirSync(chunksDir).filter(f => f.startsWith('chunk_') && f.endsWith('.json')).sort();
  
  if (chunkFiles.length === 0) {
    console.error("❌ Không tìm thấy file chunk nào để render!");
    process.exit(1);
  }

  for (const chunk of chunkFiles) {
    const chunkName = path.parse(chunk).name; // chunk_001
    const outMp4 = path.join(outChunksDir, `${chunkName}.mp4`);
    
    console.log(`\n🔄 Đang render: ${chunk} -> ${outMp4}...`);
    // Ghi props phụ ra file tạm để tránh lỗi quote trên Windows
    const propsPath = path.join(chunksDir, `${chunkName}_props.json`);
    fs.writeFileSync(propsPath, JSON.stringify({ scriptFile: `chunks/${chunk}` }));
    
    const renderCommand = `npx remotion render remotion/index.ts AIStoryCompiler "${outMp4}" --props="${propsPath}"`;
    try {
      execSync(renderCommand, { stdio: 'inherit' });
    } catch (err) {
      console.error(`❌ Lỗi khi render ${chunk}:`, err);
      process.exit(1);
    }
  }

  // 3. Stitching
  console.log(`\n🎞️ [BƯỚC 3] Nối các chunks thành phim hoàn chỉnh (Stitching)...`);
  execSync(`npx tsx scripts/tools/stitch_video.ts "${outChunksDir}" "${finalOutput}"`, { stdio: 'inherit' });

  console.log(`\n✅ HOÀN TẤT TOÀN BỘ QUY TRÌNH SẢN XUẤT!`);
}

main();