import { CSSProperties } from 'react';

/**
 * UTILITY: getActorPositionStyle
 * Chuyển đổi position string (9-Point Grid) sang CSS properties cho Remotion Actor.
 * Tuân thủ docs/architecture/visual_foundation_implementation.md
 */
export function getActorPositionStyle(position: string): CSSProperties {
  const styles: CSSProperties = {
    position: 'absolute',
    transformOrigin: 'bottom center',
    transform: 'translate(-50%, 0)', // Canh giữa theo chiều ngang dựa trên 'left'
  };

  // 1. Phân tách logic Chiều sâu (Depth) - Hàng ngang (Row)
  // Các prefix: back_, mid_, front_
  if (position.startsWith('back_')) {
    styles.bottom = '40%';
    styles.scale = 0.3;
    styles.zIndex = 10;
  } else if (position.startsWith('mid_')) {
    styles.bottom = '15%';
    styles.scale = 0.5;
    styles.zIndex = 20;
  } else if (position.startsWith('front_')) {
    styles.bottom = '-5%';
    styles.scale = 0.7;
    styles.zIndex = 30;
  } else {
    // Fallback mặc định (mid) nếu không khớp prefix
    styles.bottom = '15%';
    styles.scale = 0.5;
    styles.zIndex = 20;
  }

  // 2. Phân tách logic Vị trí Ngang (Horizontal) - Cột (Column)
  // Các suffix: _left, _center, _right
  if (position.endsWith('_left')) {
    styles.left = '15%';
  } else if (position.endsWith('_center')) {
    styles.left = '50%';
  } else if (position.endsWith('_right')) {
    styles.left = '85%';
  } else {
    // Fallback mặc định (center) nếu không khớp suffix
    styles.left = '50%';
  }

  return styles;
}
