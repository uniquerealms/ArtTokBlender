/**
 * setup-audio.mjs
 *
 * Drop an audio file (mp3/wav/aac) or a video file (mp4/mov) into public/.
 * Update config.audioSource to match the filename, then run: npm run setup-audio
 *
 * This script will:
 *  1. Extract audio from a video file (if needed)
 *  2. Detect the BPM
 *  3. Auto-patch src/config.ts with the detected BPM and (if extracted) the new audio filename
 */

import { createRequire } from "module";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 1. Read audioSource from config ────────────────────────────────────────

const configPath = join(ROOT, "src", "config.ts");
const configText = readFileSync(configPath, "utf8");

const sourceMatch = configText.match(/audioSource:\s*["']([^"']+)["']/);
if (!sourceMatch) {
  console.error("❌  Could not find audioSource in src/config.ts");
  process.exit(1);
}

let audioSource = sourceMatch[1];
let audioPath = join(ROOT, "public", audioSource);

console.log(`\n🎵  Audio source: ${audioSource}`);

// ── 2. Check the file exists ────────────────────────────────────────────────

if (!existsSync(audioPath)) {
  console.error(`❌  File not found: public/${audioSource}`);
  console.error("    Drop your audio or video file into the public/ folder and update");
  console.error("    config.audioSource to match the filename, then re-run this script.");
  process.exit(1);
}

// ── 3. Check FFmpeg is available ────────────────────────────────────────────

try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌  FFmpeg not found. Install it with: brew install ffmpeg");
  process.exit(1);
}

// ── 4. Extract audio if source is a video file ──────────────────────────────

const videoExtensions = [".mp4", ".mov", ".mkv", ".avi", ".webm"];
const ext = extname(audioSource).toLowerCase();

let workingAudioPath = audioPath;
let newAudioSource = audioSource;

if (videoExtensions.includes(ext)) {
  const extractedName = basename(audioSource, ext) + "_extracted.mp3";
  const extractedPath = join(ROOT, "public", extractedName);

  console.log(`📼  Video detected — extracting audio to: ${extractedName}`);
  execSync(
    `ffmpeg -y -i "${audioPath}" -vn -acodec libmp3lame -ar 44100 -ac 1 -q:a 2 "${extractedPath}"`,
    { stdio: "inherit" }
  );

  workingAudioPath = extractedPath;
  newAudioSource = extractedName;
  console.log(`✅  Audio extracted: ${extractedName}`);
}

// ── 5. Convert to raw mono Float32 PCM for BPM analysis ─────────────────────

const tempPcmPath = join(ROOT, "public", "_bpm_temp.pcm");

console.log("\n🔬  Converting audio for BPM analysis...");
execSync(
  `ffmpeg -y -i "${workingAudioPath}" -vn -acodec pcm_f32le -ar 44100 -ac 1 -f f32le "${tempPcmPath}"`,
  { stdio: "ignore" }
);

// ── 6. Detect BPM ────────────────────────────────────────────────────────────

console.log("🥁  Detecting BPM...");

const MusicTempo = require("music-tempo");

const pcmBuffer = readFileSync(tempPcmPath);
// Each Float32 sample is 4 bytes
const float32Array = new Float32Array(
  pcmBuffer.buffer,
  pcmBuffer.byteOffset,
  pcmBuffer.byteLength / 4
);

const mt = new MusicTempo(float32Array);
const detectedBpm = Math.round(mt.tempo * 10) / 10;

console.log(`✅  Detected BPM: ${detectedBpm}`);

// ── 7. Clean up temp PCM ─────────────────────────────────────────────────────

unlinkSync(tempPcmPath);

// ── 8. Patch src/config.ts ───────────────────────────────────────────────────

let patched = configText.replace(
  /songBpm:\s*[\d.]+/,
  `songBpm: ${detectedBpm}`
);

if (newAudioSource !== audioSource) {
  patched = patched.replace(
    /audioSource:\s*["'][^"']+["']/,
    `audioSource: "${newAudioSource}"`
  );
}

writeFileSync(configPath, patched, "utf8");

console.log("\n📝  src/config.ts updated:");
console.log(`    songBpm    → ${detectedBpm}`);
if (newAudioSource !== audioSource) {
  console.log(`    audioSource → "${newAudioSource}"`);
}
console.log("\n🚀  Ready! Run: npm run preview\n");
