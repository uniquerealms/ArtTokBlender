export const config = {
  // Absolute path to the folder on your hard drive containing clips + audio.
  // Run `npm run link-clips` after updating this or changing videoClips.
  videoBasePath: "/Volumes/URSource01/",

  videoClips: ["NameOfTheItem_art01.mp4", "NameOfTheItem_art02.mp4"],

  // Audio file sitting in videoBasePath (or a video to extract audio from).
  // Run `npm run setup-audio` after dropping a new track.
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
