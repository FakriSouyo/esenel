// One-off asset optimizer: converts every PNG in public/katalog_esenel to a
// resized WebP (long edge capped at 1600px, quality 82) written next to the
// original. Product cards are displayed at ~25vw, so 1600px is more than
// enough for any screen; the source PNGs average 2.7MB, WebP comes out ~10x
// smaller, which speeds up first paint AND Next's on-the-fly image optimizer.
//
// Run: node scripts/optimize-catalog.mjs

import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public', 'katalog_esenel');
const MAX_EDGE = 1600;
const QUALITY = 82;

function walk(p, out = []) {
  for (const name of readdirSync(p)) {
    const full = join(p, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.toLowerCase().endsWith('.png')) out.push(full);
  }
  return out;
}

const files = walk(dir);
console.log(`Found ${files.length} PNGs`);

let saved = 0;
for (const f of files) {
  const target = join(dirname(f), basename(f, extname(f)) + '.webp');
  if (existsSync(target)) {
    console.log(`skip (exists): ${basename(target)}`);
    continue;
  }
  const meta = await sharp(f).metadata();
  const longEdge = Math.max(meta.width, meta.height);
  const resize =
    longEdge > MAX_EDGE ? { width: null, height: null, ...(meta.width >= meta.height ? { width: MAX_EDGE } : { height: MAX_EDGE }), withoutEnlargement: true } : undefined;

  const before = statSync(f).size;
  const buf = await sharp(f).rotate().resize(resize).webp({ quality: QUALITY }).toBuffer();
  writeFileSync(target, buf);
  const after = buf.length;
  saved += before - after;
  console.log(
    `${basename(f)}  ${(before / 1048576).toFixed(2)}MB -> ${(after / 1048576).toFixed(2)}MB  (${Math.round((after / before) * 100)}%)`
  );
}

console.log(`\nTotal saved: ${(saved / 1048576).toFixed(1)}MB`);
