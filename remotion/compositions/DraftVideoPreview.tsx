import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Series, continueRender, delayRender, staticFile } from 'remotion';
import { SceneCompiler } from './SceneCompiler';
import { VideoScriptSchema, SceneData, ActorData, ShotData } from '../../src/shared/types/ai-schemas';

type FlexibleScript = { title: string; scenes: (SceneData & { shots?: ShotData[] | ActorData[] })[] };

export const DraftVideoPreview: React.FC<{
  scriptFile: string;
  syncOffset?: number;
}> = ({ scriptFile, syncOffset = 0 }) => {
  const [handle] = useState(() => delayRender());
  const [scriptData, setScriptData] = useState<FlexibleScript | null>(null);
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
        // Validate dữ liệu: Chấp nhận cả định dạng VideoScript (Full) và TTSScript (Review)
        const result = VideoScriptSchema.safeParse(data);
        
        if (!result.success) {
          // Kiểm tra xem có phải định dạng TTS (có scenes và shots) không
          const rawData = data as Record<string, unknown>;
          const isTTSFormat = rawData &&
            'scenes' in rawData &&
            Array.isArray(rawData.scenes) &&
            rawData.scenes.every((s: unknown) =>
              s && typeof s === 'object' && ('shots' in s || 'actors' in s)
            );
          
          if (!isTTSFormat) {
            console.error("Lỗi cấu trúc kịch bản:", result.error.format());
            throw new Error(`File kịch bản '${scriptFile}' bị lỗi cấu trúc nghiêm trọng (Thiếu 'scenes').`);
          }
          
          console.warn(`[DraftVideoPreview] File '${scriptFile}' không khớp hoàn toàn với VideoScriptSchema, nhưng vẫn có cấu trúc cơ bản. Đang cố gắng render...`);
          
          const hasActors = (rawData.scenes as Record<string, unknown>[]).every((s) => s && 'actors' in s);
          if (!hasActors) {
            console.log("ℹ️ Chế độ: TTS Review Mode (Sequential)");
          }
        }

        setScriptData(data as FlexibleScript);
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

  const fps = 30;

  return (
    <AbsoluteFill>
      <Series>
        {scriptData.scenes.map((scene, index) => {
          let sceneDurationSecs = 0;
          if (typeof (scene as any).totalDurationSeconds === 'number') {
            sceneDurationSecs = (scene as any).totalDurationSeconds;
          } else if (Array.isArray(scene.shots)) {
            // Fallback calculating from shots
            sceneDurationSecs = scene.shots.reduce((acc, shot: any) => acc + (shot.durationSeconds || 5), 0);
          } else {
            // Old fallback
            sceneDurationSecs = (scene as any).durationSeconds || 5;
          }

          const durationInFrames = Math.max(Math.ceil(sceneDurationSecs * fps), 30);

          return (
            <Series.Sequence
              key={`${index}-${scene.sceneId || 'scene'}`}
              durationInFrames={durationInFrames}
              name={`🎞️ Cảnh: ${scene.sceneId || index}`}
            >
              <SceneCompiler scene={scene as any} syncOffset={syncOffset} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};