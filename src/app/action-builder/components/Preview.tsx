'use client';

import React, { useEffect, useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { HumanoidSprite as Puppet } from '../../../../remotion/components/HumanoidSprite';
import { useActionStore } from '../store/useActionStore';

const Preview: React.FC = () => {
  const { currentFrame, currentPose, activeAction, seek, durationFrames, isLooping } = useActionStore();
  const playerRef = useRef<PlayerRef>(null);

  const baseAction = activeAction || {
    id: 'dummy',
    name: 'Empty Action',
    durationFrames: durationFrames,
    fps: 30,
    loop: true,
    tracks: {}
  };

  // Sync Remotion Player frame back to Zustand timeline when playing
  useEffect(() => {
    const { current } = playerRef;
    if (!current) return;

    const onFrameUpdate = () => {
      if (current.isPlaying()) {
        seek(current.getCurrentFrame());
      }
    };

    current.addEventListener('frameupdate', onFrameUpdate);
    return () => {
      current.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, [seek]);

  // Sync Zustand timeline back to Remotion Player when seeking manually
  useEffect(() => {
    const { current } = playerRef;
    if (current && !current.isPlaying() && current.getCurrentFrame() !== currentFrame) {
      current.seekTo(currentFrame);
    }
  }, [currentFrame]);

  return (
    <div className="relative w-full h-full bg-gray-950 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
      }} />
      
      <div className="w-full h-full flex items-center justify-center p-4">
        <Player
          ref={playerRef}
          component={Puppet}
          inputProps={{
            characterId: "char_001",
            action: baseAction,
            manualPose: currentPose
          }}
          durationInFrames={durationFrames}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={baseAction.fps}
          controls
          loop={isLooping}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded text-xs text-blue-400 font-mono border border-blue-900/50 pointer-events-none">
        Viewport: 1920x1080 (Dynamic Scale)
      </div>
    </div>
  );
};

export default Preview;
