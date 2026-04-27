import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function stitchVideos(chunksDir: string, outputFile: string) {
  try {
    if (!fs.existsSync(chunksDir)) {
      console.error(`❌ Thư mục không tồn tại: ${chunksDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(chunksDir)
      .filter(f => f.endsWith('.mp4') && f.startsWith('chunk_'))
      .sort(); // Đảm bảo nối đúng thứ tự

    if (files.length === 0) {
      console.log(`⚠️ Không tìm thấy file mp4 nào (bắt đầu bằng chunk_) để nối trong thư mục: ${chunksDir}`);
      return;
    }

    console.log(`⏳ Đang tạo danh sách concat cho ${files.length} videos...`);
    const listPath = path.join(chunksDir, 'concat_list.txt');
    // FFmpeg concat demuxer yêu cầu đường dẫn có format đặc biệt hoặc đường dẫn tương đối
    const listContent = files.map(file => `file '${file}'`).join('\n');
    fs.writeFileSync(listPath, listContent);

    console.log(`🚀 Bắt đầu nối video bằng FFmpeg...`);
    
    // Tạo thư mục out nếu chưa có
    const outDir = path.dirname(outputFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const command = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputFile}"`;
    
    // Chạy đồng bộ
    execSync(command, { stdio: 'inherit' });
    console.log(`\n🎉🎉 Nối video thành công! File xuất tại: ${outputFile}`);
    
    // Dọn dẹp file list
    fs.unlinkSync(listPath);
  } catch (error) {
    console.error("❌ Lỗi khi nối video:", error);
    console.error("💡 Đảm bảo rằng bạn đã cài đặt FFmpeg trên máy (https://ffmpeg.org/download.html)");
    process.exit(1);
  }
}

// Chạy trực tiếp từ CLI: npx tsx scripts/tools/stitch_video.ts <chunksDir> [outputFile]
const chunksDir = process.argv[2] || 'out/chunks';
const outputFile = process.argv[3] || 'out/final_movie.mp4';
stitchVideos(chunksDir, outputFile);