import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, interpolate, useCurrentFrame, useVideoConfig, spring, Audio } from 'remotion';
import { Puppet } from '../components/Puppet';
import { Action } from '../../src/types/animation';
import { SceneData, VideoScriptData } from '../../src/types/ai-schemas';
import { calculateSceneDuration } from '../../src/lib/audio-timing';

/**
 * COMPONENT: SingleActor
 * Chịu trách nhiệm load file action JSON và render 1 nhân vật trên màn hình.
 */
const SingleActor: React.FC<{
  characterId: string;
  actionId: string;
  expressionId: string;
  facing: "left" | "right";
  index: number;
  totalActors: number;
  movement?: { from: string, to: string };
  zIndex?: number;
}> = ({ characterId, actionId, expressionId, facing, index, totalActors, movement, zIndex = 10 }) => {
  const [handle] = useState(() => delayRender());
  const [action, setAction] = useState<Action | null>(null);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  useEffect(() => {
    const fileName = actionId.endsWith('.json') ? actionId : `${actionId}.json`;
    
    fetch(staticFile(`animations/${fileName}`))
      .then((res) => {
        if (!res.ok) throw new Error(`Action JSON không tồn tại: ${fileName}`);
        return res.json();
      })
      .then((data) => {
        setAction(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.warn(`[SceneCompiler] Không tìm thấy action '${fileName}', fallback về 'verified_walk.json'`, err);
        return fetch(staticFile(`animations/verified_walk.json`))
          .then((res2) => res2.json())
          .then((fallbackData) => {
            setAction(fallbackData);
            continueRender(handle);
          });
      })
      .catch((finalErr) => {
        console.error("Lỗi Fallback:", finalErr);
        continueRender(handle);
      });
  }, [actionId, handle]);

  if (!action) return null;

  // Giả lập tọa độ các điểm POI
  const POI_MAP: Record<string, number> = {
    'front_left': 20,
    'mid_center': 50,
    'back_right': 80,
    'wooden_bench': 65 // Nằm ở X=65%
  };

  // Logic nội suy chuyển động (Nếu có movement)
  let posX = totalActors === 1 ? 50 : (index === 0 ? 25 : 75);
  
  if (movement) {
    const startX = POI_MAP[movement.from] || 20;
    const endX = POI_MAP[movement.to] || 80;
    
    // Thay vì spring đi hết nhanh, ta dùng interpolate theo frame để đi từ từ
    posX = interpolate(frame, [0, durationInFrames - 30], [startX, endX], {
      extrapolateRight: 'clamp'
    });
  }

  return (
    <div style={{
      position: 'absolute',
      left: `${posX}%`,
      top: '50%',
      zIndex: zIndex,
      transform: `translate(-50%, -50%) ${facing === 'right' ? 'scaleX(-1)' : ''}`,
    }}>
      <Puppet
        characterId={characterId}
        action={action}
        overrideExpressionId={expressionId}
      />
    </div>
  );
};

// Các Placeholder Mock Assets cho bối cảnh
const PlaceholderLayer: React.FC<{ 
  color: string, 
  text: string, 
  zIndex: number, 
  style?: React.CSSProperties 
}> = ({ color, text, zIndex, style }) => (
  <div style={{
    position: 'absolute',
    backgroundColor: color,
    zIndex,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    border: '2px dashed rgba(255,255,255,0.5)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    ...style
  }}>
    {text} <br/> (Z: {zIndex})
  </div>
);

/**
 * COMPONENT: SceneRenderer
 * Chịu trách nhiệm render bên trong một Sequence cụ thể,
 * bao gồm logic Camera (Zoom/Pan), Audio SFX và Subtitle.
 */
const SceneRenderer: React.FC<{ scene: SceneData; durationFrames: number }> = ({ scene, durationFrames }) => {
  const frame = useCurrentFrame();
  
  let scale = 1;
  let translateX = 0;

  if (scene.camera?.type === 'zoom_in') {
    scale = interpolate(frame, [0, durationFrames], [1, scene.camera.intensity || 1.2], { extrapolateRight: 'clamp' });
    translateX = interpolate(frame, [0, durationFrames], [0, 50 - (scene.camera.targetX || 50)], { extrapolateRight: 'clamp' });
  } else if (scene.camera?.type === 'zoom_out') {
    scale = interpolate(frame, [0, durationFrames], [scene.camera.intensity || 1.2, 1], { extrapolateRight: 'clamp' });
    translateX = interpolate(frame, [0, durationFrames], [50 - (scene.camera.targetX || 50), 0], { extrapolateRight: 'clamp' });
  } else if (scene.camera?.type === 'pan_left') {
    translateX = interpolate(frame, [0, durationFrames], [0, 10], { extrapolateRight: 'clamp' });
  } else if (scene.camera?.type === 'pan_right') {
    translateX = interpolate(frame, [0, durationFrames], [0, -10], { extrapolateRight: 'clamp' });
  }

  return (
    <AbsoluteFill style={{ 
      transform: `scale(${scale}) translateX(${translateX}%)`,
      transformOrigin: 'center center',
      backgroundColor: '#94a3b8'
    }}>
      {/* Lớp Nền (Background Z:0) */}
      <AbsoluteFill style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', bottom: 10, left: 20, color: '#333' }}>
          📍 Bối cảnh: {scene.backgroundId} (Z: 0)
        </div>
      </AbsoluteFill>

      {/* Các lớp Đồ vật Placeholder */}
      {scene.backgroundId === 'bg_bus_stop_layered' && (
        <>
          <PlaceholderLayer 
            color="#d97706" text="Ghế Đá (wooden_bench)" zIndex={5} 
            style={{ width: 300, height: 150, bottom: '20%', left: '65%', transform: 'translateX(-50%)' }} 
          />
          <PlaceholderLayer 
            color="#78350f" text="Cái Bàn (coffee_table)" zIndex={15} 
            style={{ width: 250, height: 100, bottom: '15%', left: '68%', transform: 'translateX(-50%)' }} 
          />
          <PlaceholderLayer 
            color="#1e293b" text="Cột Đèn (street_pillar)" zIndex={100} 
            style={{ width: 80, height: '80%', bottom: '0%', left: '35%', transform: 'translateX(-50%)' }} 
          />
        </>
      )}

      {/* Render danh sách Diễn viên */}
      {scene.actors.map((actor, actorIndex) => (
        <SingleActor
          key={`actor-${actor.characterId}-${actorIndex}`}
          characterId={actor.characterId}
          actionId={actor.actionId}
          expressionId={actor.expressionId}
          facing={actor.facing}
          index={actorIndex}
          totalActors={scene.actors.length}
          movement={actor.movement}
          zIndex={actor.zIndex}
        />
      ))}

      {/* Render SFX của từng diễn viên */}
      {scene.actors.map((actor) => 
        actor.sfx?.map((effect, i) => (
          <Sequence key={`sfx-${actor.characterId}-${i}`} from={effect.startFrame} name={`SFX ${effect.assetId}`}>
            <div style={{ position: 'absolute', top: 20, right: 20, padding: 10, background: 'orange', color: 'white', fontWeight: 'bold', zIndex: 1000, borderRadius: 5 }}>
              🔊 SFX: {effect.assetId}
            </div>
            {/* Tắt thẻ Audio thật để khỏi bị lỗi thiếu file mp3 khi render preview */}
            {/* <Audio src={staticFile(`assets/audio/${effect.assetId}`)} /> */}
          </Sequence>
        ))
      )}

      {/* Subtitle - Render bên ngoài hiệu ứng transform của scene nếu không muốn text bị zoom */}
      {/* Trong demo này ta đặt ở trong để text ăn theo camera luôn (tùy thiết kế) */}
      {scene.actors.filter(a => a.dialogue).map((actor, actorIndex) => {
        const isLeft = scene.actors.length === 1 || actorIndex === 0;
        return (
          <div key={`dlg-${actorIndex}`} style={{
            position: 'absolute',
            bottom: 50,
            left: isLeft ? '10%' : '50%',
            width: '40%',
            textAlign: 'center',
            fontSize: 36,
            color: 'black',
            textShadow: '2px 2px 4px white, -2px -2px 4px white, 2px -2px 4px white, -2px 2px 4px white',
            fontWeight: 'bold',
            zIndex: 999
          }}>
            <span style={{ fontSize: 24, color: '#555', display: 'block' }}>{actor.characterId}</span>
            &quot;{actor.dialogue}&quot;
          </div>
        );
      })}

      {/* Cảnh báo Thiếu Asset (Graceful Fallback Mechanism) */}
      {scene.requestedAssets && scene.requestedAssets.map((req, i) => (
        <div key={`req-${i}`} style={{
          position: 'absolute',
          top: 80 + i * 50,
          left: 20,
          padding: 10,
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: 8,
          zIndex: 1000,
          border: '2px solid white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          ⚠️ CẦN VẼ THÊM [{req.type.toUpperCase()}]: {req.missingConcept}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: SceneCompiler
 */
export const SceneCompiler: React.FC<{
  script: VideoScriptData;
}> = ({ script }) => {
  
  const FPS = 30;
  return (
    <AbsoluteFill style={{ backgroundColor: '#f0f0f0' }}>
      
      <div style={{ position: 'absolute', padding: 20, zIndex: 999, fontSize: 24, fontWeight: 'bold' }}>
        🎬 {script.title}
      </div>

      {script.scenes.map((scene: SceneData, sceneIndex: number) => {
        // Auto Pacing: Lấy durationSeconds hoặc tự tính dựa trên dialogue
        const finalDurationSecs = scene.durationSeconds || calculateSceneDuration(scene.actors);
        const durationFrames = finalDurationSecs * FPS;
        
        let computedStart = 0;
        for (let i = 0; i < sceneIndex; i++) {
          const prevSecs = script.scenes[i].durationSeconds || calculateSceneDuration(script.scenes[i].actors);
          computedStart += prevSecs * FPS;
        }

        return (
          <Sequence
            key={`scene-${sceneIndex}-${scene.sceneId}`}
            from={computedStart}
            durationInFrames={durationFrames}
            name={scene.sceneId}
          >
            <SceneRenderer scene={scene} durationFrames={durationFrames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
