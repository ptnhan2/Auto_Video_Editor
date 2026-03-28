import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { PuppetPreview } from './PuppetPreview';

export type ActionSequenceItem = {
  actionFile: string;
  durationInFrames: number;
};

export const ActionSequence: React.FC<{
  characterId?: string;
  sequence: ActionSequenceItem[];
}> = ({
  characterId = 'char_001',
  sequence = []
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      {sequence.map((item, index) => {
        const startFrame = sequence.slice(0, index).reduce((acc, curr) => acc + curr.durationInFrames, 0);
        
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={item.durationInFrames}
          >
            <PuppetPreview actionFile={item.actionFile} characterId={characterId} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
