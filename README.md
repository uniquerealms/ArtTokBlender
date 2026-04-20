# ArtTokBlender

Hyper-kinetic, beat-synced YouTube Shorts template built with [Remotion](https://www.remotion.dev/).

Drop 4K art book clips into `public/`, run one setup command, and get a perfectly loop-synced Short with crash zooms, strobe effects, and a bold text overlay.

---

## Project Structure

```
ArtTokBlender/
├── public/              ← Drop your clips + audio here (not committed to git)
├── src/
│   ├── config.ts        ← The only file you need to edit between videos
│   ├── Root.tsx         ← Remotion composition registration
│   ├── DynamicEdit.tsx  ← Main engine: sequences, audio, overlay
│   ├── ClipSequence.tsx ← Per-clip effects: crash zoom + strobe
│   └── utils/
│       └── beatCalculator.ts
└── scripts/
    └── setup-audio.mjs  ← Auto-detects BPM, patches config.ts
```

---

## Workflow: Making a New Video

### Step 1 — Add your clips

Drop your 4K `.mp4` or `.mov` clips into `public/`. Then open `src/config.ts` and update `videoClips` to list them:

```ts
videoClips: ['MyBook_art01.mp4', 'MyBook_art02.mp4', 'MyBook_art03.mp4'],
```

### Step 2 — Add your audio

Drop your music file into `public/`. It can be:
- An `.mp3` / `.wav` / `.aac` file → update `audioSource` to match
- A `.mp4` / `.mov` video → the setup script will extract the audio automatically

```ts
audioSource: 'mytrack.mp3',  // or 'mytrack.mp4' to extract from video
```

### Step 3 — Detect BPM automatically

```bash
npm run setup-audio
```

This will:
1. Extract audio from the source if it's a video file
2. Detect the BPM
3. Automatically update `songBpm` (and `audioSource` if extracted) in `config.ts`

### Step 4 — Tune the config (optional)

Open `src/config.ts`:

| Field | What it does |
|-------|-------------|
| `beatMultiplier` | `1` = cut every beat, `0.5` = cut every half-beat (twice as fast) |
| `targetDurationSeconds` | Target length of the Short (default 13.5s) |
| `overlayText.seriesName` | The series title shown on screen |
| `overlayText.partNumber` | **Increment this by 1 for each new video in the series** |

### Step 5 — Preview

```bash
npm run preview
```

Opens Remotion Studio at `http://localhost:3000`. Scrub the timeline to check cut timing, zoom effect, and strobe pattern.

### Step 6 — Render

```bash
npm run render
```

Output is saved to `out/video.mp4` at 1080×1920 (YouTube Shorts format).

---

## How the Beat Math Works

At 160 BPM with `beatMultiplier: 1` and 24fps:

```
framesPerBeat = (60 / 160) × 24 × 1 = 9 frames per cut
totalDuration = nearest multiple of 9 to (13.5s × 24fps = 324 frames)
             = 324 frames = exactly 13.5 seconds
```

The total duration is always mathematically forced to be an exact multiple of `framesPerBeat` — so the last cut lands exactly on a beat and the video loops seamlessly.

---

## Requirements

- Node.js 18+
- FFmpeg (for the setup script): `brew install ffmpeg`
- A GitHub account (already connected via `gh`)
