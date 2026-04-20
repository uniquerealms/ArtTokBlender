/**
 * setup.mjs — one command to rule them all
 *
 * USAGE (drag both paths onto the line before pressing Enter):
 *
 *   npm run setup -- <clips-folder> <audio-file>
 *
 * Example:
 *   npm run setup -- /Volumes/URSource01/Clips /Volumes/URSource01/track.mov
 *
 * Or run with no arguments for interactive prompts:
 *   npm run setup
 */

import { createRequire } from "module";
import { createInterface } from "readline";
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { symlink, unlink, access } from "fs/promises";
import { join, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { constants } from "fs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanPath(p) {
  return p.trim().replace(/^["']|["']$/g, "").trimEnd();
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(cleanPath(answer));
    });
  });
}

// ── Resolve arguments or prompt ──────────────────────────────────────────────

let [clipsFolder, audioFilePath] = process.argv.slice(2).map(cleanPath);

if (!clipsFolder) {
  console.log("\n📂  Drag your clips folder into this terminal and press Enter:");
  clipsFolder = await prompt("   > ");
}

if (!audioFilePath) {
  console.log("\n🎵  Drag your audio/video file into this terminal and press Enter:");
  audioFilePath = await prompt("   > ");
}

// ── Validate paths ───────────────────────────────────────────────────────────

try {
  await access(clipsFolder, constants.F_OK);
} catch {
  console.error(`\n❌  Clips folder not found: ${clipsFolder}`);
  process.exit(1);
}

if (!existsSync(audioFilePath)) {
  console.error(`\n❌  Audio file not found: ${audioFilePath}`);
  process.exit(1);
}

// ════════════════════════════════════════════════════════════════════════════
// PART 1 — LINK CLIPS
// ════════════════════════════════════════════════════════════════════════════

console.log(`\n🎬  Scanning clips in: ${clipsFolder}`);

const clipFiles = readdirSync(clipsFolder)
  .filter((f) => !f.startsWith("._") && VIDEO_EXTENSIONS.includes("." + f.split(".").pop().toLowerCase()))
  .sort();

if (clipFiles.length === 0) {
  console.error(`❌  No video files found in: ${clipsFolder}`);
  process.exit(1);
}

console.log(`    Found ${clipFiles.length} clip(s).`);

let linked = 0;
for (const file of clipFiles) {
  const sourcePath = join(clipsFolder, file);
  const linkPath = join(PUBLIC, file);
  try { await unlink(linkPath); } catch { /* didn't exist */ }
  await symlink(sourcePath, linkPath);
  linked++;
}
console.log(`✅  ${linked} symlink(s) created in public/`);

// Update videoClips in config.ts
const configPath = join(ROOT, "src", "config.ts");
let configText = readFileSync(configPath, "utf8");

const clipsArrayString =
  "[\n" + clipFiles.map((f) => `    "${f}"`).join(",\n") + ",\n  ]";

configText = configText.replace(/videoClips:\s*\[[^\]]*\]/s, `videoClips: ${clipsArrayString}`);
console.log(`📝  config.ts — videoClips updated (${clipFiles.length} files)`);

// ════════════════════════════════════════════════════════════════════════════
// PART 2 — AUDIO + BPM
// ════════════════════════════════════════════════════════════════════════════

console.log(`\n🎵  Audio file: ${basename(audioFilePath)}`);

try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌  FFmpeg not found. Install it with: brew install ffmpeg");
  process.exit(1);
}

let workingAudioPath = audioFilePath;

if (VIDEO_EXTENSIONS.includes(extname(audioFilePath).toLowerCase())) {
  const extractedName = basename(audioFilePath, extname(audioFilePath)) + "_extracted.mp3";
  const extractedPath = join(PUBLIC, extractedName);

  console.log(`📼  Video detected — extracting audio to: public/${extractedName}`);
  execSync(
    `ffmpeg -y -i "${audioFilePath}" -vn -acodec libmp3lame -ar 44100 -ac 1 -q:a 2 "${extractedPath}"`,
    { stdio: "ignore" }
  );
  workingAudioPath = extractedPath;
  console.log(`✅  Audio extracted.`);

  configText = configText.replace(
    /audioSource:\s*["'][^"']+["']/,
    `audioSource: "${extractedName}"`
  );
}

const tempPcmPath = join(PUBLIC, "_bpm_temp.pcm");
console.log("🔬  Detecting BPM...");

execSync(
  `ffmpeg -y -i "${workingAudioPath}" -vn -acodec pcm_f32le -ar 44100 -ac 1 -f f32le "${tempPcmPath}"`,
  { stdio: "ignore" }
);

const MusicTempo = require("music-tempo");
const pcmBuffer = readFileSync(tempPcmPath);
const float32Array = new Float32Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 4);
const mt = new MusicTempo(float32Array);
const detectedBpm = Math.round(mt.tempo * 10) / 10;

unlinkSync(tempPcmPath);
console.log(`✅  BPM detected: ${detectedBpm}`);

configText = configText.replace(/songBpm:\s*[\d.]+/, `songBpm: ${detectedBpm}`);

// ── Write config once at the end ─────────────────────────────────────────────

writeFileSync(configPath, configText, "utf8");
console.log(`📝  config.ts — songBpm updated to ${detectedBpm}`);

console.log("\n🚀  All done! Run: npm run preview\n");
