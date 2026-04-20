import { Composition, registerRoot } from "remotion";
import { config } from "./config";
import { DynamicEdit } from "./DynamicEdit";
import { getFramesPerBeat, getTotalDurationInFrames, getTotalDurationFromCuts } from "./utils/beatCalculator";

const { fps, songBpm, beatMultiplier, targetDurationSeconds, cutFrames } = config;

const framesPerBeat = getFramesPerBeat(songBpm, fps, beatMultiplier);
const totalDurationInFrames = cutFrames.length >= 2
  ? getTotalDurationFromCuts(cutFrames)
  : getTotalDurationInFrames(targetDurationSeconds, fps, framesPerBeat);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ArtTokBlender"
      component={DynamicEdit}
      fps={24}
      width={1080}
      height={1920}
      durationInFrames={totalDurationInFrames}
    />
  );
};

registerRoot(RemotionRoot);
