import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const InteractionEffect: React.FC<{ durationFrames?: number }> = ({ durationFrames = 15 }) => {
  const frame = useCurrentFrame();
  
  // Scale from 0.5 up to 1.5
  const scale = interpolate(
    frame, 
    [0, durationFrames * 0.5, durationFrames], 
    [0.5, 1.2, 1.5], 
    { extrapolateRight: 'clamp' }
  );
  
  // Opacity fades in then out
  const opacity = interpolate(
    frame, 
    [0, durationFrames * 0.2, durationFrames * 0.8, durationFrames], 
    [0, 1, 1, 0], 
    { extrapolateRight: 'clamp' }
  );
  
  // Rotate for scuffle feel
  const rotation = interpolate(frame, [0, durationFrames], [0, 180]);

  if (frame > durationFrames) return null;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 100 }}>
      {/* Dust Cloud base */}
      <div style={{
        position: 'absolute',
        width: 250,
        height: 250,
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 20%, rgba(200, 200, 200, 0.6) 60%, transparent 80%)',
        borderRadius: '50%',
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        filter: 'blur(8px)'
      }} />
      
      {/* Scuffle inner star/spikes */}
      <div style={{
        position: 'absolute',
        width: 150,
        height: 150,
        background: 'radial-gradient(star, rgba(255, 255, 200, 0.9) 10%, transparent 70%)',
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        transform: `scale(${scale * 0.8}) rotate(${-rotation * 1.5}deg)`,
        opacity: opacity * 0.9,
      }} />

      {/* Comic style emotion */}
      <div style={{
        position: 'absolute',
        fontSize: 80,
        transform: `scale(${scale * 0.9}) rotate(${-rotation * 0.5}deg)`,
        opacity: opacity * 0.8
      }}>
        💢
      </div>
    </AbsoluteFill>
  );
};
