export const config = {
  // Absolute path to the folder on your hard drive containing clips + audio.
  // Run `npm run link-clips` after updating this or changing videoClips.
  videoBasePath: "/Volumes/URSource01/",

  videoClips: [
    "BigHero6Inside_art02.mov",
    "BigHero6cover_art01.mov",
    "BraveCover_art07.mov",
    "BraveInside_art08.mov",
    "ElementCover_art17.mov",
    "EncantoCover_art13.mov",
    "EncantoInside_art14.mov",
    "InsideOutCover_art05.mov",
    "InsideOutInside_art06.mov",
    "LightyearCover_art15.mov",
    "LightyearInside_art16.mov",
    "MoanaCover_art09.mov",
    "MoanaInside_art10.mov",
    "RayaCover_art11.mov",
    "RayaInside_art12.mov",
    "ZootopiaCover_art03.mov",
    "ZootopiaInside_art04.mov",
    "elementalInside_art18.mov",
  ],

  // Audio file sitting in videoBasePath (or a video to extract audio from).
  // Run `npm run setup-audio` after dropping a new track.
  audioSource: "Audio_04-19-2026 20-09-52_1_extracted.mp3",

  fps: 24,

  // Auto-updated by `npm run setup-audio` — or set manually
  songBpm: 166.1,

  // 1 = cut every beat | 2 = every 2 beats | 4 = every bar (recommended for natural flow)
  beatMultiplier: 4,

  // Frames to skip at the start of each clip (24 = 1 sec at 24fps)
  // Small values catch the beginning of motion so it peaks at the cut point
  clipStartFrom: 30,

  // Nudge cuts forward in frames to sync with the actual beat in the audio.
  // Start at 0. If cuts land just BEFORE the beat, increase by 2–3 until it locks in.
  beatOffsetFrames: 0,

  // Artificial zoom effect (scale 1.0 → 1.35 per clip) — off matches the reference style
  crashZoom: false,

  // Alternating color inversion on every other clip — set true to re-enable
  strobeEffect: false,

  targetDurationSeconds: 13.5,

  overlayText: {
    seriesName: "Editing Random Things in my office",
    // Bump this by 1 each time you make a new video in this series
    partNumber: 1,
  },
};
