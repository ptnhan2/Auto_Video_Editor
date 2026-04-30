import fs from 'fs';
import path from 'path';
import { VideoScriptData } from '../../shared/types/ai-schemas';

function extractMissingAssets(inputFile: string, outputFile: string) {
  try {
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Không tìm thấy kịch bản đầu vào: ${inputFile}`);
      return;
    }

    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const script: VideoScriptData = JSON.parse(rawData);
    
    const missingAssets: any[] = [];

    script.scenes.forEach(scene => {
      scene.shots.forEach((shot) => {
        if (shot.requestedAssets && shot.requestedAssets.length > 0) {
          shot.requestedAssets.forEach((asset: any) => {
            missingAssets.push({
              sceneId: scene.sceneId,
              shotId: shot.shotId,
              ...asset
            });
          });
        }
      });
    });

    if (missingAssets.length === 0) {
      console.log(`✅ Không có asset nào thiếu trong kịch bản này.`);
      return;
    }

    console.log(`⚠️ Tìm thấy ${missingAssets.length} yêu cầu asset mới từ AI!`);

    // Ghi vào file markdown
    const dateStr = new Date().toISOString().split('T')[0];
    let markdown = `\n## Báo cáo thiếu Asset (${dateStr})\n`;
    markdown += `**Nguồn:** ${script.title}\n\n`;
    markdown += `| Loại (Type) | Yêu cầu (Missing Concept) | Lý do (Reason) | Cảnh/Góc máy |\n`;
    markdown += `|---|---|---|---|\n`;

    missingAssets.forEach(a => {
      markdown += `| \`${a.type}\` | ${a.missingConcept} | ${a.reason || '-'} | \`${a.sceneId} / ${a.shotId}\` |\n`;
    });

    const outDir = path.dirname(outputFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Append hoặc tạo mới
    if (fs.existsSync(outputFile)) {
      fs.appendFileSync(outputFile, markdown);
    } else {
      const header = `# Danh sách Asset cần bổ sung (Assets Backlog)\n\n_Danh sách này được AI tự động tổng hợp từ các kịch bản bị thiếu tài nguyên. Đội họa sĩ / 3D modeler sẽ dựa vào đây để sản xuất thêm._\n`;
      fs.writeFileSync(outputFile, header + markdown);
    }

    console.log(`✅ Đã cập nhật danh sách vào: ${outputFile}`);

  } catch (error) {
    console.error("❌ Lỗi khi trích xuất missing assets:", error);
  }
}

// Chạy trực tiếp: npx tsx scripts/tools/extract_missing_assets.ts <inputFile>
const inputFile = process.argv[2] || 'public/scripts/draft_ai.json';
const outputFile = 'docs/assets_backlog.md';
extractMissingAssets(inputFile, outputFile);
