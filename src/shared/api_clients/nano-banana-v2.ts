import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Technical rules for different types of assets
 */
export interface Blueprint {
  id: string;
  description: string;
  examplePrompt: string;
  rules: string;
}

export const ASSET_BLUEPRINTS: Record<string, Blueprint> = {
  humanoid: {
    id: 'humanoid',
    description: 'Humanoid character with A-pose and specific joint gaps for rigging.',
    examplePrompt: 'A brave knight in silver armor',
    rules: `1.  **POSE CONTROL:**
- Strictly replicate the pose of the **FIRST** attached image.
- Arms: Position the arms at a 45-degree angle away from the body (A-pose). There MUST be a clearly visible green gap between the upper arms and the torso.
- Hands (Asymmetric): The character's hands must show two different sides.
        * CRITICAL Left Hand: Positioned with the palm facing the viewer (Open palm facing the viewer).
        * CRITICAL Right Hand: Positioned with the back of the hand facing the viewer (5 fingers extended).
- Legs & Feet:
        * Both of the legs MUST be straight, while the torso remains facing the front.
        * FEET DISTANCE: There must be a large, dramatic horizontal distance between the two feet. They should not be close to each other.    
        * CRITICAL FEET ORIENTATION: Both feet must be shown in the same Profile View. Both left and right feet MUST have their toes (or Tip of the shoe) pointed strictly toward the LEFT side of the frame.
        * Ensure a continuous green space (negative space) between the inner thighs, preventing the baggy pants from merging at any point from the crotch down to the ankles.
2.  **DESIGN CONTROL:** Strictly adopt the character design, clothing, and color palette of the **SECOND** attached image. Full body, fully clothed.
3.  **BACKGROUND:** Solid Industrial Green Screen (HEX **#00FF00**).
4.  **OUTPUT:** Single character, centered, full body. **DO NOT** remove body parts or clothing.
5.  **CLOTHING & HAIR:**
    *   Wear pants (no skirts). NO accessories (handbags, wallets, etc.).
    *   **CRITICAL:** Hair must be styled so it **DOES NOT** touch the shoulders. There must be a clear green gap between the head/hair and the torso.
     
### CRITICAL REMINDERS:
- NO EXTRA DOTS OR MARKERS. Do not draw any floating dots or UI elements.
- The green screen (#00FF00) must be pure and unshadowed.
- Maintain the absolute green gaps at the armpits, crotch, and neck.`
  },
  background: {
    id: 'background',
    description: 'Environment or background setting.',
    examplePrompt: 'A sunset over a peaceful lake',
    rules: 'Generate a high-quality background based on the prompt. No characters.'
  },
  animal: {
    id: 'animal',
    description: 'Non-humanoid animal or creature.',
    examplePrompt: 'A majestic lion in the savanna',
    rules: 'Generate a high-quality animal based on the prompt. Centered, full body.'
  }
};

export interface NanoBananaBlueprint {
  id: string;
  name: string;
  wireframeUrl: string;
  metadata: {
    headPos: { x: number; y: number };
    torsoPos: { x: number; y: number };
    joints: string[];
  };
}

export interface NanoBananaGenerationRequest {
  prompt: string;
  blueprintId: string;
  referenceImageUrl?: string; // POSE REF (local://)
  styleReferenceImageUrl?: string; // STYLE REF (local://)
  strength: number;
}

export interface NanoBananaGenerationResponse {
  imageUrl: string;
  seed: number;
  metadata: {
    alignmentScore: number;
    processingTime: number;
  };
}

/**
 * Converts SVG to PNG buffer using Sharp
 */
async function convertSvgToPng(svgPath: string): Promise<Buffer> {
    return await sharp(svgPath).png().toBuffer();
}

/**
 * Helper to prepare image data for Gemini API
 */
async function prepareImageData(imagePath: string): Promise<{ mime_type: string, data: string }> {
    const localPath = imagePath.replace("local://", "public/");
    const resolvedPath = path.resolve(process.cwd(), localPath);
    
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Reference Image not found at: ${resolvedPath}`);
    }

    let buffer: Buffer;
    if (resolvedPath.endsWith('.svg')) {
        buffer = await convertSvgToPng(resolvedPath);
    } else {
        buffer = fs.readFileSync(resolvedPath);
    }
    
    return {
        mime_type: "image/png",
        data: buffer.toString('base64')
    };
}

export async function generateAssetWithBlueprint(
  request: NanoBananaGenerationRequest
): Promise<NanoBananaGenerationResponse> {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

  if (!apiKey) {
    throw new Error("Missing NANO_BANANA_API_KEY in environment variables");
  }

  // Lookup blueprint rules
  const blueprint = ASSET_BLUEPRINTS[request.blueprintId as keyof typeof ASSET_BLUEPRINTS];
  if (!blueprint) {
    throw new Error(`Blueprint not found: ${request.blueprintId}`);
  }

  try {
    // 1. Prepare Pose Reference
    const poseData = request.referenceImageUrl ? await prepareImageData(request.referenceImageUrl) : null;
    
    // 2. Prepare Style Reference
    const styleData = request.styleReferenceImageUrl ? await prepareImageData(request.styleReferenceImageUrl) : null;

    console.log(`Calling Gemini API with blueprint: ${blueprint.id}...`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [
      { text: `### ROLE:
Expert digital artist and character rigger.

### TASK:
${request.prompt || "Generate the requested asset."}

### TECHNICAL RULES:
${blueprint.rules}` }
    ];

    if (poseData) {
        parts.push({ inline_data: poseData }); // Image 1 = Pose
    }

    if (styleData) {
        parts.push({ inline_data: styleData }); // Image 2 = Style
    }

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
            temperature: 0.0,
            candidateCount: 1,
            imageConfig: {
              aspectRatio: "1:1"
            }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedImageData = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)?.inlineData?.data;

    return {
      imageUrl: generatedImageData ? `data:image/png;base64,${generatedImageData}` : "https://example.com/no-image-returned.png",
      seed: 0,
      metadata: { alignmentScore: 1.0, processingTime: 0 },
    };
  } catch (error) {
    console.error("Error in generateAssetWithBlueprint:", error);
    throw error;
  }
}
