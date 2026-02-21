import { VectorizerService } from './services/vectorizer';
import { RiggerService } from './services/rigger';
import { Character, useCharacterLibraryStore } from './character-store';

export class CharacterPipeline {
  /**
   * Executes the full pipeline: SAM -> Vectorization -> Rigging.
   */
  static async processNewCharacter(imageBuffer: Buffer, name: string, blueprintData?: any): Promise<Character> {
    const modalUrl = process.env.MODAL_SAM_URL;
    console.log(`📡 Connecting to Modal SAM at: ${modalUrl}`);
    
    let masks: Record<string, string> = {};
    const mockPartIds = ["head", "torso", "left_arm", "right_arm", "left_leg", "right_leg"];
    
    if (modalUrl) {
      const response = blueprintData
        ? await fetch(modalUrl, {
            method: "POST",
            body: JSON.stringify({
              image: imageBuffer.toString('base64'),
              blueprint: blueprintData.anatomy
            }),
            headers: { "Content-Type": "application/json" }
          })
        : await fetch(modalUrl, {
            method: "POST",
            body: new Uint8Array(imageBuffer),
            headers: { "Content-Type": "application/octet-stream" }
          });
          
      const text = await response.text();
      console.log(`DEBUG: Raw response from Modal: ${text.substring(0, 200)}...`);
      masks = JSON.parse(text);
      console.log(`✅ Received ${Object.keys(masks).length} masks from SAM.`);
    } else {
      console.warn("⚠️ MODAL_SAM_URL not set, using image fallbacks.");
    }

    const partEntries = Object.entries(masks);
    const hasSmartMasks = partEntries.length > 0;
    
    // 2. Vectorization & Part Generation
    const vectorizedParts = hasSmartMasks 
      ? await Promise.all(
          partEntries.map(async ([id, base64]) => {
            const partBuffer = Buffer.from(base64, 'base64');
            return {
              id,
              svgPath: await VectorizerService.vectorizeMask(partBuffer, id)
            };
          })
        )
      : await Promise.all(
          mockPartIds.map(async (id) => {
            return {
              id,
              svgPath: await VectorizerService.vectorizeMask(imageBuffer, id)
            };
          })
        );

    const activePartIds = hasSmartMasks ? partEntries.map(([id]) => id) : mockPartIds;
    const svgContent = VectorizerService.combineToSVG(vectorizedParts, 1000, 1000);

    // 3. Auto-Rigging
    const skeleton = RiggerService.generateSkeleton(activePartIds);

    const character: Character = {
      id: Math.random().toString(36).substring(7),
      name,
      svgContent,
      skeleton,
    };

    // Add to library store
    useCharacterLibraryStore.getState().addCharacter(character);

    return character;
  }
}
