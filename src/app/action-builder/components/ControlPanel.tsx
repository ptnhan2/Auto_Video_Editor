'use client';

import React from 'react';
import { useActionStore } from '../store/useActionStore';
import { HUMANOID_RIG } from '../../../constants/rig-anatomy';

const ControlPanel: React.FC = () => {
  const currentPose = useActionStore(state => state.currentPose);
  const updatePose = useActionStore(state => state.updatePose);

  return (
    <div className="bg-gray-900 text-white p-6 overflow-y-auto h-full border-l border-gray-700">
      <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">Bone Controls</h2>
      
      <div className="space-y-8">
        {HUMANOID_RIG.map((part) => {
          const pose = currentPose[part.name] || { rotation: 0, rotationY: 0, x: 0, y: 0 };
          
          return (
            <div key={part.name} className="bg-gray-800 p-4 rounded-lg shadow-inner">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-4">{part.name.replace('_', ' ')}</h3>
              
              <div className="space-y-4">
                {/* Rotation Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Rotation (Z)</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={pose.rotation ? Math.round(pose.rotation) : 0}
                        onChange={(e) => updatePose(part.name, { rotation: parseFloat(e.target.value) || 0 })}
                        className="w-14 bg-gray-900 text-white border border-gray-600 rounded px-1 py-0.5 text-right font-mono focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-gray-500 ml-1">°</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={pose.rotation || 0}
                    onChange={(e) => updatePose(part.name, { rotation: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* RotationY Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Rotation (Y) - Depth</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={pose.rotationY ? Math.round(pose.rotationY) : 0}
                        onChange={(e) => updatePose(part.name, { rotationY: parseFloat(e.target.value) || 0 })}
                        className="w-14 bg-gray-900 text-white border border-gray-600 rounded px-1 py-0.5 text-right font-mono focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-gray-500 ml-1">°</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={pose.rotationY || 0}
                    onChange={(e) => updatePose(part.name, { rotationY: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>

                {/* Head specific controls */}
                {part.name === 'head' && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Expression ID</span>
                    </div>
                    <select
                      value={pose.assetId || 'exp_female_001'}
                      onChange={(e) => updatePose(part.name, { assetId: e.target.value })}
                      className="w-full bg-gray-900 text-white border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                    >
                      {/* Generate options from 001 to 055 based on manifest */}
                      {Array.from({ length: 55 }, (_, i) => {
                        const numStr = String(i + 1).padStart(3, '0');
                        const id = `exp_female_${numStr}`;
                        return (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Root specific controls */}
                {part.name === 'torso' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">X Offset</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={pose.x ? Math.round(pose.x) : 0}
                            onChange={(e) => updatePose(part.name, { x: parseFloat(e.target.value) || 0 })}
                            className="w-14 bg-gray-900 text-white border border-gray-600 rounded px-1 py-0.5 text-right font-mono focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-gray-500 ml-1">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="1"
                        value={pose.x || 0}
                        onChange={(e) => updatePose(part.name, { x: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Y Offset</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={pose.y ? Math.round(pose.y) : 0}
                            onChange={(e) => updatePose(part.name, { y: parseFloat(e.target.value) || 0 })}
                            className="w-14 bg-gray-900 text-white border border-gray-600 rounded px-1 py-0.5 text-right font-mono focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-gray-500 ml-1">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="1"
                        value={pose.y || 0}
                        onChange={(e) => updatePose(part.name, { y: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ControlPanel;
