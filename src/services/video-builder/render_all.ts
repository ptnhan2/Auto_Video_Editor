import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function main() {
  const episode_id = process.argv[2];
  if (!episode_id) {
    console.error("❌ Lỗi: Thiếu episode_id! Usage: npx tsx render_all.ts <episode_id>");
    process.exit(1);
  }

  const inputFile = `public/scripts/compiled_${episode_id}.json`;
  const outDir = 'out';
  const outMp4 = `${outDir}/episode_${episode_id}.mp4`;

  console.log(`\n========================================`);
  console.log(`🎬 GIAI ĐOẠN 8: RENDER MP4`);
  console.log(`========================================\n`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Lỗi: Không tìm thấy file JSON đầu vào: ${inputFile}`);
    process.exit(1);
  }

  console.log(`🚀 Đang gọi Remotion để render ${outMp4}...`);
  
  // Prepare proper quotes for Windows shell execution
  const renderCommand = `npx remotion render remotion/index.ts AIStoryCompiler "${outMp4}" --props="{\\"scriptFile\\": \\"scripts/compiled_${episode_id}.json\\"}"`;

  try {
    execSync(renderCommand, { stdio: 'inherit' });
    console.log(`\n✅ Render hoàn tất! Output saved at: ${outMp4}`);
  } catch (err) {
    console.error(`❌ Lỗi khi render:`, err);
    process.exit(1);
  }
}

main();
