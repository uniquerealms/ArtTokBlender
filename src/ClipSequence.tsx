import { useEffect } from "react";
import { interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { prefetch } from "@remotion/preload";

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

  // Prefetch runs once per clip src change — prevents 4K stutter in preview
  useEffect(() => {
    const { free } = prefetch(staticFile(src));
    return free;
  }, [src]);

  // Crash zoom: scale grows from 1.0 → 1.35 over the clip's duration
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.35], {
    extrapolateRight: "clamp",
  });

  // Radioactive strobe: even index = psychedelic invert, odd = raw
  const filter =
    sequenceIndex % 2 === 0
      ? "invert(100%) hue-rotate(90deg) saturate(300%)"
      : "none";

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Video
        src={staticFile(src)}
        startFrom={24}
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
