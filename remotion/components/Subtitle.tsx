import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const Subtitle: React.FC<{
  dialogue: string;
  characterId: string;
  audioDurationInFrames?: number;
  wordTimings?: { text: string; start: number; end: number }[];
  style?: React.CSSProperties;
  syncOffset?: number;
}> = ({ dialogue, characterId, audioDurationInFrames, wordTimings: manualTimings, style, syncOffset = 0 }) => {
  const rawFrame = useCurrentFrame();
  const frame = rawFrame - syncOffset;
  const { fps } = useVideoConfig();
  
  // Ưu tiên dùng Timings chính xác từ TTS Engine, nếu không có mới dùng ước lượng tuyến tính
  const finalWordTimings = React.useMemo(() => {
    if (manualTimings && manualTimings.length > 0) {
      return manualTimings.map(t => ({
        text: t.text,
        startFrame: t.start * fps,
        endFrame: t.end * fps
      }));
    }

    const words = dialogue.split(' ');
    const totalDuration = audioDurationInFrames || (dialogue.length / 15) * fps;
    
    // Thêm một khoảng trễ nhỏ (offset) cho chế độ ước lượng tuyến tính
    // vì hầu hết các file audio TTS đều có một đoạn lặng ngắn ở đầu (~0.3s)
    const START_OFFSET_FRAMES = 0.3 * fps;
    const usableDuration = Math.max(totalDuration - START_OFFSET_FRAMES, 0);

    let currentPos = 0;
    const timings: { text: string; startFrame: number; endFrame: number }[] = [];
    
    for (const word of words) {
      const startFrame = START_OFFSET_FRAMES + (currentPos / dialogue.length) * usableDuration;
      timings.push({
        text: word,
        startFrame,
        endFrame: startFrame + (word.length / dialogue.length) * usableDuration
      });
      currentPos += word.length + 1;
    }
    return timings;
  }, [dialogue, audioDurationInFrames, fps, manualTimings]);

  return (
    <div style={{
      position: 'absolute',
      textAlign: 'center',
      fontSize: 42,
      fontFamily: 'sans-serif',
      color: 'white',
      textShadow: '3px 3px 6px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
      fontWeight: 'bold',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: '20px',
      borderRadius: '16px',
      ...style
    }}>
      {characterId !== 'narrator' && (
        <span style={{ fontSize: 28, color: '#fbbf24', marginBottom: 8 }}>{characterId}</span>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60px', alignItems: 'center' }}>
        {finalWordTimings.map((w, i) => {
          // Bắt chữ hiện ra sớm hơn 0.25 giây để mắt phản xạ kịp với âm thanh
          const VISUAL_OFFSET_FRAMES = 0.25 * fps;
          const currentAdjustedFrame = frame + VISUAL_OFFSET_FRAMES;
          
          const isActive = currentAdjustedFrame >= w.startFrame && currentAdjustedFrame < (w.endFrame || w.startFrame + 15);
          
          if (!isActive) return null;

          return (
            <span
              key={i}
              style={{
                color: '#fbbf24',
                fontWeight: 'bold',
                textShadow: '0 0 15px rgba(251, 191, 36, 1), 2px 2px 4px #000',
                fontSize: '60px' // Chữ to rõ để dễ test
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
