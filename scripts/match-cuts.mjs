/**
 * match-cuts.mjs
 *
 * Run: npm run match-cuts
 * When prompted, drag a reference video into the terminal and press Enter.
 *
 * This script detects the actual cut points in the reference video using
 * FFmpeg scene detection and writes them to cutFrames in src/config.ts.
 * Remotion will then cut your clips at exactly the same rhythm.
 */

import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanPath(p) {
  return p.trim().replace(/^["']|["']$/g, "").trimEnd();
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(cleanPath(answer)); });
  });
}

// ── 1. Get reference video path ───────────────────────────────────────────────

console.log("\n🎬  Drag your reference video into this terminal and press Enter:");
let refVideo = await prompt("   > ");

if (!refVideo || !existsSync(refVideo)) {
  console.error(`❌  File not found: ${refVideo}`);
  process.exit(1);
}

// ── 2. Check FFmpeg ───────────────────────────────────────────────────────────

try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌  FFmpeg not found. Install it with: brew install ffmpeg");
  process.exit(1);
}

// ── 3. Read config values ─────────────────────────────────────────────────────

const configPath = join(ROOT, "src", "config.ts");
const configText = readFileSync(configPath, "utf8");

const fpsMatch = configText.match(/fps:\s*(\d+)/);
const targetMatch = configText.match(/targetDurationSeconds:\s*([\d.]+)/);
const fps = fpsMatch ? parseInt(fpsMatch[1], 10) : 24;
const targetSecs = targetMatch ? parseFloat(targetMatch[1]) : 13.5;

console.log(`\n🔍  Detecting cuts in reference video (fps: ${fps}, target: ${targetSecs}s)...`);

// ── 4. Scene detection via FFmpeg ─────────────────────────────────────────────

const raw = execSync(
  `ffmpeg -i "${refVideo}" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep pts_time || true`,
  { shell: true }
).toString();

const allTimestamps = [...raw.matchAll(/pts_time:([\d.]+)/g)]
  .map((m) => parseFloat(m[1]))
  .sort((a, b) => a - b);

if (allTimestamps.length === 0) {
  console.error("❌  No scene changes detected. Try a video with hard cuts between clips.");
  process.exit(1);
}

// ── 5. Filter: remove duplicates within 0.4s of each other ───────────────────

const filtered = [];
let prevTime = -999;
for (const t of allTimestamps) {
  if (t - prevTime >= 0.4) {
    filtered.push(t);
    prevTime = t;
  }
}

console.log(`   Found ${filtered.length} cuts: ${filtered.map(t => t.toFixed(2) + 's').join(', ')}`);

// ── 6. Normalize: shift so first cut = frame 0, filter to targetDuration ──────

const offset = filtered[0] ?? 0;
const normalized = filtered
  .map((t) => Math.round((t - offset) * fps))
  .filter((f) => f <= Math.round(targetSecs * fps));

console.log(`\n✅  ${normalized.length} cut frames: [${normalized.join(', ')}]`);

// ── 7. Write cutFrames to config.ts ──────────────────────────────────────────

const patched = configText.replace(
  /cutFrames:\s*\[[^\]]*\]/s,
  `cutFrames: [${normalized.join(", ")}]`
);

writeFileSync(configPath, patched, "utf8");
console.log(`📝  config.ts — cutFrames updated with ${normalized.length} reference cut points`);
console.log("\n🚀  Run: npm run preview\n");
