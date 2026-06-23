import fs from 'fs';
import path from 'path';

function main() {
  const episode_id = process.argv[2];
  if (!episode_id) {
    console.error("Error: Missing episode_id! Usage: npx tsx render_all.ts <episode_id>");
    process.exit(1);
  }

  const inputFile = `public/scripts/opencut_${episode_id}.json`;
  const outDir = 'out';
  const outMp4 = `${outDir}/episode_${episode_id}.mp4`;

  console.log("\n========================================");
  console.log("STAGE 8: RENDER MP4");
  console.log("========================================\n");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input JSON file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Remotion render deprecated — use OpenCut Editor export instead`);
  console.log(`Output would be saved at: ${outMp4}`);
}

main();
