import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/BebasNeue";
import { config } from "./config";
import { ClipSequence } from "./ClipSequence";
import { getFramesPerBeat, getTotalDurationInFrames } from "./utils/beatCalculator";

const { fontFamily } = loadFont();

const { videoClips, audioSource, fps, songBpm, beatMultiplier, targetDurationSeconds, overlayText, beatOffsetFrames } =
  config;

const framesPerBeat = getFramesPerBeat(songBpm, fps, beatMultiplier);
const totalDurationInFrames = getTotalDurationInFrames(
  targetDurationSeconds,
  fps,
  framesPerBeat
);
const numBeats = Math.round(totalDurationInFrames / framesPerBeat);
const halfBeat = Math.round(framesPerBeat / 2);
const { clipStartFrom } = config;

// Loop structure:
//   [Clip 0: second half] [Clip 1] [Clip 2]... [Clip N] [Clip 0: first half]
// When YouTube loops: ...first half → second half = clip 0 plays seamlessly across the boundary.
type SeqDef = { from: number; duration: number; clipIndex: number; startFrom: number };

const sequences: SeqDef[] = [];

// Opening half — clip 0 entering mid-motion
sequences.push({ from: beatOffsetFrames, duration: halfBeat, clipIndex: 0, startFrom: clipStartFrom + halfBeat });

// Middle beats — all other clips at full duration
for (let i = 1; i < numBeats; i++) {
  sequences.push({
    from: beatOffsetFrames + halfBeat + (i - 1) * Math.round(framesPerBeat),
    duration: Math.round(framesPerBeat),
    clipIndex: i % videoClips.length,
    startFrom: clipStartFrom,
  });
}

// Closing half — clip 0 from the start of its motion, completes the loop
sequences.push({
  from: beatOffsetFrames + halfBeat + (numBeats - 1) * Math.round(framesPerBeat),
  duration: halfBeat,
  clipIndex: 0,
  startFrom: clipStartFrom,
});

export const DynamicEdit: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#000", position: "relative", overflow: "hidden" }}>
      {sequences.map((seq, i) => (
        <Sequence key={i} from={seq.from} durationInFrames={seq.duration}>
          <ClipSequence
            src={videoClips[seq.clipIndex]}
            sequenceIndex={i}
            durationInFrames={seq.duration}
            startFrom={seq.startFrom}
          />
        </Sequence>
      ))}

      {/* Audio startFrom skips ahead so beat 1 aligns with the first cut */}
      <Audio src={staticFile(audioSource)} startFrom={beatOffsetFrames} />

      {/* Static text overlay — stays perfectly still while chaos happens below */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily,
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1.1,
            margin: 0,
            padding: "0 48px",
            textShadow:
              "0 0 20px #000, 0 0 40px #000, 3px 3px 0px #000, -3px -3px 0px #000",
          }}
        >
          {overlayText.seriesName}
          {"\n"}Part {overlayText.partNumber}
        </p>
      </div>
    </div>
  );
};
