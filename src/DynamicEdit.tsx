import React from "react";
import { Audio, Sequence, staticFile, Video } from "remotion";
import { loadFont } from "@remotion/google-fonts/BebasNeue";
import { config } from "./config";
import { ClipSequence } from "./ClipSequence";
import { getFramesPerBeat, getTotalDurationInFrames, getTotalDurationFromCuts } from "./utils/beatCalculator";

const { fontFamily } = loadFont();

const {
  videoClips,
  audioSource,
  fps,
  songBpm,
  beatMultiplier,
  targetDurationSeconds,
  overlayText,
  beatOffsetFrames,
  clipStartFrom,
  cutFrames,
  clipOverrides,
  usePrerendered,
  noAudio,
} = config;

// Resolve per-clip startFrom by matching filename substrings against clipOverrides
function resolveStartFrom(filename: string): number {
  for (const [key, override] of Object.entries(clipOverrides)) {
    if (filename.includes(key) && override.startFrom !== undefined) {
      return override.startFrom;
    }
  }
  return clipStartFrom;
}

// ── Sequence generation ───────────────────────────────────────────────────────

type SeqDef = { from: number; duration: number; clipIndex: number; startFrom: number };
const sequences: SeqDef[] = [];
let totalDurationInFrames: number;

const useCutFrames = cutFrames.length >= 2;

if (useCutFrames) {
  // Waveform-driven: cutFrames[i] is the exact composition frame where beat i hits.
  // Audio plays from frame 0, so sequence positions map 1:1 to cut positions.
  const cuts = cutFrames;
  const avgInterval = Math.round(
    cuts.slice(1).reduce((sum, f, i) => sum + (f - cuts[i]), 0) / (cuts.length - 1)
  );
  totalDurationInFrames = getTotalDurationFromCuts(cuts);

  for (let i = 0; i < cuts.length; i++) {
    const from = cuts[i];
    const duration = i < cuts.length - 1 ? cuts[i + 1] - cuts[i] : avgInterval;
    const clipIndex = i % videoClips.length;
    sequences.push({
      from,
      duration,
      clipIndex,
      startFrom: resolveStartFrom(videoClips[clipIndex]),
    });
  }
} else {
  // BPM fallback: evenly spaced cuts from tempo calculation
  const framesPerBeat = getFramesPerBeat(songBpm, fps, beatMultiplier);
  totalDurationInFrames = getTotalDurationInFrames(targetDurationSeconds, fps, framesPerBeat);
  const numBeats = Math.round(totalDurationInFrames / framesPerBeat);
  const halfBeat = Math.round(framesPerBeat / 2);

  sequences.push({ from: beatOffsetFrames, duration: halfBeat, clipIndex: 0, startFrom: resolveStartFrom(videoClips[0]) + halfBeat });
  for (let i = 1; i < numBeats; i++) {
    const clipIndex = i % videoClips.length;
    sequences.push({
      from: beatOffsetFrames + halfBeat + (i - 1) * Math.round(framesPerBeat),
      duration: Math.round(framesPerBeat),
      clipIndex,
      startFrom: resolveStartFrom(videoClips[clipIndex]),
    });
  }
  sequences.push({
    from: beatOffsetFrames + halfBeat + (numBeats - 1) * Math.round(framesPerBeat),
    duration: halfBeat,
    clipIndex: 0,
    startFrom: resolveStartFrom(videoClips[0]),
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DynamicEdit: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#000", position: "relative", overflow: "hidden" }}>
      {usePrerendered ? (
        // Pre-rendered single-file path: FFmpeg already did the cuts → public/_edited.mp4
        <Video src={staticFile("_edited.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        sequences.map((seq, i) => (
          <Sequence key={i} from={seq.from} durationInFrames={seq.duration}>
            <ClipSequence
              src={videoClips[seq.clipIndex]}
              sequenceIndex={i}
              durationInFrames={seq.duration}
              startFrom={seq.startFrom}
            />
          </Sequence>
        ))
      )}

      {!noAudio && <Audio src={staticFile(audioSource)} startFrom={beatOffsetFrames} />}

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
            textShadow: "0 0 20px #000, 0 0 40px #000, 3px 3px 0px #000, -3px -3px 0px #000",
          }}
        >
          {overlayText.seriesName}
          {"\n"}Part {overlayText.partNumber}
        </p>
      </div>
    </div>
  );
};
