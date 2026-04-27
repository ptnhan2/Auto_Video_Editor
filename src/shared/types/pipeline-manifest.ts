import { z } from "zod";

// ==========================================
// TRẠM 0: THE INGESTOR (Core Script)
// ==========================================

export const ShotSchema = z.object({
  shotId: z.string(),
  speaker: z.string(),
  dialogue: z.string(),
  tone: z.string(),
});

export const SceneSchema = z.object({
  sceneId: z.string(),
  location: z.string(),
  timeOfDay: z.string(),
  shots: z.array(ShotSchema),
});

export const CoreScriptSchema = z.object({
  documentId: z.string(),
  characters_present: z.array(z.string()),
  locations_present: z.array(z.string()),
  scenes: z.array(SceneSchema),
});

export type CoreScript = z.infer<typeof CoreScriptSchema>;

// ==========================================
// TRẠM 1: THE CASTER (Casting Map)
// ==========================================

export const CastingMapSchema = z.record(
  z.string(), // Original Name from CoreScript (e.g., "Nam_Chinh")
  z.string()  // Semantic Asset ID from Registry (e.g., "char_male_01")
);

export type CastingMap = z.infer<typeof CastingMapSchema>;

// ==========================================
// TRẠM 2: THE AUDIO ENGINEER (Audio Track)
// ==========================================

export const WordTimestampSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export const AudioTrackSchema = z.object({
  id: z.string(),
  speakerId: z.string(), // Original Name from CoreScript
  text: z.string(),
  actualDuration: z.number().nullable(), // Filled after TTS generation
  media: z.object({
    audioUrl: z.string().nullable(),
    wordTimestamps: z.array(WordTimestampSchema).optional(),
  }).optional(),
});

export type AudioTrack = z.infer<typeof AudioTrackSchema>;

// ==========================================
// TRẠM 3: THE VISUAL & PERSONA DIRECTOR
// ==========================================

export const CameraWorkSchema = z.object({
  type: z.enum(["static", "pan_left", "pan_right", "zoom_in", "zoom_out"]),
  duration: z.number().optional(), // If not provided, it spans the entire syncDependency
});

export const VisualTrackSchema = z.object({
  id: z.string(),
  backgroundId: z.string(), // Semantic Asset ID from CastingMap
  cameraWork: CameraWorkSchema,
  syncDependency: z.array(z.string()), // Array of AudioTrack IDs to anchor to
});

export const PersonaTrackSchema = z.object({
  id: z.string(),
  characterId: z.string(), // Semantic Asset ID from CastingMap
  positionGrid: z.enum([
    "back_left", "back_center", "back_right",
    "mid_left", "mid_center", "mid_right",
    "front_left", "front_center", "front_right",
    "offscreen"
  ]),
  facing: z.enum(["left", "right"]).optional(),
  actionId: z.string(), // E.g., "talk_normal", "walk", "idle"
  expressionTag: z.string(), // E.g., "happy", "angry"
  syncDependency: z.array(z.string()), // Array of AudioTrack IDs to anchor to
});

export type VisualTrack = z.infer<typeof VisualTrackSchema>;
export type PersonaTrack = z.infer<typeof PersonaTrackSchema>;

// ==========================================
// THE FINAL RENDER MANIFEST (SSoT)
// ==========================================

export const FinalRenderScriptSchema = z.object({
  documentId: z.string(),
  castingMap: CastingMapSchema,
  videoTracks: z.object({
    audio: z.array(AudioTrackSchema),
    visual: z.array(VisualTrackSchema),
    persona: z.array(PersonaTrackSchema),
  }),
});

export type FinalRenderScript = z.infer<typeof FinalRenderScriptSchema>;
