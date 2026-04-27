import { ActorData } from '../types/ai-schemas';

/**
 * Tính toán thời lượng scene tự động dựa trên độ dài thoại của tất cả diễn viên trong scene.
 * Tốc độ đọc trung bình: ~15 ký tự/giây.
 * @param actors Danh sách diễn viên trong scene
 * @returns Thời gian (giây) - Mặc định tối thiểu 2 giây
 */
export const calculateSceneDuration = (actors: ActorData[], isSequential: boolean = false): number => {
  let totalDuration = 0;
  let maxDuration = 2; // Tối thiểu 2 giây cho một scene
  
  if (!actors || actors.length === 0) return maxDuration;

  actors.forEach(actor => {
    let duration = 0;
    
    if (actor.audioDuration) {
      // Dùng thời lượng thật của TTS Audio nếu có
      duration = actor.audioDuration;
    } else if (actor.dialogue) {
      // Dự phòng: Ước tính 15 ký tự/giây
      duration = Math.max(actor.dialogue.length / 15, 2);
    }
    
    totalDuration += duration;
    
    if (duration > maxDuration) {
      maxDuration = duration;
    }
  });
  
  // Nếu là dạng thoại nối tiếp (như TTS preview), thì lấy tổng
  // Nếu là dạng song song (nhân vật cùng diễn), lấy khoảng thời gian dài nhất
  const finalDuration = isSequential ? totalDuration : maxDuration;
  
  return Math.max(Math.ceil(finalDuration), 2);
};
