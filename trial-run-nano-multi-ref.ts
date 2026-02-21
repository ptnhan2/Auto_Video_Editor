import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { generateCharacterWithBlueprint } from './src/lib/nano-banana';

async function runMultiRefDemo() {
  console.log("--- MULTI-REFERENCE DEMO: POSE + STYLE ---");
  console.log("Goal: Use FIRST image for POSE (Blueprint) and SECOND image for STYLE reference.");
  
  const demoRequest = {
    prompt: "", // ZERO prompt: All info comes from reference images
    blueprintId: "pose-style-mix",
    referenceImageUrl: "local://blueprints/humanoid-3-4-v1.svg", // POSE REF
    styleReferenceImageUrl: "local://blueprints/design-style.png", // STYLE REF (Using previous output as style)
    strength: 1.0, 
  };

  try {
    console.log("Requesting generation with Dual-Reference Control...");
    const result = await generateCharacterWithBlueprint(demoRequest);
    
    if (result.imageUrl.startsWith('data:image')) {
      const base64Data = result.imageUrl.split(',')[1];
      const outputPath = path.resolve(process.cwd(), 'public/assets/characters/pubpet.png');
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
      console.log(`\n--- SUCCESS ---`);
      console.log(`Mixed Result saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error("\n--- FAILED ---");
    console.error(error);
  }
}

runMultiRefDemo();
