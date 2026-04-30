import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateAssetWithBlueprint, ASSET_BLUEPRINTS } from '../../shared/api_clients/nano-banana-v3';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// CONFIGURATION: Support CLI arguments
const ACTIVE_BLUEPRINT = process.argv[2] || 'humanoid';
const ASSET_ID = process.argv[3] || 'char_002';

// BẠN PASTE NỘI DUNG MIÊU TẢ NHÂN VẬT VÀO BIẾN NÀY (THAY THẾ ĐOẠN TEXT MẪU):
const CUSTOM_PROMPT = process.argv[4] || "A young man";

// Dynamic prompt loading
const blueprint = ASSET_BLUEPRINTS[ACTIVE_BLUEPRINT as keyof typeof ASSET_BLUEPRINTS];

// Tách biệt Style và Content
// Thêm yêu cầu tạo nền xanh (Green Screen) để dễ dàng bóc tách nếu không dùng rigging nữa
const GLOBAL_STYLE_PROMPT = blueprint?.rules || 'Anime style, flat colors, clear lineart, cel shading';
const GREEN_SCREEN_PROMPT = 'solid bright green background, #00FF00, no shadows on the background, easy to chroma key';
const PROMPT = CUSTOM_PROMPT ? `${CUSTOM_PROMPT}, ${GLOBAL_STYLE_PROMPT}, ${GREEN_SCREEN_PROMPT}` : `${GLOBAL_STYLE_PROMPT}, ${GREEN_SCREEN_PROMPT}`;

/**
 * Core script for generating assets using blueprints.
 */
async function runAssetGen() {
  console.log(`--- CORE ASSET GEN: ${ACTIVE_BLUEPRINT} | ${ASSET_ID} ---`);
  if (CUSTOM_PROMPT) {
      console.log(`Using Custom Prompt (Content) from CLI: ${CUSTOM_PROMPT}`);
      console.log(`Appended Global Style: ${GLOBAL_STYLE_PROMPT}`);
  }
  console.log(`Final Prompt: ${PROMPT}`);
  
  const request = {
    prompt: PROMPT,
    blueprintId: ACTIVE_BLUEPRINT,
    // API V3 tự động nạp 5 ảnh trong folder references/, bỏ qua styleReferenceImageUrl
    strength: 0.9,
  };

  try {
    const result = await generateAssetWithBlueprint(request);
    
    if (result.imageUrl.startsWith('data:image')) {
      const base64Data = result.imageUrl.split(',')[1];
      const folder = ACTIVE_BLUEPRINT === 'background' ? 'background' : ACTIVE_BLUEPRINT;
      const fileName = ACTIVE_BLUEPRINT === 'background' ? `${ASSET_ID}.jpg` : 'base.png';
      
      const outputPath = path.resolve(process.cwd(), `public/assets/${folder}/${ASSET_ID}/${fileName}`);
      
      // Special case for root-level backgrounds
      const finalOutputPath = ACTIVE_BLUEPRINT === 'background'
        ? path.resolve(process.cwd(), `public/assets/background/${ASSET_ID}.jpg`)
        : outputPath;

      const dir = path.dirname(finalOutputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(finalOutputPath, Buffer.from(base64Data, 'base64'));
      console.log(`\n--- SUCCESS ---`);
      console.log(`Asset saved to: ${finalOutputPath}`);
    } else {
        console.error("No valid image data returned from API.");
    }
  } catch (error) {
    console.error("\n--- GENERATION FAILED ---");
    console.error(error);
  }
}

runAssetGen();
