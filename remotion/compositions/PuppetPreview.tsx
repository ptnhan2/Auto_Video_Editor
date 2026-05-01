import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SingleActor } from './SceneCompiler';

export const PuppetPreview: React.FC<{
  actionFile?: string;
  characterId?: string;
  expressionId?: string;
  facing?: "left" | "right" | "camera";
  isSpeaking?: boolean;
}> = ({
  actionFile = "idle",
  characterId = "char_001",
  expressionId = "neutral",
  facing = "left",
  isSpeaking = false,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <SingleActor
        characterId={characterId}
        actionId={actionFile}
        expressionId={expressionId}
        facing={facing}
        position="mid_center"
        index={0}
        totalActors={1}
        isSpeaking={isSpeaking}
      />
    </AbsoluteFill>
  );
};

