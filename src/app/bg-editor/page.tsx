"use client";

import React, { useState, useEffect, useRef } from "react";

interface PoiData {
  id: string;
  x: number;
  y: number;
  scale: number;
  affordances?: string[];
  description: string;
}

interface BgPoiSchema {
  horizon_y?: number;
  pois: PoiData[];
}

interface BackgroundInfo {
  id: string;
  name: string;
  path: string;
}

export default function BgEditor() {
  const [backgrounds, setBackgrounds] = useState<BackgroundInfo[]>([]);
  const [selectedBg, setSelectedBg] = useState<BackgroundInfo | null>(null);
  const [poiData, setPoiData] = useState<BgPoiSchema>({ pois: [] });
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const fetchBackgrounds = async () => {
    try {
      const res = await fetch("/api/bg/list");
      const data = await res.json();
      setBackgrounds(data.backgrounds || []);
    } catch {
      console.error("Failed to fetch backgrounds");
    }
  };

  useEffect(() => {
    void fetchBackgrounds();
  }, []);

  const loadPoiData = async (bg: BackgroundInfo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bg/load?id=${bg.id}`);
      const data = await res.json();
      setPoiData(data.pois ? data : { pois: [] });
      setSelectedBg(bg);
    } catch (e) {
      console.error("Failed to load POI data", e);
    }
    setLoading(false);
  };

  // Kéo thả POI
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setDraggingIndex(index);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIndex === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const newPois = [...poiData.pois];
    newPois[draggingIndex] = { ...newPois[draggingIndex], x, y };
    setPoiData({ pois: newPois });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIndex !== null) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingIndex(null);
    }
  };

  const handleSave = async () => {
    if (!selectedBg) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bg/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgFile: selectedBg.id, data: poiData }),
      });
      if (res.ok) alert("✅ Đã lưu POI!");
    } catch {
      alert("❌ Lỗi khi lưu!");
    }
    setLoading(false);
  };

  const handleAIAnalyze = async () => {
    if (!selectedBg) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bg/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgFile: selectedBg.id }),
      });
      const data = await res.json();
      if (data.pois) {
        setPoiData(data);
        alert("✨ AI đã phân tích xong! Hãy kiểm tra và tinh chỉnh lại các điểm POI trên màn hình.");
      } else {
        alert("❌ AI không trả về dữ liệu POI.");
      }
    } catch {
      alert("❌ Lỗi khi phân tích bằng AI!");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* Sidebar chọn nền */}
      <div className="w-64 border-r border-gray-700 p-4 flex flex-col bg-gray-950">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-blue-500">🖼️</span> Backgrounds
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {backgrounds.map(bg => (
            <button
              key={bg.id}
              onClick={() => loadPoiData(bg)}
              className={`w-full text-left p-3 rounded-lg transition-all ${selectedBg?.id === bg.id ? 'bg-blue-600 shadow-lg scale-105' : 'bg-gray-800 hover:bg-gray-700 opacity-70 hover:opacity-100'}`}
            >
              <div className="text-sm font-semibold truncate">{bg.name}</div>
            </button>
          ))}
          {backgrounds.length === 0 && <p className="text-gray-500 text-xs italic">Không có ảnh nào trong public/assets/background</p>}
        </div>
      </div>

      {/* Vùng chỉnh sửa chính */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Spatial POI Editor</h1>
            <p className="text-gray-400 text-sm mt-1">Gắn các điểm neo (Point of Interest) để định vị nhân vật trong không gian.</p>
          </div>
          <div className="flex gap-3">
            <button 
                onClick={handleAIAnalyze}
                className="bg-purple-600 px-5 py-2.5 rounded-lg font-bold hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-lg"
                disabled={!selectedBg || loading}
            >
                <span className="animate-pulse">✨</span> Phân tích bằng AI
            </button>
            <button 
                onClick={() => setPoiData({ pois: [...poiData.pois, { id: `poi_${poiData.pois.length + 1}`, x: 50, y: 50, scale: 1, description: "" }] })}
                className="bg-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 disabled:opacity-50 transition-colors"
                disabled={!selectedBg || loading}
            >
                + Thêm thủ công
            </button>
            <button 
                onClick={handleSave} 
                className="bg-blue-600 px-5 py-2.5 rounded-lg font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg"
                disabled={!selectedBg || loading}
            >
                💾 Lưu POI
            </button>
          </div>
        </div>

        {/* Viewport ảnh */}
        <div className="flex-1 bg-black rounded-2xl relative overflow-hidden flex items-center justify-center border-4 border-gray-800 shadow-2xl group">
          {selectedBg ? (
            <div 
              ref={containerRef}
              className="relative select-none touch-none shadow-2xl"
              style={{ width: "100%", height: "100%", position: "relative" }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Background Image thật */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedBg.path} 
                alt="background" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
              />

              {/* Lớp SVG hiển thị Polygon và Horizon */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Vùng Sàn Nhà Mặc Định (Từ 60% đến 100% Y) */}
                <rect 
                  x="0" 
                  y="60" 
                  width="100" 
                  height="40" 
                  fill="rgba(0, 255, 0, 0.05)" 
                  stroke="rgba(0, 255, 0, 0.3)" 
                  strokeWidth="0.5" 
                  strokeDasharray="2,2"
                />
                <text x="2" y="98" fill="rgba(0, 255, 0, 0.5)" fontSize="3" fontWeight="bold" fontFamily="sans-serif">
                  Vùng di chuyển mặc định (Sàn nhà)
                </text>

                {/* Horizon Line */}
                {poiData.horizon_y !== undefined && (
                  <>
                    <line 
                      x1="0" 
                      y1={poiData.horizon_y} 
                      x2="100" 
                      y2={poiData.horizon_y} 
                      stroke="rgba(255, 0, 0, 0.5)" 
                      strokeWidth="0.5" 
                      strokeDasharray="1,1" 
                    />
                    <text x="2" y={poiData.horizon_y - 1} fill="rgba(255, 0, 0, 0.5)" fontSize="3" fontWeight="bold" fontFamily="sans-serif">
                      Đường chân trời (Scale nhỏ nhất)
                    </text>
                  </>
                )}
              </svg>

              {/* Lớp hiển thị POI */}
              {poiData.pois.map((poi, idx) => (
                <div
                  key={`${poi.id}-${idx}`}
                  onPointerDown={(e) => handlePointerDown(idx, e)}
                  className="absolute cursor-move transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/poi"
                  style={{ left: `${poi.x}%`, top: `${poi.y}%`, zIndex: draggingIndex === idx ? 100 : 10 }}
                >
                  {/* Pin icon hoặc marker */}
                  <div className={`w-8 h-8 rounded-full border-4 ${draggingIndex === idx ? 'bg-red-500 border-white scale-125' : 'bg-blue-500 border-white group-hover/poi:bg-blue-400'} shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center`}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  
                  {/* Tooltip chỉnh sửa */}
                  <div className={`mt-2 bg-gray-900/95 border border-gray-700 p-3 rounded-xl shadow-2xl transition-all flex flex-col items-center gap-2 ${draggingIndex === idx ? 'opacity-100' : 'opacity-0 group-hover/poi:opacity-100 pointer-events-none'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ID:</span>
                        <input 
                            className="bg-gray-800 rounded px-2 py-0.5 focus:outline-none border border-transparent focus:border-blue-500 text-xs w-24 text-white font-mono" 
                            value={poi.id} 
                            onChange={(e) => {
                                const newPois = [...poiData.pois];
                                newPois[idx] = { ...newPois[idx], id: e.target.value };
                                setPoiData({ pois: newPois });
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Scale:</span>
                        <input 
                            type="number" 
                            step="0.1" 
                            className="bg-gray-800 rounded px-2 py-0.5 focus:outline-none border border-transparent focus:border-blue-500 text-xs w-12 text-center text-white" 
                            value={poi.scale} 
                            onChange={(e) => {
                                const newPois = [...poiData.pois];
                                newPois[idx] = { ...newPois[idx], scale: parseFloat(e.target.value) || 0 };
                                setPoiData({ pois: newPois });
                            }}
                        />
                        <button 
                            className="text-red-500 hover:text-red-400 ml-2 text-xs font-bold"
                            onClick={(e) => {
                                e.stopPropagation();
                                const newPois = poiData.pois.filter((_, i) => i !== idx);
                                setPoiData({ pois: newPois });
                            }}
                        >
                            🗑️
                        </button>
                    </div>
                    {poi.affordances && poi.affordances.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[120px]">
                        {poi.affordances.map(tag => (
                          <span key={tag} className="text-[9px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center flex flex-col items-center">
                <div className="text-6xl mb-4 animate-bounce">🖼️</div>
                <h3 className="text-xl font-bold mb-2">Hãy chọn ảnh nền từ Sidebar</h3>
                <p className="text-gray-500 max-w-xs">Chọn một bối cảnh trong thư mục assets để bắt đầu gắn điểm POI.</p>
            </div>
          )}
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] pointer-events-none">
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-bold animate-pulse">Đang xử lý bằng AI...</p>
            </div>
        </div>
      )}
    </div>
  );
}
