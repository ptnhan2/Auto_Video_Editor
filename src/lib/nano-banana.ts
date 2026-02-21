import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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
  referenceImageUrl: string; // POSE REF (local://)
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

export async function generateCharacterWithBlueprint(
  request: NanoBananaGenerationRequest
): Promise<NanoBananaGenerationResponse> {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

  if (!apiKey) {
    throw new Error("Missing NANO_BANANA_API_KEY in environment variables");
  }

  try {
    // 1. Prepare Pose Reference
    const poseData = await prepareImageData(request.referenceImageUrl);
    
    // 2. Prepare Style Reference
    const styleData = request.styleReferenceImageUrl ? await prepareImageData(request.styleReferenceImageUrl) : null;

    console.log(`Calling Gemini 3 Pro with ZERO SEMANTIC PROMPT (Pure Visual Control)...`);
    
    const parts = [
//         { text: `IMAGE GENERATION TASK:
// 1. POSE CONTROL: You MUST strictly replicate the skeletal pose and body structure of the FIRST attached image.
// 2. DESIGN CONTROL: You MUST strictly adopt the art style, character design, clothing aesthetic, and color palette of the SECOND attached image.
// 3. BACKGROUND: You MUST use a solid Industrial Green Screen background (HEX #00FF00) for professional chroma keying.
// 4. OUTPUT: Single character, centered, full body.
// 5. The character must wear pants, not a skirt, Do not wear accessories (e.g., wallet, briefcase, handbag, etc.).
// 6. Draw green lines around the following elements: the face, the armpits, and the cut-out section between the legs and the torso.
// 7. NO CREATIVITY: Do not add or change any pose or style elements beyond the two reference images.` },
{text: `

### IMAGE GENERATION TASK:

1.  **POSE CONTROL:** 
- Strictly replicate the pose of the **FIRST** attached image.
- Arms: Position the arms at a 45-degree angle away from the body (A-pose). There MUST be a clearly visible green gap between the upper arms and the torso.
- Hands (Asymmetric): The character's hands must show two different sides.
        * CRITICAL Left Hand: Positioned with the palm facing the viewer ( Open palm facing the viewer).
        * CRITICAL Right Hand: Positioned with the back of the hand facing the viewer (Back of the hand facing the viewer - 5 fingers extended)
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
    *   NECK SEPARATION: NO LINE FOR THE NECK, Ensure a visible green gap between the base of the chin and the top of the neck/collar to facilitate head detachment.
     
6.  **TECHNICAL MARKERS (OFFSET OVERLAY):** Draw EXACTLY 8 small, solid, circular **Bright Magenta (HEX #FF00FF)** dots (5 pixels in diameter). 
    *   **Dot 1 (Sub-Chin):** Floating exactly 5 pixels directly **below** the center of the chin.
    *   **Dots 2 & 3 (Shoulder Anchors):** Floating exactly 5 pixels directly **above** the highest point of each shoulder.
    *   **Dots 4 & 5 (Armpit Anchors):** Floating in the green space of the armpits, centered between the arm and the torso, not touching either.
    *   **Dot 6 (Crotch Anchor):** Floating precisely at the vertex of the crotch, exactly 5 pixels at the junction where the inner thighs meet the base of the torso. DO NOT place this dot at the bottom of image, it should be at the crotch vertex.
    *   **Dot 7 (Left Hand Terminal): Place ONLY ONE dot floating outward from the tip of the middle finger of the LEFT HAND. It must be a horizontal extension of the arm axis. Ignore the thumb.
    *   **Dot 8 (Right Hand Terminal): Place ONLY ONE dot floating outward from the tip of the middle finger of the RIGHT HAND. It must be a horizontal extension of the arm axis. Ignore the thumb.
7.  **STRICT RULE:** ONLY 8 dots and All 8 Magenta dots must be perfectly visible against the green background. The character's body, skin, and clothes must remain 100% intact and untouched by these markers.
8.  **NO CREATIVITY:** Follow these technical coordinate instructions with 100% precision.

### CHECK MOST IMPORTAN TASKS:
    * CRITICAL Left Hand: Positioned with the palm facing the viewer ( Open palm facing the viewer).
    * CRITICAL Right Hand: Positioned with the back of the hand facing the viewer (Back of the hand facing the viewer - 5 fingers extended)
    * CRITICAL FEET ORIENTATION: Both feet must be shown in the same Profile View. Both left and right feet MUST have their toes (or Tip of the shoe) pointed strictly toward the LEFT side of the frame.
    * CRITICAL Hair must be styled so it **DOES NOT** touch the shoulders. There must be a clear green gap between the head/hair and the torso.
    * NECK SEPARATION: NO LINE FOR THE NECK, Ensure a visible green gap between the base of the chin and the top of the neck/collar to facilitate head detachment.
`},
        { inline_data: poseData } // Image 1 = Pose
    ];

    if (styleData) {
        parts.push({ inline_data: styleData }); // Image 2 = Style
    }

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
            temperature: 0.0, // Absolute adherence
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
    const generatedImageData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    return {
      imageUrl: generatedImageData ? `data:image/png;base64,${generatedImageData}` : "https://example.com/no-image-returned.png",
      seed: 0,
      metadata: { alignmentScore: 1.0, processingTime: 0 },
    };
  } catch (error) {
    console.error("Error in generateCharacterWithBlueprint:", error);
    throw error;
  }
}
