'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { useCinematicStore } from './store/useCinematicStore';
import { BACKGROUNDS } from '@/config/asset-registry';
import { CinematicPreview } from '../../../../remotion/compositions/CinematicPreview';

// Lấy danh sách enum từ file InteractionEffect
const LAYOUT_STYLES = ['none', 'split_screen', 'diorama'];
const VISUAL_METAPHORS = ['none', 'red_string', 'magnifying_glass'];
const TRANSITIONS = ['none', 'fade_in', 'black_screen'];
const ATMOSPHERE_FX = ['none', 'film_grain', 'halftone_filter'];
const ASSET_DYNAMICS = ['none']; // 'stop_motion_stutter' unimplemented

export default function CinematicEditorPage() {
  const {
    backgroundId,
    layoutStyle,
    visualMetaphor,
    transitionIn,
    atmosphereFx,
    assetDynamics,
    setBackground,
    setLayoutStyle,
    setVisualMetaphor,
    setTransitionIn,
    setAtmosphereFx,
    setAssetDynamics,
    resetEffects
  } = useCinematicStore();

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar Controls */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-950 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Cinematic Tester</h2>
          <button 
            onClick={resetEffects}
            className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
          >
            Reset
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Background */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Background</label>
            <select 
              value={backgroundId}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {BACKGROUNDS.map(bg => (
                <option key={bg.id} value={bg.id}>{bg.id}</option>
              ))}
            </select>
          </div>

          <hr className="border-zinc-800" />

          {/* Layout Style */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Layout Style</label>
            <select 
              value={layoutStyle}
              onChange={(e) => setLayoutStyle(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {LAYOUT_STYLES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Atmosphere Fx */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Atmosphere Fx</label>
            <select 
              value={atmosphereFx}
              onChange={(e) => setAtmosphereFx(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {ATMOSPHERE_FX.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Visual Metaphor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Visual Metaphor</label>
            <select 
              value={visualMetaphor}
              onChange={(e) => setVisualMetaphor(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {VISUAL_METAPHORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Transition In */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Transition In</label>
            <select 
              value={transitionIn}
              onChange={(e) => setTransitionIn(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {TRANSITIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-zinc-900 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
        
        <div className="relative shadow-2xl shadow-black/50 ring-1 ring-white/10 rounded-lg overflow-hidden bg-zinc-950">
          <Player
            component={CinematicPreview}
            inputProps={{
              backgroundId,
              layoutStyle,
              visualMetaphor,
              transitionIn,
              atmosphereFx,
              assetDynamics,
            }}
            durationInFrames={60}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
              width: 960,  // Scale down 50% for preview
              height: 540,
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
