import { Composition } from 'remotion';
import { Main } from './Main';
import { PuppetPreview } from './compositions/PuppetPreview';
import { ActionSequence } from './compositions/ActionSequence';
import { SceneCompiler } from './compositions/SceneCompiler';
import { DraftVideoPreview } from './compositions/DraftVideoPreview';
import { ExpressionPlayer } from '../src/components/ExpressionPlayer';
import { VideoScriptSchema } from '../src/types/ai-schemas';
import { COMPOSITION_ID, FPS, VIDEO_HEIGHT, VIDEO_WIDTH, DURATION_IN_FRAMES } from '../src/lib/remotion';
import { z } from 'zod';

// Automatically detect all JSON files in public/animations folder using Webpack require.context
// This allows Remotion Studio UI to show a dropdown of available actions
let animationFiles = ['verified_walk.json'];
try {
  // @ts-expect-error - Webpack specific
  const context = require.context('../public/animations', false, /\.json$/);
  animationFiles = context.keys().map((k: string) => k.replace('./', ''));
} catch (e) {
  // Fallback if not bundled by webpack
  console.warn('Could not auto-detect animation files', e);
}

// Automatically detect all JSON files in public/scripts folder
let scriptFiles = ['draft.json'];
try {
  // @ts-expect-error - Webpack specific
  const context = require.context('../public/scripts', false, /\.json$/);
  scriptFiles = context.keys().map((k: string) => k.replace('./', ''));
} catch (e) {
  console.warn('Could not auto-detect script files', e);
}

// Automatically detect characters in public/assets/humanoid/
let characterFolders = ['char_001'];
try {
  // @ts-expect-error - Webpack specific
  // We match character.json to find character folders
  const context = require.context('../public/assets/humanoid', true, /character\.json$/);
  const detected = context.keys().map((k: string) => {
    // k is like "./char_001/character.json"
    const match = k.match(/\.\/(.+)\/character\.json/);
    return match ? match[1] : null;
  }).filter(Boolean);
  if (detected.length > 0) {
    characterFolders = detected as string[];
  }
} catch (e) {
  console.warn('Could not auto-detect character folders', e);
}

// Create a zod enum schema dynamically from the detected files
const actionFileEnum = z.enum(
  (animationFiles.length > 0 ? animationFiles : ['verified_walk.json']) as [string, ...string[]]
);

const characterEnum = z.enum(
  (characterFolders.length > 0 ? characterFolders : ['char_001']) as [string, ...string[]]
);

// Helper for expressions
const expressionIds = Array.from({ length: 55 }, (_, i) => `exp_female_${String(i + 1).padStart(3, '0')}`);
const expressionEnum = z.enum(expressionIds as [string, ...string[]]);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      <Composition
        id="PuppetPreview"
        component={PuppetPreview}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={z.object({
          actionFile: actionFileEnum,
          characterId: characterEnum,
          expressionId: expressionEnum.optional(),
        })}
        defaultProps={{
          actionFile: animationFiles[0] || 'verified_walk.json',
          characterId: characterFolders[0] || 'char_001',
          expressionId: 'exp_female_001',
        }}
      />
      <Composition
        id="ActionSequence"
        component={ActionSequence}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        schema={z.object({
          characterId: characterEnum,
          sequence: z.array(z.object({
            actionFile: actionFileEnum,
            durationInFrames: z.number().min(1)
          }))
        })}
        defaultProps={{
          characterId: characterFolders[0] || 'char_001',
          sequence: [
            { actionFile: animationFiles[0] || 'verified_walk.json', durationInFrames: 150 },
            { actionFile: animationFiles[1] || animationFiles[0] || 'verified_walk.json', durationInFrames: 150 },
          ]
        }}
      />
      <Composition
        id="ExpressionTest"
        component={ExpressionPlayer}
        durationInFrames={150}
        fps={30}
        width={500}
        height={500}
      />
      <Composition
        id="AIStoryCompiler"
        component={DraftVideoPreview}
        durationInFrames={600} // Độ dài dự phòng, sẽ tự động thay đổi dựa trên nội dung thực tế
        fps={30}
        width={1920}
        height={1080}
        schema={z.object({
          scriptFile: z.enum(scriptFiles as [string, ...string[]]).describe("Chọn file kịch bản JSON")
        })}
        defaultProps={{
          scriptFile: "draft.json"
        }}
      />
    </>
  );
};

