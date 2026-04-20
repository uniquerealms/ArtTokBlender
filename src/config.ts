export const config = {
  videoClips: ["NameOfTheItem_art01.mp4", "NameOfTheItem_art02.mp4"],

  // Drop your audio file (or a video to extract audio from) into public/
  // then run: npm run setup-audio
  audioSource: "track.mp3",

  fps: 24,

  // Auto-updated by `npm run setup-audio` — or set manually
  songBpm: 160,

  // 1 = cut every beat | 0.5 = cut every half-beat (faster)
  beatMultiplier: 1,

  targetDurationSeconds: 13.5,

  overlayText: {
    seriesName: "Editing Random Things in my office",
    // Bump this by 1 each time you make a new video in this series
    partNumber: 1,
  },
};
