import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile } from 'remotion';
import { Puppet } from '../components/Puppet';
import { Action } from '../../src/types/animation';

export const PuppetPreview: React.FC<{
  actionFile?: string,
  characterId?: string,
  expressionId?: string
}> = ({
  actionFile = 'verified_walk.json',
  characterId = 'char_001',
  expressionId
}) => {
  const [handle] = useState(() => delayRender());
  const [action, setAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(staticFile(`animations/${actionFile}`))
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${actionFile}`);
        return res.json();
      })
      .then((data) => {
        setAction(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        continueRender(handle);
      });
  }, [actionFile, handle]);

  if (error) {
    return (
      <AbsoluteFill style={{ backgroundColor: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'red', fontSize: '24px' }}>Error loading action: {error}</h1>
      </AbsoluteFill>
    );
  }

  if (!action) {
    return null; // Or a loading spinner
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <Puppet
        characterId={characterId}
        action={action}
        overrideExpressionId={expressionId}
      />
    </AbsoluteFill>
  );
};

