import { TripleScript, ContentModerationResult } from "@/types/script";
import { generateObject } from "ai";
import { z } from "zod";
import { primaryModel, fallbackModel } from "@/lib/vercel-ai";
import { CharacterPipeline } from "@/features/library/character-pipeline";

const tripleScriptSchema = z.object({
  audio: z.array(z.object({
    id: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    text: z.string(),
    speakerId: z.string(),
    metadata: z.object({
      tone: z.string().describe("Voice tone, e.g., 'Excited', 'Professional', 'Whisper'"),
      emotion: z.string().describe("Primary emotion, e.g., 'Happy', 'Serious', 'Anxious'"),
      volume: z.number().optional().default(1),
      speed: z.number().optional().default(1),
    }).optional(),
  })),
  visual: z.array(z.object({
    id: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    description: z.string(),
    sceneType: z.string().describe("Scene location/type, e.g., 'Office', 'Park', 'Close-up'"),
    backgroundId: z.string().optional(),
    cameraMovement: z.string().describe("Camera action, e.g., 'Static', 'Zoom-in', 'Pan-left'"),
    metadata: z.record(z.string(), z.any()).optional(),
  })),
  persona: z.array(z.object({
    id: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    characterId: z.string(),
    action: z.string().describe("Character action/gesture, e.g., 'Wave', 'Pointing', 'Thinking'"),
    emotion: z.string().describe("Facial expression, e.g., 'Smile', 'Surprised', 'Angry'"),
    position: z.object({
      x: z.number(),
      y: z.number(),
      scale: z.number(),
    }).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })),
});

export interface FailoverLog {
  timestamp: string;
  chunk: string;
  error: string;
  originalModel: string;
  fallbackModel: string;
}

export class TripleScriptEngine {
  private failoverHistory: FailoverLog[] = [];

  /**
   * Decomposes a raw script into a Triple-Script structure with automated multi-layer metadata.
   * Uses Gemini with DeepSeek fallback for resilience.
   * @param rawScript The raw text script to be decomposed.
   * @returns A promise that resolves to the TripleScript structure.
   */
  async decompose(rawScript: string, characterImage?: Buffer): Promise<TripleScript> {
    // Story 2.1 - 2.3: If a character image is provided, trigger the rigging pipeline
    if (characterImage) {
      await CharacterPipeline.processNewCharacter(characterImage, "Custom Host");
    }

    // For Story 1.5, we implement chunk-level resilience.
    // In a full implementation, we might split the script into logical scenes/chunks.
    // For now, we'll treat the whole script as one chunk or provide the mechanism for it.
    
    const script = await this.processWithFailover(rawScript);
    
    // Story 1.6: Integrate Moderation Check
    const moderation = await this.checkModeration(script);
    script.moderation = moderation;

    return script;
  }

  private async checkModeration(script: TripleScript): Promise<ContentModerationResult> {
    // Collect all text content to check
    const audioTexts = script.audio.map(a => ({ id: a.id, text: a.text, layer: 'audio' as const }));
    const visualDescriptions = script.visual.map(v => ({ id: v.id, text: v.description, layer: 'visual' as const }));
    const personaActions = script.persona.map(p => ({ id: p.id, text: `${p.action} ${p.emotion}`, layer: 'persona' as const }));

    const allSegments = [...audioTexts, ...visualDescriptions, ...personaActions];
    const combinedText = allSegments.map(s => s.text).join("\n---\n");

    try {
      // Using OpenAI Moderation API directly via fetch for simplicity/reliability if SDK is tricky
      const response = await fetch("https://api.openai.com/v1/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: combinedText }),
      });

      if (!response.ok) {
        throw new Error(`Moderation API error: ${response.statusText}`);
      }

      const result = await response.json();
      const moderationData = result.results[0];

      const contentModeration: ContentModerationResult = {
        flagged: moderationData.flagged,
        categories: moderationData.categories,
        categoryScores: moderationData.category_scores,
        flaggedSegments: [],
      };

      // If flagged, try to identify which segment is problematic
      if (moderationData.flagged) {
        // Individual check for flagged segments if the whole script is flagged
        // In a production environment, we might want to do this in parallel or
        // use a more sophisticated way to map back.
        for (const segment of allSegments) {
          const segResponse = await fetch("https://api.openai.com/v1/moderation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({ input: segment.text }),
          });
          
          if (segResponse.ok) {
            const segResult = await segResponse.json();
            if (segResult.results[0].flagged) {
              contentModeration.flaggedSegments.push({
                layer: segment.layer,
                id: segment.id,
                categories: Object.entries(segResult.results[0].categories)
                  .filter(([_, value]) => value === true)
                  .map(([key]) => key),
              });
            }
          }
        }
      }

      return contentModeration;
    } catch (error) {
      console.error("Moderation Check Failed:", error);
      // Return a non-flagged result but log the error
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
        flaggedSegments: [],
      };
    }
  }

  private async processWithFailover(chunk: string): Promise<TripleScript> {
    try {
      const { object } = await generateObject({
        model: primaryModel,
        schema: tripleScriptSchema,
        prompt: this.getPrompt(chunk),
      });
      return object as TripleScript;
    } catch (error: unknown) {
      console.warn("Primary model failed, attempting failover to DeepSeek...", error);
      
      this.logFailover(chunk, error);

      const { object } = await generateObject({
        model: fallbackModel,
        schema: tripleScriptSchema,
        prompt: this.getPrompt(chunk),
      });
      return object as TripleScript;
    }
  }

  private logFailover(chunk: string, error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const entry: FailoverLog = {
      timestamp: new Date().toISOString(),
      chunk: chunk.substring(0, 100) + (chunk.length > 100 ? "..." : ""),
      error: errorMessage || "Unknown error / Safety block",
      originalModel: "gemini-3-flash-preview",
      fallbackModel: "deepseek-chat",
    };
    this.failoverHistory.push(entry);
    // In a real app, this would be persisted to Supabase
    console.info("Failover recorded:", entry);
  }

  private getPrompt(rawScript: string): string {
    return `
        Decompose the following raw script into a Triple-Script structure with three layers: Audio, Visual, and Persona.
        
        For each segment, you MUST coordinate the metadata across layers to ensure a cohesive scene:
        
        1. Audio Layer (Voice):
           - Extract the spoken text.
           - Assign logical tone and emotion metadata that matches the context.
        
        2. Visual Layer (Scene):
           - Describe the visual environment.
           - Specify sceneType and cameraMovement.
        
        3. Persona Layer (Behavior):
           - Define character actions and facial expressions (emotions) that align with the spoken text and tone.
        
        COORDINATION RULES:
        - If the character is 'Excited' in Audio tone, the Persona action should be energetic (e.g., 'Wave', 'Jumping') and Persona emotion should be 'Big Smile'.
        - If the scene is an 'Office', ensure Visual sceneType reflects this and Persona actions are context-appropriate.
        - Timestamps (startTime, endTime) MUST be logical, sequential, and synchronized across layers where applicable.
        
        Assign unique IDs to each segment.
        
        Raw Script:
        ${rawScript}
      `;
  }

  getFailoverHistory(): FailoverLog[] {
    return this.failoverHistory;
  }
}
