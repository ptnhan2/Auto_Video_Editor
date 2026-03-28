import fs from 'fs';
import path from 'path';

const ACTIVE_BLUEPRINT = 'humanoid';
const ASSET_ID = 'char_001';
const PARTS_DIR = `public/assets/${ACTIVE_BLUEPRINT}/${ASSET_ID}/parts`;
const OUTPUT_HTML = 'test_rig.html';

async function buildHtml() {
    const pivotsPath = path.join(PARTS_DIR, 'pivots.json');
    if (!fs.existsSync(pivotsPath)) {
        console.error('pivots.json not found');
        return;
    }

    const pivots = JSON.parse(fs.readFileSync(pivotsPath, 'utf8'));

    // To make this easily runnable without a web server, we embed the JSON directly.
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Rig Test</title>
    <style>
        body { margin: 0; background: #333; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; }
        canvas { background: #222; margin-top: 20px; border: 1px solid #555; }
        .controls { margin-top: 20px; display: flex; gap: 20px; }
    </style>
</head>
<body>
    <h1>Rig Visualization</h1>
    <div class="controls">
        <label><input type="range" id="angleHead" min="-180" max="180" value="0"> Head</label>
        <label><input type="range" id="angleTorso" min="-180" max="180" value="0"> Torso</label>
        <label><input type="range" id="angleRightShoulder" min="-180" max="180" value="0"> Right Shoulder</label>
        <label><input type="range" id="angleLeftShoulder" min="-180" max="180" value="0"> Left Shoulder</label>
        <label><input type="range" id="angleRightElbow" min="-180" max="180" value="0"> Right Elbow</label>
        <label><input type="range" id="angleLeftElbow" min="-180" max="180" value="0"> Left Elbow</label>
        <label><input type="range" id="angleRightThigh" min="-180" max="180" value="0"> Right Thigh</label>
        <label><input type="range" id="angleLeftThigh" min="-180" max="180" value="0"> Left Thigh</label>
        <label><input type="range" id="angleRightKnee" min="-180" max="180" value="0"> Right Knee</label>
        <label><input type="range" id="angleLeftKnee" min="-180" max="180" value="0"> Left Knee</label>
    </div>
    <canvas id="canvas" width="1024" height="1024"></canvas>

    <script>
        const pivots = ${JSON.stringify(pivots)};
        const partsDir = '${PARTS_DIR.replace(/\\/g, '/')}';
        
        const hierarchy = {
            'torso': ['head', 'right_upper_arm', 'left_upper_arm', 'right_thigh', 'left_thigh'],
            'right_upper_arm': ['right_lower_arm'],
            'left_upper_arm': ['left_lower_arm'],
            'right_thigh': ['right_calf'],
            'left_thigh': ['left_calf'],
            'head': [],
            'right_lower_arm': [],
            'left_lower_arm': [],
            'right_calf': [],
            'left_calf': []
        };

        const drawOrder = [
            'torso',
            'head',
            'left_thigh',
            'left_calf',
            'left_upper_arm',
            'left_lower_arm',
            'right_thigh',
            'right_calf',
            'right_upper_arm',
            'right_lower_arm'
        ];

        const partsData = {};
        let loadedImages = 0;
        const totalImages = Object.keys(pivots).length;

        Object.keys(pivots).forEach(partName => {
            const img = new Image();
            img.src = partsDir + '/' + partName + '.png';
            img.onload = () => {
                const data = pivots[partName];
                // Use actual localX/localY from pivots.json, fallback to calculation if missing
                const trueLocalX = data.localX !== undefined ? data.localX : (data.x * img.width);
                const trueLocalY = data.localY !== undefined ? data.localY : (data.y * img.height);

                partsData[partName] = {
                    img: img,
                    globalX: data.globalX,
                    globalY: data.globalY,
                    localX: trueLocalX,
                    localY: trueLocalY,
                    globalPivotX: data.globalX + trueLocalX,
                    globalPivotY: data.globalY + trueLocalY,
                    rotation: 0
                };
                
                loadedImages++;
                if (loadedImages === totalImages) {
                    draw();
                }
            };
        });

        // Test rotations (in radians)
        const rotations = {
            'head': 0,
            'torso': 0,
            'right_upper_arm': 0,
            'left_upper_arm': 0,
            'right_lower_arm': 0,
            'left_lower_arm': 0,
            'right_thigh': 0,
            'left_thigh': 0,
            'right_calf': 0,
            'left_calf': 0
        };

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply slider values
            rotations['head'] = document.getElementById('angleHead').value * Math.PI / 180;
            rotations['torso'] = document.getElementById('angleTorso').value * Math.PI / 180;
            rotations['right_upper_arm'] = document.getElementById('angleRightShoulder').value * Math.PI / 180;
            rotations['left_upper_arm'] = document.getElementById('angleLeftShoulder').value * Math.PI / 180;
            rotations['right_lower_arm'] = document.getElementById('angleRightElbow').value * Math.PI / 180;
            rotations['left_lower_arm'] = document.getElementById('angleLeftElbow').value * Math.PI / 180;
            rotations['right_thigh'] = document.getElementById('angleRightThigh').value * Math.PI / 180;
            rotations['left_thigh'] = document.getElementById('angleLeftThigh').value * Math.PI / 180;
            rotations['right_calf'] = document.getElementById('angleRightKnee').value * Math.PI / 180;
            rotations['left_calf'] = document.getElementById('angleLeftKnee').value * Math.PI / 180;

            // Pre-calculate world matrices/transforms
            const worldTransforms = {};

            function computeTransforms(partName, parentWorldX, parentWorldY, parentWorldRotation) {
                const part = partsData[partName];
                if (!part) return;

                const localRot = rotations[partName] || 0;
                const totalRot = parentWorldRotation + localRot;

                // Position of this part's pivot in parent's coordinate space
                const px = part.globalPivotX - (partsData[getParent(partName)]?.globalPivotX || part.globalPivotX);
                const py = part.globalPivotY - (partsData[getParent(partName)]?.globalPivotY || part.globalPivotY);

                // Rotate pivot offset by parent's world rotation
                const cos = Math.cos(parentWorldRotation);
                const sin = Math.sin(parentWorldRotation);
                const rx = px * cos - py * sin;
                const ry = px * sin + py * cos;

                const worldPivotX = parentWorldX + (getParent(partName) ? rx : 0);
                const worldPivotY = parentWorldY + (getParent(partName) ? ry : 0);

                worldTransforms[partName] = {
                    x: worldPivotX,
                    y: worldPivotY,
                    rotation: totalRot
                };

                const children = hierarchy[partName] || [];
                for (const childName of children) {
                    computeTransforms(childName, worldPivotX, worldPivotY, totalRot);
                }
            }

            function getParent(name) {
                for (const parent in hierarchy) {
                    if (hierarchy[parent].includes(name)) return parent;
                }
                return null;
            }

            const root = 'torso';
            if (partsData[root]) {
                computeTransforms(root, partsData[root].globalPivotX, partsData[root].globalPivotY, 0);
            }

            // Draw in drawOrder
            for (const partName of drawOrder) {
                const transform = worldTransforms[partName];
                const part = partsData[partName];
                if (!transform || !part) continue;

                ctx.save();
                ctx.translate(transform.x, transform.y);
                ctx.rotate(transform.rotation);
                ctx.drawImage(part.img, -part.localX, -part.localY);
                
                // Draw pivot point for debugging
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }

        document.getElementById('angleHead').addEventListener('input', draw);
        document.getElementById('angleTorso').addEventListener('input', draw);
        document.getElementById('angleRightShoulder').addEventListener('input', draw);
        document.getElementById('angleLeftShoulder').addEventListener('input', draw);
        document.getElementById('angleRightElbow').addEventListener('input', draw);
        document.getElementById('angleLeftElbow').addEventListener('input', draw);
        document.getElementById('angleRightThigh').addEventListener('input', draw);
        document.getElementById('angleLeftThigh').addEventListener('input', draw);
        document.getElementById('angleRightKnee').addEventListener('input', draw);
        document.getElementById('angleLeftKnee').addEventListener('input', draw);

    </script>
</body>
</html>
    `;

    fs.writeFileSync(OUTPUT_HTML, htmlContent);
    console.log("Successfully created " + OUTPUT_HTML + ". Open it in your browser to test the rig.");
}

buildHtml().catch(console.error);
