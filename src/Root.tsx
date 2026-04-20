import { Composition, registerRoot } from "remotion";
import { config } from "./config";
import { DynamicEdit } from "./DynamicEdit";
import { getFramesPerBeat, getTotalDurationInFrames } from "./utils/beatCalculator";

const { fps, songBpm, beatMultiplier, targetDurationSeconds } = config;

const framesPerBeat = getFramesPerBeat(songBpm, fps, beatMultiplier);
const totalDurationInFrames = getTotalDurationInFrames(
  targetDurationSeconds,
  fps,
  framesPerBeat
);

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
