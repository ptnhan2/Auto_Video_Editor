import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateAssetWithBlueprint, ASSET_BLUEPRINTS } from '../../src/lib/nano-banana-v2';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// CONFIGURATION
const ACTIVE_BLUEPRINT = 'humanoid';
const ASSET_ID = 'char_002';

// Dynamic prompt loading
const blueprint = ASSET_BLUEPRINTS[ACTIVE_BLUEPRINT as keyof typeof ASSET_BLUEPRINTS];
const PROMPT = blueprint?.rules || 'A brave knight in silver armor';

/**
 * Core script for generating assets using blueprints.
 * This can be updated to loop over a JSON list in the future.
 */
async function runAssetGen() {
  console.log(`--- CORE ASSET GEN: ${ACTIVE_BLUEPRINT} | ${ASSET_ID} ---`);
  console.log(`Example Prompt: ${blueprint?.examplePrompt}`);
  console.log(`Rules (Prompt): ${PROMPT}`);
  
  const request = {
    prompt: PROMPT, 
    blueprintId: ACTIVE_BLUEPRINT,
    referenceImageUrl: "local://blueprints/humanoid-3-4-v1.svg",
    styleReferenceImageUrl: "local://blueprints/design-style.png",
    strength: 1.0, 
  };

  try {
    const result = await generateAssetWithBlueprint(request);
    
    if (result.imageUrl.startsWith('data:image')) {
      const base64Data = result.imageUrl.split(',')[1];
      const outputPath = path.resolve(process.cwd(), `public/assets/${ACTIVE_BLUEPRINT}/${ASSET_ID}/base.png`);
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
      console.log(`\n--- SUCCESS ---`);
      console.log(`Asset saved to: ${outputPath}`);
    } else {
        console.error("No valid image data returned from API.");
    }
  } catch (error) {
    console.error("\n--- GENERATION FAILED ---");
    console.error(error);
  }
}

runAssetGen();
