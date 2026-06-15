import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// MÃ´ phá»ng Schema giáº£n lÆ°á»£c Ä‘á»ƒ in cho gá»n (Thay vÃ¬ import toÃ n bá»™ asset registry)
const SimulatedScriptSchema = z.object({
    title: z.string(),
    reasoning: z.string().describe("AI giáº£i thÃ­ch tÆ° duy sáº¯p xáº¿p Z-Index vÃ  Di chuyá»ƒn cá»§a mÃ¬nh"),
    scenes: z.array(z.object({
        sceneId: z.string(),
        backgroundId: z.string(),
        actors: z.array(z.object({
            characterId: z.string(),
            actionId: z.enum(["walk_cycle", "sit_down", "lean_wall", "talk_angry", "combat_stance"]),
            movement: z.object({
                from: z.string(),
                to: z.string()
            }).optional(),
            zIndex: z.number().describe("10 lÃ  bÃ¬nh thÆ°á»ng. Cáº§n nhá» hÆ¡n Z-Index cá»§a váº­t cáº£n phÃ­a trÆ°á»›c máº·t.")
        }))
    }))
});

async function main() {
    const model = google('gemini-3-flash-preview');

    console.log("ðŸŽ¬ Báº¯t Ä‘áº§u mÃ´ phá»ng AI Director (Giai Ä‘oáº¡n 5.2 - Z-Sorting & POI)...\n");

    const prompt = `Báº¡n lÃ  AI Director. HÃ£y viáº¿t ká»‹ch báº£n JSON cho tÃ¬nh huá»‘ng sau:

Bá»‘i cáº£nh: 'bg_bus_stop_layered' (Gá»“m Lá»›p ná»n [Z: 0] vÃ  Lá»›p má»™t cÃ¡i cá»™t Ä‘Ã¨n che cháº¯n phÃ­a trÆ°á»›c mÃ n hÃ¬nh [Z: 100]).
CÃ³ 2 Ä‘iá»ƒm POI ná»•i báº­t: 
- 'wooden_bench' (Z: 5, Tháº»: sit_able)
- CÃ¡c Ä‘iá»ƒm di dáº¡o máº·c Ä‘á»‹nh: 'front_left', 'mid_center', 'back_right' (Z máº·c Ä‘á»‹nh: 10).

CÃ¢u chuyá»‡n: 
1. Cáº£nh 1: CÃ³ má»™t thanh niÃªn (char_001) Ä‘ang Ä‘i bá»™ tá»« ngoÃ i rÃ o (front_left) tiáº¿n vÃ o giá»¯a tráº¡m chá» (mid_center). Anh ta Ä‘i ngang qua sau lÆ°ng cÃ¡i cá»™t Ä‘Ã¨n lá»›n (bá»‹ cá»™t Ä‘Ã¨n che máº¥t má»™t pháº§n).
2. Cáº£nh 2: Sau Ä‘Ã³ anh ta má»‡t quÃ¡, Ä‘i Ä‘áº¿n cÃ¡i gháº¿ Ä‘Ã¡ (wooden_bench) vÃ  ngá»“i phá»‹ch xuá»‘ng nghá»‰ ngÆ¡i. Gháº¿ Ä‘Ã¡ náº±m phÃ­a sau má»™t cÃ¡i bÃ n nhá» (bÃ n cÃ³ Z: 15).

Nhiá»‡m vá»¥: Sáº¯p xáº¿p Ä‘Ãºng actionId, movement (tá»« Ä‘Ã¢u Ä‘áº¿n Ä‘Ã¢u), vÃ  Ä‘áº·c biá»‡t lÃ  zIndex Ä‘á»ƒ nhÃ¢n váº­t bá»‹ che khuáº¥t má»™t cÃ¡ch há»£p lÃ½ bá»Ÿi cá»™t Ä‘Ã¨n vÃ  cÃ¡i bÃ n.`;

    try {
        const { object } = await generateObject({
            model,
            schema: SimulatedScriptSchema,
            messages: [{ role: 'user', content: prompt }],
        });

        console.log("âœ… AI Director Ä‘Ã£ chá»‘t ká»‹ch báº£n. Xem káº¿t quáº£ (JSON) bÃªn dÆ°á»›i:\n");
        console.log(JSON.stringify(object, null, 2));

        console.log("\n\nðŸ” PHÃ‚N TÃCH Káº¾T QUáº¢:");
        console.log("- HÃ£y xem [reasoning] Ä‘á»ƒ hiá»ƒu cÃ¡ch AI tá»± tÃ­nh toÃ¡n lá»›p (Layer) che khuáº¥t.");
        console.log("- CÃ¡c `actionId` vÃ  `movement` Ä‘Ã£ Ä‘Æ°á»£c tuÃ¢n thá»§ Ä‘Ãºng luáº­t 2.5D POI.");
        console.log("\n(Ghi chÃº: Lá»›p 'Cá»™t Ä‘Ã¨n' Z=100 vÃ  'CÃ¡i BÃ n' Z=15 lÃ  file PNG cáº¯t sáºµn náº±m trong thÆ° má»¥c bá»‘i cáº£nh, Remotion sáº½ tá»± Ä‘á»™ng render Ä‘Ã¨ lÃªn theo Ä‘Ãºng chá»‰ sá»‘ Z-Index nÃ y).");
    } catch (e) {
        console.error("Lá»—i:", e);
    }
}

main().catch(console.error);