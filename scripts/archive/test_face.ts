import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as poseDetection from '@tensorflow-models/pose-detection';

async function test(imagePath: string) {
    const { data: rgbData, info } = await sharp(imagePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const tensor = tf.tensor3d(new Uint8Array(rgbData), [info.height, info.width, 3], 'int32');
    
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
    });
    
    const poses = await detector.estimatePoses(tensor);
    console.log(`[${imagePath}] Detected poses: ${poses.length}`);
    if (poses.length > 0) {
        const k = poses[0].keypoints;
        console.log('Nose:', k.find(p => p.name === 'nose'));
        console.log('L Eye:', k.find(p => p.name === 'left_eye'));
        console.log('R Eye:', k.find(p => p.name === 'right_eye'));
        console.log('L Ear:', k.find(p => p.name === 'left_ear'));
        console.log('R Ear:', k.find(p => p.name === 'right_ear'));
    }
}

async function run() {
    await tf.ready();
    await tf.setBackend('cpu');
    await test('public/assets/humanoid/char_001/base.png');
}

run().catch(console.error);