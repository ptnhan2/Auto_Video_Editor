import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');
const REGISTRY_FILE = path.join(process.cwd(), 'src', 'config', 'asset-registry.ts');

function getDirectories(srcPath: string) {
  if (!fs.existsSync(srcPath)) return [];
  return fs.readdirSync(srcPath).filter(file => fs.statSync(path.join(srcPath, file)).isDirectory());
}

function getFiles(srcPath: string) {
  if (!fs.existsSync(srcPath)) return [];
  return fs.readdirSync(srcPath).filter(file => fs.statSync(path.join(srcPath, file)).isFile());
}

function generateRegistry() {
  console.log('Syncing asset registry...');

  // 1. CHARACTERS
  const humanoidDir = path.join(ASSETS_DIR, 'humanoid');
  const characterDirs = getDirectories(humanoidDir);
  const characters = characterDirs.map(dir => ({
    id: dir,
    name: dir,
    description: `Nhân vật: ${dir}`
  }));

  // 2. BACKGROUNDS
  const backgroundDir = path.join(ASSETS_DIR, 'backgrounds');
  let backgrounds = [
    { id: 'bg_transparent', description: 'Phông nền trong suốt hoặc màu trơn.' },
    { id: 'bg_city_day', description: 'Cảnh đường phố thành phố ban ngày.' },
    { id: 'bg_city_night', description: 'Cảnh đường phố thành phố ban đêm.' },
    { id: 'bg_room_indoor', description: 'Cảnh trong phòng, trong nhà.' }
  ];
  if (fs.existsSync(backgroundDir)) {
    const bgFiles = getFiles(backgroundDir);
    bgFiles.forEach(file => {
      const ext = path.extname(file);
      if (['.jpg', '.png', '.jpeg', '.webp'].includes(ext)) {
         const id = `bg_${path.basename(file, ext)}`;
         if (!backgrounds.find(b => b.id === id)) {
           backgrounds.push({ id, description: `Background: ${file}` });
         }
      }
    });
  }
  // Check the old 'background' folder just in case
  const backgroundDir2 = path.join(ASSETS_DIR, 'background');
  if (fs.existsSync(backgroundDir2)) {
    const bgFiles = getFiles(backgroundDir2);
    bgFiles.forEach(file => {
      const ext = path.extname(file);
      if (['.jpg', '.png', '.jpeg', '.webp'].includes(ext)) {
         const id = `bg_${path.basename(file, ext)}`;
         if (!backgrounds.find(b => b.id === id)) {
           backgrounds.push({ id, description: `Background: ${file}` });
         }
      }
    });
  }

  // 3. AUDIO
  const audioDir = path.join(ASSETS_DIR, 'audio');
  let audioTracks = [
    { id: 'bgm_happy', type: 'bgm', description: 'Nhạc nền vui tươi, nhẹ nhàng.' },
    { id: 'bgm_sad', type: 'bgm', description: 'Nhạc nền buồn, chậm, cảm động.' },
    { id: 'bgm_tense', type: 'bgm', description: 'Nhạc nền hồi hộp, kịch tính, đánh nhau.' },
    { id: 'sfx_punch', type: 'sfx', description: 'Tiếng đấm, đánh nhau vật lý.' },
    { id: 'sfx_footsteps', type: 'sfx', description: 'Tiếng bước chân đi bộ.' },
    { id: 'sfx_gasp', type: 'sfx', description: 'Tiếng giật mình thở dốc.' }
  ];
  if (fs.existsSync(audioDir)) {
    const audioFiles = getFiles(audioDir);
    audioFiles.forEach(file => {
      const ext = path.extname(file);
      if (['.mp3', '.wav', '.ogg'].includes(ext)) {
        const baseName = path.basename(file, ext);
        const isBgm = baseName.toLowerCase().startsWith('bgm');
        const id = baseName;
        if (!audioTracks.find(a => a.id === id)) {
            audioTracks.push({
                id,
                type: isBgm ? 'bgm' : 'sfx',
                description: `Audio: ${file}`
            });
        }
      }
    });
  }

  // 4. PROPS
  const propsDir = path.join(ASSETS_DIR, 'props');
  let props = [
    { id: 'prop_none', description: 'Không cầm gì.' },
    { id: 'prop_sword', description: 'Cầm một thanh kiếm.' },
    { id: 'prop_phone', description: 'Cầm điện thoại.' }
  ];
  if (fs.existsSync(propsDir)) {
    const propFiles = getFiles(propsDir);
    propFiles.forEach(file => {
      const ext = path.extname(file);
      if (['.png', '.svg', '.webp'].includes(ext)) {
        const id = `prop_${path.basename(file, ext)}`;
        if (!props.find(p => p.id === id)) {
          props.push({ id, description: `Prop: ${file}` });
        }
      }
    });
  }

  // HARDCODED ACTIONS, EXPRESSIONS, EFFECTS
  const actions = [
    { id: "combat_stance", category: "locomotion", description: "Hành động: combat_stance" },
    { id: "look_around", category: "locomotion", description: "Quay đầu nhìn ngang ngó dọc tìm kiếm." },
    { id: "reach_out", category: "locomotion", description: "Hành động: reach_out" },
    { id: "sneak_cycle", category: "locomotion", description: "Hành động: sneak" },
    { id: "strike", category: "locomotion", description: "Hành động: strike" },
    { id: "surprise_fear", category: "locomotion", description: "Hành động: surprise_fear" },
    { id: "talk_angry", category: "locomotion", description: "Đứng chỉ tay, chồm tới trước, mắng mỏ tức giận." },
    { id: "talk_sad", category: "locomotion", description: "Cúi gập người, buồn bã, thở dài, khóc." },
    { id: "run_cycle", category: "locomotion", description: "Hành động: verified_run" },
    { id: "walk_cycle", category: "locomotion", description: "Hành động: verified_walk" }
  ];

  const expressions = [
    { id: "neutral", description: "Khuôn mặt bình thường, không biểu lộ cảm xúc rõ rệt." },
    { id: "happy", description: "Cười vui vẻ, rạng rỡ." },
    { id: "sad", description: "Buồn bã, ủ rũ hoặc rơm rớm nước mắt." },
    { id: "angry", description: "Tức giận, nhăn nhó, cau mày." },
    { id: "surprised", description: "Sốc, ngạc nhiên tột độ, há hốc mồm." },
    { id: "fear", description: "Sợ hãi, hoảng hốt." }
  ];

  const effects = [
    { id: "cam_wide", type: "camera", description: "Góc máy toàn cảnh nhìn thấy cả người." },
    { id: "cam_closeup", type: "camera", description: "Góc máy cận cảnh vào khuôn mặt nhân vật." },
    { id: "vfx_screen_shake", type: "vfx", description: "Hiệu ứng rung lắc màn hình (khi có va chạm hoặc tức giận)." },
    { id: "vfx_flash_white", type: "vfx", description: "Chớp trắng màn hình (sấm sét, phép thuật)." }
  ];

  const fileContent = `/**
 * ASSET REGISTRY - TỪ ĐIỂN TÀI NGUYÊN CHO AI DIRECTOR (AUTO-GENERATED)
 * 
 * File này được sinh ra tự động bởi script scripts/core/sync_registry.ts.
 * Xin ĐỪNG SỬA TAY file này. Mọi thay đổi sẽ bị ghi đè.
 * Để thêm asset, hãy copy file vào thư mục public/ và chạy lệnh: npm run sync-assets
 */

export const CHARACTERS = ${JSON.stringify(characters, null, 2)} as const;

export const ACTIONS = ${JSON.stringify(actions, null, 2)} as const;

export const EXPRESSIONS = ${JSON.stringify(expressions, null, 2)} as const;

export const BACKGROUNDS = ${JSON.stringify(backgrounds, null, 2)} as const;

export const AUDIO_TRACKS = ${JSON.stringify(audioTracks, null, 2)} as const;

export const EFFECTS = ${JSON.stringify(effects, null, 2)} as const;

export const PROPS = ${JSON.stringify(props, null, 2)} as const;

// Helper Types
export type CharacterId = typeof CHARACTERS[number]["id"];
export type ActionId = typeof ACTIONS[number]["id"];
export type ExpressionId = typeof EXPRESSIONS[number]["id"];
export type BackgroundId = typeof BACKGROUNDS[number]["id"];
export type AudioId = typeof AUDIO_TRACKS[number]["id"];
export type EffectId = typeof EFFECTS[number]["id"];
export type PropId = typeof PROPS[number]["id"];
`;

  fs.writeFileSync(REGISTRY_FILE, fileContent, 'utf-8');
  console.log('✅ Successfully synced asset registry at src/config/asset-registry.ts');
}

generateRegistry();
