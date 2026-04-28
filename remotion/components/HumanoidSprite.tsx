import { Img, useCurrentFrame, interpolate, Easing, staticFile } from 'remotion';
import React, { useEffect, useState } from 'react';
import { Action } from '../../src/shared/types/animation';
import { ExpressionLayer } from './ExpressionLayer';

type PivotData = {
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  width: number;
  height: number;
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

export const HumanoidSprite: React.FC<{
  characterId: string;
  action: Action;
  actionName?: string;
  manualPose?: ManualPose;
  overrideExpressionId?: string;
  expressionTag?: string;
  isSpeaking?: boolean;
  onError?: () => void;
}> = ({ characterId, action, actionName, manualPose, overrideExpressionId, expressionTag, isSpeaking, onError }) => {
  const frame = useCurrentFrame();
  const [pivots, setPivots] = useState<Pivots | null>(null);

  useEffect(() => {
    fetch(staticFile(`assets/humanoid/${characterId}/parts/pivots.json`))
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setPivots(data))
      .catch((err) => {
        console.error('Failed to load pivots', err);
        if (onError) onError();
      });
  }, [characterId, onError]);

  if (!pivots) {
    return null;
  }

  const getTrackState = (trackName: string) => {
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

    const track = action.tracks[trackName];
    if (!track || track.keyframes.length === 0) return { rotation: 0, rotationY: 0, x: 0, y: 0 };

    const duration = action.durationFrames;
    const localFrame = action.loop ? frame % duration : Math.min(frame, duration);

    const keyframes = track.keyframes;
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
        };
    }

    let easingFn = Easing.linear;
    switch (kfA.easing) {
      case 'ease-in': easingFn = Easing.in(Easing.ease); break;
      case 'ease-out': easingFn = Easing.out(Easing.ease); break;
      case 'ease-in-out': easingFn = Easing.inOut(Easing.ease); break;
      case 'linear': easingFn = Easing.linear; break;
      case 'spring': easingFn = Easing.elastic(1); break;
    }

    const rotation = interpolate(localFrame, [kfA.frame, kfB.frame], [kfA.rotation ?? 0, kfB.rotation ?? 0], { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const rotationY = interpolate(localFrame, [kfA.frame, kfB.frame], [kfA.rotationY ?? 0, kfB.rotationY ?? 0], { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const x = interpolate(localFrame, [kfA.frame, kfB.frame], [kfA.x ?? 0, kfB.x ?? 0], { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const y = interpolate(localFrame, [kfA.frame, kfB.frame], [kfA.y ?? 0, kfB.y ?? 0], { easing: easingFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return { rotation, rotationY, x, y };
  };

  const getStyle = (): React.CSSProperties => {
    // Luôn lấy track 'body' là track root của Waddle mechanism
    const state = getTrackState('body');
    const pivot = pivots['body'];
    
    // Nếu có actionName, áp dụng Waddle procedural animation bổ trợ
    const actionOffsetX = state.x;
    let actionOffsetY = state.y;
    let actionRotation = state.rotation;
    
    // Procedural Fallback cho Waddle nếu JSON action bị thiếu hoặc để bổ trợ thêm
    const time = frame / 30;
    if (actionName && (!action.tracks || !action.tracks['body'])) {
      if (actionName.includes('walk') || actionName.includes('run')) {
        // Tilt
        actionRotation += Math.sin(time * Math.PI * 2) * 15;
        // Bounce (nhanh gấp đôi Tilt)
        actionOffsetY += Math.abs(Math.sin(time * Math.PI * 2)) * -30;
      } else if (actionName.includes('talk')) {
        // Rung nhẹ
        actionRotation += Math.sin(time * Math.PI * 4) * 3;
        actionOffsetY += Math.sin(time * Math.PI * 2) * -5;
      } else if (actionName.includes('sit')) {
        actionOffsetY += 50; // Thấp xuống một chút
      } else {
        // IDLE: Breathing effect
        actionOffsetY += Math.sin(time * Math.PI) * 10;
        // Phồng người (Scale) có thể kết hợp thêm sau
      }
    }

    return {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%',
      // TÂM XOAY BẮT BUỘC: 50% 100% (Bottom Center) để Waddle tự nhiên
      transformOrigin: pivot ? `${pivot.x * 100}% ${pivot.y * 100}%` : '50% 100%',
      transform: `translate(${actionOffsetX}px, ${actionOffsetY}px) rotate(${actionRotation}deg) rotateY(${state.rotationY}deg)`,
      transformStyle: 'preserve-3d',
    };
  };

  return (
    <div style={{ position: 'relative', width: '1080px', height: '1920px', perspective: '2000px', overflow: 'visible' }}>
      <div style={getStyle()}>
        <Img src={staticFile(`assets/humanoid/${characterId}/parts/body.png`)} style={{ width: '100%', height: '100%', objectFit: 'contain', backfaceVisibility: 'hidden' }} />
        
        {/* Nếu có config mốc gắn biểu cảm (cho VTuber tĩnh) */}
        {pivots['body']?.expressionAnchor && (
          <ExpressionLayer
            anchor={pivots['body'].expressionAnchor}
            assetId={overrideExpressionId || 'exp_female_001'}
            expressionTag={expressionTag}
            isTalking={isSpeaking || actionName?.startsWith('talk_')}
          />
        )}
      </div>
    </div>
  );
};
