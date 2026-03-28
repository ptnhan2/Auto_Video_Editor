import React, { useEffect, useState } from 'react';
import { useCurrentFrame, staticFile } from 'remotion';

interface AtlasFrame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  offX?: number;
  offY?: number;
  sourceW?: number;
  sourceH?: number;
}

interface AtlasMetrics {
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
  note?: string;
}

interface AtlasData {
  imagePath: string;
  frames: AtlasFrame[];
  metrics?: AtlasMetrics;
}

export const ExpressionLayer: React.FC<{
  anchor: { x: number, y: number, width: number, height: number };
  assetId?: string;
}> = ({ anchor, assetId = "exp_female_001" }) => {
  const frame = useCurrentFrame();
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null);
  
  const spriteSheetUrl = staticFile("assets/expressions/female_01/female_expression_sprite_sheet_001.png");
  const jsonDataUrl = staticFile("assets/expressions/female_01/asset_manifest.json");

  useEffect(() => {
    fetch(jsonDataUrl)
      .then(res => res.json())
      .then(data => {
        // Find the right asset ID dynamically
        const asset = data.assets.find((a: { asset_id: string }) => a.asset_id === assetId);
        if (asset) {
          setAtlasData({
            imagePath: data.source_image,
            frames: asset.sprites,
            metrics: data.metrics
          });
        }
      })
      .catch(err => console.error("Error loading expression data:", err));
  }, [jsonDataUrl, assetId]);

  if (!atlasData || atlasData.frames.length === 0) return null;

  // Let's assume frame rate mapping: 6 frames per sprite
  const frameIndex = Math.floor(frame / 6) % atlasData.frames.length;
  const currentFrame = atlasData.frames[frameIndex];

  // Use source dimensions for scaling if available to maintain consistency between frames
  const sourceW = currentFrame.sourceW || currentFrame.w;
  const sourceH = currentFrame.sourceH || currentFrame.h;
  const offX = currentFrame.offX || 0;
  const offY = currentFrame.offY || 0;

  // We multiply anchor dimensions by 1.5 because anchor only covers inner eyes-to-mouth area
  const scaleX = (anchor.width * 1.5) / sourceW;
  const scaleY = (anchor.height * 1.5) / sourceH;
  const scale = Math.min(scaleX, scaleY);

  // Calculate position:
  // 1. Start at anchor center
  // 2. Adjust for symbol-to-sprite offset (frameX, frameY in XML are typically negative in Starling/Animate)
  // 3. Center the whole symbol box on the anchor
  const visualX = anchor.x + (anchor.width - sourceW * scale) / 2 + (Math.abs(offX) * scale);
  const visualY = anchor.y + (anchor.height - sourceH * scale) / 2 + (Math.abs(offY) * scale);

  return (
    <div style={{
      position: 'absolute',
      // Start at anchor center, adjust for symbol box centering, then add local offset
      left: anchor.x + (anchor.width - sourceW * scale) / 2 + (Math.abs(offX) * scale),
      top: anchor.y + (anchor.height - sourceH * scale) / 2 + (Math.abs(offY) * scale),
      width: currentFrame.w,
      height: currentFrame.h,
      backgroundImage: `url(${spriteSheetUrl})`,
      backgroundPosition: `-${currentFrame.x}px -${currentFrame.y}px`,
      backgroundRepeat: 'no-repeat',
      transform: `scale(${scale})`,
      transformOrigin: '0 0',
      zIndex: 10,
      pointerEvents: 'none'
    }} />
  );
};
