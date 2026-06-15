import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { VideoScriptSchema, VideoScriptData } from "../../shared/types/ai-schemas";
import { CHARACTERS, ACTIONS, EXPRESSIONS, BACKGROUNDS, AUDIO_TRACKS, EFFECTS } from "../../config/asset-registry";

/**
 * HÃ m nÃ y chá»‹u trÃ¡ch nhiá»‡m gá»­i ká»‹ch báº£n thÃ´ (text) lÃªn Gemini
 * vÃ  yÃªu cáº§u Gemini Ä‘Ã³ng vai Äáº¡o diá»…n (AI Director),
 * sinh ra cáº¥u trÃºc dá»¯ liá»‡u JSON chuáº©n xÃ¡c 100% Ä‘á»ƒ náº¡p vÃ o Remotion.
 */
export async function generateVideoScript(storyText: string): Promise<VideoScriptData> {
  
  // Chuáº©n bá»‹ thÃ´ng tin "Tá»« Ä‘iá»ƒn tÃ i nguyÃªn" Ä‘á»ƒ nháº¯c nhá»Ÿ AI trong System Prompt
  const contextPrompt = `
    Báº¡n lÃ  má»™t Äáº¡o diá»…n Phim Hoáº¡t HÃ¬nh 2D chuyÃªn nghiá»‡p.
    Nhiá»‡m vá»¥ cá»§a báº¡n lÃ  chuyá»ƒn Ä‘á»•i ká»‹ch báº£n truyá»‡n sau Ä‘Ã¢y thÃ nh má»™t chuá»—i cÃ¡c cáº£nh quay (Scenes) chi tiáº¿t.
    Há»‡ thá»‘ng render (Remotion) chá»‰ hiá»ƒu Ä‘Æ°á»£c má»™t cáº¥u trÃºc JSON Ä‘áº·c biá»‡t.

    QUAN TRá»ŒNG NHáº¤T: Báº¡n KHÃ”NG ÄÆ¯á»¢C PHÃ‰P "sÃ¡ng táº¡o" ra báº¥t ká»³ tÃ i nguyÃªn nÃ o (nhÃ¢n váº­t, hÃ nh Ä‘á»™ng, biá»ƒu cáº£m, Ã¢m thanh, bá»‘i cáº£nh) khÃ´ng cÃ³ trong danh sÃ¡ch dÆ°á»›i Ä‘Ã¢y.
    
    TÃ€I NGUYÃŠN HIá»†N CÃ“ TRONG Há»† THá»NG:
    - NhÃ¢n váº­t (Characters): ${CHARACTERS.map(c => `${c.id} (${c.name}: ${c.description})`).join(", ")}
    - HÃ nh Ä‘á»™ng (Actions): ${ACTIONS.map(a => `${a.id} (${a.description})`).join(", ")}
    - Biá»ƒu cáº£m (Expressions): ${EXPRESSIONS.map(e => `${e.id} (${e.description})`).join(", ")}
    - Bá»‘i cáº£nh (Backgrounds): ${BACKGROUNDS.map(b => `${b.id} (${b.description})`).join(", ")}
    - Nháº¡c ná»n (BGM): ${AUDIO_TRACKS.filter(a => a.type === "bgm").map(a => `${a.id} (${a.description})`).join(", ")}
    - Hiá»‡u á»©ng Ã¢m thanh (SFX): ${AUDIO_TRACKS.filter(a => a.type === "sfx").map(a => `${a.id} (${a.description})`).join(", ")}
    - GÃ³c mÃ¡y/Ká»¹ xáº£o (Camera/VFX): ${EFFECTS.map(e => `${e.id} (${e.description})`).join(", ")}

    YÃŠU Cáº¦U Äáº O DIá»„N:
    1. BÃ³c tÃ¡ch cÃ¢u chuyá»‡n thÃ nh tá»«ng phÃ¢n cáº£nh nhá» (Scenes). Má»—i cáº£nh khoáº£ng 3-10 giÃ¢y.
    2. Chá»n bá»‘i cáº£nh (backgroundId) phÃ¹ há»£p.
    3. Äáº·t cÃ¡c nhÃ¢n váº­t (actors) vÃ o cáº£nh.
    4. Chá»‰ Ä‘á»‹nh hÃ nh Ä‘á»™ng (actionId) vÃ  biá»ƒu cáº£m (expressionId) phÃ¹ há»£p vá»›i ngá»¯ cáº£nh cÃ¢u thoáº¡i.
    5. Chá»‰ Ä‘á»‹nh hÆ°á»›ng máº·t (facing) Ä‘á»ƒ hai nhÃ¢n váº­t nÃ³i chuyá»‡n nhÃ¬n vÃ o nhau. VÃ­ dá»¥ nam bÃªn trÃ¡i (facing right), ná»¯ bÃªn pháº£i (facing left).
    6. TrÃ­ch xuáº¥t chÃ­nh xÃ¡c cÃ¢u thoáº¡i (dialogue) cá»§a nhÃ¢n váº­t.
    7. ThÃªm nháº¡c ná»n (bgmId) hoáº·c hiá»‡u á»©ng Ã¢m thanh (sfxId) náº¿u tháº¥y phÃ¹ há»£p Ä‘á»ƒ tÄƒng cáº£m xÃºc.
  `;

  console.log("ðŸŽ¬ [AI Director] Äang phÃ¢n tÃ­ch ká»‹ch báº£n vÃ  dá»±ng cáº¥u trÃºc phim...");

  try {
    // Sá»­ dá»¥ng Vercel AI SDK 'generateObject'
    // HÃ m nÃ y tá»± Ä‘á»™ng wrap Zod Schema thÃ nh JSON Schema vÃ  Ã©p model tráº£ vá» Ä‘Ãºng format.
    // NÃ³ cÅ©ng tÃ­ch há»£p sáºµn cÆ¡ cháº¿ auto-retry (thá»­ láº¡i) náº¿u model tráº£ vá» sai JSON.
    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: VideoScriptSchema,
      system: contextPrompt,
      prompt: `Ká»‹ch báº£n truyá»‡n cáº§n Ä‘áº¡o diá»…n:\n\n"""\n${storyText}\n"""`,
      // Máº·c Ä‘á»‹nh Vercel AI SDK cÃ³ cÆ¡ cháº¿ maxRetries Ä‘á»ƒ tá»± sá»­a lá»—i JSON
    });

    console.log("âœ… [AI Director] Dá»±ng phim hoÃ n táº¥t!");
    return object;

  } catch (error) {
    console.error("âŒ [AI Director] Tháº¥t báº¡i trong viá»‡c sinh ká»‹ch báº£n JSON:", error);
    throw error;
  }
}
