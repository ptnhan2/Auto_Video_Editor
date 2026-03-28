import { Img, useCurrentFrame, interpolate, Easing, staticFile } from 'remotion';
import React, { useEffect, useState } from 'react';
import { Action, Keyframe } from '../../src/types/animation';
import { HUMANOID_RIG } from '../../src/constants/rig-anatomy';
import { ExpressionLayer } from './ExpressionLayer';

type PivotData = {
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  localX: number;
  localY: number;
  width: number;
  height: number;
  baseAngle?: number;
  expressionAnchor?: { x: number, y: number, width: number, height: number };
};

type Pivots = Record<string, PivotData>;

export interface ManualPose {
  [trackName: string]: {
    rotation?: number;
    rotationY?: number;
    x?: number;
    y?: number;
    zIndex?: number;
    assetId?: string;
  };
}

export const Puppet: React.FC<{
  characterId: string;
  action: Action;
  manualPose?: ManualPose;
  overrideExpressionId?: string;
}> = ({ characterId, action, manualPose, overrideExpressionId }) => {
  const frame = useCurrentFrame();
  const [pivots, setPivots] = useState<Pivots | null>(null);

  useEffect(() => {
    fetch(staticFile(`assets/humanoid/${characterId}/parts/pivots.json`))
      .then((res) => res.json())
      .then((data) => setPivots(data))
      .catch((err) => console.error('Failed to load pivots', err));
  }, [characterId]);

  if (!pivots) {
    return <div>Loading Rig...</div>;
  }

  const getTrackState = (trackName: string) => {
    // Priority 1: Manual Pose from UI Sliders
    if (manualPose && manualPose[trackName]) {
      const pose = manualPose[trackName];
      return {
        rotation: pose.rotation ?? 0,
        rotationY: pose.rotationY ?? 0,
        x: pose.x ?? 0,
        y: pose.y ?? 0,
        zIndex: pose.zIndex,
        assetId: pose.assetId,
      };
    }

    // Priority 2: Keyframe Animation
    const track = action.tracks[trackName];
    if (!track || track.keyframes.length === 0) return { rotation: 0, rotationY: 0, x: 0, y: 0 };

    const duration = action.durationFrames;
    const localFrame = action.loop ? frame % duration : Math.min(frame, duration);

    const keyframes = track.keyframes;
    
    // Find the current and next keyframes
    let kfA = keyframes[0];
    let kfB = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (localFrame >= keyframes[i].frame && localFrame <= keyframes[i + 1].frame) {
        kfA = keyframes[i];
        kfB = keyframes[i + 1];
        break;
      }
    }

    if (kfA === kfB || kfA.frame === kfB.frame) {
        return {
            rotation: kfA.rotation ?? 0,
            rotationY: kfA.rotationY ?? 0,
            x: kfA.x ?? 0,
            y: kfA.y ?? 0,
            zIndex: kfA.zIndex,
            ikTarget: kfA.ikTarget,
            assetId: kfA.assetId,
            constraints: track.constraints
        };
    }

    // Get easing function
    let easingFn = Easing.linear;
    switch (kfA.easing) {
      case 'ease-in': easingFn = Easing.in(Easing.ease); break;
      case 'ease-out': easingFn = Easing.out(Easing.ease); break;
      case 'ease-in-out': easingFn = Easing.inOut(Easing.ease); break;
      case 'linear': easingFn = Easing.linear; break;
      case 'spring': easingFn = Easing.elastic(1); break;
    }

    const rotation = interpolate(
      localFrame,
      [kfA.frame, kfB.frame],
      [kfA.rotation ?? 0, kfB.rotation ?? 0],
      { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const rotationY = interpolate(
      localFrame,
      [kfA.frame, kfB.frame],
      [kfA.rotationY ?? 0, kfB.rotationY ?? 0],
      { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const x = interpolate(
      localFrame,
      [kfA.frame, kfB.frame],
      [kfA.x ?? 0, kfB.x ?? 0],
      { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const y = interpolate(
      localFrame,
      [kfA.frame, kfB.frame],
      [kfA.y ?? 0, kfB.y ?? 0],
      { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // State props like assetId don't interpolate, just snap at kfA.frame
    return { rotation, rotationY, x, y, zIndex: kfA.zIndex, ikTarget: kfA.ikTarget, assetId: kfA.assetId, constraints: track.constraints };
  };

  const getStyle = (partName: string, parentName: string | null = null, defaultZIndex: number = 0): React.CSSProperties => {
    const part = pivots[partName];
    if (!part) return {};

    const state = getTrackState(partName);
    
    const baseAngle = part.baseAngle || 0;
    const myAbsoluteCss = state.rotation - baseAngle;
    
    let parentAbsoluteCss = 0;
    if (parentName && pivots[parentName]) {
        const parentState = getTrackState(parentName);
        const parentBaseAngle = pivots[parentName].baseAngle || 0;
        parentAbsoluteCss = parentState.rotation - parentBaseAngle;
    }

    let finalRotation = myAbsoluteCss - parentAbsoluteCss;

    if (state.constraints) {
      finalRotation = Math.max(state.constraints.min, Math.min(state.constraints.max, finalRotation));
    }

    if (state.ikTarget) {
        // Basic IK Wrapper placeholder
        // In a full implementation, we would calculate the angles for thigh and calf to reach state.ikTarget
    }
    
    let left = 0;
    let top = 0;

    if (parentName && pivots[parentName]) {
      const parent = pivots[parentName];
      // When nested, position relative to parent's global position
      left = part.globalX - parent.globalX;
      top = part.globalY - parent.globalY;
      
      // Shift Head 5px down to hide potential white seam lines
      if (partName === 'head') {
        top += 5;
      }

    } else {
      left = part.globalX;
      top = part.globalY;

      // Proportional Scaling for root translation
      if (partName === 'torso') {
          const referenceThighHeight = 200;
          const leftThigh = pivots['left_thigh'];
          if (leftThigh && leftThigh.height) {
              const scaleFactor = leftThigh.height / referenceThighHeight;
              left += state.x * scaleFactor;
              top += state.y * scaleFactor;
          } else {
              left += state.x;
              top += state.y;
          }
      } else {
          left += state.x;
          top += state.y;
      }
    }

    let zIndex = state.zIndex !== undefined ? state.zIndex : defaultZIndex;
    
    // Force Head behind Torso (Head usually has higher defaultZIndex in humanoid rig)
    if (partName === 'head' && state.zIndex === undefined) {
      zIndex = -1; // Relative to torso
    }

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${part.width}px`,
      height: `${part.height}px`,
      transformOrigin: `${part.x * 100}% ${part.y * 100}%`,
      transform: `rotate(${finalRotation}deg) rotateY(${state.rotationY ?? 0}deg)`,
      zIndex,
      transformStyle: 'preserve-3d',
    };
  };

  const partSrc = (partName: string) => staticFile(`assets/humanoid/${characterId}/parts/${partName}.png`);

  const renderPart = (partName: string) => {
    const partConfig = HUMANOID_RIG.find((p) => p.name === partName);
    if (!partConfig) return null;

    const children = HUMANOID_RIG.filter((p) => p.parent === partName);

    return (
      <div key={partName} style={getStyle(partName, partConfig.parent, partConfig.defaultZIndex)}>
        <Img src={partSrc(partName)} style={{ width: '100%', height: '100%', backfaceVisibility: 'hidden' }} />
        
        {/* Render expression overlay if this is the head and an anchor exists */}
        {partName === 'head' && pivots['head']?.expressionAnchor && (
          <ExpressionLayer
            anchor={pivots['head'].expressionAnchor}
            assetId={overrideExpressionId || getTrackState('head').assetId || 'exp_female_001'}
          />
        )}

        {children.map((child) => renderPart(child.name))}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '1920px', height: '1080px', perspective: '2000px' }}>
      {renderPart('torso')}
    </div>
  );
};
