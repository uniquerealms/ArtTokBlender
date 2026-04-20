/**
 * How many frames a single beat lasts at this BPM/FPS/multiplier combo.
 * e.g. 160 BPM, 24fps, multiplier 1 → (60/160)*24*1 = 9 frames per beat
 */
export function getFramesPerBeat(
  bpm: number,
  fps: number,
  multiplier: number
): number {
  return (60 / bpm) * fps * multiplier;
}

/**
 * Derives total composition duration from real detected cut positions.
 * Adds one average beat interval after the last cut to size the final clip.
 */
export function getTotalDurationFromCuts(cutFrames: number[]): number {
  if (cutFrames.length < 2) return 0;
  const avgInterval = Math.round(
    cutFrames.slice(1).reduce((sum, f, i) => sum + (f - cutFrames[i]), 0) /
      (cutFrames.length - 1)
  );
  return cutFrames[cutFrames.length - 1] + avgInterval;
}

/**
 * Forces total duration to the nearest exact multiple of framesPerBeat so the
 * video loops seamlessly — last cut lands exactly on a beat.
 */
export function getTotalDurationInFrames(
  targetSeconds: number,
  fps: number,
  framesPerBeat: number
): number {
  const targetFrames = targetSeconds * fps;
  return Math.round(Math.round(targetFrames / framesPerBeat) * framesPerBeat);
}
