import { Composition } from 'remotion';
import { Main } from './Main';
import { COMPOSITION_ID, FPS, VIDEO_HEIGHT, VIDEO_WIDTH, DURATION_IN_FRAMES } from '../src/lib/remotion';

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
    </>
  );
};
