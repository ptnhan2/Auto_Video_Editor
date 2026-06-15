import { CSSProperties } from 'react';

/**
 * UTILITY: getActorPositionStyle
 * Chuyá»ƒn Ä‘á»•i position string (9-Point Grid) sang CSS properties cho Video Actor.
 * TuÃ¢n thá»§ docs/architecture/visual_foundation_implementation.md
 */
export function getActorPositionStyle(position: string): CSSProperties {
  const styles: CSSProperties = {
    position: 'absolute',
    transformOrigin: 'bottom center',
    transform: 'translate(-50%, 0)', // Canh giá»¯a theo chiá»u ngang dá»±a trÃªn 'left'
  };

  // 1. PhÃ¢n tÃ¡ch logic Chiá»u sÃ¢u (Depth) - HÃ ng ngang (Row)
  // CÃ¡c prefix: back_, mid_, front_
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
    // Fallback máº·c Ä‘á»‹nh (mid) náº¿u khÃ´ng khá»›p prefix
    styles.bottom = '15%';
    styles.scale = 0.5;
    styles.zIndex = 20;
  }

  // 2. PhÃ¢n tÃ¡ch logic Vá»‹ trÃ­ Ngang (Horizontal) - Cá»™t (Column)
  // CÃ¡c suffix: _left, _center, _right
  if (position.endsWith('_left')) {
    styles.left = '15%';
  } else if (position.endsWith('_center')) {
    styles.left = '50%';
  } else if (position.endsWith('_right')) {
    styles.left = '85%';
  } else {
    // Fallback máº·c Ä‘á»‹nh (center) náº¿u khÃ´ng khá»›p suffix
    styles.left = '50%';
  }

  return styles;
}
