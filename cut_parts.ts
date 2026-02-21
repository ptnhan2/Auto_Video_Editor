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

function isBG(r: number, g: number, b: number) {
    const dG = Math.sqrt(r*r + (g-255)**2 + b*b);
    const dM = Math.sqrt((r-255)**2 + g*g + (b-255)**2);
    return dG < 165 || dM < 165;
}

async function run() {
    const { data, info } = await sharp(IMAGE_PATH).raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const getP = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return { r: 0, g: 255, b: 0 };
        const idx = (Math.round(y) * width + Math.round(x)) * 3;
        return { r: data[idx], g: data[idx+1], b: data[idx+2] };
    };

    const traceBody = (start, target) => {
        let curr = { ...start };
        const dx = target.x - start.x, dy = target.y - start.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        for (let i = 0; i <= d; i++) {
            if (!isBG(getP(curr.x, curr.y).r, getP(curr.x, curr.y).g, getP(curr.x, curr.y).b)) return curr;
            curr.x += dx/d; curr.y += dy/d;
        }
        return curr;
    };

    const traceUntilBG = (start, vx, vy) => {
        let curr = { ...start };
        let d = 0;
        while (d < 500) {
            if (isBG(getP(curr.x, curr.y).r, getP(curr.x, curr.y).g, getP(curr.x, curr.y).b)) return d;
            curr.x += vx; curr.y += vy; d++;
        }
        return d;
    };

    let pChinY = MARKERS.neck.y;
    while (pChinY > 0 && isBG(getP(MARKERS.neck.x, pChinY).r, getP(MARKERS.neck.x, pChinY).g, getP(MARKERS.neck.x, pChinY).b)) pChinY--;

    async function pPart(maskSvg, name) {
        const mask = Buffer.from(`<svg width="${width}" height="${height}">${maskSvg}</svg>`);
        const { data: pData, info: pInfo } = await sharp(IMAGE_PATH).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < pData.length; i += pInfo.channels) {
            const r = pData[i], g = pData[i+1], b = pData[i+2];
            if (isBG(r, g, b)) pData[i+3] = 0;
        }
        await sharp(pData, { raw: pInfo }).trim().toFile(path.join(OUTPUT_DIR, `${name}.png`));
    }

    const processArm = async (s_m, a_m, h_m, name) => {
        const s_ref = traceBody(s_m, a_m), a_ref = traceBody(a_m, s_m);
        const mid = { x: (s_ref.x + a_ref.x)/2, y: (s_ref.y + a_ref.y)/2 };
        const vArm = { x: h_m.x - mid.x, y: h_m.y - mid.y };
        const dLen = Math.sqrt(vArm.x**2 + vArm.y**2);
        const nx = vArm.x/dLen, ny = vArm.y/dLen;
        
        let px = -ny, py = nx;
        if (py > 0) { px = -px; py = -py; } // Ensure pointing UP
        
        const radius = traceUntilBG(mid, px, py);
        const diameter = radius * 2;
        const angle = Math.atan2(ny, nx) * 180 / Math.PI;

        // The user's logic: Diameter is 2 * trace_length.
        // We use M as the starting point for the cut, as requested.
        await pPart(`
            <g transform="translate(${mid.x}, ${mid.y}) rotate(${angle})">
                <polygon points="0,${-radius} 0,${radius} 1500,${radius} 1500,${-radius}" fill="white" />
                <ellipse cx="0" cy="0" rx="${radius + 10}" ry="${radius * 0.7}" fill="white" />
            </g>
        `, name);
        
        return { mid, radius, angle };
    };

    const ra = await processArm(MARKERS.rs, MARKERS.ra, MARKERS.rh, 'right_arm');
    const la = await processArm(MARKERS.ls, MARKERS.la, MARKERS.lh, 'left_arm');

    await pPart(`<rect x="0" y="0" width="${width}" height="${pChinY}" fill="white" />`, 'head');
    await pPart(`<path d="M 0 ${height} H 515 V 530 H 480 A 35 35 0 0 0 410 530 H 0 Z" fill="white" />`, 'right_leg');
    await pPart(`<path d="M ${width} ${height} H 515 V 530 H 550 A 35 35 0 0 1 620 530 H ${width} Z" fill="white" />`, 'left_leg');

    await pPart(`
        <path d="M ${MARKERS.rs.x} ${MARKERS.rs.y} L ${MARKERS.ls.x} ${MARKERS.ls.y} L ${MARKERS.crotch.x + 100} 700 L ${MARKERS.crotch.x - 100} 700 Z" fill="white" />
        <circle cx="${MARKERS.neck.x}" cy="${pChinY + 20}" r="35" fill="white" />
        <g transform="translate(${ra.mid.x}, ${ra.mid.y}) rotate(${ra.angle})">
            <ellipse cx="0" cy="0" rx="${ra.radius + 10}" ry="${ra.radius * 0.7}" fill="white" />
        </g>
        <g transform="translate(${la.mid.x}, ${la.mid.y}) rotate(${la.angle})">
            <ellipse cx="0" cy="0" rx="${la.radius + 10}" ry="${la.radius * 0.7}" fill="white" />
        </g>
        <circle cx="450" cy="530" r="45" fill="white" />
        <circle cx="580" cy="530" r="45" fill="white" />
        <rect x="0" y="0" width="${width}" height="${pChinY}" fill="none" />
    `, 'torso');
    console.log('Done.');
}
run().catch(console.error);
