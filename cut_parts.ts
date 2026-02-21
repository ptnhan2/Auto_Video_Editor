import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MARKERS = {
    neck: { x: 515, y: 218 },
    rs: { x: 421, y: 225 },
    ls: { x: 609, y: 225 },
    ra: { x: 433, y: 333 },
    la: { x: 597, y: 332 },
    rh: { x: 173, y: 516 },
    lh: { x: 857, y: 516 },
    crotch: { x: 515, y: 530 }
};

const IMAGE_PATH = 'public/assets/characters/pubpet.png';
const OUTPUT_DIR = 'public/assets/characters/parts';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function isGreen(r: number, g: number, b: number) {
    return g > 130 && r < 120 && b < 120;
}
function isMagenta(r: number, g: number, b: number) {
    return r > 150 && g < 100 && b > 150;
}
function isBackground(r: number, g: number, b: number) {
    return isGreen(r, g, b) || isMagenta(r, g, b);
}

async function run() {
    const { data, info } = await sharp(IMAGE_PATH).raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;

    const getPixel = (x: number, y: number) => {
        const idx = (Math.round(y) * width + Math.round(x)) * 3;
        return { r: data[idx], g: data[idx+1], b: data[idx+2] };
    };

    const trace = (start: {x: number, y: number}, target: {x: number, y: number}) => {
        let curr = { ...start };
        const dx = target.x - start.x, dy = target.y - start.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const stepX = dx / dist, stepY = dy / dist;
        for (let i = 0; i < dist; i++) {
            const p = getPixel(curr.x, curr.y);
            if (!isBackground(p.r, p.g, p.b)) return curr;
            curr.x += stepX; curr.y += stepY;
        }
        return curr;
    };

    const pChin = trace(MARKERS.neck, { x: 515, y: 0 });
    const pRS = trace(MARKERS.rs, MARKERS.ra);
    const pRA = trace(MARKERS.ra, MARKERS.rs);
    const pLS = trace(MARKERS.ls, MARKERS.la);
    const pLA = trace(MARKERS.la, MARKERS.ls);
    const pCrotch = trace(MARKERS.crotch, { x: 515, y: 0 });

    const raMid = { x: (pRS.x + pRA.x)/2, y: (pRS.y + pRA.y)/2 };
    const laMid = { x: (pLS.x + pLA.x)/2, y: (pLS.y + pLA.y)/2 };
    const raWidth = Math.sqrt((pRS.x-pRA.x)**2 + (pRS.y-pRA.y)**2);
    const laWidth = Math.sqrt((pLS.x-pLA.x)**2 + (pLS.y-pLA.y)**2);
    
    // Arm axis angles
    const raAngle = Math.atan2(MARKERS.rh.y - raMid.y, MARKERS.rh.x - raMid.x) * 180 / Math.PI;
    const laAngle = Math.atan2(MARKERS.lh.y - laMid.y, MARKERS.lh.x - laMid.x) * 180 / Math.PI;

    async function pPart(maskSvg, name) {
        const mask = Buffer.from(`<svg width="${width}" height="${height}">${maskSvg}</svg>`);
        const { data: pData, info: pInfo } = await sharp(IMAGE_PATH).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < pData.length; i += pInfo.channels) {
            const r = pData[i], g = pData[i+1], b = pData[i+2];
            if (Math.sqrt(r*r + (g-255)**2 + b*b) < 170 || Math.sqrt((r-255)**2 + g*g + (b-255)**2) < 170) pData[i+3] = 0;
        }
        await sharp(pData, { raw: pInfo }).trim().toFile(path.join(OUTPUT_DIR, `${name}.png`));
        console.log(`Saved ${name}.png`);
    }

    // --- ARMS ---
    // Make sure the mask doesn't cross into the torso.
    // We point the rectangle only OUTWARD.
    await pPart(`<g transform="rotate(${raAngle}, ${raMid.x}, ${raMid.y})"><rect x="${raMid.x}" y="${-raWidth/2}" width="1000" height="${raWidth}" fill="white" transform="translate(0, ${raMid.y})" /><circle cx="${raMid.x}" cy="${raMid.y}" r="${raWidth/2 + 5}" fill="white" /></g>`, 'right_arm');
    await pPart(`<g transform="rotate(${laAngle}, ${laMid.x}, ${laMid.y})"><rect x="${laMid.x}" y="${-laWidth/2}" width="1000" height="${laWidth}" fill="white" transform="translate(0, ${laMid.y})" /><circle cx="${laMid.x}" cy="${laMid.y}" r="${laWidth/2 + 5}" fill="white" /></g>`, 'left_arm');

    // --- HEAD ---
    await pPart(`<path d="M 0 0 H ${width} V ${pChin.y} H ${pChin.x + 40} A 40 40 0 0 1 ${pChin.x - 40} ${pChin.y} H 0 Z" fill="white" />`, 'head');

    // --- LEGS ---
    const cY = pCrotch.y;
    await pPart(`<path d="M 0 ${height} H ${pCrotch.x} V ${cY} H ${pCrotch.x - 40} A 40 40 0 0 0 ${pCrotch.x - 120} ${cY} H 0 Z" fill="white" />`, 'right_leg');
    await pPart(`<path d="M ${width} ${height} H ${pCrotch.x} V ${cY} H ${pCrotch.x + 40} A 40 40 0 0 1 ${pCrotch.x + 120} ${cY} H ${width} Z" fill="white" />`, 'left_leg');

    // --- TORSO ---
    // Using a more precise torso shape that traces the markers
    await pPart(`
        <path d="M ${pRS.x} ${pRS.y} Q ${pChin.x} ${pChin.y - 40} ${pLS.x} ${pLS.y} L ${pLA.x} ${pLA.y} L ${pCrotch.x + 80} ${cY} L ${pCrotch.x - 80} ${cY} L ${pRA.x} ${pRA.y} Z" fill="white" />
        <circle cx="${pChin.x}" cy="${pChin.y + 15}" r="30" fill="white" />
        <circle cx="${raMid.x}" cy="${raMid.y}" r="${raWidth/2 + 10}" fill="white" />
        <circle cx="${laMid.x}" cy="${laMid.y}" r="${laWidth/2 + 10}" fill="white" />
        <circle cx="${pCrotch.x - 70}" cy="${cY}" r="40" fill="white" />
        <circle cx="${pCrotch.x + 70}" cy="${cY}" r="40" fill="white" />
    `, 'torso');

    console.log('Done.');
}
run().catch(console.error);
