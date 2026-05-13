import React, { useEffect, useState } from 'react';
import { Audio, staticFile, delayRender, continueRender } from 'remotion';

export const SafeAudio: React.FC<{
  src: string;
  volume?: number;
  onMissing?: () => void;
}> = ({ src, volume = 1, onMissing }) => {
  const [handle] = useState(() => delayRender());
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(src)
      .then((res) => {
        if (res.ok) {
          setExists(true);
        } else {
          setExists(false);
          if (onMissing) onMissing();
        }
      })
      .catch(() => {
        setExists(false);
        if (onMissing) onMissing();
      })
      .finally(() => {
        continueRender(handle);
      });
  }, [src, handle, onMissing]);

  if (exists === null) return null;
  if (exists === false) return null;

  return <Audio src={src} volume={volume} />;
};
