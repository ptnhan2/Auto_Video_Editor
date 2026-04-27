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
    description: 'Humanoid character with green screen.',
    examplePrompt: 'A brave knight in silver armor',
    rules: `
    **BACKGROUND:** Solid Industrial Green Screen (HEX **#00FF00**).
    **ITEMS**: wind blowing through hair.
    **OUTPUT:** Single character, full body, weight shifted to one leg, perspective from slightly below. 
    ### CRITICAL REMINDERS: The green screen (#00FF00) must be pure and unshadowed.
    `
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
  styleReferenceImageUrl?: string; // DEPRECATED in V3: Using global style anchors
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
    
    const ext = path.extname(resolvedPath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';

    return {
        mime_type: mimeType,
        data: buffer.toString('base64')
    };
}

export async function generateAssetWithBlueprint(
  request: NanoBananaGenerationRequest
): Promise<NanoBananaGenerationResponse> {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  // CHUYỂN SANG MODEL FLASH 3.1 ĐỂ TRÁNH TIMEOUT BỊ TREO DO QUÁ TẢI SERVER
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

  if (!apiKey) {
    throw new Error("Missing NANO_BANANA_API_KEY in environment variables");
  }

  // Lookup blueprint rules
  const blueprint = ASSET_BLUEPRINTS[request.blueprintId as keyof typeof ASSET_BLUEPRINTS];
  if (!blueprint) {
    throw new Error(`Blueprint not found: ${request.blueprintId}`);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    let loadedStyleImagesCount = 0;

    // 1. Load all 5 Style Anchors from public/references
    const styleRefs = [
      'public/references/ref001.jpg',
      'public/references/ref002.jpg',
      'public/references/ref003.jpg',
      'public/references/ref004.jpg',
      'public/references/ref005.jpg'
    ];

    for (const refPath of styleRefs) {
      const resolvedPath = path.resolve(process.cwd(), refPath);
      if (fs.existsSync(resolvedPath)) {
        // Resize image to reduce payload size and prevent API timeouts
        const buffer = await sharp(resolvedPath)
            .resize(512, 512, { fit: 'inside', withoutEnlargement: true }) // THU NHỎ THÊM ĐỂ TRÁNH LỖI MẠNG
            .jpeg({ quality: 70 })
            .toBuffer();
            
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: buffer.toString('base64')
          }
        });
        loadedStyleImagesCount++;
      }
    }

    // 2. Prepare Pose Reference if requested
    const poseData = request.referenceImageUrl ? await prepareImageData(request.referenceImageUrl) : null;
    
    if (poseData) {
        parts.push({ inline_data: poseData }); // Append pose image AFTER style images
    }

    console.log(`Calling Gemini API with blueprint: ${blueprint.id}. Using ${loadedStyleImagesCount} style anchors.`);
    
    // 3. Construct the Structured Prompt
    let poseInstruction = "";
    if (poseData) {
        poseInstruction = `\n5. The LAST attached image (Image #${loadedStyleImagesCount + 1}) is a POSE REFERENCE. Strictly replicate the pose from this final image for the subject.`;
    }

    parts.push({ 
      text: `You are an expert digital artist and character rigger. Your task is to draw the following subject:

### 1. SUBJECT CONTENT (CORE FOCUS)
${request.prompt || "Generate the requested asset."}

### 2. ART STYLE & COLOR (FROM STYLE REFERENCES)
1. Analyze the first ${loadedStyleImagesCount} attached images. These are your STYLE REFERENCES.
2. CRITICAL: Do NOT copy the characters, subjects, or specific clothing from these Style References.
3. You MUST extract ONLY the artistic style, brushstrokes, color grading, shading technique, and overall "vibe" from these references and apply it to the SUBJECT CONTENT.
4. The final image must look exactly as if it was drawn by the same artist who drew the Style References.${poseInstruction}

### 3. TECHNICAL RULES
${blueprint.rules}` 
    });

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
