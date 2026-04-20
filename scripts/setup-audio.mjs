/**
 * setup-audio.mjs
 *
 * Run: npm run setup-audio
 * When prompted, drag your audio file (or a video to extract audio from)
 * into the terminal and press Enter.
 *
 * This script will:
 *  1. Accept a dragged file path — audio (.mp3/.wav/.aac) or video (.mp4/.mov)
 *  2. Extract audio from a video file (if needed) → saves to public/
 *  3. Detect the BPM
 *  4. Patch only songBpm in src/config.ts
 */

import { createRequire } from "module";
import { createInterface } from "readline";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Prompt helper ────────────────────────────────────────────────────────────

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      // Strip surrounding quotes and trailing whitespace that macOS adds on drag
      resolve(answer.trim().replace(/^["']|["']$/g, "").trimEnd());
    });
  });
}

// ── 1. Prompt for audio file ─────────────────────────────────────────────────

console.log("\n🎵  Drag your audio file (or video to extract audio from) into this terminal and press Enter:");
const audioPath = await prompt("   > ");

if (!audioPath) {
  console.error("❌  No path received. Exiting.");
  process.exit(1);
}

if (!existsSync(audioPath)) {
  console.error(`❌  File not found: ${audioPath}`);
  process.exit(1);
}

const audioSource = basename(audioPath);
console.log(`\n   Using: ${audioSource}`);

// ── 2. Check FFmpeg is available ─────────────────────────────────────────────

try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌  FFmpeg not found. Install it with: brew install ffmpeg");
  process.exit(1);
}

// ── 3. Extract audio if source is a video file ───────────────────────────────

const videoExtensions = [".mp4", ".mov", ".mkv", ".avi", ".webm"];
const ext = extname(audioSource).toLowerCase();

let workingAudioPath = audioPath;

if (videoExtensions.includes(ext)) {
  const extractedName = basename(audioSource, ext) + "_extracted.mp3";
  const extractedPath = join(ROOT, "public", extractedName);

  console.log(`\n📼  Video detected — extracting audio to: public/${extractedName}`);
  execSync(
    `ffmpeg -y -i "${audioPath}" -vn -acodec libmp3lame -ar 44100 -ac 1 -q:a 2 "${extractedPath}"`,
    { stdio: "inherit" }
  );

  workingAudioPath = extractedPath;
  console.log(`✅  Audio extracted.`);
}

// ── 4. Convert to raw mono Float32 PCM for BPM analysis ──────────────────────

const tempPcmPath = join(ROOT, "public", "_bpm_temp.pcm");

console.log("\n🔬  Converting audio for BPM analysis...");
execSync(
  `ffmpeg -y -i "${workingAudioPath}" -vn -acodec pcm_f32le -ar 44100 -ac 1 -f f32le "${tempPcmPath}"`,
  { stdio: "ignore" }
);

// ── 5. Detect BPM ─────────────────────────────────────────────────────────────

console.log("🥁  Detecting BPM...");

const MusicTempo = require("music-tempo");

const pcmBuffer = readFileSync(tempPcmPath);
const float32Array = new Float32Array(
  pcmBuffer.buffer,
  pcmBuffer.byteOffset,
  pcmBuffer.byteLength / 4
);

const mt = new MusicTempo(float32Array);
const detectedBpm = Math.round(mt.tempo * 10) / 10;

console.log(`✅  Detected BPM: ${detectedBpm}`);

// ── 6. Clean up temp PCM ──────────────────────────────────────────────────────

unlinkSync(tempPcmPath);

// ── 7. Patch only songBpm in src/config.ts ────────────────────────────────────

const configPath = join(ROOT, "src", "config.ts");
const configText = readFileSync(configPath, "utf8");

const patched = configText.replace(
  /songBpm:\s*[\d.]+/,
  `songBpm: ${detectedBpm}`
);

writeFileSync(configPath, patched, "utf8");

console.log(`\n📝  src/config.ts updated — songBpm → ${detectedBpm}`);
console.log("\n🚀  Ready! Run: npm run preview\n");
