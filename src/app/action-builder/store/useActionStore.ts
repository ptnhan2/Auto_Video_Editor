import { create } from 'zustand';
import { Action, Keyframe } from '../../../shared/types/animation';
import { ManualPose } from '../../../../remotion/components/HumanoidSprite';

interface ActionBuilderState {
  currentFrame: number;
  currentPose: ManualPose;
  durationFrames: number;
  // Keyframes: Frame Number -> Pose
  keyframes: Record<number, ManualPose>;
  
  // Actions
  updatePose: (
    part: string,
    values: Partial<{
      rotation: number;
      rotationY: number;
      x: number;
      y: number;
      assetId: string;
    }>
  ) => void;
  recordKeyframe: () => void;
  removeKeyframe: (frame: number) => void;
  clearTimeline: () => void;
  seek: (frame: number) => void;
  setDurationFrames: (frames: number) => void;
  importAction: (action: Action) => void;
  exportAction: () => string;
  activeAction: Action | null;
  isLooping: boolean;
  setIsLooping: (loop: boolean) => void;
}

// Helper to interpolate between two poses
function interpolatePose(poseA: ManualPose, poseB: ManualPose, progress: number): ManualPose {
  const result: ManualPose = {};
  const allParts = new Set([...Object.keys(poseA), ...Object.keys(poseB)]);
  
  allParts.forEach(part => {
    const a = poseA[part] || { rotation: 0, rotationY: 0, x: 0, y: 0 };
    const b = poseB[part] || { rotation: 0, rotationY: 0, x: 0, y: 0 };
    result[part] = {
      rotation: a.rotation! + (b.rotation! - a.rotation!) * progress,
      rotationY: a.rotationY! + (b.rotationY! - a.rotationY!) * progress,
      x: a.x! + (b.x! - a.x!) * progress,
      y: a.y! + (b.y! - a.y!) * progress,
    };
  });
  return result;
}

export const useActionStore = create<ActionBuilderState>((set, get) => ({
  currentFrame: 0,
  currentPose: {},
  durationFrames: 60,
  keyframes: {},
  activeAction: null,
  isLooping: true,

  updatePose: (part, values) => {
    set((state) => ({
      currentPose: {
        ...state.currentPose,
        [part]: {
          ...(state.currentPose[part] || { rotation: 0, rotationY: 0, x: 0, y: 0 }),
          ...values,
        },
      },
    }));
  },

  recordKeyframe: () => {
    const { currentFrame, currentPose, keyframes } = get();
    set({
      keyframes: {
        ...keyframes,
        [currentFrame]: structuredClone(currentPose),
      },
    });
  },

  removeKeyframe: (frame) => {
    set((state) => {
      const newKeyframes = { ...state.keyframes };
      delete newKeyframes[frame];
      return { keyframes: newKeyframes };
    });
  },

  clearTimeline: () => {
    set({ keyframes: {}, currentFrame: 0, currentPose: {}, durationFrames: 60, activeAction: null });
  },

  seek: (frame) => {
    const { keyframes, currentPose } = get();
    
    // Exact match
    if (keyframes[frame]) {
      set({ currentFrame: frame, currentPose: structuredClone(keyframes[frame]) });
      return;
    }

    // Interpolate
    const frameNumbers = Object.keys(keyframes).map(Number).sort((a, b) => a - b);
    if (frameNumbers.length === 0) {
      set({ currentFrame: frame }); // Keep existing pose if timeline is empty
      return;
    }

    const prevFrame = frameNumbers.slice().reverse().find(f => f < frame);
    const nextFrame = frameNumbers.find(f => f > frame);

    if (prevFrame !== undefined && nextFrame !== undefined) {
      const progress = (frame - prevFrame) / (nextFrame - prevFrame);
      const interpolated = interpolatePose(keyframes[prevFrame], keyframes[nextFrame], progress);
      set({ currentFrame: frame, currentPose: interpolated });
    } else if (prevFrame !== undefined) {
      set({ currentFrame: frame, currentPose: structuredClone(keyframes[prevFrame]) });
    } else if (nextFrame !== undefined) {
      set({ currentFrame: frame, currentPose: structuredClone(keyframes[nextFrame]) });
    } else {
      set({ currentFrame: frame });
    }
  },

  setDurationFrames: (frames) => {
    set({ durationFrames: frames });
  },

  setIsLooping: (loop) => {
    set({ isLooping: loop });
  },

  importAction: (action) => {
    const newKeyframes: Record<number, ManualPose> = {};

    Object.entries(action.tracks).forEach(([trackName, trackData]) => {
      trackData.keyframes.forEach((kf) => {
        const frame = kf.frame;
        if (!newKeyframes[frame]) {
          newKeyframes[frame] = {};
        }
        newKeyframes[frame][trackName] = {
          rotation: kf.rotation,
          rotationY: kf.rotationY ?? 0,
          x: kf.x ?? 0,
          y: kf.y ?? 0,
          assetId: kf.assetId,
        };
      });
    });

    set({
      keyframes: newKeyframes,
      currentFrame: 0,
      durationFrames: action.durationFrames || 60,
      activeAction: action,
      currentPose: newKeyframes[0] ? structuredClone(newKeyframes[0]) : {},
    });
  },

  exportAction: () => {
    const { keyframes, activeAction, durationFrames } = get();
    
    // Group back to tracks format
    const tracks: Action['tracks'] = {};
    const frames = Object.keys(keyframes).map(Number).sort((a, b) => a - b);
    
    frames.forEach(frame => {
      const pose = keyframes[frame];
      Object.entries(pose).forEach(([part, transforms]) => {
        if (!tracks[part]) {
          tracks[part] = { keyframes: [] };
        }
        tracks[part].keyframes.push({
          frame,
          rotation: transforms.rotation || 0,
          rotationY: transforms.rotationY || 0,
          x: transforms.x || 0,
          y: transforms.y || 0,
          assetId: transforms.assetId,
          easing: 'linear' // Default easing
        });
      });
    });

    const exportData: Action = {
      id: activeAction?.id || `action_${Date.now()}`,
      name: activeAction?.name || 'Exported Action',
      durationFrames: durationFrames,
      fps: activeAction?.fps || 30,
      loop: activeAction?.loop || true,
      tracks
    };

    return JSON.stringify(exportData, null, 2);
  }
}));
