import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, Series, continueRender, delayRender, staticFile, interpolate, useCurrentFrame, useVideoConfig, Audio, Img, Easing, spring } from 'remotion';
import { HumanoidSprite as WaddleSprite } from '../components/HumanoidSprite';
import { InteractionEffect } from '../components/InteractionEffect';
import { Action } from '../../src/shared/types/animation';
import { ActorData, SceneData, ShotData } from '../../src/shared/types/ai-schemas';
import { getActorPositionStyle } from '../../src/lib/visual-grid';

/**
 * COMPONENT: SingleActor
 * Chịu trách nhiệm load file action JSON và render 1 nhân vật trên màn hình.
 */
export const SingleActor: React.FC<{
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
  const { durationInFrames } = useVideoConfig();

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
  const walkDuration = Math.min(45, durationInFrames / 2);
  const exitStart = durationInFrames - walkDuration;

  let currentTranslateX = 0;
  const offScreenLeft = -100;
  const offScreenRight = 100;

  if (isEnteringFrom && frame < walkDuration) {
    const startX = isEnteringFrom === 'left' ? offScreenLeft : offScreenRight;
    currentTranslateX = interpolate(frame, [0, walkDuration], [startX, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  } else if (isExitingTo && frame >= exitStart) {
    const endX = isExitingTo === 'left' ? offScreenLeft : offScreenRight;
    currentTranslateX = interpolate(frame, [exitStart, durationInFrames], [0, endX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  const flip = facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  const combinedTransform = `${startGridStyle.transform} translateX(${currentTranslateX}vw) ${flip} scale(${breathing})`;
  const opacity = 1;

  // Logic hiệu ứng cầm nắm (Visual workaround cho 'grab')
  const isGrabbing = actionId === 'grab' && propId && propId !== 'prop_none';
  const grabCloudDuration = 15;
  const grabFlyDuration = 15; 
  
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
export const BackgroundLayer: React.FC<{ 
  backgroundId: string;
  environment?: { time_of_day?: string; lighting?: string };
}> = ({ backgroundId, environment }) => {
  const [errorCount, setErrorCount] = useState(0);
  
  if (!backgroundId) {
    return <VisualPlaceholder type="background" label="EMPTY_ID" />;
  }
  
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
 * COMPONENT: CameraWrapper
 * Bao bọc BackgroundLayer và Shots timeline để áp dụng chuyển động Camera (zoom, pan)
 */
const CameraWrapper: React.FC<{ shots: ShotData[], children: React.ReactNode }> = ({ shots, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  let accumulatedFrames = 0;
  let activeShot = shots[0];
  let shotStartFrame = 0;
  let shotDuration = 30;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const durationFrames = Math.max(Math.ceil((shot.durationSeconds || 5) * fps), 30);
    if (frame >= accumulatedFrames && frame < accumulatedFrames + durationFrames) {
      activeShot = shot;
      shotStartFrame = accumulatedFrames;
      shotDuration = durationFrames;
      break;
    }
    accumulatedFrames += durationFrames;
    if (i === shots.length - 1 && frame >= accumulatedFrames) {
      activeShot = shot;
      shotStartFrame = accumulatedFrames - durationFrames;
      shotDuration = durationFrames;
    }
  }

  const relativeFrame = frame - shotStartFrame;
  const camera = activeShot?.camera;
  
  let scale = 1;
  let translateX = 0;
  let transformOrigin = '50% 50%';

  if (camera) {
    const intensity = camera.intensity || 1.2;
    const isCrashZoom = (camera as any).crash_zoom || (camera as any).easing === 'spring';
    
    // Zoom logic with easeInOut spring-like feel using interpolate or spring
    if (camera.type === 'zoom_in') {
      if (isCrashZoom) {
        const spr = spring({ frame: relativeFrame, fps, config: { damping: 10, stiffness: 100 } });
        scale = interpolate(spr, [0, 1], [1, intensity]);
      } else {
        scale = interpolate(relativeFrame, [0, shotDuration], [1, intensity], { 
          extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) 
        });
      }
    } else if (camera.type === 'zoom_out') {
      if (isCrashZoom) {
        const spr = spring({ frame: relativeFrame, fps, config: { damping: 10, stiffness: 100 } });
        scale = interpolate(spr, [0, 1], [intensity, 1]);
      } else {
        scale = interpolate(relativeFrame, [0, shotDuration], [intensity, 1], { 
          extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) 
        });
      }
    } else if (camera.type === 'pan_left') {
      translateX = interpolate(relativeFrame, [0, shotDuration], [0, 10], { 
        extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) 
      });
    } else if (camera.type === 'pan_right') {
      translateX = interpolate(relativeFrame, [0, shotDuration], [0, -10], { 
        extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) 
      });
    }

    if (camera.targetX !== undefined) {
      transformOrigin = `${camera.targetX}% 50%`;
    }
  }

  return (
    <AbsoluteFill style={{
      transform: `scale(${scale}) translateX(${translateX}vw)`,
      transformOrigin,
      willChange: 'transform'
    }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * COMPONENT: SceneCompiler
 * Parses SceneData -> Shots -> Actors.
 */
export const SceneCompiler: React.FC<{
  scene: SceneData;
  syncOffset?: number;
}> = ({ scene, syncOffset = 0 }) => {
  const { fps } = useVideoConfig();

  // Normalize structure: if it's legacy without shots, treat the whole scene as one shot
  const shots: ShotData[] = scene.shots && scene.shots.length > 0
    ? scene.shots
    : [
        {
          shotId: scene.sceneId + "_fallback_shot",
          durationSeconds: scene.totalDurationSeconds || (scene as any).durationSeconds || 5,
          actors: (scene as any).actors || [],
          camera: (scene as any).camera || null,
        }
      ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', overflow: 'hidden' }}>
      <CameraWrapper shots={shots}>
        {/* Background is stable throughout the Scene */}
        <BackgroundLayer 
          backgroundId={scene.backgroundId} 
          environment={(scene as any).environment} 
        />

        <Series>
          {shots.map((shot, shotIndex) => {
            const durationFrames = Math.max(Math.ceil((shot.durationSeconds || 5) * fps), 30);
            
            return (
              <Series.Sequence
                key={`shot-${shot.shotId || shotIndex}`}
                durationInFrames={durationFrames}
                name={`🎥 Shot: ${shot.shotId || shotIndex}`}
              >
                <AbsoluteFill>
                  {/* Cinematic Under-Actors Overlays */}
                  <InteractionEffect 
                    layerType="under_actors"
                    layoutStyle={shot.layoutStyle}
                    visualMetaphor={shot.visualMetaphor}
                    transitionIn={shot.transitionIn}
                    atmosphereFx={shot.atmosphereFx}
                    assetDynamics={shot.assetDynamics}
                    durationFrames={durationFrames}
                  />

                  {/* Visual Actors */}
                  {shot.actors && shot.actors.map((actor, idx) => {
                    if (!actor.characterId || actor.characterId === 'narrator') return null;
                    return (
                      <SingleActor
                        key={`actor-${idx}`}
                        characterId={actor.characterId}
                        actionId={actor.actionId || 'verified_walk'}
                        expressionId={actor.expressionId || 'neutral'}
                        expressionTag={actor.expressionTag}
                        facing={actor.facing || 'left'}
                        position={actor.position || 'mid_center'}
                        moveToPosition={actor.moveToPosition}
                        index={idx}
                        totalActors={shot.actors.length}
                        movement={actor.movement}
                        isEnteringFrom={actor.isEnteringFrom}
                        isExitingTo={actor.isExitingTo}
                        zIndex={actor.zIndex}
                        propId={actor.propId}
                        isSpeaking={!!actor.dialogue || !!actor.isSpeaking}
                      />
                    );
                  })}

                  {/* Cinematic Over-Actors Overlays */}
                  <InteractionEffect 
                    layerType="over_actors"
                    layoutStyle={shot.layoutStyle}
                    visualMetaphor={shot.visualMetaphor}
                    transitionIn={shot.transitionIn}
                    atmosphereFx={shot.atmosphereFx}
                    assetDynamics={shot.assetDynamics}
                    durationFrames={durationFrames}
                  />

                  {/* Audio/SFX */}
                  {shot.actors && shot.actors.map((actor, idx) => (
                    <AbsoluteFill key={`audio-${idx}`}>
                      {actor.audioId && (
                        <Audio src={staticFile(`assets/audio/tts/${actor.audioId}.mp3`)} />
                      )}
                      {actor.sfx?.map((effect, i) => (
                        <Sequence key={`sfx-${i}`} from={effect.startFrame || 0} name={`🔊 SFX: ${effect.assetId}`}>
                          <div style={{ position: 'absolute', top: 20 + i*30, right: 20, padding: 10, background: 'orange', color: 'white', fontWeight: 'bold', zIndex: 1000, borderRadius: 5 }}>
                            🔊 SFX: {effect.assetId}
                          </div>
                        </Sequence>
                      ))}
                    </AbsoluteFill>
                  ))}
                </AbsoluteFill>
              </Series.Sequence>
            );
          })}
        </Series>
        
        {/* Cảnh báo Thiếu Asset */}
        {(scene as any).requestedAssets && ((scene as any).requestedAssets as { type: string, missingConcept: string }[]).map((req, i) => (
          <Sequence key={`req-${i}`} from={0} name={`⚠️ Missing: ${req.missingConcept}`}>
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
      </CameraWrapper>
    </AbsoluteFill>
  );
};
