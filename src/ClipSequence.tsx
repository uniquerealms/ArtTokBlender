import { useEffect } from "react";
import { interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { preloadVideo } from "@remotion/preload";
import { config } from "./config";

type Props = {
  src: string;
  sequenceIndex: number;
  durationInFrames: number;
};

export const ClipSequence: React.FC<Props> = ({
  src,
  sequenceIndex,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  useEffect(() => {
    const cancel = preloadVideo(staticFile(src));
    return cancel;
  }, [src]);

  const scale = config.crashZoom
    ? interpolate(frame, [0, durationInFrames], [1.0, 1.35], { extrapolateRight: "clamp" })
    : 1;

  const filter =
    config.strobeEffect && sequenceIndex % 2 === 0
      ? "invert(100%) hue-rotate(90deg) saturate(300%)"
      : "none";

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Video
        src={staticFile(src)}
        startFrom={config.clipStartFrom}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter,
        }}
      />
    </div>
  );
};
