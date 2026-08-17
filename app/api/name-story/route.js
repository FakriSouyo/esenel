/**
 * POST /api/name-story  { name }
 *
 * Alur "buat bunga dari namamu":
 *   1. normalizeName(nama) -> cek cache Supabase (name_stories). Kalau sudah
 *      ada, langsung tarik tanpa generate ulang.
 *   2. Kalau belum, panggil DeepSeek (DEEPSEEK_API_KEY di .env.local).
 *   3. Kalau tidak ada key / gagal, fallback ke dummy supaya UI tetap jalan.
 *
 * Kunci DeepSeek TIDAK pernah sampai ke browser — hanya dipakai di sini.
 */
import { NextResponse } from 'next/server';
import { normalizeName } from '@/lib/nameNormalize';
import {
  NAME_STORY_SYSTEM_PROMPT,
  buildNamePrompt,
  parseStoryResponse,
} from '@/lib/nameStoryPrompt';
import { getDummyStory } from '@/lib/nameStoryDummy';
import { enforceImagePrompt } from '@/lib/nameStoryImage';
import { getCachedNameStory, saveNameStoryCache } from '@/lib/supabase';
import { products } from '@/data/products';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CATALOG_NAMES = Array.from(new Set(products.map((p) => p.name))).filter(Boolean);

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  const name = String(body.name || '').trim();
  const key = normalizeName(name);
  if (!key) return NextResponse.json({ error: 'nama kosong' }, { status: 400 });

  // 1) cache Supabase — nama yang sama tidak perlu di-generate ulang.
  try {
    const cached = await getCachedNameStory(key);
    if (cached && cached.story) {
      // imagePrompt lama (sebelum aturan "semua bunga") ikut diperkuat di sini,
      // jadi story hasil cache pun tetap menyebut semua bunga kecocokan.
      return NextResponse.json({
        story: enforceImagePrompt(cached.story),
        name: cached.name || name,
        cached: true,
        source: 'cache',
      });
    }
  } catch {
    // tanpa env Supabase → lanjut ke DeepSeek / dummy
  }

  // 2) DeepSeek.
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: NAME_STORY_SYSTEM_PROMPT },
            { role: 'user', content: buildNamePrompt(name, CATALOG_NAMES) },
          ],
          temperature: 0.85,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        const story = parseStoryResponse(raw);
        if (story) {
          story.nama = story.nama || name;
          story.namaBuket = story.namaBuket || CATALOG_NAMES[0] || 'ESENEL';
          // Pastikan imagePrompt menyebut SEMUA bunga kecocokan, bukan ringkasan.
          enforceImagePrompt(story);
          try {
            await saveNameStoryCache(key, name, story);
          } catch {
            // cache gagal tidak memblokir jawaban
          }
          return NextResponse.json({
            story,
            name,
            cached: false,
            source: 'deepseek',
          });
        }
      }
    } catch {
      // timeout / network — jatuh ke dummy
    }
  }

  // 3) fallback dummy (belum ada key, atau DeepSeek gagal).
  const story = getDummyStory(name, CATALOG_NAMES);
  story.nama = name;
  enforceImagePrompt(story);
  return NextResponse.json({ story, name, cached: false, source: 'dummy' });
}
