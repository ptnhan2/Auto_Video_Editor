export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export interface Keyframe {
  frame: number;
  rotation: number;
  rotationY?: number;
  easing?: EasingType;
  x?: number;
  y?: number;
  zIndex?: number;
  ikTarget?: { x: number; y: number };
  assetId?: string; // Used for swapping expressions/sprites
}

export interface Track {
  keyframes: Keyframe[];
  constraints?: { min: number; max: number };
}

export interface Action {
  id: string;
  name: string;
  loop: boolean;
  durationFrames: number;
  fps: number;
  tracks: Record<string, Track>;
}
