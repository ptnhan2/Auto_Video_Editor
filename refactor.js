const fs = require('fs');
const path = require('path');

const dirsToCreate = [
  'src/services/ai-director',
  'src/services/character',
  'src/services/asset-manager',
  'src/services/video-builder',
  'src/shared/api-clients',
  'src/shared/types',
  '.archive'
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const fileMoves = [
  // 1. To .archive/
  { src: 'props.json', dest: '.archive/props.json' },
  { src: 'out.mp4', dest: '.archive/out.mp4' },
  { src: 'src/lib/nano-banana.ts', dest: '.archive/nano-banana.ts' },
  { src: 'src/lib/nano-banana.test.ts', dest: '.archive/nano-banana.test.ts' },
  { src: 'src/features/library/services/sam_modal.py', dest: '.archive/sam_modal.py' },
  { src: 'scripts/archive', dest: '.archive/scripts-archive' },
  { src: 'scripts/lab', dest: '.archive/lab' },
  { src: 'scripts/tools/gemini-tests', dest: '.archive/gemini-tests' },
  { src: 'scripts/tools/test_ai_director.ts', dest: '.archive/test_ai_director.ts' },
  { src: 'scripts/tools/test_expression_detection.ts', dest: '.archive/test_expression_detection.ts' },
  { src: 'scripts/tools/test-schema.ts', dest: '.archive/test-schema.ts' },

  // 2. ai-director
  { src: 'src/features/ai-orchestrator/triple-script-engine.ts', dest: 'src/services/ai-director/triple-script-engine.ts' },
  { src: 'src/features/ai-orchestrator/triple-script-engine.spec.ts', dest: 'src/services/ai-director/triple-script-engine.spec.ts' },
  { src: 'src/lib/ai-engine/director.ts', dest: 'src/services/ai-director/director.ts' },
  { src: 'scripts/core/generate_video_script.py', dest: 'src/services/ai-director/generate_video_script.py' },
  { src: 'scripts/core/generate_actions.py', dest: 'src/services/ai-director/generate_actions.py' },

  // 3. character
  { src: 'src/features/library/character-pipeline.ts', dest: 'src/services/character/character-pipeline.ts' },
  { src: 'src/features/library/character-pipeline.test.ts', dest: 'src/services/character/character-pipeline.test.ts' },
  { src: 'src/features/library/character-store.ts', dest: 'src/services/character/character-store.ts' },
  { src: 'src/features/library/services/rigger.ts', dest: 'src/services/character/rigger.ts' },
  { src: 'src/features/library/services/vectorizer.ts', dest: 'src/services/character/vectorizer.ts' },
  { src: 'src/config/rigging.ts', dest: 'src/services/character/rigging.ts' },
  { src: 'src/constants/rig-anatomy.ts', dest: 'src/services/character/rig-anatomy.ts' },
  { src: 'scripts/core/core-rigger.ts', dest: 'src/services/character/core-rigger.ts' },
  { src: 'src/lib/action-factory.ts', dest: 'src/services/character/action-factory.ts' },
  { src: 'src/lib/auto-detect-pivots.ts', dest: 'src/services/character/auto-detect-pivots.ts' },

  // 4. asset-manager
  { src: 'src/config/asset-registry.ts', dest: 'src/services/asset-manager/asset-registry.ts' },
  { src: 'src/config/asset_types.json', dest: 'src/services/asset-manager/asset_types.json' },
  { src: 'scripts/core/asset_factory.ts', dest: 'src/services/asset-manager/asset_factory.ts' },
  { src: 'scripts/core/asset_ingestor.py', dest: 'src/services/asset-manager/asset_ingestor.py' },
  { src: 'scripts/core/core-asset-gen.ts', dest: 'src/services/asset-manager/core-asset-gen.ts' },
  { src: 'scripts/core/sync_registry.ts', dest: 'src/services/asset-manager/sync_registry.ts' },
  { src: 'scripts/tools/process_assets_backlog.py', dest: 'src/services/asset-manager/process_assets_backlog.py' },
  { src: 'scripts/tools/extract_missing_assets.ts', dest: 'src/services/asset-manager/extract_missing_assets.ts' },

  // 5. video-builder
  { src: 'scripts/core/render_with_subtitles.py', dest: 'src/services/video-builder/render_with_subtitles.py' },
  { src: 'scripts/tools/render_all.ts', dest: 'src/services/video-builder/render_all.ts' },
  { src: 'scripts/tools/stitch_video.ts', dest: 'src/services/video-builder/stitch_video.ts' },
  { src: 'scripts/tools/chunk_script.ts', dest: 'src/services/video-builder/chunk_script.ts' },

  // 6. api-clients
  { src: 'src/lib/nano-banana-v2.ts', dest: 'src/shared/api-clients/nano-banana-v2.ts' },
  { src: 'src/lib/vercel-ai.ts', dest: 'src/shared/api-clients/vercel-ai.ts' },
  { src: 'src/lib/supabase.ts', dest: 'src/shared/api-clients/supabase.ts' },
  { src: 'scripts/core/tts/manager.py', dest: 'src/shared/api-clients/tts_manager.py' },
  { src: 'scripts/core/voice_director.py', dest: 'src/shared/api-clients/voice_director.py' },

  // 7. types
  { src: 'src/types/ai-schemas.ts', dest: 'src/shared/types/ai-schemas.ts' },
  { src: 'src/types/ai-schemas.test.ts', dest: 'src/shared/types/ai-schemas.test.ts' },
  { src: 'src/types/animation.ts', dest: 'src/shared/types/animation.ts' },
  { src: 'src/types/script.ts', dest: 'src/shared/types/script.ts' }
];

fileMoves.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    console.log(`Moved: ${src} -> ${dest}`);
  }
});

// Update import paths in code (simplified alias replacements)
const aliasReplacements = [
  { old: '@/*/nano-banana-v2', new: '@/shared/api-clients/nano-banana-v2' },
  { old: '@/lib/nano-banana-v2', new: '@/shared/api-clients/nano-banana-v2' },
  { old: '@/config/asset-registry', new: '@/services/asset-manager/asset-registry' },
  { old: '@/constants/rig-anatomy', new: '@/services/character/rig-anatomy' },
  { old: '@/config/rigging', new: '@/services/character/rigging' },
  { old: '@/lib/action-factory', new: '@/services/character/action-factory' },
  { old: '@/lib/ai-engine/director', new: '@/services/ai-director/director' },
  { old: '@/features/ai-orchestrator/triple-script-engine', new: '@/services/ai-director/triple-script-engine' },
  { old: '@/features/library/character-pipeline', new: '@/services/character/character-pipeline' },
  { old: '@/types/ai-schemas', new: '@/shared/types/ai-schemas' },
  { old: '@/types/animation', new: '@/shared/types/animation' },
  { old: '@/types/script', new: '@/shared/types/script' }
];

function updateImports(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', '.next', '.archive'].includes(file)) {
        updateImports(fullPath);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      aliasReplacements.forEach(({ old, new: newAlias }) => {
        if (content.includes(old)) {
          content = content.split(old).join(newAlias);
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in: ${fullPath}`);
      }
    }
  }
}

updateImports('src');
updateImports('app');
updateImports('remotion');
updateImports('scripts');

console.log('Refactor complete.');
