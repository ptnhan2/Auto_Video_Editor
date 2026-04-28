import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, Series, continueRender, delayRender, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig, Audio, Img, Easing } from 'remotion';
import { HumanoidSprite as WaddleSprite } from '../components/HumanoidSprite';
import { Subtitle } from '../components/Subtitle';
import { InteractionEffect } from '../components/InteractionEffect';
import { Action } from '../../src/shared/types/animation';
import { ActorData, SceneData } from '../../src/shared/types/ai-schemas';
import { calculateSceneDuration } from '../../src/lib/audio-timing';
import { getActorPositionStyle } from '../../src/lib/visual-grid';

/**
 * COMPONENT: SingleActor
 * Chịu trách nhiệm load file action JSON và render 1 nhân vật trên màn hình.
 */
const SingleActor: React.FC<{
  characterId: string;
  actionId: string;
  expressionId: string;
  expressionTag?: string;
  facing: "left" | "right" | "camera";
  position?: string;
  moveToPosition?: string;
  index: number;
  totalActors: number;
  movement?: { from: string, to: string };
  isEnteringFrom?: 'left' | 'right';
  isExitingTo?: 'left' | 'right';
  zIndex?: number;
  propId?: string;
  isSpeaking?: boolean;
}> = ({ characterId, actionId, expressionId, expressionTag, facing, position = "mid_center", moveToPosition, index, totalActors, movement, isEnteringFrom, isExitingTo, zIndex, propId, isSpeaking }) => {
  const [handle] = useState(() => delayRender());
  const [action, setAction] = useState<Action | null>(null);
  const [hasError, setHasError] = useState(false);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

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

  // Lấy Grid Style cơ bản dựa trên position
  const startGridStyle = getActorPositionStyle(position);
  const endGridStyle = moveToPosition ? getActorPositionStyle(moveToPosition) : startGridStyle;

  // Ghi đè zIndex nếu có prop truyền vào trực tiếp
  const finalZIndex = zIndex ?? (startGridStyle.zIndex as number);

  // Xử lý nội suy di chuyển (Movement Interpolation)
  const parsePercent = (val: string | number | undefined, def: number) => {
    if (typeof val === 'string' && val.endsWith('%')) return parseFloat(val);
    if (typeof val === 'number') return val;
    return def;
  };

  const startLeft = parsePercent(startGridStyle.left, 50);
  const endLeft = parsePercent(endGridStyle.left, startLeft);

  const startBottom = parsePercent(startGridStyle.bottom, 15);
  const endBottom = parsePercent(endGridStyle.bottom, startBottom);

  const startScale = typeof startGridStyle.scale === 'number' ? startGridStyle.scale : 0.5;
  const endScale = typeof endGridStyle.scale === 'number' ? endGridStyle.scale : startScale;

  // Progress từ 0 -> 1 trên toàn bộ durationInFrames
  const moveProgress = moveToPosition
    ? interpolate(frame, [0, durationInFrames], [0, 1], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
        easing: Easing.inOut(Easing.quad)
      })
    : 0;

  const currentLeft = startLeft + (endLeft - startLeft) * moveProgress;
  const currentBottom = startBottom + (endBottom - startBottom) * moveProgress;
  const currentScaleBase = startScale + (endScale - startScale) * moveProgress;

  // 🔄 HIỆU ỨNG "BREATHING" (THỞ): Làm nhân vật sống động hơn khi đứng im
  const breathing = interpolate(
    Math.sin(frame / 10),
    [-1, 1],
    [0.995, 1.005]
  );

  // 🚪 HIỆU ỨNG ENTER/EXIT (TH1: Walking in/out)
  // TH2: Nếu không có isEnteringFrom / isExitingTo, nhân vật xuất hiện instant, opacity luôn là 1.
  const walkDuration = Math.min(45, durationInFrames / 2); // 45 frames cho một walk cycle mượt mà
  const exitStart = durationInFrames - walkDuration;

  let currentTranslateX = 0; // Relative to the computed percentage grid position

  // 1. Tính toán điểm bắt đầu/kết thúc nếu đi vào/đi ra
  // Assuming full screen is roughly 100vw, -100 to +100 gives plenty of off-screen room
  const offScreenLeft = -100;
  const offScreenRight = 100;

  if (isEnteringFrom && frame < walkDuration) {
    const startX = isEnteringFrom === 'left' ? offScreenLeft : offScreenRight;
    currentTranslateX = interpolate(frame, [0, walkDuration], [startX, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  } else if (isExitingTo && frame >= exitStart) {
    const endX = isExitingTo === 'left' ? offScreenLeft : offScreenRight;
    currentTranslateX = interpolate(frame, [exitStart, durationInFrames], [0, endX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  // Xử lý hướng mặt: Mặc định asset hướng phải, nên facing="left" thì scaleX(-1)
  // Lưu ý: startGridStyle đã có transform: translate(-50%, 0)
  const flip = facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  // Kết hợp translateX của walk in/out với transform gốc
  const combinedTransform = `${startGridStyle.transform} translateX(${currentTranslateX}vw) ${flip} scale(${breathing})`;
  const opacity = 1; // Luôn luôn instant theo TH2 nếu không đi bộ (hoặc giữ 1 khi đang đi bộ TH1)

  // Logic hiệu ứng cầm nắm (Visual workaround cho 'grab')
  const isGrabbing = actionId === 'grab' && propId && propId !== 'prop_none';
  const grabCloudDuration = 15;
  const grabFlyDuration = 15; // Thời gian item bay từ xa tới tay
  
  const isPropEquipped = !isGrabbing || frame >= grabCloudDuration + grabFlyDuration;
  
  const flyProgress = isGrabbing ? interpolate(
    frame,
    [grabCloudDuration, grabCloudDuration + grabFlyDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  ) : 1;

  return (
    <div style={{
      ...startGridStyle,
      left: `${currentLeft}%`,
      bottom: `${currentBottom}%`,
      scale: currentScaleBase,
      zIndex: finalZIndex,
      transform: combinedTransform,
      opacity,
      filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))'
    }}>
      {/* Hiệu ứng mây bụi khi đang grab (Frame 0-15) */}
      {isGrabbing && frame < grabCloudDuration && (
        <InteractionEffect durationFrames={grabCloudDuration} />
      )}

      {/* Item bay về phía nhân vật sau khi mây bụi kết thúc (Frame 15-30) */}
      {isGrabbing && frame >= grabCloudDuration && frame < grabCloudDuration + grabFlyDuration && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          // Item bay từ dưới góc lên tay
          transform: `translate(-50%, -50%) translate(${interpolate(flyProgress, [0, 1], [150, 0])}px, ${interpolate(flyProgress, [0, 1], [150, 0])}px) scale(0.3)`,
          zIndex: 100,
        }}>
          <Img src={staticFile(`assets/item/${propId}.png`)} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {!hasError ? (
        <WaddleSprite
          characterId={characterId}
          action={action}
          actionName={actionId}
          overrideExpressionId={expressionId}
          expressionTag={expressionTag}
          isSpeaking={isSpeaking}
          onError={() => setHasError(true)}
        />
      ) : (
        <VisualPlaceholder type="character" label={characterId} />
      )}
    </div>
  );
};

/**
 * COMPONENT: VisualPlaceholder
 * Hiển thị một khung bao (Box) chuyên nghiệp đại diện cho tài nguyên bị thiếu.
 */
const VisualPlaceholder: React.FC<{
  type: 'character' | 'background' | 'prop',
  label: string,
  style?: React.CSSProperties
}> = ({ type, label, style }) => {
  const isBg = type === 'background';
  
  return (
    <div style={{
      width: isBg ? '100%' : 250,
      height: isBg ? '100%' : 400,
      backgroundColor: isBg ? '#334155' : 'rgba(100, 116, 139, 0.4)',
      border: '4px dashed rgba(255,255,255,0.3)',
      borderRadius: isBg ? 0 : 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'monospace',
      position: isBg ? 'absolute' : 'relative',
      overflow: 'hidden',
      ...style
    }}>
      {/* Họa tiết Grid cho background */}
      {isBg && (
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      )}
      
      <div style={{ fontSize: isBg ? 80 : 40, marginBottom: 10 }}>
        {type === 'character' ? '👤' : type === 'background' ? '🖼️' : '📦'}
      </div>
      <div style={{ fontSize: isBg ? 30 : 16, fontWeight: 'bold', textAlign: 'center', padding: '0 20px' }}>
        MISSING {type.toUpperCase()}
      </div>
      <div style={{ fontSize: isBg ? 20 : 14, opacity: 0.8, marginTop: 5 }}>
        ID: {label}
      </div>
    </div>
  );
};

/**
 * COMPONENT: BackgroundLayer
 */
const BackgroundLayer: React.FC<{ 
  backgroundId: string;
  environment?: { time_of_day?: string; lighting?: string };
}> = ({ backgroundId, environment }) => {
  const [errorCount, setErrorCount] = useState(0);
  
  // Kiểm tra an toàn nếu backgroundId bị rỗng
  if (!backgroundId) {
    return <VisualPlaceholder type="background" label="EMPTY_ID" />;
  }
  
  // Thử các biến thể của tên file (có hoặc không có tiền tố bg_)
  const cleanId = backgroundId.startsWith('bg_') ? backgroundId.replace('bg_', '') : backgroundId;
  const variants = [backgroundId, cleanId, `bg_${backgroundId}`];
  
  const currentPath = staticFile(`assets/background/${variants[errorCount] || backgroundId}.jpg`);
  const isFinalError = errorCount >= variants.length;

  const timeOfDay = environment?.time_of_day || 'day';
  const lighting = environment?.lighting || 'normal';

  let filter = 'none';
  if (lighting === 'dim') filter = 'brightness(0.7)';
  if (lighting === 'dramatic') filter = 'contrast(1.2)';

  return (
    <AbsoluteFill style={{ zIndex: 0 }}>
      {!isFinalError ? (
        <Img
          src={currentPath}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter }}
          onError={() => setErrorCount(prev => prev + 1)}
        />
      ) : (
        <VisualPlaceholder type="background" label={backgroundId} />
      )}
      
      {/* Lớp phủ Overlay (Night/Twilight) */}
      {timeOfDay === 'night' && (
        <AbsoluteFill style={{ backgroundColor: 'rgba(10, 10, 40, 0.6)', mixBlendMode: 'multiply' }} />
      )}
      {timeOfDay === 'twilight' && (
        <AbsoluteFill style={{ backgroundColor: 'rgba(255, 140, 50, 0.3)', mixBlendMode: 'overlay' }} />
      )}

      {/* Label bối cảnh nhỏ gọn ở góc */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: '5px 12px',
        background: 'rgba(0,0,0,0.6)',
        color: '#94a3b8',
        borderRadius: 5,
        fontSize: 12,
        fontFamily: 'monospace'
      }}>
        ENV: {backgroundId}
      </div>
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: ShotVisual
 * Render hình ảnh diễn viên.
 */
const ShotVisual: React.FC<{
  actor: Partial<ActorData> & { actors?: Partial<ActorData>[] };
  actorIndex: number;
  totalActors: number;
}> = ({ actor, actorIndex, totalActors }) => {
  const actorsList = Array.isArray(actor.actors) ? actor.actors : [actor];

  return (
    <AbsoluteFill>
      {/* Visual Actor (Skip if narrator) */}
      {actorsList.map((a: Partial<ActorData>, idx: number) => {
        if (!a.characterId || a.characterId === 'narrator') return null;
        return (
          <SingleActor
            key={idx}
            characterId={a.characterId}
            actionId={a.actionId || 'verified_walk'}
            expressionId={a.expressionId || 'neutral'}
            expressionTag={a.expressionTag}
            facing={a.facing || 'left'}
            position={a.position || 'mid_center'}
            moveToPosition={a.moveToPosition}
            index={idx}
            totalActors={actorsList.length}
            movement={a.movement}
            isEnteringFrom={a.isEnteringFrom}
            isExitingTo={a.isExitingTo}
            zIndex={a.zIndex}
            propId={a.propId}
            isSpeaking={!!a.dialogue || !!a.isSpeaking}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: ShotAudioSub
 * Render Subtitle, Audio, và SFX.
 */
const ShotAudioSub: React.FC<{
  actor: ActorData;
  syncOffset: number;
  isLeft: boolean;
}> = ({ actor, syncOffset, isLeft }) => {
  const { fps } = useVideoConfig();
  const durationInFrames = actor.audioDuration ? Math.ceil(actor.audioDuration * fps) : undefined;

  return (
    <AbsoluteFill>
      {/* 2. Subtitle */}
      {actor.dialogue && (
        <Subtitle
          dialogue={actor.dialogue}
          characterId={actor.characterId || 'narrator'}
          audioDurationInFrames={durationInFrames}
          wordTimings={actor.wordTimings}
          syncOffset={syncOffset}
          style={{
            bottom: 50,
            left: isLeft ? '10%' : '50%',
            width: '40%'
          }}
        />
      )}

      {/* 3. Voice Audio */}
      {actor.audioId && (
        <Audio
          src={staticFile(`assets/audio/tts/${actor.audioId}.mp3`)}
        />
      )}

      {/* 4. Actor SFX (Nếu có) */}
      {actor.sfx?.map((effect, i) => (
        <Sequence key={`sfx-${i}`} from={effect.startFrame} name={`🔊 SFX: ${effect.assetId}`}>
          <div style={{ position: 'absolute', top: 20, right: 20, padding: 10, background: 'orange', color: 'white', fontWeight: 'bold', zIndex: 1000, borderRadius: 5 }}>
            🔊 SFX: {effect.assetId}
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: CameraWrapper
 * Xử lý chuyển động Camera cho Background và Actors.
 */
const CameraWrapper: React.FC<{
  cameraWork?: { type: string; intensity?: number; targetX?: number };
  durationFrames: number;
  children: React.ReactNode;
}> = ({ cameraWork, durationFrames, children }) => {
  const frame = useCurrentFrame();

  let scale = 1;
  let translateX = 0;

  const cameraType = cameraWork?.type || 'static';
  const intensity = cameraWork?.intensity || 1.15;
  const targetX = cameraWork?.targetX || 50;

  if (cameraType === 'zoom_in') {
    scale = interpolate(frame, [0, durationFrames], [1, intensity], {
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.33, 1, 0.68, 1) // Smooth ease-out
    });
    translateX = interpolate(frame, [0, durationFrames], [0, 50 - targetX], {
      extrapolateRight: 'clamp'
    });
  } else if (cameraType === 'zoom_out') {
    scale = interpolate(frame, [0, durationFrames], [intensity, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.33, 1, 0.68, 1)
    });
    translateX = interpolate(frame, [0, durationFrames], [50 - targetX, 0], {
      extrapolateRight: 'clamp'
    });
  } else if (cameraType === 'pan_left') {
    translateX = interpolate(frame, [0, durationFrames], [-5, 5], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad)
    });
  } else if (cameraType === 'pan_right') {
    translateX = interpolate(frame, [0, durationFrames], [5, -5], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad)
    });
  }

  return (
    <AbsoluteFill style={{
      transform: `scale(${scale}) translateX(${translateX}%)`,
      transformOrigin: 'center center',
    }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: SceneRenderer
 */
const SceneRenderer: React.FC<{
  scene: SceneData & { 
    shots?: ActorData[]; 
    cameraWork?: { type: string; intensity?: number; targetX?: number };
    environment?: { time_of_day?: string; lighting?: string };
  };
  durationFrames: number;
  syncOffset?: number;
}> = ({ scene, durationFrames, syncOffset = 0 }) => {
  const { fps } = useVideoConfig();
  
  const rawActors = scene.actors || scene.shots || [];
  const normalizedActors = rawActors.map((item: Partial<ActorData> & { actors?: Partial<ActorData>[] }) => {
    const inferredCharId = item.characterId || (item.actors && item.actors.length > 0 ? item.actors[0].characterId : 'narrator');
    return {
      ...item,
      characterId: inferredCharId,
      actionId: item.actionId || 'verified_walk',
    };
  }) as ActorData[];

  const isSequential = !scene.actors && !!scene.shots;

  const cameraWork = scene.cameraWork || scene.camera;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a', // Deep slate background
      overflow: 'hidden'
    }}>
      {/* --- PHẦN 1: CAMERA (CHỈ BỌC BACKGROUND VÀ ACTORS) --- */}
      <CameraWrapper cameraWork={cameraWork} durationFrames={durationFrames}>
        {/* Background Layer */}
        <Sequence from={0} durationInFrames={durationFrames} name={`🖼️ Background: ${scene.backgroundId}`}>
          <BackgroundLayer backgroundId={scene.backgroundId} environment={scene.environment} />
        </Sequence>

        {/* Visual Actors */}
        {isSequential ? (
          <Sequence from={0} durationInFrames={durationFrames} name="👥 Sequential Visuals">
            <Series>
              {normalizedActors.map((actor, idx) => (
                <Series.Sequence
                  key={`visual-${idx}`}
                  durationInFrames={Math.max(Math.ceil((actor.audioDuration || 2) * fps), 30)}
                  name={`🎬 [${actor.characterId}] Visual`}
                >
                  <ShotVisual
                    actor={actor}
                    actorIndex={idx}
                    totalActors={1}
                  />
                </Series.Sequence>
              ))}
            </Series>
          </Sequence>
        ) : (
          <Sequence from={0} durationInFrames={durationFrames} name="👥 Parallel Visuals">
            {normalizedActors.map((actor, idx) => (
              <Sequence
                key={`visual-${idx}`}
                from={0}
                durationInFrames={durationFrames}
                name={`🎬 [${actor.characterId}] Visual`}
              >
                <ShotVisual
                  actor={actor}
                  actorIndex={idx}
                  totalActors={normalizedActors.length}
                />
              </Sequence>
            ))}
          </Sequence>
        )}
      </CameraWrapper>

      {/* --- PHẦN 2: NGOÀI CAMERA (SUBTITLE, AUDIO, UI OVERLAYS) --- */}
      {isSequential ? (
        <Sequence from={0} durationInFrames={durationFrames} name="🗣️ Sequential Audio/Sub">
          <Series>
            {normalizedActors.map((actor, idx) => (
              <Series.Sequence
                key={`audio-sub-${idx}`}
                durationInFrames={Math.max(Math.ceil((actor.audioDuration || 2) * fps), 30)}
                name={`🔊 [${actor.characterId}] ${actor.dialogue?.substring(0, 30) || 'Audio'}...`}
              >
                <ShotAudioSub
                  actor={actor}
                  syncOffset={syncOffset}
                  isLeft={true}
                />
              </Series.Sequence>
            ))}
          </Series>
        </Sequence>
      ) : (
        <Sequence from={0} durationInFrames={durationFrames} name="🗣️ Parallel Audio/Sub">
          {normalizedActors.map((actor, idx) => (
            <Sequence
              key={`audio-sub-${idx}`}
              from={0}
              durationInFrames={durationFrames}
              name={`🔊 [${actor.characterId}] Audio`}
            >
              <ShotAudioSub
                actor={actor}
                syncOffset={syncOffset}
                isLeft={idx === 0}
              />
            </Sequence>
          ))}
        </Sequence>
      )}

      {/* Overlay info for TTS mode */}
      {isSequential && (
        <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', padding: '5px 15px', background: 'rgba(59, 130, 246, 0.8)', color: 'white', zIndex: 1000, textAlign: 'center', borderRadius: 20, fontSize: 12 }}>
          ℹ️ Chế độ xem trước thoại (Sequential Mode)
        </div>
      )}

      {/* Cảnh báo Thiếu Asset (Graceful Fallback Mechanism) */}
      {scene.requestedAssets && (scene.requestedAssets as { type: string, missingConcept: string }[]).map((req, i) => (
        <Sequence key={`req-${i}`} from={0} durationInFrames={durationFrames} name={`⚠️ Missing: ${req.missingConcept}`}>
          <div style={{
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
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: SceneCompiler
 */
interface FlexibleScene extends SceneData {
  shots?: ActorData[];
  environment?: { time_of_day?: string; lighting?: string };
}

export const SceneCompiler: React.FC<{
  script: { title: string; scenes: FlexibleScene[] };
  syncOffset?: number;
}> = ({ script, syncOffset = 0 }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#f0f0f0' }}>
      <div style={{ position: 'absolute', padding: 20, zIndex: 999, fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>
        🎬 {script.title}
      </div>

      <Series>
        {script.scenes.map((scene, index) => {
          const actors = (scene.actors || scene.shots || []) as ActorData[];
          const isSequential = !scene.actors && !!scene.shots;
          const durationSecs = scene.durationSeconds || calculateSceneDuration(actors, isSequential);
          const durationInFrames = Math.max(Math.ceil(durationSecs * fps), 30);

          return (
            <Series.Sequence
              key={`${index}-${scene.sceneId}`}
              durationInFrames={durationInFrames}
              name={`🎞️ Cảnh: ${scene.sceneId}`}
            >
              <SceneRenderer
                scene={scene as FlexibleScene}
                durationFrames={durationInFrames}
                syncOffset={syncOffset}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
