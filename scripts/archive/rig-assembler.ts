import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PARTS_DIR = 'public/assets/characters/parts';
const OUTPUT_IMAGE = 'public/assets/characters/assembled.png';

async function assemble() {
    const pivotsPath = path.join(PARTS_DIR, 'pivots.json');
    if (!fs.existsSync(pivotsPath)) {
        console.error('pivots.json not found');
        return;
    }

    const pivots = JSON.parse(fs.readFileSync(pivotsPath, 'utf8'));
    
    const parts = [
        'right_calf', 'left_calf',
        'right_thigh', 'left_thigh',
        'torso',
        'right_upper_arm', 'left_upper_arm',
        'right_lower_arm', 'left_lower_arm',
        'head'
    ];

    const composites: sharp.OverlayOptions[] = [];

    for (const part of parts) {
        const imagePath = path.join(PARTS_DIR, `${part}.png`);
        if (fs.existsSync(imagePath) && pivots[part]) {
            composites.push({
                input: imagePath,
                left: Math.round(pivots[part].globalX),
                top: Math.round(pivots[part].globalY)
            });
            console.log(`Added ${part} at (${Math.round(pivots[part].globalX)}, ${Math.round(pivots[part].globalY)})`);
        }
    }

    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite(composites)
    .toFile(OUTPUT_IMAGE);

    console.log(`Assembled image saved to ${OUTPUT_IMAGE}`);
}

assemble().catch(console.error);