import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runAggressiveChromaPipeline() {
  console.log("🚀 Link Start! Pipeline: Vertical Column Tracer (Armpit Detection)...");
  
  const imagePath = path.join(process.cwd(), "public", "assets", "characters", "pubpet.png");
  
  try {
    const imageBuffer = await fs.readFile(imagePath);
    console.log(`✅ Đã nạp ảnh gốc (${imageBuffer.length} bytes)`);

    const partsDir = path.join(process.cwd(), "public", "assets", "characters", "parts");
    await fs.mkdir(partsDir, { recursive: true });

    const { data, info } = await sharp(imageBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const centerX = info.width / 2;

    // --- STAGE 0: VERTICAL COLUMN ANALYSIS ---
    console.log("🔍 Giai đoạn 0: Phân tích trục dọc (Vertical Column Tracing)...");
    
    const colLengths: number[] = new Array(info.width).fill(0);
    const colStarts: number[] = new Array(info.width).fill(-1);

    for (let x = 0; x < info.width; x++) {
        let continuousLength = 0;
        let started = false;
        for (let y = 0; y < info.height; y++) {
            const idx = (y * info.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            const isBG = (g > 100 && (g - Math.max(r, b)) > 30);

            if (!isBG) {
                if (!started) { colStarts[x] = y; started = true; }
                continuousLength++;
            } else {
                if (started) break; // Gặp Gap đầu tiên thì dừng đo (Logic tránh UnderBody)
            }
        }
        colLengths[x] = continuousLength;
    }

    // Tìm điểm nách (Armpit Point) dựa trên độ dài pixel dọc tăng đột biến
    let leftArmpitX = centerX - 100;
    let rightArmpitX = centerX + 100;

    // Trace từ ngoài vào tâm (Trái)
    for (let x = 10; x < centerX - 20; x++) {
        if (colLengths[x] > colLengths[x-1] * 2.5 && colLengths[x] > 150) {
            leftArmpitX = x;
            break;
        }
    }
    // Trace từ ngoài vào tâm (Phải)
    for (let x = info.width - 10; x > centerX + 20; x--) {
        if (colLengths[x] > colLengths[x+1] * 2.5 && colLengths[x] > 150) {
            rightArmpitX = x;
            break;
        }
    }

    // --- STAGE 1: SCANLINE FOR Y-LEVELS ---
    const scanlines: { y: number, left: number, right: number, width: number }[] = [];
    for (let y = 0; y < info.height; y++) {
        let rowLeft = -1, rowRight = -1;
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            const isBG = (g > 100 && (g - Math.max(r, b)) > 30);
            if (!isBG) {
                if (rowLeft === -1) rowLeft = x;
                rowRight = x;
            }
        }
        if (rowLeft !== -1) {
            scanlines.push({ y, left: rowLeft, right: rowRight, width: rowRight - rowLeft });
        }
    }

    const topY = scanlines[0].y;
    const bottomY = scanlines[scanlines.length - 1].y;

    // Head/Neck
    let neckY = topY + (bottomY - topY) * 0.15;
    for (let i = 5; i < Math.floor(scanlines.length / 3); i++) {
        if (scanlines[i].width > scanlines[i-1].width * 1.5 && scanlines[i].width > 100) {
            neckY = scanlines[i].y;
            break;
        }
    }

    // Crotch (Bottom-Up)
    let crotchY = bottomY - 150;
    for (let i = scanlines.length - 1; i > Math.floor(scanlines.length * 0.4); i--) {
        const line = scanlines[i];
        let gaps = 0, inC = false;
        for (let x = line.left; x <= line.right; x++) {
            const idx = (line.y * info.width + x) * 4;
            if (data[idx+1] > 100 && (data[idx+1] - Math.max(data[idx], data[idx+2])) > 30) {
                if (inC) gaps++;
            } else inC = true;
        }
        if (gaps < 5 && line.y < bottomY - 50) { crotchY = line.y; break; }
    }

    const upperLimitY = topY + (bottomY - topY) * 0.5;

    // --- STAGE 2: GEOMETRIC REFINEMENT (Outward Edge Tracing) ---
    console.log("🔍 Giai đoạn 2: Tinh chỉnh nách bằng Vector Outward Tracing...");

    // Hàm lấy tọa độ biên dưới tại cột x
    const getBottomEdgeY = (x: number) => {
        const upperLimitY = Math.floor(topY + (bottomY - topY) * 0.55);
        for (let y = Math.floor(neckY); y < upperLimitY; y++) {
            const idx = (y * info.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            const isBG = (g > 100 && (g - Math.max(r, b)) > 30);
            if (isBG && y > neckY + 20) return y; // Trả về điểm background đầu tiên dưới nhân vật
        }
        return -1;
    };

    // Tinh chỉnh nách Trái (Trace ngược từ tâm ra biên)
    let refinedLeftX = leftArmpitX;
    for (let x = leftArmpitX; x > 10; x--) {
        const currY = getBottomEdgeY(x);
        const prevY = getBottomEdgeY(x + 1);
        if (currY === -1 || prevY === -1) continue;

        // Nếu đường biên bắt đầu "ngang" ra (độ dốc dy gần bằng 0)
        // hoặc đột ngột gãy hướng đi lên (hốc nách)
        const dy = currY - prevY;
        if (Math.abs(dy) < 2) { // Điểm bắt đầu nằm ngang = Sát nách
            refinedLeftX = x;
            break;
        }
    }

    // Tinh chỉnh nách Phải
    let refinedRightX = rightArmpitX;
    for (let x = rightArmpitX; x < info.width - 10; x++) {
        const currY = getBottomEdgeY(x);
        const prevY = getBottomEdgeY(x - 1);
        if (currY === -1 || prevY === -1) continue;

        const dy = currY - prevY;
        if (Math.abs(dy) < 2) {
            refinedRightX = x;
            break;
        }
    }

    leftArmpitX = refinedLeftX;
    rightArmpitX = refinedRightX;

    // Lấy tọa độ Y của điểm nách thực tế tại điểm X vừa tìm được
    const leftArmpitY = getBottomEdgeY(leftArmpitX);
    const rightArmpitY = getBottomEdgeY(rightArmpitX);
    const armpitYLimit = (leftArmpitY + rightArmpitY) / 2;

    console.log(`📐 Refined Map: Neck=${neckY}, ArmpitX=[X:${leftArmpitX}-${rightArmpitX}], ArmpitY=${armpitYLimit}`);

    const partPixels: Record<string, Buffer> = {
        head: Buffer.alloc(info.width * info.height * 4, 0),
        torso: Buffer.alloc(info.width * info.height * 4, 0),
        left_arm: Buffer.alloc(info.width * info.height * 4, 0),
        right_arm: Buffer.alloc(info.width * info.height * 4, 0),
        left_leg: Buffer.alloc(info.width * info.height * 4, 0),
        right_leg: Buffer.alloc(info.width * info.height * 4, 0)
    };

    const getPixelOwner = (x: number, y: number) => {
        if (y < neckY) return 'head';
        if (y >= crotchY) return x < centerX ? 'left_leg' : 'right_leg';

        if (y >= neckY && y < crotchY) {
            // KHÓA THÂN theo trục X đã tinh chỉnh (Armpit Point X)
            if (x >= leftArmpitX && x <= rightArmpitX) return 'torso';

            // NGOÀI TRỤC THÂN:
            // Chỉ tính là CÁNH TAY nếu nằm TRÊN điểm nách (Armpit Point Y)
            // Pixel nằm ngoài nách X nhưng ở DƯỚI nách Y => Váy/Phụ kiện/Chân
            if (y < armpitYLimit + 10) { // Chừa 10px lề cho khớp nách
                return x < centerX ? 'left_arm' : 'right_arm';
            } else {
                return x < centerX ? 'left_leg' : 'right_leg';
            }
        }
        return null;
    };

    console.log("🧩 Giai đoạn 1: Phân tách Giải phẫu Trục dọc...");
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % info.width;
        const y = Math.floor((i / 4) / info.width);
        const r = data[i], b = data[i+2];
        let g = data[i+1];
        const greenSurplus = g - Math.max(r, b);
        let alpha = 255;
        if (g > 100 && greenSurplus > 5) alpha = Math.max(0, 255 - (greenSurplus * 8));
        if (alpha < 255 && alpha > 0) g = Math.min(g, (r + b) / 2);
        if (alpha === 0) continue;

        const owner = getPixelOwner(x, y);
        if (owner) {
            const bArr = partPixels[owner];
            bArr[i] = r; bArr[i+1] = g; bArr[i+2] = b; bArr[i+3] = alpha;
        }
    }

    for (const [name, buffer] of Object.entries(partPixels)) {
        await sharp(buffer, { raw: { width: info.width, height: info.height, channels: 4 } })
            .trim().png().toFile(path.join(partsDir, `${name}.png`));
        console.log(`✅ Hoàn tất: ${name}.png`);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

runAggressiveChromaPipeline();
