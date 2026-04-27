import sharp from 'sharp';

export interface PivotPoints {
    chin: { x: number; y: number };
    leftArmpit: { x: number; y: number };
    rightArmpit: { x: number; y: number };
    crotch: { x: number; y: number };
}

// Helper to check if a pixel is green screen
// We use a tolerance range because AI generated images might have slight compression artifacts
function isGreen(r: number, g: number, b: number): boolean {
    return r < 100 && g > 180 && b < 100;
}

/**
 * Detects structural pivot points (chin, crotch, armpits) from an AI-generated 
 * character on a green screen. This completely replaces the need for the AI 
 * to draw "magenta dots".
 */
export async function detectPivotPoints(imageBuffer: Buffer | string): Promise<PivotPoints> {
    const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    
    // Quick helper to get pixel index (RGBA = 4 channels)
    const getIndex = (x: number, y: number) => (y * width + x) * 4;

    // 1. Find the Character Bounding Box (first/last non-green pixels)
    let minX = width, maxX = 0, minY = height, maxY = 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIndex(x, y);
            if (!isGreen(data[idx], data[idx+1], data[idx+2])) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    const centerX = Math.floor((minX + maxX) / 2);

    // 2. Find Crotch (highest green pixel in the bottom half gap)
    let crotch = { x: centerX, y: maxY };
    const scanWidth = Math.floor((maxX - minX) * 0.15); // scan 15% of width in the center
    let foundCrotch = false;

    // Scan from waist down to feet, looking for the highest green pixel in the gap
    const waistY = Math.floor(minY + (maxY - minY) * 0.45);
    for (let y = waistY; y <= maxY; y++) {
        for (let x = centerX - scanWidth; x <= centerX + scanWidth; x++) {
            const idx = getIndex(x, y);
            if (isGreen(data[idx], data[idx+1], data[idx+2])) {
                // Found the top vertex of the inner thigh gap
                crotch = { x, y };
                foundCrotch = true;
                break;
            }
        }
        if (foundCrotch) break;
    }

    // 3. Find Chin (lowest non-green pixel in the top section before the neck gap)
    let chin = { x: centerX, y: minY };
    let inHead = false;
    
    for (let y = minY; y < minY + (maxY - minY) * 0.3; y++) { 
        let isRowGreenInCenter = true;
        let lowestNonGreenX = centerX;
        
        for (let x = centerX - scanWidth; x <= centerX + scanWidth; x++) {
            const idx = getIndex(x, y);
            if (!isGreen(data[idx], data[idx+1], data[idx+2])) {
                isRowGreenInCenter = false;
                lowestNonGreenX = x;
                inHead = true;
            }
        }
        
        if (inHead && !isRowGreenInCenter) {
            chin = { x: lowestNonGreenX, y }; // Keep pushing the chin down
        } else if (inHead && isRowGreenInCenter) {
            // We hit the green neck gap! The previous chin is the lowest point.
            break;
        }
    }

    // 4. Find Armpits
    let leftArmpit = { x: minX, y: maxY };
    let rightArmpit = { x: maxX, y: maxY };
    
    // Left Armpit: Scan from shoulder level down to waist
    let foundLeft = false;
    for (let y = chin.y + 10; y < crotch.y; y++) {
        // scan from center towards left
        for (let x = centerX; x > minX; x--) {
            const idx = getIndex(x, y);
            if (isGreen(data[idx], data[idx+1], data[idx+2])) {
                // Check if there is an arm (non-green) further left
                let hasArmToLeft = false;
                for (let armX = x - 5; armX > minX; armX--) {
                    const armIdx = getIndex(armX, y);
                    if (!isGreen(data[armIdx], data[armIdx+1], data[armIdx+2])) {
                        hasArmToLeft = true;
                        break;
                    }
                }
                if (hasArmToLeft) {
                    leftArmpit = { x, y };
                    foundLeft = true;
                    break;
                }
            }
        }
        if (foundLeft) break; // Highest green pixel found
    }

    // Right Armpit
    let foundRight = false;
    for (let y = chin.y + 10; y < crotch.y; y++) {
        // scan from center towards right
        for (let x = centerX; x < maxX; x++) {
            const idx = getIndex(x, y);
            if (isGreen(data[idx], data[idx+1], data[idx+2])) {
                // Check if there is an arm (non-green) further right
                let hasArmToRight = false;
                for (let armX = x + 5; armX < maxX; armX++) {
                    const armIdx = getIndex(armX, y);
                    if (!isGreen(data[armIdx], data[armIdx+1], data[armIdx+2])) {
                        hasArmToRight = true;
                        break;
                    }
                }
                if (hasArmToRight) {
                    rightArmpit = { x, y };
                    foundRight = true;
                    break;
                }
            }
        }
        if (foundRight) break;
    }

    return {
        chin,
        leftArmpit,
        rightArmpit,
        crotch
    };
}

/**
 * Utility to visualize the detected points by drawing red dots 
 * so you can verify the script works correctly.
 */
export async function visualizePivots(imageBuffer: Buffer | string, outputDest: string): Promise<void> {
    const pivots = await detectPivotPoints(imageBuffer);
    
    // Draw 5x5 red rects at pivot points
    const createSvgDot = (x: number, y: number) => 
        `<rect x="${x-2}" y="${y-2}" width="5" height="5" fill="#FF0000" />`;

    const svgOverlay = Buffer.from(`
        <svg width="100%" height="100%">
            ${createSvgDot(pivots.chin.x, pivots.chin.y)}
            ${createSvgDot(pivots.crotch.x, pivots.crotch.y)}
            ${createSvgDot(pivots.leftArmpit.x, pivots.leftArmpit.y)}
            ${createSvgDot(pivots.rightArmpit.x, pivots.rightArmpit.y)}
        </svg>
    `);

    await sharp(imageBuffer)
        .composite([{ input: svgOverlay }])
        .toFile(outputDest);
        
    console.log(`Saved visualization with pivots to: ${outputDest}`);
}
