/**
 * Normalize the craft workbench flower assets:
 *   - every pose image is padded onto the SAME transparent canvas (400×800)
 *   - content keeps its natural aspect, centered
 *   - converted to WebP (much lighter than the ~400KB PNGs)
 *
 * Usage:  node scripts/optimize-flowers.mjs
 * Output: public/flowers/<type>/<type>_<pose>.webp (PNGs left in place, delete after verifying)
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = 'public/flowers';
const TARGET_W = 400;
const TARGET_H = 800;

const dirs = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory());

let count = 0;
let savedBytes = 0;

for (const dir of dirs) {
  const folder = path.join(ROOT, dir);
  for (const f of fs.readdirSync(folder)) {
    if (!/\.png$/i.test(f)) continue;
    const src = path.join(folder, f);
    const out = src.replace(/\.png$/i, '.webp');

    const meta = await sharp(src).metadata();
    const scale = Math.min(TARGET_W / meta.width, TARGET_H / meta.height);
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));

    await sharp(src)
      .resize({ width: w, height: h, fit: 'fill' })
      .extend({
        top: Math.round((TARGET_H - h) / 2),
        bottom: Math.round((TARGET_H - h) / 2),
        left: Math.round((TARGET_W - w) / 2),
        right: Math.round((TARGET_W - w) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 85 })
      .toFile(out);

    const oldSize = fs.statSync(src).size;
    const newSize = fs.statSync(out).size;
    savedBytes += oldSize - newSize;
    count += 1;
    console.log(`${f.padEnd(34)} ${(oldSize / 1024).toFixed(0).padStart(4)}KB -> ${(newSize / 1024).toFixed(0).padStart(3)}KB`);
  }
}

console.log(`\n${count} assets → ${TARGET_W}×${TARGET_H} webp, saved ${(savedBytes / 1024 / 1024).toFixed(1)}MB`);
