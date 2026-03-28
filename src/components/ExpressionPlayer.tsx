import React, { useEffect, useState } from 'react';
import { useCurrentFrame, AbsoluteFill, staticFile } from 'remotion';

interface AtlasFrame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AtlasData {
  imagePath: string;
  frames: AtlasFrame[];
}

export const ExpressionPlayer: React.FC = () => {
  const frame = useCurrentFrame();
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null);
  
  const spriteSheetUrl = staticFile("assets/female_expression/002/Biểu cảm nữ.png");
  const jsonDataUrl = staticFile("assets/female_expression/002/data.json");

  // Đọc file JSON đã convert từ XML
  useEffect(() => {
    fetch(jsonDataUrl)
      .then(res => res.json())
      .then(data => setAtlasData(data))
      .catch(err => console.error("Lỗi đọc file data:", err));
  }, [jsonDataUrl]);

  if (!atlasData) return <AbsoluteFill style={{backgroundColor: '#000'}} />;

  // Nhóm các frame theo prefix "元件 X" (mỗi biểu cảm có 6 frame)
  // Trong file của bạn: 2000x, 3000x, 4000x
  const expressions = [
    atlasData.frames.filter(f => f.name.includes("2000")),
    atlasData.frames.filter(f => f.name.includes("3000")),
    atlasData.frames.filter(f => f.name.includes("4000"))
  ].filter(group => group.length > 0);

  return (
    <AbsoluteFill style={{ 
      backgroundColor: '#121212', 
      display: 'flex', 
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      {expressions.map((frames, idx) => {
        // Tốc độ 6 frame video cho 1 frame biểu cảm
        const frameIndex = Math.floor(frame / 6) % frames.length;
        const currentFrame = frames[frameIndex];

        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 30px' }}>
            <div
              style={{
                width: currentFrame.w,
                height: currentFrame.h,
                backgroundImage: `url(${spriteSheetUrl})`,
                backgroundPosition: `-${currentFrame.x}px -${currentFrame.y}px`,
                backgroundRepeat: 'no-repeat',
                transform: 'scale(1.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            />
            <div style={{ color: '#fff', marginTop: 60, fontSize: 18, fontWeight: 'bold' }}>
              Biểu cảm {idx + 1}
            </div>
          </div>
        );
      })}
      
      <div style={{ position: 'absolute', top: 50, color: '#4caf50', fontSize: 32, fontWeight: 'bold' }}>
        KẾT QUẢ TRÍCH XUẤT TỪ FILE .FLA (BỘ 002)
      </div>
      
      <div style={{ position: 'absolute', bottom: 50, color: '#666', fontSize: 16 }}>
        Đã đọc file XML gốc và chuyển đổi tự động sang Animation
      </div>
    </AbsoluteFill>
  );
};
