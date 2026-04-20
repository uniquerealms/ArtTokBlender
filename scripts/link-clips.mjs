/**
 * link-clips.mjs
 *
 * Run: npm run link-clips
 * When prompted, drag your clips folder into the terminal and press Enter.
 *
 * This script will:
 *  1. Scan the dragged folder for .mp4 and .mov files
 *  2. Create symlinks in public/ pointing to each clip on the drive
 *  3. Update videoClips in src/config.ts with the discovered filenames
 */

import { createInterface } from "readline";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { symlink, unlink, access } from "fs/promises";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { constants } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

// ── Prompt helper ────────────────────────────────────────────────────────────

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      // Strip surrounding quotes and whitespace that macOS adds on drag-and-drop
      resolve(answer.trim().replace(/^["']|["']$/g, "").trimEnd());
    });
  });
}

// ── 1. Prompt for clips folder ───────────────────────────────────────────────

console.log("\n📂  Drag your clips folder into this terminal window and press Enter:");
const clipsFolder = await prompt("   > ");

if (!clipsFolder) {
  console.error("❌  No path received. Exiting.");
  process.exit(1);
}

// ── 2. Check folder exists ───────────────────────────────────────────────────

try {
  await access(clipsFolder, constants.F_OK);
} catch {
  console.error(`❌  Folder not found: ${clipsFolder}`);
  process.exit(1);
}

// ── 3. Scan for video files ──────────────────────────────────────────────────

const allFiles = readdirSync(clipsFolder);
const clipFiles = allFiles
  .filter((f) => !f.startsWith("._") && VIDEO_EXTENSIONS.includes("." + f.split(".").pop().toLowerCase()))
  .sort();

if (clipFiles.length === 0) {
  console.error(`❌  No video files found in: ${clipsFolder}`);
  console.error(`    Looking for: ${VIDEO_EXTENSIONS.join(", ")}`);
  process.exit(1);
}

console.log(`\n🎬  Found ${clipFiles.length} clip(s):`);
clipFiles.forEach((f) => console.log(`    • ${f}`));

// ── 4. Create symlinks in public/ ────────────────────────────────────────────

console.log("\n🔗  Creating symlinks in public/...");
let linked = 0;

for (const file of clipFiles) {
  const sourcePath = join(clipsFolder, file);
  const linkPath = join(PUBLIC, file);

  try {
    await unlink(linkPath);
  } catch {
    // didn't exist
  }

  await symlink(sourcePath, linkPath);
  console.log(`   ✅  public/${file} → ${sourcePath}`);
  linked++;
}

// ── 5. Update videoClips in config.ts ────────────────────────────────────────

const configPath = join(ROOT, "src", "config.ts");
const configText = readFileSync(configPath, "utf8");

const clipsArrayString =
  "[\n" + clipFiles.map((f) => `    "${f}"`).join(",\n") + ",\n  ]";

const patched = configText.replace(
  /videoClips:\s*\[[^\]]*\]/s,
  `videoClips: ${clipsArrayString}`
);

writeFileSync(configPath, patched, "utf8");

console.log(`\n📝  src/config.ts updated — videoClips now has ${clipFiles.length} file(s).`);
console.log(`\n🚀  ${linked} symlink(s) created. Run: npm run preview\n`);
