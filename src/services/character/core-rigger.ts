import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { RIGGING_CONFIG } from './rigging';

const ACTIVE_BLUEPRINT = process.argv[2] || RIGGING_CONFIG.ACTIVE_BLUEPRINT;
const ASSET_ID = process.argv[3] || RIGGING_CONFIG.ASSET_ID;
const IMAGE_PATH = `public/assets/${ACTIVE_BLUEPRINT}/${ASSET_ID}/base.png`;
const OUTPUT_DIR = `public/assets/${ACTIVE_BLUEPRINT}/${ASSET_ID}/parts`;

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function isBG(r: number, g: number, b: number, a: number) {
    if (a < RIGGING_CONFIG.BG_ALPHA_THRESHOLD) return true;
    return (g > r + RIGGING_CONFIG.BG_G_R_DIFF && g > b + RIGGING_CONFIG.BG_G_B_DIFF && g > RIGGING_CONFIG.BG_G_MIN);
}

interface Point { x: number; y: number; }

interface PivotData {
    x: number;
    y: number;
    globalX: number;
    globalY: number;
    localX: number;
    localY: number;
    width: number;
    height: number;
    baseAngle: number;
    expressionAnchor?: { x: number, y: number, width: number, height: number };
    [key: string]: unknown; // Allow for extra custom fields
}

async function run() {
    console.log('--- V7: 10-Part Automated Rigging Standard ---');
    
    if (!fs.existsSync(IMAGE_PATH)) {
        console.error(`Error: Image not found at ${IMAGE_PATH}`);
        return;
    }

    const { data, info } = await sharp(IMAGE_PATH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;

    const isBackground = (x: number, y: number) => {
        const rx = Math.round(x), ry = Math.round(y);
        if (rx < 0 || rx >= width || ry < 0 || ry >= height) return true;
        const idx = (ry * width + rx) * 4;
        return isBG(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
    };

    // 1. Run AI Pose Detection
    await tf.ready();
    await tf.setBackend('cpu'); // Use CPU backend for Node.js compatibility
    const { data: rgbData } = await sharp(IMAGE_PATH).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const tensor = tf.tensor3d(new Uint8Array(rgbData), [height, width, 3], 'int32');
    
    // MoveNet Pose Detection
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType[RIGGING_CONFIG.POSE_MODEL_TYPE as keyof typeof poseDetection.movenet.modelType]
    });
    const poses = await detector.estimatePoses(tensor);

    // Face Mesh Detection for Precision Chin
    const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const faceDetector = await faceLandmarksDetection.createDetector(faceModel, {
        runtime: 'tfjs',
        refineLandmarks: true
    });
    const faces = await faceDetector.estimateFaces(tensor);
    
    const k = poses[0].keypoints.reduce((acc: Record<string, Point>, kp: poseDetection.Keypoint) => {
        if (kp.name) {
            acc[kp.name] = { x: Math.round(kp.x), y: Math.round(kp.y) };
        }
        return acc;
    }, {});

    const nose = k.nose;
    const rs_m = k.left_shoulder; const rhip_m = k.left_hip; const rknee_m = k.left_knee; const re_m = k.left_elbow; const rw_m = k.left_wrist; const rankle_m = k.left_ankle;
    const ls_m = k.right_shoulder; const lhip_m = k.right_hip; const lknee_m = k.right_knee; const le_m = k.right_elbow; const lw_m = k.right_wrist; const lankle_m = k.right_ankle;

    // --- 2. Advanced Geometric Algorithms ---
    // ============================================================== //
    // 🔒 FROZEN BLOCK - CORE CUTTING LOGIC (DO NOT MODIFY ALGORITHMS)
    // ============================================================== //

    function findArmpitTriangle(S: Point, E: Point) {
        let armpit = { x: S.x, y: S.y + RIGGING_CONFIG.ARMPIT_Y_OFFSET };
        let minY = Infinity;
        const sy = S.y, ey = E.y, sx = S.x, ex = E.x;
        for (let y = Math.min(sy, ey); y <= Math.max(sy, ey); y++) {
            const x_line = sx + (y - sy) * (ex - sx) / (ey - sy === 0 ? 1 : (ey - sy));
            for (let x = Math.min(sx, x_line); x <= Math.max(sx, x_line); x++) {
                if (isBackground(x, y) && y < minY) {
                    minY = y;
                    armpit = { x: Math.round(x), y: Math.round(y) };
                }
            }
        }
        return armpit;
    }
    const ra_m = findArmpitTriangle(rs_m, re_m);
    const la_m = findArmpitTriangle(ls_m, le_m);

    function findCrotch(hip1: Point, hip2: Point) {
        const startY = Math.max(hip1.y, hip2.y);
        for (let y = startY; y < height; y++) {
            for (let x = Math.min(hip1.x, hip2.x); x <= Math.max(hip1.x, hip2.x); x++) {
                if (isBackground(x, y)) return { x: Math.round(x), y: Math.round(y) };
            }
        }
        return { x: Math.floor((hip1.x + hip2.x) / 2), y: startY + RIGGING_CONFIG.CROTCH_Y_OFFSET };
    }
    const crotch = findCrotch(lhip_m, rhip_m);

    function findJointCircle(startPoint: Point, boneP1: Point, boneP2: Point, isRightOnScreen: boolean) {
        const vx = boneP2.x - boneP1.x, vy = boneP2.y - boneP1.y;
        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        let px = -vy / len, py = vx / len;
        if (isRightOnScreen && px < 0) { px = -px; py = -py; }
        if (!isRightOnScreen && px > 0) { px = -px; py = -py; }
        
        let t = 0, enteredBody = false, inDist = 0, outDist = 0;
        while (t < width) {
            const x = Math.round(startPoint.x + px * t), y = Math.round(startPoint.y + py * t);
            const bg = isBackground(x, y);
            if (!bg && !enteredBody) { enteredBody = true; inDist = t; } 
            else if (bg && enteredBody) { outDist = t; break; }
            t++;
        }
        if (!enteredBody) return { radius: RIGGING_CONFIG.JOINT_DEFAULT_RADIUS, center: startPoint };
        const radius = (outDist - inDist) / 2;
        return { radius, center: { x: Math.round(startPoint.x + px * (inDist + radius)), y: Math.round(startPoint.y + py * (inDist + radius)) } };
    }

    const r_arm_joint = findJointCircle(ra_m, rs_m, re_m, true);
    const l_arm_joint = findJointCircle(la_m, ls_m, le_m, false);
    const r_leg_joint = findJointCircle(crotch, rhip_m, rknee_m, true);
    const l_leg_joint = findJointCircle(crotch, lhip_m, lknee_m, false);

    function getTrueJointGeometry(center: Point, p1: Point, p2: Point) {
        const vx = p2.x - p1.x, vy = p2.y - p1.y;
        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        const px = -vy / len, py = vx / len;
        
        let dist1 = RIGGING_CONFIG.TRUE_JOINT_DEFAULT_DIST, dist2 = RIGGING_CONFIG.TRUE_JOINT_DEFAULT_DIST;
        let t = 0;
        while(t < RIGGING_CONFIG.TRUE_JOINT_TRACE_LIMIT) {
            if (isBackground(center.x + px * t, center.y + py * t)) { dist1 = t; break; }
            t++;
        }
        t = 0;
        while(t < RIGGING_CONFIG.TRUE_JOINT_TRACE_LIMIT) {
            if (isBackground(center.x - px * t, center.y - py * t)) { dist2 = t; break; }
            t++;
        }
        
        const edge1 = { x: Math.round(center.x + px * dist1), y: Math.round(center.y + py * dist1) };
        const edge2 = { x: Math.round(center.x - px * dist2), y: Math.round(center.y - py * dist2) };
        const trueCenter = { x: Math.round((edge1.x + edge2.x) / 2), y: Math.round((edge1.y + edge2.y) / 2) };
        const trueRadius = Math.max(RIGGING_CONFIG.TRUE_JOINT_DEFAULT_DIST, (dist1 + dist2) / 2);
        
        const circle = `<circle cx="${trueCenter.x}" cy="${trueCenter.y}" r="${trueRadius}" fill="white" />`;
        
        return { trueCenter, trueRadius, edge1, edge2, circle };
    }

    const r_elbow_geom = getTrueJointGeometry(re_m, rs_m, re_m);
    const l_elbow_geom = getTrueJointGeometry(le_m, ls_m, le_m);
    const r_knee_geom = getTrueJointGeometry(rknee_m, rhip_m, rknee_m);
    const l_knee_geom = getTrueJointGeometry(lknee_m, lhip_m, lknee_m);

    // E. FIND HAND BOTTOM & THIGH BOUNDARY
    function findClearanceAndThighEdge(hip: Point, knee: Point, armpitX: number, isRightSideOnScreen: boolean) {
        let Y_clear = hip.y;
        let handFound = false;
        
        for (let y = hip.y; y < height; y++) {
            let boneX = hip.x;
            if (knee.y !== hip.y) boneX = hip.x + (y - hip.y) * (knee.x - hip.x) / (knee.y - hip.y);
            
            let tracePattern = 0; // 0: Leg, 1: Gap, 2: Hand, 3: Outer BG
            
            const dir = isRightSideOnScreen ? 1 : -1;
            const edgeX = isRightSideOnScreen ? width : 0;
            
            let x = Math.round(boneX);
            // Skip initial BG if bone is slightly misaligned
            while (x !== edgeX && isBackground(x, y)) x += dir;
            
            while (x !== edgeX) {
                const bg = isBackground(x, y);
                if (tracePattern === 0 && bg) tracePattern = 1;
                else if (tracePattern === 1 && !bg) { tracePattern = 2; handFound = true; }
                else if (tracePattern === 2 && bg) tracePattern = 3;
                x += dir;
            }
            
            if (handFound && tracePattern < 2) {
                Y_clear = y; // Hand ended!
                break;
            }
        }
        
        if (!handFound) Y_clear = hip.y + RIGGING_CONFIG.HAND_FALLBACK_OFFSET; // Fallback if hand is raised
        
        // Find thigh boundary at Y_clear - 5
        const traceY = Math.max(0, Y_clear - RIGGING_CONFIG.THIGH_TRACE_OFFSET);
        let boneX = hip.x;
        if (knee.y !== hip.y) boneX = hip.x + (traceY - hip.y) * (knee.x - hip.x) / (knee.y - hip.y);
        
        const dir = isRightSideOnScreen ? 1 : -1;
        let x = Math.round(boneX);
        while (x > 0 && x < width && isBackground(x, traceY)) x += dir; // Enter leg
        
        let thighX = x;
        while (x > 0 && x < width) {
            if (isBackground(x, traceY)) {
                thighX = x - dir; // Last leg pixel
                break;
            }
            x += dir;
        }

        // If tracing fails completely, fallback to armpit.x
        if (Math.abs(thighX - Math.round(boneX)) > RIGGING_CONFIG.THIGH_FALLBACK_LIMIT) thighX = armpitX;

        return { Y_clear, thighX };
    }

    const r_clear = findClearanceAndThighEdge(rhip_m, rknee_m, ra_m.x, true);
    const l_clear = findClearanceAndThighEdge(lhip_m, lknee_m, la_m.x, false);

    const r_Y_clear = r_clear.Y_clear;
    const r_X_gap = r_clear.thighX;
    
    const l_Y_clear = l_clear.Y_clear;
    const l_X_gap = l_clear.thighX;

    // --- 3. BUILD THE EXACT 4-POINT POLYGONS ---
    
    function getOppositeCirclePoint(armpit: Point, center: Point, radius: number) {
        const vx = armpit.x - center.x;
        const vy = armpit.y - center.y;
        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        return {
            x: Math.round(center.x - (vx / len) * radius),
            y: Math.round(center.y - (vy / len) * radius)
        };
    }

    const r_top_outer = getOppositeCirclePoint(ra_m, r_arm_joint.center, r_arm_joint.radius);
    const l_top_outer = getOppositeCirclePoint(la_m, l_arm_joint.center, l_arm_joint.radius);

    const r_arm_poly = `${ra_m.x},${ra_m.y} ${r_X_gap},${r_Y_clear} ${width},${r_Y_clear} ${r_top_outer.x},${r_top_outer.y}`;
    const l_arm_poly = `${la_m.x},${la_m.y} ${l_X_gap},${l_Y_clear} 0,${l_Y_clear} ${l_top_outer.x},${l_top_outer.y}`;

    const r_leg_outer = getOppositeCirclePoint(crotch, r_leg_joint.center, r_leg_joint.radius);
    const l_leg_outer = getOppositeCirclePoint(crotch, l_leg_joint.center, l_leg_joint.radius);

    let r_diagX_hip = r_X_gap;
    if (r_Y_clear !== ra_m.y) {
        r_diagX_hip = ra_m.x + (r_X_gap - ra_m.x) * (r_leg_outer.y - ra_m.y) / (r_Y_clear - ra_m.y);
    }
    const r_leg_poly = `${crotch.x},${crotch.y} ${r_leg_outer.x},${r_leg_outer.y} ${r_diagX_hip},${r_leg_outer.y} ${r_X_gap},${r_Y_clear} ${width},${r_Y_clear} ${width},${height} ${crotch.x},${height}`;

    let l_diagX_hip = l_X_gap;
    if (l_Y_clear !== la_m.y) {
        l_diagX_hip = la_m.x + (l_X_gap - la_m.x) * (l_leg_outer.y - la_m.y) / (l_Y_clear - la_m.y);
    }
    const l_leg_poly = `${crotch.x},${crotch.y} ${l_leg_outer.x},${l_leg_outer.y} ${l_diagX_hip},${l_leg_outer.y} ${l_X_gap},${l_Y_clear} 0,${l_Y_clear} 0,${height} ${crotch.x},${height}`;

    // --- SPLIT LINES FOR ARMS AND LEGS ---
    function getPerpendicularSplitPolygon(p1: Point, p2: Point, isRight: boolean, isUpperMask: boolean, ext = RIGGING_CONFIG.SPLIT_MASK_EXT) {
        // Line vector
        const vx = p2.x - p1.x;
        const vy = p2.y - p1.y;
        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        const nx = -vy / len;
        const ny = vx / len;
        
        // Perpendicular line at p2 (joint)
        const pa = { x: p2.x + nx * ext, y: p2.y + ny * ext };
        const pb = { x: p2.x - nx * ext, y: p2.y - ny * ext };
        
        // We need a large polygon to mask out the unwanted part
        // Vector along the limb
        const dx = vx / len * ext * 2;
        const dy = vy / len * ext * 2;
        
        if (isUpperMask) {
            // Mask out the upper part (covers from joint backwards)
            return `${pa.x},${pa.y} ${pb.x},${pb.y} ${pb.x - dx},${pb.y - dy} ${pa.x - dx},${pa.y - dy}`;
        } else {
            // Mask out the lower part (covers from joint forwards)
            return `${pa.x},${pa.y} ${pb.x},${pb.y} ${pb.x + dx},${pb.y + dy} ${pa.x + dx},${pa.y + dy}`;
        }
    }

    const r_elbow_mask_lower = getPerpendicularSplitPolygon(rs_m, re_m, true, false);
    const l_elbow_mask_upper = getPerpendicularSplitPolygon(ls_m, le_m, false, true);
    const l_elbow_mask_lower = getPerpendicularSplitPolygon(ls_m, le_m, false, false);
    
    const r_knee_mask_lower = getPerpendicularSplitPolygon(rhip_m, rknee_m, true, false);
    const l_knee_mask_upper = getPerpendicularSplitPolygon(lhip_m, lknee_m, false, true);
    const l_knee_mask_lower = getPerpendicularSplitPolygon(lhip_m, lknee_m, false, false);

    // --- FIND CHIN LEVEL ---
    let chinY = nose.y;
    
    if (faces && faces.length > 0) {
        // Face Mesh Point 152 is the bottom of the chin
        const face = faces[0];
        const chinLandmark = face.keypoints[152];
        if (chinLandmark) {
            // Apply a small -5 pixel offset to ensure we don't cut into the neck/body
            // as landmark 152 can sometimes be slightly below the visual chin line in 2D assets.
            chinY = Math.round(chinLandmark.y) + RIGGING_CONFIG.CHIN_Y_OFFSET;
            
            console.log(`AI-Detected Chin level (Face Mesh 152 offset): ${chinY}`);
        }
    } else {
        // Fallback to legacy tracing if no face detected
        const shoulderCenterY = Math.round(Math.min(ls_m.y, rs_m.y));
        let traceY = shoulderCenterY;
        
        while (traceY >= nose.y && !isBackground(nose.x, traceY)) traceY--;
        while (traceY >= nose.y && isBackground(nose.x, traceY)) traceY--;
        
        if (traceY >= nose.y) {
            chinY = traceY;
        } else {
            chinY = Math.round(nose.y + (Math.min(ls_m.y, rs_m.y) - nose.y) * RIGGING_CONFIG.LEGACY_CHIN_RATIO); // Fallback
        }
        console.log(`Face Mesh failed on base.png, using legacy tracing chin level: ${chinY}`);
    }

    // ============================================================== //
    // 🔒 END OF FROZEN BLOCK
    // ============================================================== //

    // --- 4. ACTUAL CUTTING & EXTRACTION ---
    console.log('\nStarting extraction of individual parts with Island Filtering...');
    
    const pivotsPath = path.join(OUTPUT_DIR, 'pivots.json');
    let pivots: Record<string, PivotData> = {};
    
    // Load existing pivots to preserve manual edits
    if (fs.existsSync(pivotsPath)) {
        try {
            pivots = JSON.parse(fs.readFileSync(pivotsPath, 'utf8'));
            console.log(`Loaded existing pivots from ${pivotsPath}`);
        } catch (_e) {
            console.warn(`Failed to parse existing pivots.json, starting fresh.`);
        }
    }

    function calcBaseAngle(parent: Point, child: Point) {
        if (!parent || !child) return 0;
        return (Math.atan2(child.y - parent.y, child.x - parent.x) * (180 / Math.PI)) - 90;
    }

    async function extractPart(partName: string, svgMaskElements: string, seed: Point, pivotPoint: Point, baseAngle: number = 0) {
        const maskSVG = `
            <svg width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="black" />
                ${svgMaskElements}
            </svg>
        `;
        
        const maskBuffer = await sharp(Buffer.from(maskSVG)).toColorspace('b-w').raw().toBuffer();
        const { data: imgData, info: imgInfo } = await sharp(IMAGE_PATH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

        for (let i = 0; i < maskBuffer.length; i++) {
            const isMaskedOut = maskBuffer[i] < 128;
            const idx = i * 4;
            if (isMaskedOut || isBG(imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3])) {
                imgData[idx + 3] = 0; 
            }
        }

        const visited = new Uint8Array(width * height);
        const stack: [number, number][] = [[Math.round(seed.x), Math.round(seed.y)]];
        const keep = new Uint8Array(width * height);

        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            const idx = y * width + x;
            if (visited[idx]) continue;
            visited[idx] = 1;

            if (imgData[idx * 4 + 3] > 0) {
                keep[idx] = 1;
                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }

        // --- MASK EROSION (ToRemove black outlines) ---
        const skipErosion = partName === 'head' || partName === 'torso';
        const erosionRadius = RIGGING_CONFIG.EROSION_RADIUS; // Shrink by 2 pixels
        const erodedKeep = skipErosion ? keep : new Uint8Array(width * height);
        
        if (!skipErosion) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (keep[idx] === 1) {
                        let hasBG = false;
                        for (let dy = -erosionRadius; dy <= erosionRadius; dy++) {
                            for (let dx = -erosionRadius; dx <= erosionRadius; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx < 0 || nx >= width || ny < 0 || ny >= height || keep[ny * width + nx] === 0) {
                                    hasBG = true;
                                    break;
                                }
                            }
                            if (hasBG) break;
                        }
                        if (!hasBG) erodedKeep[idx] = 1;
                    }
                }
            }
        }

        for (let i = 0; i < keep.length; i++) {
            if (!erodedKeep[i]) imgData[i * 4 + 3] = 0;
        }

        const outputPath = path.join(OUTPUT_DIR, `${partName}.png`);
        const imageObj = sharp(imgData, { raw: { width: imgInfo.width, height: imgInfo.height, channels: 4 } });
        
        const { info: trimInfo } = await imageObj.clone().trim().toBuffer({ resolveWithObject: true });
        
        // Safety check if trim returns valid info (it might be completely empty)
        if (trimInfo.width > 0 && trimInfo.height > 0) {
            const finalImage = imageObj.trim();

            await finalImage.toFile(outputPath);
            
            // Calculate Pivot
            const localX = pivotPoint.x + (trimInfo.trimOffsetLeft ?? 0);
            const localY = pivotPoint.y + (trimInfo.trimOffsetTop ?? 0);
            const normX = localX / trimInfo.width;
            const normY = localY / trimInfo.height;
            
            pivots[partName] = {
                ...pivots[partName], // Preserve existing manual fields if any
                x: Number(normX.toFixed(4)),
                y: Number(normY.toFixed(4)),
                globalX: -(trimInfo.trimOffsetLeft ?? 0),
                globalY: -(trimInfo.trimOffsetTop ?? 0),
                localX: localX,
                localY: localY,
                width: trimInfo.width,
                height: trimInfo.height,
                baseAngle: Number(baseAngle.toFixed(2))
            };

            console.log(`-> Extracted: ${outputPath} | Pivot: [${pivots[partName].x}, ${pivots[partName].y}] | GlobalPos: [${pivots[partName].globalX}, ${pivots[partName].globalY}]`);
        } else {
            console.log(`-> Skipped: ${partName} (Empty)`);
        }
    }

    const r_arm_half_circle = `<path d="M ${ra_m.x},${ra_m.y} A ${r_arm_joint.radius},${r_arm_joint.radius} 0 0,1 ${r_top_outer.x},${r_top_outer.y} Z" fill="white" />`;
    const l_arm_half_circle = `<path d="M ${la_m.x},${la_m.y} A ${l_arm_joint.radius},${l_arm_joint.radius} 0 0,0 ${l_top_outer.x},${l_top_outer.y} Z" fill="white" />`;
    const r_leg_half_circle = `<path d="M ${crotch.x},${crotch.y} A ${r_leg_joint.radius},${r_leg_joint.radius} 0 0,1 ${r_leg_outer.x},${r_leg_outer.y} Z" fill="white" />`;
    const l_leg_half_circle = `<path d="M ${crotch.x},${crotch.y} A ${l_leg_joint.radius},${l_leg_joint.radius} 0 0,0 ${l_leg_outer.x},${l_leg_outer.y} Z" fill="white" />`;

    // UPPER ARMS
    await extractPart('left_upper_arm', `
        <polygon points="${l_arm_poly}" fill="white" />
        ${l_arm_half_circle}
        <polygon points="${l_elbow_mask_lower}" fill="black" />
        ${l_elbow_geom.circle}
    `, { x: (ls_m.x + le_m.x) / 2, y: (ls_m.y + le_m.y) / 2 }, l_arm_joint.center, calcBaseAngle(ls_m, le_m));

    await extractPart('right_upper_arm', `
        <polygon points="${r_arm_poly}" fill="white" />
        ${r_arm_half_circle}
        <polygon points="${r_elbow_mask_lower}" fill="black" />
        ${r_elbow_geom.circle}
    `, { x: (rs_m.x + re_m.x) / 2, y: (rs_m.y + re_m.y) / 2 }, r_arm_joint.center, calcBaseAngle(rs_m, re_m));

    // LOWER ARMS
    await extractPart('left_lower_arm', `
        <polygon points="${l_arm_poly}" fill="white" />
        <polygon points="${l_elbow_mask_upper}" fill="black" />
        ${l_elbow_geom.circle}
    `, { x: (l_elbow_geom.trueCenter.x + lw_m.x) / 2, y: (l_elbow_geom.trueCenter.y + lw_m.y) / 2 }, l_elbow_geom.trueCenter, calcBaseAngle(le_m, lw_m));

    // THIGHS
    await extractPart('left_thigh', `
        <polygon points="${l_leg_poly}" fill="white" />
        ${l_leg_half_circle}
        <polygon points="${l_knee_mask_lower}" fill="black" />
        ${l_knee_geom.circle}
    `, { x: (lhip_m.x + lknee_m.x) / 2, y: (lhip_m.y + lknee_m.y) / 2 }, l_leg_joint.center, calcBaseAngle(lhip_m, lknee_m));

    await extractPart('right_thigh', `
        <polygon points="${r_leg_poly}" fill="white" />
        ${r_leg_half_circle}
        <polygon points="${r_knee_mask_lower}" fill="black" />
        ${r_knee_geom.circle}
    `, { x: (rhip_m.x + rknee_m.x) / 2, y: (rhip_m.y + rknee_m.y) / 2 }, r_leg_joint.center, calcBaseAngle(rhip_m, rknee_m));

    // CALVES
    await extractPart('left_calf', `
        <polygon points="${l_leg_poly}" fill="white" />
        <polygon points="${l_knee_mask_upper}" fill="black" />
        ${l_knee_geom.circle}
    `, { x: l_knee_geom.trueCenter.x, y: l_knee_geom.trueCenter.y + RIGGING_CONFIG.CALF_Y_OFFSET }, l_knee_geom.trueCenter, calcBaseAngle(lknee_m, lankle_m));

    // HEAD
    await extractPart('head', `
        <rect x="0" y="0" width="${width}" height="${chinY}" fill="white" />
    `, nose, { x: nose.x, y: chinY });

    // TORSO
    const torsoSeed = { x: (lhip_m.x + rhip_m.x) / 2, y: (ls_m.y + lhip_m.y) / 2 };
    const torsoPivot = { x: (lhip_m.x + rhip_m.x) / 2, y: (lhip_m.y + rhip_m.y) / 2 };
    await extractPart('torso', `
        <rect x="0" y="${chinY}" width="${width}" height="${height - chinY}" fill="white" />
        <polygon points="${l_arm_poly}" fill="black" />
        <polygon points="${r_arm_poly}" fill="black" />
        <polygon points="${l_leg_poly}" fill="black" />
        <polygon points="${r_leg_poly}" fill="black" />
        <circle cx="${l_arm_joint.center.x}" cy="${l_arm_joint.center.y}" r="${l_arm_joint.radius}" fill="white" />
        <circle cx="${r_arm_joint.center.x}" cy="${r_arm_joint.center.y}" r="${r_arm_joint.radius}" fill="white" />
        <circle cx="${l_leg_joint.center.x}" cy="${l_leg_joint.center.y}" r="${l_leg_joint.radius}" fill="white" />
        <circle cx="${r_leg_joint.center.x}" cy="${r_leg_joint.center.y}" r="${r_leg_joint.radius}" fill="white" />
    `, torsoSeed, torsoPivot);

    // --- 5. DUPLICATE SYMMETRY FOR RIGHT LIMBS ---
    console.log('\nDuplicating left limbs for right side...');
    
    async function duplicateSymmetry(srcName: string, destName: string, pivotPoint: Point, applyMedian = false, baseAngle: number = 0) {
        if (!pivots[srcName]) {
            console.log(`-> Skipped: ${destName} (Source ${srcName} not found)`);
            return;
        }

        const srcPath = path.join(OUTPUT_DIR, `${srcName}.png`);
        const destPath = path.join(OUTPUT_DIR, `${destName}.png`);

        if (fs.existsSync(srcPath)) {
            if (applyMedian) {
                await sharp(srcPath).median(RIGGING_CONFIG.MEDIAN_FILTER_SIZE).toFile(destPath);
            } else {
                await sharp(srcPath).toFile(destPath);
            }
        }

        const srcPivot = pivots[srcName];

        pivots[destName] = {
            ...pivots[destName], // Preserve existing manual fields if any
            x: srcPivot.x,
            y: srcPivot.y,
            globalX: Math.round(pivotPoint.x - srcPivot.localX),
            globalY: Math.round(pivotPoint.y - srcPivot.localY),
            localX: srcPivot.localX,
            localY: srcPivot.localY,
            width: srcPivot.width,
            height: srcPivot.height,
            baseAngle: Number(baseAngle.toFixed(2))
        };

        console.log(`-> Duplicated: ${destName} | Pivot: [${pivots[destName].x}, ${pivots[destName].y}] | BaseAngle: ${pivots[destName].baseAngle}`);
    }

    // Use exact same baseAngle from left side as requested
    const rightLowerArmAngle = pivots['left_lower_arm'] ? pivots['left_lower_arm'].baseAngle : calcBaseAngle(re_m, rw_m);
    const rightCalfAngle = pivots['left_calf'] ? pivots['left_calf'].baseAngle : calcBaseAngle(rknee_m, rankle_m);

    await duplicateSymmetry('left_lower_arm', 'right_lower_arm', r_elbow_geom.trueCenter, true, rightLowerArmAngle);
    await duplicateSymmetry('left_calf', 'right_calf', r_knee_geom.trueCenter, false, rightCalfAngle);

    // --- 6. AUTO WIPE FACE & EXTRACT EXPRESSION ANCHOR ON HEAD.PNG ---
    console.log('\nAnalyzing head.png to extract expression anchor and wipe face...');
    const headPath = path.join(OUTPUT_DIR, 'head.png');
    if (fs.existsSync(headPath) && pivots['head']) {
        const { data: headData, info: headInfo } = await sharp(headPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const headTensor = tf.tensor3d(new Uint8Array(headData), [headInfo.height, headInfo.width, 3], 'int32');
        
        const headFaces = await faceDetector.estimateFaces(headTensor);
        if (headFaces && headFaces.length > 0) {
            const face = headFaces[0];
            
            const faceOvalIndices = [
                10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
            ];
            const faceOvalPoints = faceOvalIndices.map(idx => face.keypoints[idx]);

            const leftEye = face.keypoints[33];
            const rightEye = face.keypoints[263];
            const mouthBottom = face.keypoints[17];
            const forehead = face.keypoints[10];

            pivots['head'].expressionAnchor = {
                x: Math.round(leftEye.x),
                y: Math.round(forehead.y),
                width: Math.round(rightEye.x - leftEye.x),
                height: Math.round(mouthBottom.y - forehead.y)
            };

            // Sample skin color from forehead
            const px = Math.round(forehead.x);
            const py = Math.round(forehead.y + 10);
            const sampleIdx = (py * headInfo.width + px) * 3;
            const skinColor = `rgb(${headData[sampleIdx]},${headData[sampleIdx+1]},${headData[sampleIdx+2]})`;

            const polygonPoints = faceOvalPoints.map(p => {
                return `${Math.round(p.x)},${Math.round(p.y)}`;
            }).join(' ');

            // Vertical blur mask
            const svgOverlay = `
                <svg width="${headInfo.width}" height="${headInfo.height}">
                    <defs>
                        <filter id="vertBlur" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="0 8" />
                        </filter>
                    </defs>
                    <polygon points="${polygonPoints}" fill="${skinColor}" filter="url(#vertBlur)" />
                </svg>
            `;

            const outputBuffer = await sharp(headPath)
                .composite([{ input: Buffer.from(svgOverlay), blend: 'over' }])
                .png()
                .toBuffer();

            fs.writeFileSync(headPath, outputBuffer);
            console.log(`Successfully wiped face on head.png and saved expressionAnchor.`);
        } else {
            console.warn(`Face Mesh failed to detect a face on head.png!`);
        }
    }

    // Save Pivots JSON
    fs.writeFileSync(pivotsPath, JSON.stringify(pivots, null, 2));
    console.log(`\nSaved pivots to ${pivotsPath}`);

    console.log('--- DONE V7 EXTRACTION! ---');
}

run().catch(console.error);
