import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/BebasNeue";
import { config } from "./config";
import { ClipSequence } from "./ClipSequence";
import { getFramesPerBeat, getTotalDurationInFrames } from "./utils/beatCalculator";

const { fontFamily } = loadFont();

const { videoClips, audioSource, fps, songBpm, beatMultiplier, targetDurationSeconds, overlayText } =
  config;

const framesPerBeat = getFramesPerBeat(songBpm, fps, beatMultiplier);
const totalDurationInFrames = getTotalDurationInFrames(
  targetDurationSeconds,
  fps,
  framesPerBeat
);
const numBeats = Math.round(totalDurationInFrames / framesPerBeat);

export const DynamicEdit: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#000", position: "relative", overflow: "hidden" }}>
      {/* Beat-cut video sequences */}
      {Array.from({ length: numBeats }, (_, i) => (
        <Sequence
          key={i}
          from={Math.round(i * framesPerBeat)}
          durationInFrames={Math.round(framesPerBeat)}
        >
          <ClipSequence
            src={videoClips[i % videoClips.length]}
            sequenceIndex={i}
            durationInFrames={Math.round(framesPerBeat)}
          />
        </Sequence>
      ))}

      {/* Music — plays for the full composition */}
      <Audio src={staticFile(audioSource)} />

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
