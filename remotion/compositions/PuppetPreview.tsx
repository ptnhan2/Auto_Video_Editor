import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SingleActor } from './SceneCompiler';

export const PuppetPreview: React.FC<{
  actionFile?: string,
  characterId?: string,
  expressionId?: string
}> = ({
  actionFile = 'verified_walk.json',
  characterId = 'char_001',
  expressionId = 'exp_female_001'
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <SingleActor
        characterId={characterId}
        actionId={actionFile}
        expressionId={expressionId}
        facing="left"
        position="mid_center"
        index={0}
        totalActors={1}
      />
    </AbsoluteFill>
  );
};

