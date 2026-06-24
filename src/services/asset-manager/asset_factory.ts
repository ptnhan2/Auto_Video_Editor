import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PUBLIC_SCRIPTS_DIR = path.join(process.cwd(), 'public', 'scripts');
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

// ── Types ──────────────────────────────────────────────────────────

interface AssetProfile {
  assetId?: string;
  type?: string;
  visualPrompt?: string;
  visual_prompt?: string;
}

interface ActorEntry {
  characterId?: string;
}

interface ShotEntry {
  actors?: ActorEntry[];
}

interface SceneEntry {
  backgroundId?: string;
  actors?: ActorEntry[];
  shots?: ShotEntry[];
}

async function runAssetFactory() {
    const scriptName = process.argv[2] || 'reviewed_script.json';
    const scriptPath = path.join(PUBLIC_SCRIPTS_DIR, scriptName);

    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script not found: ${scriptPath}`);
        process.exit(1);
    }

    console.log(`🚀 ASSET FACTORY (WADDLE MIGRATION): Processing ${scriptName}...`);

    const scriptData = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
    
    const characters = new Set<string>();
    const backgrounds = new Set<string>();

    const assetProfiles = scriptData.new_assets_profiles || [];
    const getVisualPrompt = (id: string, type: string) => {
        const profile = assetProfiles.find((p: AssetProfile) => p.assetId === id && p.type === type);
        return profile ? (profile.visualPrompt || profile.visual_prompt || '') : '';
    };

    scriptData.scenes.forEach((scene: SceneEntry) => {
        if (scene.backgroundId) backgrounds.add(scene.backgroundId);
        
        const actors = scene.actors || [];
        actors.forEach((actor: ActorEntry) => {
            if (actor.characterId && actor.characterId !== 'narrator') {
                characters.add(actor.characterId);
            }
        });
        
        const shots = scene.shots || [];
        shots.forEach((shot: ShotEntry) => {
            const shotActors = shot.actors || [];
            shotActors.forEach((actor: ActorEntry) => {
                if (actor.characterId && actor.characterId !== 'narrator') {
                    characters.add(actor.characterId);
                }
            });
        });
    });

    console.log(`Found ${characters.size} unique characters and ${backgrounds.size} unique backgrounds.`);

    for (const charId of characters) {
        const charDir = path.join(ASSETS_DIR, 'humanoid', charId);
        const partsDir = path.join(charDir, 'parts');
        const pivotsPath = path.join(partsDir, 'pivots.json');
        const bodyImagePath = path.join(partsDir, 'body.png');

        if (!fs.existsSync(pivotsPath)) {
            console.log(`\n💎 Missing Character: ${charId}. Generating...`);
            try {
                // Sinh hình ảnh cơ bản nền xanh (base.png)
                console.log(`   [1/2] Generating base image with green screen...`);
                const customPrompt = getVisualPrompt(charId, 'character');
                const promptArg = customPrompt ? ` "${customPrompt.replace(/"/g, '\\"')}"` : '';
                execSync(`npx tsx scripts/core/core-asset-gen.ts humanoid ${charId}${promptArg}`, { stdio: 'inherit' });

                // Chuyển sang cơ chế Waddle: Không dùng Rigger nữa
                console.log(`   [2/2] Bypassing Rigger... Setting up single body layer...`);
                if (!fs.existsSync(partsDir)) fs.mkdirSync(partsDir, { recursive: true });
                
                // Copy base.png sang parts/body.png (trong thực tế có thể dùng node-canvas để xóa phông xanh ở đây)
                const baseImagePath = path.join(charDir, 'base.png');
                if (fs.existsSync(baseImagePath)) {
                    fs.copyFileSync(baseImagePath, bodyImagePath);
                } else {
                    console.error("Base image not found to copy to body.png");
                }

                // Tạo pivots.json tối giản cho Waddle (1 mảnh duy nhất, tâm neo ở Bottom Center)
                const waddlePivots = {
                    "body": {
                        "x": 0.5,
                        "y": 1.0,
                        "width": 1024,
                        "height": 1024,
                        "globalX": 0,
                        "globalY": 0
                    }
                };
                fs.writeFileSync(pivotsPath, JSON.stringify(waddlePivots, null, 2));
                
                console.log(`✅ Character ${charId} is ready (Waddle Mode)!`);
            } catch (err) {
                console.error(`❌ Failed to produce character ${charId}:`, err);
            }
        } else {
            console.log(`✅ Character ${charId} already exists.`);
        }
    }

    for (const bgId of backgrounds) {
        const cleanBgId = bgId.startsWith('bg_') ? bgId.replace('bg_', '') : bgId;
        const bgPath = path.join(ASSETS_DIR, 'background', `${cleanBgId}.jpg`);

        if (!fs.existsSync(bgPath)) {
            console.log(`\n🖼️ Missing Background: ${bgId} (File: ${cleanBgId}.jpg). Generating...`);
            try {
                const customPrompt = getVisualPrompt(bgId, 'background');
                const promptArg = customPrompt ? ` "${customPrompt.replace(/"/g, '\\"')}"` : '';
                execSync(`npx tsx scripts/core/core-asset-gen.ts background ${bgId}${promptArg}`, { stdio: 'inherit' });
                console.log(`✅ Background ${bgId} is ready!`);
            } catch (err) {
                console.error(`❌ Failed to produce background ${bgId}:`, err);
            }
        } else {
            console.log(`✅ Background ${bgId} already exists.`);
        }
    }

    console.log(`\n🔄 Syncing Registry...`);
    execSync(`npx tsx scripts/core/sync_registry.ts`, { stdio: 'inherit' });

    console.log(`\n🎉 ASSET FACTORY COMPLETE! All assets are synchronized.`);
}

runAssetFactory();
