import React from 'react';
import { Img, useCurrentFrame, staticFile } from 'remotion';

export interface WaddleSpriteProps {
  src: string;
  waddleSpeed?: number;
  waddleAmplitude?: number;
  enableGreenScreen?: boolean;
}

/**
 * WaddleSprite: Component tạo chuyển động lắc lư (waddle) sinh động cho hình ảnh tĩnh.
 * Thích hợp cho PNGTuber, nhân vật Paper Mario style hoặc vật thể vui nhộn.
 * 
 * @param src - Đường dẫn ảnh (hỗ trợ staticFile)
 * @param waddleSpeed - Tốc độ chuyển động (mặc định 0.15 rad/frame)
 * @param waddleAmplitude - Biên độ xoay và nảy (mặc định 10)
 * @param enableGreenScreen - Bật bộ lọc xoá nền xanh (#00FF00)
 */
export const WaddleSprite: React.FC<WaddleSpriteProps> = ({
  src,
  waddleSpeed = 0.15,
  waddleAmplitude = 10,
  enableGreenScreen = false,
}) => {
  const frame = useCurrentFrame();

  // 1. Công thức xoay (Rotation): Lắc lư qua lại như con lắc
  // Dùng sin wave để tạo sự mượt mà
  const rotation = Math.sin(frame * waddleSpeed) * waddleAmplitude;

  // 2. Công thức nảy (Bounce/Translation Y): 
  // Theo Waddle_Animation_Deep_Dive.md: "Khi đổi hướng, trọng tâm được nâng lên"
  // Chúng ta sử dụng abs(cos) để nhân vật đạt độ cao cực đại khi ở giữa (rotation = 0)
  // và thấp xuống khi nghiêng về hai bên (trọng tâm dồn vào chân).
  const bounceHeight = waddleAmplitude * 1.5;
  const bounce = -Math.abs(Math.cos(frame * waddleSpeed)) * bounceHeight;

  // 3. Công thức Co giãn (Squash & Stretch):
  // Khi bounce gần bằng 0 (lên cao nhất) -> Stretch (Scale Y > 1, Scale X < 1)
  // Khi bounce đạt cực đại âm (rơi xuống thấp nhất) -> Squash (Scale Y < 1, Scale X > 1)
  const stretchFactor = 0.1 * (waddleAmplitude / 10); // Độ co giãn tỷ lệ thuận với biên độ
  const squashStretch = Math.cos(frame * waddleSpeed * 2); // Chu kỳ co giãn nhanh gấp đôi chu kỳ xoay
  
  const scaleY = 1 + squashStretch * stretchFactor;
  const scaleX = 1 - squashStretch * stretchFactor;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
      {/* Bộ lọc Chroma Key cơ bản dùng SVG Matrix */}
      {enableGreenScreen && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id="chromaKeyFilter">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      1.5 -2.5 1.5 1 0"
            />
          </filter>
        </svg>
      )}

      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          // TÂM XOAY BẮT BUỘC: Bottom Center để tạo hiệu ứng waddle tự nhiên
          transformOrigin: 'bottom center',
          transform: `translateY(${bounce}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
          filter: enableGreenScreen ? 'url(#chromaKeyFilter)' : 'none',
          willChange: 'transform',
        }}
      >
        <Img
          src={src.startsWith('http') || src.startsWith('/') ? src : staticFile(src)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
