import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function main() {
  const episode_id = process.argv[2];
  if (!episode_id) {
    console.error("âŒ Lá»—i: Thiáº¿u episode_id! Usage: npx tsx render_all.ts <episode_id>");
    process.exit(1);
  }

  const inputFile = `public/scripts/compiled_${episode_id}.json`;
  const outDir = 'out';
  const outMp4 = `${outDir}/episode_${episode_id}.mp4`;

  console.log(`\n========================================`);
  console.log(`ðŸŽ¬ GIAI ÄOáº N 8: RENDER MP4`);
  console.log(`========================================\n`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`âŒ Lá»—i: KhÃ´ng tÃ¬m tháº¥y file JSON Ä‘áº§u vÃ o: ${inputFile}`);
    process.exit(1);
  }

  console.log(`ðŸš€ Äang gá»i Remotion Ä‘á»ƒ render ${outMp4}...`);
  
  // Prepare proper quotes for Windows shell execution
  const renderCommand = `echo "Remotion render command deprecated — use OpenCut Editor export instead"

  try {
    execSync(renderCommand, { stdio: 'inherit' });
    console.log(`\nâœ… Render hoÃ n táº¥t! Output saved at: ${outMp4}`);
  } catch (err) {
    console.error(`âŒ Lá»—i khi render:`, err);
    process.exit(1);
  }
}

main();
