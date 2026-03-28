'use client';

import React from 'react';
import { useActionStore } from '../store/useActionStore';

const Timeline: React.FC = () => {
  const currentFrame = useActionStore(state => state.currentFrame);
  const keyframes = useActionStore(state => state.keyframes);
  const durationFrames = useActionStore(state => state.durationFrames);
  const setDurationFrames = useActionStore(state => state.setDurationFrames);
  const isLooping = useActionStore(state => state.isLooping);
  const setIsLooping = useActionStore(state => state.setIsLooping);
  const recordKeyframe = useActionStore(state => state.recordKeyframe);
  const removeKeyframe = useActionStore(state => state.removeKeyframe);
  const seek = useActionStore(state => state.seek);
  const clearTimeline = useActionStore(state => state.clearTimeline);
  const exportAction = useActionStore(state => state.exportAction);

  // Render one extra frame so the user can place a keyframe exactly at the end (loop point)
  const maxFrames = durationFrames + 1;
  const frameNumbers = Array.from({ length: maxFrames }, (_, i) => i);
  const recordedFrames = Object.keys(keyframes).map(Number).sort((a, b) => a - b);

  const handleExport = () => {
    const json = exportAction();
    // Copy to clipboard or trigger download
    navigator.clipboard.writeText(json)
      .then(() => alert('Action exported and copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={recordKeyframe}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-bold transition-colors shadow-lg"
          >
            ● Record Keyframe
          </button>
          <button
            onClick={clearTimeline}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors shadow-lg"
          >
            Export JSON
          </button>
          <span className="text-gray-400 font-mono">
            Frame: <span className="text-white font-bold">{currentFrame}</span>
          </span>
          <div className="flex items-center space-x-2 border-l border-gray-600 pl-4">
            <span className="text-gray-400 text-sm">Duration:</span>
            <input
              type="number"
              min="1"
              max="600"
              value={durationFrames}
              onChange={(e) => setDurationFrames(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm text-center outline-none border border-gray-600 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2 border-l border-gray-600 pl-4">
            <label className="text-gray-400 text-sm flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              Auto-Replay Video
            </label>
          </div>
        </div>
        
        <div className="flex space-x-2">
            {recordedFrames.length > 0 && (
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                    {recordedFrames.length} Keyframes Recorded
                </div>
            )}
        </div>
      </div>

      <div className="relative h-12 bg-gray-900 rounded-lg overflow-x-auto border border-gray-700 flex items-center px-2">
        {frameNumbers.map((f) => {
          const isKeyframe = keyframes[f] !== undefined;
          const isSelected = currentFrame === f;
          
          return (
            <div
              key={f}
              onClick={() => seek(f)}
              className={`
                flex-shrink-0 w-8 h-8 mx-0.5 rounded flex items-center justify-center cursor-pointer transition-all
                ${isSelected ? 'bg-blue-600 text-white scale-110 z-10' : 'hover:bg-gray-700 text-gray-500'}
                ${isKeyframe ? 'ring-2 ring-red-500 ring-inset' : ''}
              `}
            >
              <span className="text-[10px] font-mono">{f}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex overflow-x-auto space-x-2">
        {recordedFrames.map((f) => (
          <div key={f} className="flex-shrink-0 flex items-center justify-between bg-gray-700 px-2 py-1 rounded text-xs">
            <span className="text-gray-300">F{f}</span>
            <button 
                onClick={() => removeKeyframe(f)}
                className="text-red-400 hover:text-red-200 ml-2"
            >
                ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
