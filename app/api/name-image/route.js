/**
 * POST /api/name-image  { nameKey, prompt }
 *
 * Gambar buket untuk nama (urutan provider):
 *   1. Cek apakah <nameKey>.jpg/.png sudah ada di bucket name-bouquets
 *      (nama yang sama = gambar yang sama, langsung tarik tanpa generate ulang).
 *   2. Generate lewat Alibaba DashScope (qwen3.5-omni-plus) — provider image
 *      generation utama. Menggunakan OpenAI-compatible endpoint. Hasilnya di-upload ke Storage.
 *   3. Generate lewat Cloudflare Worker Image Generation (fallback):
 *      POST { prompt } ke CLOUDFLARE_WORKER_ENDPOINT. Hasilnya di-upload ke Storage.
 *   4. Kalau Alibaba + Cloudflare kosong / gagal, fallback pollinations.ai (free):
 *      GET https://image.pollinations.ai/prompt/{prompt}?seed=<deterministik>&model=flux
 *      dengan pengulangan anti-makhluk-hidup via Gemini vision.
 *
 * Gemini TIDAK dipakai untuk generate gambar lagi (kuota gambar sering 0) —
 * perannya sekarang hanya "text": memverifikasi hasil pollinations lewat
 * model teks-gambar (imageHasLivingBeing) sebelum disimpan.
 *
 * Generate bisa makan waktu puluhan detik pada permintaan pertama — route ini
 * sengaja punya maxDuration besar (di Vercel hobby maks 60s, kalau lewat batas
 * browser tetap bisa melihat gambar via URL provisional / cache berikutnya).
 */
import { NextResponse } from 'next/server';
import { normalizeName } from '@/lib/nameNormalize';
import {
  buildNameImageUrl,
  generateWithAlibaba,
  generateWithCloudflare,
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

  // 2) Alibaba DashScope (kalau ALIBABA_API_KEY ada) — provider image generation.
  // Sertakan referensi gambar dari public/image_reference untuk hasil lebih realistis.
  // URL referensi harus lengkap (http/https) untuk API Alibaba.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const referenceImages = [
    `${baseUrl}/image_reference/amsterdam.webp`,
    `${baseUrl}/image_reference/athena.webp`,
    `${baseUrl}/image_reference/bruges.webp`,
  ];
  const alibaba = await generateWithAlibaba(prompt, { referenceImages });
  if (alibaba) {
    try {
      const url = await uploadNameImage(nameKey, alibaba.buffer, alibaba.contentType);
      return NextResponse.json({ url, cached: false, source: 'alibaba' });
    } catch {
      // storage gagal — lanjut ke Cloudflare / fallback
    }
  }

  // 3) Cloudflare Worker (kalau CLOUDFLARE_WORKER_API_KEY ada) — provider utama.
  const cf = await generateWithCloudflare(prompt);
  if (cf) {
    try {
      const url = await uploadNameImage(nameKey, cf.buffer, cf.contentType);
      return NextResponse.json({ url, cached: false, source: 'cloudflare' });
    } catch {
      // storage gagal — lanjut ke fallback
    }
  }

  // 4) fallback pollinations, dengan pengulangan anti-makhluk-hidup:
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
