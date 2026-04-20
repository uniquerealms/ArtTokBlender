/**
 * link-clips.mjs
 *
 * Creates symlinks in public/ that point to the actual files on your hard drive.
 * Remotion follows symlinks transparently — no component changes needed.
 *
 * Run this once whenever you:
 *  - Add new clips to videoClips in config.ts
 *  - Change videoBasePath
 *  - Set up the project on a new machine
 *
 * Usage: npm run link-clips
 */

import { readFileSync } from "fs";
import { symlink, unlink, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { constants } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Read config values via regex (avoids running TS) ────────────────────────

const configText = readFileSync(join(ROOT, "src", "config.ts"), "utf8");

function extractString(key) {
  const m = configText.match(new RegExp(`${key}:\\s*["']([^"']+)["']`));
  if (!m) throw new Error(`Could not find "${key}" in src/config.ts`);
  return m[1];
}

function extractArray(key) {
  const m = configText.match(new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`));
  if (!m) throw new Error(`Could not find "${key}" in src/config.ts`);
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
}

const videoBasePath = extractString("videoBasePath");
const videoClips = extractArray("videoClips");
const audioSource = extractString("audioSource");

const allFiles = [...new Set([...videoClips, audioSource])];

console.log(`\n🔗  Linking from: ${videoBasePath}`);
console.log(`    Files: ${allFiles.join(", ")}\n`);

// ── Check the drive is mounted ───────────────────────────────────────────────

try {
  await access(videoBasePath, constants.F_OK);
} catch {
  console.error(`❌  Drive not found at: ${videoBasePath}`);
  console.error("    Make sure the drive is plugged in and mounted, then try again.");
  process.exit(1);
}

// ── Create symlinks ──────────────────────────────────────────────────────────

let linked = 0;
let skipped = 0;

for (const file of allFiles) {
  const sourcePath = join(videoBasePath, file);
  const linkPath = join(ROOT, "public", file);

  // Check the source file actually exists on the drive
  try {
    await access(sourcePath, constants.F_OK);
  } catch {
    console.warn(`⚠️   Not found on drive, skipping: ${file}`);
    skipped++;
    continue;
  }

  // Remove stale symlink if it exists
  try {
    await unlink(linkPath);
  } catch {
    // didn't exist, that's fine
  }

  await symlink(sourcePath, linkPath);
  console.log(`✅  Linked: public/${file} → ${sourcePath}`);
  linked++;
}

console.log(`\n📎  Done — ${linked} linked, ${skipped} skipped.`);
if (linked > 0) {
  console.log("🚀  Run: npm run preview\n");
}
