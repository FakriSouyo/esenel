/**
 * Uploads local site images to Supabase Storage (katalog + craft buckets).
 * Run with the service role key in env (never commit it):
 *
 *   SUPABASE_PROJECT_REF=jimsgyrsgygicxwyuqzo \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/upload-storage.mjs
 *
 * Maps:
 *   public/katalog_esenel/<Folder>/<file>.webp -> katalog/<Folder>/<file>.webp
 *   public/flowers/<flower>/<pose>.webp        -> craft/<flower>/<pose>.webp
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const REF = process.env.SUPABASE_PROJECT_REF;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!REF || !KEY) {
  console.error('Missing SUPABASE_PROJECT_REF / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const BASE = `https://${REF}.supabase.co/storage/v1/object`;

async function upload(bucket, folder, file) {
  const body = readFileSync(`public/${folder}/${file}`);
  const path = `${folder}/${file}`.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${BASE}/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body,
  });
  return res.status;
}

const jobs = [];
for (const file of globSync('public/katalog_esenel/*/*.webp')) {
  const parts = file.split(/[\\/]/); // public / katalog_esenel / Folder / file.webp
  jobs.push({ bucket: 'katalog', srcDir: `katalog_esenel/${parts[2]}`, name: parts[3] });
}
for (const file of globSync('public/flowers/*/*.webp')) {
  const parts = file.split(/[\\/]/); // public / flowers / flower / pose.webp
  jobs.push({ bucket: 'craft', srcDir: `flowers/${parts[2]}`, name: parts[3] });
}

let ok = 0;
let fail = 0;
for (const { bucket, srcDir, name } of jobs) {
  const code = await upload(bucket, srcDir, name);
  if (code === 200) ok++;
  else {
    fail++;
    console.error(`FAIL ${code}: ${bucket}/${srcDir}/${name}`);
  }
}
console.log(`Uploaded ${ok}/${jobs.length} to Supabase Storage (${fail} failed).`);
if (fail > 0) process.exit(1);
