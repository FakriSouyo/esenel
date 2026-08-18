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
import { finalizeNameStory } from '@/lib/nameStoryFinalize';
import { ensureUniqueBouquetName, pickBouquetName } from '@/lib/bouquetNames';
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
    const cs = cached && cached.story;
    // Story cache yang rusak / kosong / dari prompt lama yang belum punya
    // field wajib dianggap miss → di-generate ulang dengan aturan terbaru.
    const cacheOk =
      cs &&
      typeof cs === 'object' &&
      typeof cs.artiNama === 'string' &&
      cs.artiNama &&
      typeof cs.maknaNama === 'string' &&
      cs.maknaNama &&
      Array.isArray(cs.bunga) &&
      cs.bunga.length > 0;
    if (cacheOk) {
      // Finalisasi sama untuk semua pembaca (halaman shared, OG, API) —
      // dan SIMPAN hasilnya kembali, supaya cache ikut konvergen dan nama
      // buket yang sama tidak tampil beda antara API vs halaman/OG.
      const story = finalizeNameStory(cached.story, name, CATALOG_NAMES);
      try {
        await saveNameStoryCache(key, name, story);
      } catch {
        // simpan balik gagal tidak memblokir jawaban
      }
      return NextResponse.json({
        story,
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
          // Nama buket harus unik: tidak boleh nama katalog / nama input.
          ensureUniqueBouquetName(story, name, CATALOG_NAMES);
          if (!story.namaBuket) {
            story.namaBuket = pickBouquetName(name, {
              exclude: [name, ...CATALOG_NAMES],
            });
          }
          // Finalisasi: imagePrompt diperkuat + tiap bunga dapat nama
          // puitis 1 kata (jaring pengaman AI).
          finalizeNameStory(story, name, CATALOG_NAMES);
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
  finalizeNameStory(story, name, CATALOG_NAMES);
  return NextResponse.json({ story, name, cached: false, source: 'dummy' });
}
