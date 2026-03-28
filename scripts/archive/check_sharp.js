const sharp = require('sharp');
(async () => {
    const image = Buffer.alloc(100 * 100 * 4, 0); // Transparent
    for (let y = 20; y < 80; y++) {
        for (let x = 20; x < 80; x++) {
            const idx = (y * 100 + x) * 4;
            image[idx] = 255; image[idx+1] = 0; image[idx+2] = 0; image[idx+3] = 255;
        }
    }
    const { info } = await sharp(image, { raw: { width: 100, height: 100, channels: 4 } })
        .trim()
        .toBuffer({ resolveWithObject: true });
    console.log(JSON.stringify(info));
})();
