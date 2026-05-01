'use client';

import React, { useEffect } from 'react';
import { useJsonStore } from './store/useJsonStore';
import { CHARACTERS, ACTIONS, EXPRESSIONS, BACKGROUNDS } from '@/config/asset-registry';

const INPUT_CLASS = "w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none";
const LABEL_CLASS = "text-xs font-medium text-zinc-400 mb-1 block";

export default function JsonOverridePage() {
  const { 
    scriptFiles, selectedFile, scriptData, isLoading, isSaving, 
    fetchFiles, loadScript, saveScript, updateScene, updateShot, updateActor 
  } = useJsonStore();

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (!scriptFiles.length && !isLoading) {
    return <div className="p-8 text-white">No compiled_*.json files found in public/scripts/</div>;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-zinc-950 text-slate-50 overflow-hidden">
      {/* File Selector Sidebar */}
      <div className="w-72 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Compiled Scripts</h2>
        <div className="flex-1 overflow-y-auto space-y-1">
          {scriptFiles.map(file => (
            <button
              key={file.name}
              onClick={() => loadScript(file.name)}
              className={`w-full text-left px-3 py-2 rounded text-sm truncate transition-colors ${
                selectedFile === file.name 
                  ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
          <div className="font-medium text-white truncate max-w-md">
            {selectedFile ? `Editing: ${selectedFile}` : 'Select a script to edit'}
          </div>
          {scriptData && (
            <button
              onClick={saveScript}
              disabled={isSaving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded shadow transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save File'}
            </button>
          )}
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
          {isLoading ? (
            <div className="text-zinc-500 flex justify-center py-10">Loading...</div>
          ) : scriptData ? (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">{scriptData.title}</h1>
                <p className="text-zinc-400">{scriptData.description}</p>
              </div>

              {scriptData.scenes.map((scene, sIndex) => (
                <div key={scene.sceneId || sIndex} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                  <div className="bg-zinc-800/40 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                    <h3 className="font-semibold text-emerald-400">Scene {sIndex + 1}</h3>
                    <div className="text-xs text-zinc-500 font-mono">{scene.sceneId}</div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Scene Props */}
                    <div className="grid grid-cols-2 gap-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800/50">
                      <div>
                        <label className={LABEL_CLASS}>Background ID</label>
                        <select 
                          value={scene.backgroundId} 
                          onChange={e => updateScene(sIndex, 'backgroundId', e.target.value)}
                          className={INPUT_CLASS}
                        >
                          {BACKGROUNDS.map(bg => <option key={bg.id} value={bg.id}>{bg.id}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Total Duration (sec) - View Only</label>
                        <input type="number" value={scene.totalDurationSeconds} disabled className={`${INPUT_CLASS} opacity-50`} />
                      </div>
                    </div>

                    {/* Shots */}
                    {scene.shots && scene.shots.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider pl-1">Shots</h4>
                        {scene.shots.map((shot, shotIndex) => (
                          <div key={shot.shotId || shotIndex} className="border-l-2 border-emerald-500/30 pl-4 py-2">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">Shot {shotIndex + 1}</span>
                              <span className="text-xs font-mono text-zinc-500">{shot.shotId}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              <div>
                                <label className={LABEL_CLASS}>Duration (sec)</label>
                                <input type="number" value={shot.durationSeconds || 0} onChange={e => updateShot(sIndex, shotIndex, 'durationSeconds', parseFloat(e.target.value))} className={INPUT_CLASS} />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Layout Style</label>
                                <input type="text" value={shot.layoutStyle || ''} onChange={e => updateShot(sIndex, shotIndex, 'layoutStyle', e.target.value)} className={INPUT_CLASS} placeholder="e.g. split_screen" />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Atmosphere Fx</label>
                                <input type="text" value={shot.atmosphereFx || ''} onChange={e => updateShot(sIndex, shotIndex, 'atmosphereFx', e.target.value)} className={INPUT_CLASS} placeholder="e.g. film_grain" />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Asset Dynamics</label>
                                <input type="text" value={shot.assetDynamics || ''} onChange={e => updateShot(sIndex, shotIndex, 'assetDynamics', e.target.value)} className={INPUT_CLASS} placeholder="e.g. stop_motion_stutter" />
                              </div>
                            </div>

                            {/* Actors */}
                            {shot.actors && shot.actors.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {shot.actors.map((actor, aIndex) => (
                                  <div key={aIndex} className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
                                    <div className="text-xs font-medium text-zinc-400 mb-2">Actor {aIndex + 1}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                      <div className="col-span-2 md:col-span-1">
                                        <label className={LABEL_CLASS}>Character</label>
                                        <select value={actor.characterId} onChange={e => updateActor(sIndex, shotIndex, aIndex, 'characterId', e.target.value)} className={INPUT_CLASS}>
                                          {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                        </select>
                                      </div>
                                      <div className="col-span-2 md:col-span-1">
                                        <label className={LABEL_CLASS}>Action</label>
                                        <select value={actor.actionId} onChange={e => updateActor(sIndex, shotIndex, aIndex, 'actionId', e.target.value)} className={INPUT_CLASS}>
                                          {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
                                        </select>
                                      </div>
                                      <div className="col-span-2 md:col-span-1">
                                        <label className={LABEL_CLASS}>Expression</label>
                                        <select value={actor.expressionId} onChange={e => updateActor(sIndex, shotIndex, aIndex, 'expressionId', e.target.value)} className={INPUT_CLASS}>
                                          {EXPRESSIONS.map(ex => <option key={ex.id} value={ex.id}>{ex.id}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className={LABEL_CLASS}>Facing</label>
                                        <select value={actor.facing} onChange={e => updateActor(sIndex, shotIndex, aIndex, 'facing', e.target.value)} className={INPUT_CLASS}>
                                          <option value="left">left</option>
                                          <option value="right">right</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className={LABEL_CLASS}>Position</label>
                                        <select value={actor.position || 'mid_center'} onChange={e => updateActor(sIndex, shotIndex, aIndex, 'position', e.target.value)} className={INPUT_CLASS}>
                                          {['back_left', 'back_center', 'back_right', 'mid_left', 'mid_center', 'mid_right', 'front_left', 'front_center', 'front_right'].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <label className={LABEL_CLASS}>Dialogue (Read-only)</label>
                                      <p className="text-sm text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 break-words">{actor.dialogue || <span className="text-zinc-600 italic">No dialogue</span>}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Select a script from the sidebar to edit JSON overrides</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
