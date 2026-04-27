/**
 * VOICE PROFILES REGISTRY (DO NOT AUTO-SYNC)
 * 
 * File cấu hình này định nghĩa CỐ ĐỊNH giọng đọc (Provider + Voice ID) cho từng nhân vật.
 * Khi AI Director sinh ra kịch bản với `characterId`, hệ thống TTS sẽ tra cứu file này
 * để gọi API lồng tiếng cho đúng người, đảm bảo tính nhất quán (Consistency).
 */

import { CharacterId } from "./asset-registry";

export interface VoiceProfile {
  provider: "edge" | "tiktok" | "elevenlabs";
  voice: string;
  settings?: {
    model?: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
    latency?: number;
    rate?: string;
    pitch?: string;
  };
}

// Bổ sung các ID nhân vật đặc biệt không có model hình ảnh nhưng có giọng
export type ExtendedCharacterId = CharacterId | "narrator";

export const VOICE_PROFILES: Partial<Record<ExtendedCharacterId, VoiceProfile>> = {
  // Người dẫn chuyện
  narrator: {
    provider: "edge",
    voice: "vi-VN-HoaiMyNeural",
    settings: { rate: "+0%", pitch: "+0Hz" }
  },

  // Từ Mộng - Nữ chính, trẻ trung
  char_tu_mong: {
    provider: "edge",
    voice: "vi-VN-HoaiMyNeural",
    settings: { rate: "+10%", pitch: "+5Hz" }
  },

  // Phùng Yến Văn - Mẹ nuôi, hiền dịu
  char_phung_yen_van: {
    provider: "edge",
    voice: "vi-VN-HoaiMyNeural",
    settings: { rate: "-10%", pitch: "-2Hz" }
  },

  // Tiết Lão Thái - Bà nội, đanh đá
  // char_tiet_lao_thai: {
  //   provider: "edge",
  //   voice: "vi-VN-HoaiMyNeural",
  //   settings: { rate: "+20%", pitch: "+10Hz" }
  // },

  // Dì Đại Pháo - Hàng xóm
  // char_di_dai_phao: {
  //   provider: "edge",
  //   voice: "vi-VN-HoaiMyNeural",
  //   settings: { rate: "+5%", pitch: "+0Hz" }
  // },

  // Default fallback for any other char
  char_001: {
    provider: "edge",
    voice: "vi-VN-HoaiMyNeural",
  },
};
