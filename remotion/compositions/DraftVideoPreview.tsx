import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile } from 'remotion';
import { SceneCompiler } from './SceneCompiler';
import { VideoScriptData } from '../../src/types/ai-schemas';

export const DraftVideoPreview: React.FC<{
  scriptFile: string;
}> = ({ scriptFile }) => {
  const [handle] = useState(() => delayRender());
  const [scriptData, setScriptData] = useState<VideoScriptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load file draft JSON từ thư mục public/scripts/
    fetch(staticFile(`scripts/${scriptFile}`))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Chưa tìm thấy file kịch bản. Vui lòng chạy lệnh tạo script trước! (vd: npx tsx scripts/core/generate_script.ts "Truyện...")`);
        }
        return res.json();
      })
      .then((data) => {
        setScriptData(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        continueRender(handle);
      });
  }, [scriptFile, handle]);

  if (error) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <h1 style={{ color: '#ff6b6b', fontSize: '32px', textAlign: 'center' }}>
          🎬 AI Director Chưa Sẵn Sàng<br/><br/>
          <span style={{ fontSize: '20px', color: '#ccc' }}>{error}</span>
        </h1>
      </AbsoluteFill>
    );
  }

  if (!scriptData) {
    return null; // Đang load file
  }

  return (
    <AbsoluteFill>
      <SceneCompiler script={scriptData} />
    </AbsoluteFill>
  );
};