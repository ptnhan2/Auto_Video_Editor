export interface TripleScript {
  audio: AudioSegment[];
  visual: VisualSegment[];
  persona: PersonaSegment[];
  moderation?: ContentModerationResult;
}

export interface ContentModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  flaggedSegments: {
    layer: 'audio' | 'visual' | 'persona';
    id: string;
    categories: string[];
  }[];
}

export interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speakerId: string;
  metadata?: {
    tone?: string;
    emotion?: string;
    volume?: number;
    speed?: number;
  };
}

export interface VisualSegment {
  id: string;
  startTime: number;
  endTime: number;
  description: string;
  sceneType?: string;
  backgroundId?: string;
  cameraMovement?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PersonaSegment {
  id: string;
  startTime: number;
  endTime: number;
  characterId: string;
  action: string;
  emotion: string;
  position?: {
    x: number;
    y: number;
    scale: number;
  };
  metadata?: Record<string, string | number | boolean | null>;
}
