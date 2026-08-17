/**
 * POST /api/name-image  { nameKey, prompt }
 *
 * Gambar buket untuk nama:
 *   1. Cek apakah <nameKey>.jpg/.png sudah ada di bucket name-bouquets
 *      (nama yang sama = gambar yang sama, langsung tarik tanpa generate ulang).
 *   2. Kalau belum, generate lewat Google Gemini (Interactions API,
 *      GEMINI_API_KEY di .env.local) — hasilnya di-upload ke Storage.
 *   3. Kalau tidak ada key / Gemini gagal, fallback ke pollinations.ai (free):
 *      GET https://image.pollinations.ai/prompt/{prompt}?seed=<deterministik>&model=flux
 *
 * Generate bisa makan waktu puluhan detik pada permintaan pertama — route ini
 * sengaja punya maxDuration besar (di Vercel hobby maks 60s, kalau lewat batas
 * browser tetap bisa melihat gambar via URL provisional / cache berikutnya).
 */
import { NextResponse } from 'next/server';
import { normalizeName } from '@/lib/nameNormalize';
import {
  buildNameImageUrl,
  generateWithGemini,
  imageHasLivingBeing,
  seedFromKey,
} from '@/lib/nameStoryImage';
import { findNameImage, storagePublicUrl, uploadNameImage } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  const nameKey = normalizeName(String(body.nameKey || ''));
  const prompt = String(body.prompt || '').trim();
  if (!nameKey) return NextResponse.json({ error: 'missing nameKey' }, { status: 400 });

  // 1) sudah pernah di-generate? langsung pakai yang di Storage.
  const existing = await findNameImage(nameKey);
  if (existing) return NextResponse.json({ url: existing, cached: true });

  // 2) Gemini dulu (kalau GEMINI_API_KEY ada).
  const gemini = await generateWithGemini(prompt);
  if (gemini) {
    try {
      const url = await uploadNameImage(nameKey, gemini.buffer, gemini.contentType);
      return NextResponse.json({ url, cached: false, source: 'gemini' });
    } catch {
      // storage gagal — lanjut ke fallback / error
    }
  }

  // 3) fallback pollinations, dengan pengulangan anti-makhluk-hidup:
  //    generate → cek via Gemini vision → kalau ada orang/tangan/animal,
  //    coba seed berikutnya (maks POLL_ATTEMPTS). Generator gambar suka
  //    menambahkan orang memegang buket, jadi hasil dicek dulu sebelum
  //    disimpan sebagai gambar resmi nama itu.
  const baseSeed = seedFromKey(nameKey);
  const POLL_ATTEMPTS = 4;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const seed = (baseSeed + attempt) % 100000;
    const genUrl = buildNameImageUrl(prompt, seed);
    let buf = null;
    let contentType = 'image/jpeg';
    try {
      const res = await fetch(genUrl, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) continue;
      buf = Buffer.from(await res.arrayBuffer());
      contentType = res.headers.get('content-type') || contentType;
    } catch {
      continue; // timeout / jaringan — coba seed berikutnya
    }

    const hasLiving = await imageHasLivingBeing(buf, contentType);
    const canRetry = attempt < POLL_ATTEMPTS - 1;
    if (hasLiving === true && canRetry) {
      console.warn(`[name-image] seed ${seed} mengandung makhluk hidup — coba seed lain`);
      continue;
    }
    // null = tidak terverifikasi (Gemini vision down / tanpa key). Kalau key
    // ada tapi check gagal, lebih aman coba seed lain daripada menyimpan
    // gambar yang belum tentu bersih. Tanpa key, terima apa adanya.
    if (hasLiving === null && canRetry && process.env.GEMINI_API_KEY) {
      console.warn(`[name-image] seed ${seed} tidak terverifikasi (vision error) — coba seed lain`);
      continue;
    }

    try {
      const url = await uploadNameImage(nameKey, buf, contentType);
      return NextResponse.json({ url, cached: false, source: 'pollinations', seed });
    } catch {
      // storage gagal — tetap kasih URL pollinations (browser bisa load)
      return NextResponse.json({ url: genUrl, cached: false, provisional: true, source: 'pollinations' });
    }
  }

  return NextResponse.json({ error: 'generation failed' }, { status: 502 });
}
