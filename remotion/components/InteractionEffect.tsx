import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface InteractionEffectProps {
  durationFrames?: number;
  layoutStyle?: string | null;
  visualMetaphor?: string | null;
  transitionIn?: string | null;
  atmosphereFx?: string | null;
  assetDynamics?: string | null;
  layerType?: 'under_actors' | 'over_actors';
  type?: 'grab'; // legacy type for backward compatibility
}

export const InteractionEffect: React.FC<InteractionEffectProps> = ({
  durationFrames = 15,
  layoutStyle,
  visualMetaphor,
  transitionIn,
  atmosphereFx,
  assetDynamics,
  layerType = 'over_actors',
  type
}) => {
  const frame = useCurrentFrame();

  // ----- LEGACY GRAB EFFECT -----
  if (type === 'grab' || (!layoutStyle && !visualMetaphor && !transitionIn && !atmosphereFx && !assetDynamics)) {
    const scale = interpolate(frame, [0, durationFrames * 0.5, durationFrames], [0.5, 1.2, 1.5], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame, [0, durationFrames * 0.2, durationFrames * 0.8, durationFrames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
    const rotation = interpolate(frame, [0, durationFrames], [0, 180]);

    if (frame > durationFrames) return null;

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 100 }}>
        <div style={{
          position: 'absolute', width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 20%, rgba(200, 200, 200, 0.6) 60%, transparent 80%)',
          borderRadius: '50%', transform: `scale(${scale}) rotate(${rotation}deg)`, opacity, filter: 'blur(8px)'
        }} />
        <div style={{
          position: 'absolute', width: 150, height: 150,
          background: 'radial-gradient(star, rgba(255, 255, 200, 0.9) 10%, transparent 70%)',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          transform: `scale(${scale * 0.8}) rotate(${-rotation * 1.5}deg)`, opacity: opacity * 0.9,
        }} />
        <div style={{
          position: 'absolute', fontSize: 80, transform: `scale(${scale * 0.9}) rotate(${-rotation * 0.5}deg)`, opacity: opacity * 0.8
        }}>
          💢
        </div>
      </AbsoluteFill>
    );
  }

  // ----- CINEMATIC OVERLAYS -----
  return (
    <>
      {/* 1. ATMOSPHERE FX */}
      {layerType === 'over_actors' && atmosphereFx === 'film_grain' && (
        <AbsoluteFill style={{
          opacity: 0.15,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          transform: `translate(${Math.random() * 2}px, ${Math.random() * 2}px)`
        }} />
      )}
      
      {layerType === 'over_actors' && atmosphereFx === 'halftone_filter' && (
        <AbsoluteFill style={{
          opacity: 0.2,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
          backgroundPosition: '0 0, 2px 2px',
          backgroundSize: '4px 4px'
        }} />
      )}

      {/* 2. VISUAL METAPHOR */}
      {layerType === 'over_actors' && visualMetaphor === 'red_string' && (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 50 }}>
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <line 
              x1="10%" y1="20%" 
              x2="90%" y2="80%" 
              stroke="red" 
              strokeWidth="4" 
              strokeDasharray="2000"
              strokeDashoffset={interpolate(frame, [0, 30], [2000, 0], { extrapolateRight: 'clamp' })}
            />
          </svg>
        </AbsoluteFill>
      )}
      
      {layerType === 'over_actors' && visualMetaphor === 'magnifying_glass' && (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 50, justifyContent: 'center', alignItems: 'center' }}>
           <div style={{
             width: 300, height: 300, 
             border: '10px solid #333', 
             borderRadius: '50%',
             backdropFilter: 'contrast(1.5) blur(2px)',
             boxShadow: '0 0 50px rgba(0,0,0,0.5)',
             transform: `scale(${interpolate(frame, [0, 15], [0.5, 1], { extrapolateRight: 'clamp' })})`
           }}>
             <div style={{ width: 20, height: 150, background: '#333', position: 'absolute', bottom: -120, right: -40, transform: 'rotate(-45deg)' }} />
           </div>
        </AbsoluteFill>
      )}

      {/* 3. TRANSITION IN */}
      {layerType === 'over_actors' && transitionIn === 'fade_in' && frame < 15 && (
        <AbsoluteFill style={{
          backgroundColor: 'black',
          opacity: interpolate(frame, [0, 15], [1, 0], { extrapolateRight: 'clamp' }),
          pointerEvents: 'none',
          zIndex: 999
        }} />
      )}

      {layerType === 'over_actors' && transitionIn === 'black_screen' && frame < 30 && (
        <AbsoluteFill style={{
          backgroundColor: 'black',
          opacity: interpolate(frame, [0, 10, 25, 30], [1, 1, 1, 0], { extrapolateRight: 'clamp' }),
          pointerEvents: 'none',
          zIndex: 999
        }} />
      )}
      
      {/* 4. LAYOUT STYLE */}
      {layerType === 'over_actors' && layoutStyle === 'split_screen' && (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 150 }}>
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            transform: 'translateX(-50%)'
          }} />
        </AbsoluteFill>
      )}
      
      {layerType === 'under_actors' && layoutStyle === 'diorama' && (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 1 }}>
           <div style={{
             position: 'absolute',
             bottom: 0, left: 0, right: 0, height: '30%',
             background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
           }} />
        </AbsoluteFill>
      )}
    </>
  );
};
