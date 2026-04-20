/**
 * transcode-clips.mjs
 *
 * Transcodes all .mov/.mp4 files in public/ down to 1080p H.264.
 * 4K source files are replaced with lighter local copies that render ~10× faster.
 *
 * Run: npm run transcode-clips
 *
 * If a file is currently a symlink, the symlink is replaced with the transcoded copy.
 * The original file on the drive is never touched.
 */

import { readdirSync, statSync, lstatSync, readlinkSync, renameSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

// ── Find clips ────────────────────────────────────────────────────────────────

const VIDEO_EXTS = [".mov", ".mp4", ".mkv"];
const clips = readdirSync(PUBLIC)
  .filter((f) => !f.startsWith("._"))
  .filter((f) => VIDEO_EXTS.includes("." + f.split(".").pop().toLowerCase()))
  .sort();

if (clips.length === 0) {
  console.error("❌  No video clips found in public/. Run `npm run setup` first.");
  process.exit(1);
}

// ── Check FFmpeg ──────────────────────────────────────────────────────────────

try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌  FFmpeg not found. Install with: brew install ffmpeg");
  process.exit(1);
}

console.log(`\n🎞   Transcoding ${clips.length} clips to 1080p H.264 (no audio)...\n`);

// ── Transcode loop ────────────────────────────────────────────────────────────

let done = 0;
const startTime = Date.now();

for (const clip of clips) {
  const linkPath = join(PUBLIC, clip);
  const isSymlink = lstatSync(linkPath).isSymbolicLink();
  const sourcePath = isSymlink ? readlinkSync(linkPath) : linkPath;
  const tempPath = join(PUBLIC, `_transcoding_${clip}`);

  // Skip if already small (under 50MB suggests already transcoded)
  if (!isSymlink && statSync(linkPath).size < 50 * 1024 * 1024) {
    console.log(`   ⏭   ${clip} — already small, skipping`);
    done++;
    continue;
  }

  process.stdout.write(`   ⏳  [${done + 1}/${clips.length}] ${clip} ... `);

  try {
    execSync(
      `ffmpeg -y -i "${sourcePath}" -vf "scale=-2:1920" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an "${tempPath}"`,
      { stdio: "ignore" }
    );

    // Replace original with transcoded copy
    if (isSymlink) unlinkSync(linkPath);
    else unlinkSync(linkPath);
    renameSync(tempPath, linkPath);

    const newSize = (statSync(linkPath).size / 1024 / 1024).toFixed(1);
    console.log(`✅  → ${newSize} MB`);
    done++;
  } catch (err) {
    console.log(`❌  failed`);
    try { unlinkSync(tempPath); } catch {}
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n🚀  Transcoded ${done}/${clips.length} clips in ${elapsed}s. Now run: npm run render\n`);
