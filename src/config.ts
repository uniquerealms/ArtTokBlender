export const config = {
  // Absolute path to the folder on your hard drive containing clips + audio.
  // Run `npm run link-clips` after updating this or changing videoClips.
  videoBasePath: "/Volumes/URSource01/",

  videoClips: [
    "BigHero6cover_art01.mov",
    "BigHero6Inside_art02.mov",
    "BraveCover_art07.mov",
    "BraveInside_art08.mov",
    "elementalInside_art18.mov",
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
  ],

  // Audio file sitting in videoBasePath (or a video to extract audio from).
  // Run `npm run setup-audio` after dropping a new track.
  audioSource: "Audio_04-19-2026 20-09-52_1_extracted.mp3",

  fps: 24,

  // Auto-updated by `npm run setup-audio` — or set manually
  songBpm: 166.1,

  // Auto-populated by `npm run setup` — exact beat/transient positions from waveform analysis.
  // When non-empty this drives all cut timing. Set to [] to fall back to BPM math.
  cutFrames: [0, 65, 82, 101, 116, 131, 153, 171, 189, 205, 218, 239, 254, 289, 310] as number[],

  // 1 = cut every beat | 2 = every 2 beats | 4 = every bar (recommended for natural flow)
  beatMultiplier: 4,

  // Frames to skip at the start of each clip (24 = 1 sec at 24fps)
  // Small values catch the beginning of motion so it peaks at the cut point
  clipStartFrom: 30,

  // Per-clip startFrom overrides — key is any substring of the filename.
  // Use this when specific clips have a longer setup pause that needs to be skipped.
  clipOverrides: {
    art08: { startFrom: 60 },
    art18: { startFrom: 60 },
    art13: { startFrom: 60 },
    art14: { startFrom: 60 },
    art06: { startFrom: 60 },
    art15: { startFrom: 60 },
    art09: { startFrom: 60 },
  } as Record<string, { startFrom?: number }>,

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
