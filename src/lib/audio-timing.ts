import { ActorData } from '../types/ai-schemas';

/**
 * Tính toán thời lượng scene tự động dựa trên độ dài thoại của tất cả diễn viên trong scene.
 * Tốc độ đọc trung bình: ~15 ký tự/giây.
 * @param actors Danh sách diễn viên trong scene
 * @returns Thời gian (giây) - Mặc định tối thiểu 2 giây
 */
export const calculateSceneDuration = (actors: ActorData[]): number => {
  let maxDuration = 2; // Tối thiểu 2 giây cho một scene
  
  if (!actors || actors.length === 0) return maxDuration;

  actors.forEach(actor => {
    if (actor.dialogue) {
      // Ước tính 15 ký tự/giây
      const estimatedSecs = Math.max(actor.dialogue.length / 15, 2); 
      if (estimatedSecs > maxDuration) {
        maxDuration = estimatedSecs;
      }
    }
  });
  
  return Math.ceil(maxDuration);
};
