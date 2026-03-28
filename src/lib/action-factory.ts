import { Action } from '../types/animation';

/**
 * Procedural animation factory for humanoid rig.
 */

interface ActionOptions {
  speed?: number;
}

/**
 * Replicates the walk cycle from walk_cycle.json with optional speed scaling.
 */
export const createWalkCycle = (options: ActionOptions = {}): Action => {
  const { speed = 1 } = options;
  const scaleFrame = (frame: number) => Math.round(frame / speed);
  const durationFrames = scaleFrame(30);

  return {
    id: 'walk_cycle_factory',
    name: 'Walk Cycle',
    loop: true,
    durationFrames: durationFrames,
    fps: 30,
    tracks: {
      left_thigh: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 65, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 115, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 65, easing: 'linear' },
        ],
      },
      left_calf: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 65, easing: 'ease-in-out' },
          { frame: scaleFrame(7), rotation: 40, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 115, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 65, easing: 'linear' },
        ],
      },
      right_thigh: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 115, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 65, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 115, easing: 'linear' },
        ],
      },
      right_calf: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 115, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 65, easing: 'ease-in-out' },
          { frame: scaleFrame(22), rotation: 40, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 115, easing: 'linear' },
        ],
      },
      left_upper_arm: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 110, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 70, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 110, easing: 'linear' },
        ],
      },
      left_lower_arm: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 100, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 40, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 100, easing: 'linear' },
        ],
      },
      right_upper_arm: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 70, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 110, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 70, easing: 'linear' },
        ],
      },
      right_lower_arm: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 40, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 100, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 40, easing: 'linear' },
        ],
      },
      torso: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 0, easing: 'ease-in-out' },
          { frame: scaleFrame(7), rotation: -2, easing: 'ease-in-out' },
          { frame: scaleFrame(15), rotation: 0, easing: 'ease-in-out' },
          { frame: scaleFrame(22), rotation: 2, easing: 'ease-in-out' },
          { frame: scaleFrame(30), rotation: 0, easing: 'linear' },
        ],
      },
      head: {
        keyframes: [
          { frame: scaleFrame(0), rotation: 0, easing: 'linear' },
        ],
      },
    },
  };
};

/**
 * Creates a friendly waving animation for the right arm.
 */
export const createWavingAction = (): Action => {
  return {
    id: 'waving_action',
    name: 'Waving',
    loop: true,
    durationFrames: 40,
    fps: 30,
    tracks: {
      torso: {
        keyframes: [{ frame: 0, rotation: 0, easing: 'linear' }],
      },
      head: {
        keyframes: [
          { frame: 0, rotation: 0, rotationY: 0, easing: 'ease-in-out' },
          { frame: 10, rotation: 0, rotationY: 30, easing: 'ease-in-out' },
          { frame: 30, rotation: 0, rotationY: -30, easing: 'ease-in-out' },
          { frame: 40, rotation: 0, rotationY: 0, easing: 'linear' },
        ],
      },
      left_upper_arm: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      left_lower_arm: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      right_upper_arm: {
        keyframes: [
          { frame: 0, rotation: 70, easing: 'ease-in-out' },
          { frame: 10, rotation: 140, easing: 'ease-in-out' },
          { frame: 30, rotation: 140, easing: 'ease-in-out' },
          { frame: 40, rotation: 70, easing: 'linear' },
        ],
      },
      right_lower_arm: {
        keyframes: [
          { frame: 0, rotation: 40, easing: 'ease-in-out' },
          { frame: 10, rotation: 90, easing: 'ease-in-out' },
          { frame: 15, rotation: 120, easing: 'ease-in-out' },
          { frame: 20, rotation: 90, easing: 'ease-in-out' },
          { frame: 25, rotation: 120, easing: 'ease-in-out' },
          { frame: 30, rotation: 90, easing: 'ease-in-out' },
          { frame: 40, rotation: 40, easing: 'linear' },
        ],
      },
      left_thigh: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      left_calf: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      right_thigh: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      right_calf: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
    },
  };
};

/**
 * Creates a simple breathing/idling animation.
 */
export const createIdleAction = (): Action => {
  return {
    id: 'idle_action',
    name: 'Idle',
    loop: true,
    durationFrames: 60,
    fps: 30,
    tracks: {
      torso: {
        keyframes: [
          { frame: 0, rotation: 0, easing: 'ease-in-out' },
          { frame: 30, rotation: 2, easing: 'ease-in-out' },
          { frame: 60, rotation: 0, easing: 'linear' },
        ],
      },
      head: {
        keyframes: [
          { frame: 0, rotation: 0, rotationY: 0, easing: 'ease-in-out' },
          { frame: 30, rotation: 0, rotationY: 20, easing: 'ease-in-out' },
          { frame: 60, rotation: 0, rotationY: 0, easing: 'linear' },
        ],
      },
      left_upper_arm: {
        keyframes: [
          { frame: 0, rotation: 90, easing: 'ease-in-out' },
          { frame: 30, rotation: 92, easing: 'ease-in-out' },
          { frame: 60, rotation: 90, easing: 'linear' },
        ],
      },
      left_lower_arm: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      right_upper_arm: {
        keyframes: [
          { frame: 0, rotation: 90, easing: 'ease-in-out' },
          { frame: 30, rotation: 92, easing: 'ease-in-out' },
          { frame: 60, rotation: 90, easing: 'linear' },
        ],
      },
      right_lower_arm: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      left_thigh: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      left_calf: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      right_thigh: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
      right_calf: {
        keyframes: [{ frame: 0, rotation: 90, easing: 'linear' }],
      },
    },
  };
};
