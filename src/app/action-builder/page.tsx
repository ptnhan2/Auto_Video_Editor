'use client';

import React, { useState } from 'react';
import Preview from './components/Preview';
import ControlPanel from './components/ControlPanel';
import Timeline from './components/Timeline';
import { useActionStore } from './store/useActionStore';

export default function ActionBuilderPage() {
  const { keyframes, importAction } = useActionStore();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");

  const handleImport = () => {
    try {
      setImportError("");
      const actionData = JSON.parse(importJson);
      
      if (!actionData.tracks || typeof actionData.tracks !== 'object') {
        throw new Error("Invalid action format: missing 'tracks' object.");
      }

      importAction(actionData);
      setShowImport(false);
      setImportJson("");
    } catch (err) {
      if (err instanceof Error) {
        setImportError(err.message);
      } else {
        setImportError("Invalid JSON");
      }
    }
  };

  const generateActionData = () => {
    const actionData = {
      id: "custom_action",
      name: "Custom Action",
      loop: true,
      durationFrames: 60,
      fps: 30,
      tracks: {} as Record<string, { keyframes: { frame: number; [key: string]: unknown }[] }>
    };

    // Group keyframes by track
    const tracks: Record<string, { frame: number; [key: string]: unknown }[]> = {};

    Object.entries(keyframes).forEach(([frameStr, pose]) => {
      const frame = parseInt(frameStr, 10);
      Object.entries(pose).forEach(([trackName, trackData]) => {
        if (!tracks[trackName]) {
          tracks[trackName] = [];
        }
        tracks[trackName].push({
          frame,
          ...trackData
        });
      });
    });

    // Sort keyframes within each track
    Object.entries(tracks).forEach(([trackName, trackFrames]) => {
      trackFrames.sort((a, b) => a.frame - b.frame);
      actionData.tracks[trackName] = { keyframes: trackFrames };
    });

    return actionData;
  };

  const handleExportDownload = () => {
    const data = generateActionData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "custom_action.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-blue-500">🎬</span> Action Builder Sandbox
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Import Action
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Export Action
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Preview */}
        <main className="flex-1 relative border-r border-gray-800">
          <Preview />
        </main>

        {/* Right: Controls */}
        <aside className="w-96 flex-none bg-gray-900 overflow-hidden">
          <ControlPanel />
        </aside>
      </div>

      {/* Bottom: Timeline */}
      <footer className="flex-none h-64 bg-gray-900 border-t border-gray-800">
        <Timeline />
      </footer>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-[800px] max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Import Action JSON</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Paste the JSON representation of an Action (must include <code className="bg-black px-1 rounded text-blue-400">tracks</code> object).
            </p>
            <textarea
              className="flex-1 min-h-[300px] bg-black p-4 rounded border border-gray-800 font-mono text-sm text-green-400 outline-none focus:border-blue-500"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{ "id": "my_action", "tracks": { ... } }'
            />
            {importError && (
              <div className="mt-4 text-red-500 text-sm font-medium">
                {importError}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-[800px] max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Export Action JSON</h2>
              <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Download the JSON file and place it in the <code className="bg-black px-1 rounded text-blue-400">public/animations/</code> directory.
            </p>
            <div className="flex-1 overflow-auto bg-black p-4 rounded border border-gray-800 font-mono text-sm text-green-400">
              <pre>{JSON.stringify(generateActionData(), null, 2)}</pre>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(generateActionData(), null, 2));
                  alert('Copied to clipboard!');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleExportDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
