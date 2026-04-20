/**
 * prerender.mjs
 *
 * Builds the edited video (cuts + clip cycling) as a single MP4 using FFmpeg.
 * Remotion then only has to play one file and overlay text — no multi-video
 * decoding which was hanging the render.
 *
 * Output: public/_edited.mp4
 *
 * Run: npm run prerender
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const TEMP = join(ROOT, "_segments_temp");
const FPS = 24;

// ── Read config via regex ─────────────────────────────────────────────────────

const configText = readFileSync(join(ROOT, "src", "config.ts"), "utf8");

const videoClips = [
  ...configText.match(/videoClips:\s*\[([^\]]+)\]/s)[1].matchAll(/["']([^"']+)["']/g),
].map((m) => m[1]);

const cutFrames = configText
  .match(/cutFrames:\s*\[([^\]]+)\]/s)[1]
  .split(",").map((s) => parseInt(s.trim(), 10));

const clipStartFrom = parseInt(configText.match(/clipStartFrom:\s*(\d+)/)[1], 10);

// Parse clipOverrides — match everything between `clipOverrides: {` and `} as Record`
const overrides = {};
const overridesBlock = configText.match(/clipOverrides:\s*\{([\s\S]*?)\}\s*as\s+Record/);
if (overridesBlock) {
  const entries = [
    ...overridesBlock[1].matchAll(/(\w+):\s*\{\s*startFrom:\s*(\d+)/g),
  ];
  entries.forEach(([, key, val]) => (overrides[key] = parseInt(val, 10)));
}

function resolveStartFrom(filename) {
  for (const [key, val] of Object.entries(overrides)) {
    if (filename.includes(key)) return val;
  }
  return clipStartFrom;
}

const avgInterval = Math.round(
  cutFrames.slice(1).reduce((sum, f, i) => sum + (f - cutFrames[i]), 0) /
    (cutFrames.length - 1)
);

// ── Setup temp dir ────────────────────────────────────────────────────────────

if (existsSync(TEMP)) rmSync(TEMP, { recursive: true });
mkdirSync(TEMP);

// ── Extract each cut as a temp segment ────────────────────────────────────────

console.log(`\n🎬  Building ${cutFrames.length} cut segments via FFmpeg...\n`);

const segments = [];

for (let i = 0; i < cutFrames.length; i++) {
  const clipIndex = i % videoClips.length;
  const filename = videoClips[clipIndex];
  const startFrame = resolveStartFrom(filename);
  const duration =
    i < cutFrames.length - 1 ? cutFrames[i + 1] - cutFrames[i] : avgInterval;

  const startSec = startFrame / FPS;
  const durationSec = duration / FPS;

  const segPath = join(TEMP, `seg_${String(i).padStart(3, "0")}.mp4`);
  segments.push(segPath);

  process.stdout.write(
    `   [${i + 1}/${cutFrames.length}] ${filename} from ${startSec.toFixed(
      2
    )}s for ${durationSec.toFixed(2)}s ... `
  );

  // Re-encode each segment to ensure clean concat (same codec/params for all)
  execSync(
    `ffmpeg -y -ss ${startSec} -i "${join(
      PUBLIC,
      filename
    )}" -t ${durationSec} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -r ${FPS} -an "${segPath}"`,
    { stdio: "ignore" }
  );

  console.log("✓");
}

// ── Concatenate all segments ──────────────────────────────────────────────────

const listPath = join(TEMP, "concat.txt");
writeFileSync(listPath, segments.map((s) => `file '${s}'`).join("\n"));

const outputPath = join(PUBLIC, "_edited.mp4");

console.log(`\n🔗  Concatenating to public/_edited.mp4 ...`);
execSync(
  `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`,
  { stdio: "ignore" }
);

// ── Cleanup ───────────────────────────────────────────────────────────────────

rmSync(TEMP, { recursive: true });

const sizeMB = (
  parseInt(execSync(`stat -f%z "${outputPath}"`).toString(), 10) /
  1024 /
  1024
).toFixed(1);
console.log(`\n✅  public/_edited.mp4 created (${sizeMB} MB). Now run: npm run render\n`);
