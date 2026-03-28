import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

/**
 * EXPERIMENTAL: Test Face Detection on stylized expressions.
 * This script attempts to find eyes, nose, and mouth on a single expression sprite.
 */
async function detectOnExpression(spritePath: string, rect?: { x: number, y: number, w: number, h: number }) {
    console.log(`\n--- Testing Detection on: ${spritePath} ${rect ? `(Crop: ${rect.w}x${rect.h})` : ''} ---`);
    
    if (!fs.existsSync(spritePath)) {
        console.error(`Error: File not found at ${spritePath}`);
        return;
    }

    // 1. Prepare Image (Crop if needed and pad with white background)
    let imagePipe = sharp(spritePath);
    if (rect) {
        imagePipe = imagePipe.extract({ left: rect.x, top: rect.y, width: rect.w, height: rect.h });
    }

    // FaceMesh likes 1:1 aspect ratio and enough resolution. 
    // We pad with white because expressions are often floating eyes/mouth on transparency.
    const { data: rgbData, info } = await imagePipe
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255 } }) 
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
        
    const tensor = tf.tensor3d(new Uint8Array(rgbData), [info.height, info.width, 3], 'int32');

    // 2. Run FaceMesh
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true
    });

    const faces = await detector.estimateFaces(tensor);
    
    console.log(`Detection Result: ${faces.length} face(s) found.`);
    
    if (faces.length > 0) {
        const face = faces[0];
        const k = face.keypoints;
        
        // Map some useful landmarks
        const landmarks = {
            nose_tip: k[1],
            left_eye: k[33],
            right_eye: k[263],
            mouth_top: k[0],
            mouth_bottom: k[17],
            chin: k[152]
        };
        
        console.log('Landmarks (relative to 512x512 canvas):');
        console.table(landmarks);
        console.log('✅ SUCCESS: FaceMesh was able to interpret this expression!');
    } else {
        console.warn('❌ FAILED: No face detected. The expression might be too stylized or missing a face contour.');
    }
}

async function run() {
    await tf.ready();
    await tf.setBackend('cpu');
    
    const manifestPath = 'public/assets/expressions/female_01/asset_manifest.json';
    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const spriteSheetPath = path.join(path.dirname(manifestPath), manifest.source_image);
        
        // Test on the first expression (exp_female_001)
        const asset = manifest.assets[0];
        const firstFrame = asset.sprites[0];
        
        await detectOnExpression(spriteSheetPath, { 
            x: firstFrame.x, 
            y: firstFrame.y, 
            w: firstFrame.w, 
            h: firstFrame.h 
        });

        // Test on a few more random ones
        if (manifest.assets.length > 10) {
            const asset10 = manifest.assets[10];
            await detectOnExpression(spriteSheetPath, { 
                x: asset10.sprites[0].x, 
                y: asset10.sprites[0].y, 
                w: asset10.sprites[0].w, 
                h: asset10.sprites[0].h 
            });
        }
    } else {
        console.error("No ingested assets found. Run asset_ingestor.py first.");
    }
}

run().catch(console.error);
