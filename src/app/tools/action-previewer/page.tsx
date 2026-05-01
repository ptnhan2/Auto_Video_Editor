'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { usePreviewStore } from './store/usePreviewStore';
import { CHARACTERS, ACTIONS, EXPRESSIONS } from '@/config/asset-registry';
import { PuppetPreview } from '../../../../remotion/compositions/PuppetPreview';

export default function ActionPreviewerPage() {
  const {
    characterId,
    actionId,
    expressionId,
    facing,
    isSpeaking,
    setCharacter,
    setAction,
    setExpression,
    setFacing,
    setIsSpeaking
  } = usePreviewStore();

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar Controls */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-950 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-6">Action Previewer</h2>
        
        <div className="space-y-6">
          {/* Character */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Character</label>
            <select 
              value={characterId}
              onChange={(e) => setCharacter(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CHARACTERS.map(char => (
                <option key={char.id} value={char.id}>{char.name} ({char.id})</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Action (Locomotion)</label>
            <select 
              value={actionId}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ACTIONS.map(action => (
                <option key={action.id} value={action.id}>{action.id}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">Actions load JSON from /public/animations/</p>
          </div>

          {/* Expression */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Expression</label>
            <select 
              value={expressionId}
              onChange={(e) => setExpression(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {EXPRESSIONS.map(exp => (
                <option key={exp.id} value={exp.id}>{exp.id}</option>
              ))}
            </select>
          </div>

          {/* Facing */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Facing</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFacing('left')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${facing === 'left' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                Left
              </button>
              <button
                onClick={() => setFacing('right')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${facing === 'right' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                Right
              </button>
            </div>
          </div>

          {/* Speaking Toggle */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-400 cursor-pointer">
              <input 
                type="checkbox"
                checked={isSpeaking}
                onChange={(e) => setIsSpeaking(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950"
              />
              Is Speaking (Mouth Animation)
            </label>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-zinc-900 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
        
        <div className="relative shadow-2xl shadow-black/50 ring-1 ring-white/10 rounded-lg overflow-hidden bg-zinc-950">
          {/* Note: We use PuppetPreview from remotion composition */}
          <Player
            component={PuppetPreview}
            inputProps={{
              actionFile: actionId,
              characterId: characterId,
              expressionId: expressionId,
              // We pass extra props that PuppetPreview might not fully use yet, but are useful 
              // if we upgrade PuppetPreview to support facing/speaking
              facing: facing,
              isSpeaking: isSpeaking
            }}
            durationInFrames={60} // Default duration, will loop
            compositionWidth={1080}
            compositionHeight={1920}
            fps={30}
            style={{
              width: 360,
              height: 640,
            }}
            controls
            loop
            autoPlay
          />
        </div>
      </div>
    </div>
  );
}
