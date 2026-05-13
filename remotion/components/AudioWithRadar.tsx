import React, { useEffect, useState } from 'react';
import { Audio, staticFile, delayRender, continueRender, useCurrentFrame, interpolate } from 'remotion';

export const AudioWithRadar: React.FC<{
  type: 'BGM' | 'SFX';
  assetId: string;
  path: string;
  topOffset?: number;
}> = ({ type, assetId, path, topOffset = 20 }) => {
  const [handle] = useState(() => delayRender());
  const [exists, setExists] = useState<boolean | null>(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    fetch(staticFile(path))
      .then((res) => {
        if (res.ok) {
          setExists(true);
        } else {
          setExists(false);
        }
      })
      .catch(() => setExists(false))
      .finally(() => continueRender(handle));
  }, [path, handle]);

  if (exists === null) return null;

  if (exists) {
    return <Audio src={staticFile(path)} />;
  }

  // Missing Audio Radar
  const color = type === 'BGM' ? 'rgba(236, 72, 153, 0.9)' : 'rgba(245, 158, 11, 0.9)';
  
  // Create a pulsing opacity effect natively with Remotion
  const opacity = interpolate(Math.sin(frame / 5), [-1, 1], [0.5, 1]);
  
  return (
    <div style={{
      position: 'absolute', top: topOffset, left: '50%', transform: 'translateX(-50%)',
      background: color, color: 'white', padding: '8px 16px',
      borderRadius: 20, fontWeight: 'bold', border: '2px solid white',
      boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      opacity,
      zIndex: 1100,
      pointerEvents: 'none'
    }}>
      {type === 'BGM' ? '🎵' : '🔊'} [MISSING {type}: {assetId}]
    </div>
  );
};
