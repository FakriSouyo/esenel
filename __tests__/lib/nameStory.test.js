import { describe, expect, it } from 'vitest';
import {
  NAME_STORY_SYSTEM_PROMPT,
  buildNamePrompt,
  parseStoryResponse,
} from '@/lib/nameStoryPrompt';
import { getDummyStory } from '@/lib/nameStoryDummy';
import {
  BOUQUET_NAMES,
  ensureUniqueBouquetName,
  pickBouquetName,
} from '@/lib/bouquetNames';
import {
  buildNameImageUrl,
  CLOUDFLARE_WORKER_ENDPOINT,
  enforceImagePrompt,
  flowerEn,
  generateWithCloudflare,
  generateWithGemini,
  GEMINI_IMAGE_MODEL_DEFAULT,
  imageHasLivingBeing,
  seedFromKey,
} from '@/lib/nameStoryImage';
import {
  enrichFlowerNames,
  getPoeticFlowerName,
  POETIC_DICTIONARY,
} from '@/lib/flowerPoeticNames';
import { FLOWER_PRICE_DATA } from '@/lib/flowerPrices';

describe('buildNamePrompt', () => {
  it('embeds the name and demands JSON-only output', () => {
    const prompt = buildNamePrompt('Carin');
    expect(prompt).toContain('Carin');
    expect(prompt.toLowerCase()).toContain('nama');
  });

  it('marks the catalog list as a tone reference, never to be copied', () => {
    const prompt = buildNamePrompt('Carin', ['Alba', 'Bali']);
    expect(prompt).toContain('Alba');
    expect(prompt).toMatch(/HANYA referensi NADA/i);
    expect(prompt).toMatch(/DILARANG KERAS menyalinnya/i);
    expect(prompt).toMatch(/TIDAK boleh memakai nama input/i);
  });
});

describe('bouquetNames', () => {
  it('picks deterministically from a poetic pool', () => {
    expect(pickBouquetName('Carin')).toBe(pickBouquetName('Carin'));
    // hasil: SATU KATA puitis
    const name = pickBouquetName('Carin');
    expect(name.split(/\s+/)).toHaveLength(1);
    expect(name).toMatch(/^[A-Z][a-zāēīōū]+$/);
    expect(pickBouquetName('a')).not.toBe(pickBouquetName('b'));
  });

  it('skips forbidden names (catalog / input words), case & accent insensitive', () => {
    const ex = ['Yūgen', 'Carin', 'Dewi', 'ratrika'];
    const got = pickBouquetName('Dewi Ratrika Rinupa Sejati', { exclude: ex });
    expect(ex.map((x) => x.toLowerCase())).not.toContain(got.toLowerCase());
    // aksen: 'Yūgen' dilarang, jadi 'Yūgen' (normalize -> 'yugen') tidak muncul
    expect(got.toLowerCase()).not.toBe('yūgen');
    expect(got.toLowerCase()).not.toBe('yugen');
  });

  it('replaces a forbidden bouquet name with a unique poetic one', () => {
    const catalogs = ['Alba', 'Bali', 'Colmar'];
    // nama buket = nama katalog → diganti
    let story = ensureUniqueBouquetName({ namaBuket: 'Bali' }, 'Carin', catalogs);
    expect(story.namaBuket).not.toBe('Bali');
    expect(catalogs).not.toContain(story.namaBuket);
    // nama buket = salah satu kata nama input → diganti
    story = ensureUniqueBouquetName(
      { namaBuket: 'Ratrika' },
      'Dewi Ratrika Rinupa Sejati',
      catalogs
    );
    expect(story.namaBuket).not.toBe('Ratrika');
    // nama buket yang MENURUN dari kata input (bukan salinan persis) → diganti
    story = ensureUniqueBouquetName(
      { namaBuket: 'Ratrī Kusuma' },
      'Dewi Ratrika Rinupa Sejati',
      catalogs
    );
    expect(story.namaBuket).not.toBe('Ratrī Kusuma');
    expect(story.namaBuket.toLowerCase()).not.toContain('ratri');
    // nama buket = nama input persis → diganti
    story = ensureUniqueBouquetName({ namaBuket: 'Carin' }, 'Carin', catalogs);
    expect(story.namaBuket).not.toBe('Carin');
    // nama buket dari kolam fallback (mudah dipakai ulang AI → dua orang
    // bisa kebagian nama sama) → diganti
    story = ensureUniqueBouquetName({ namaBuket: 'Tsukiyo' }, 'Carin', catalogs);
    expect(story.namaBuket).not.toBe('Tsukiyo');
    // nama AI yang aman & unik (bukan katalog/input/kolam) → dibiarkan
    story = ensureUniqueBouquetName({ namaBuket: 'Lumière' }, 'Carin', catalogs);
    expect(story.namaBuket).toBe('Lumière');
  });
});

describe('NAME_STORY_SYSTEM_PROMPT', () => {
  it('forbids AI cliches and dashes', () => {
    expect(NAME_STORY_SYSTEM_PROMPT.toLowerCase()).toContain('tentu saja');
    expect(NAME_STORY_SYSTEM_PROMPT.toLowerCase()).toContain('dash');
  });

  it('demands talking directly with kamu, never third-person', () => {
    expect(NAME_STORY_SYSTEM_PROMPT.toLowerCase()).toContain('kamu');
    expect(NAME_STORY_SYSTEM_PROMPT).toContain('orang dengan nama');
    expect(NAME_STORY_SYSTEM_PROMPT.toLowerCase()).toContain('dilarang keras');
  });

  it('asks for 6 to 8 flowers', () => {
    expect(NAME_STORY_SYSTEM_PROMPT).toContain('6 sampai 8');
  });

  it('requests story, meaning, flowers, bouquet name and image prompt in its JSON schema', () => {
    for (const key of ['artiNama', 'maknaNama', 'cerita', 'bunga', 'imagePrompt', 'namaBuket', 'namaPuitis']) {
      expect(NAME_STORY_SYSTEM_PROMPT).toContain(key);
    }
  });

  it('demands a one-word poetic flower name from the five languages, not a person name', () => {
    const p = NAME_STORY_SYSTEM_PROMPT.toLowerCase();
    expect(p).toContain('namapuitis');
    expect(p).toContain('5 bahasa');
    for (const lang of ['arab', 'inggris', 'sanskerta', 'nordik', 'jepang']) {
      expect(p).toContain(lang);
    }
    expect(p).toMatch(/satu kata/i);
    expect(p).toMatch(/bukan nama orang|dilarang keras memakai nama orang/i);
    expect(p).toMatch(/hanya namanya/i);
  });
});

describe('flowerPoeticNames', () => {
  it('gives every flower in the price database a one-word poetic name', () => {
    const oneWord = /^[\p{L}\p{M}'-]+$/u;
    for (const f of FLOWER_PRICE_DATA) {
      const name = getPoeticFlowerName(f.nama);
      expect(name, f.nama).toBeTruthy();
      expect(name.split(/\s+/), f.nama).toHaveLength(1);
      expect(name, f.nama).toMatch(oneWord);
      expect(name, f.nama).not.toMatch(/\d/);
    }
  });

  it('picks deterministically so the same flower always gets the same name', () => {
    expect(getPoeticFlowerName('Eustoma')).toBe(getPoeticFlowerName('eustoma'));
    expect(getPoeticFlowerName('Tulip putih')).toBe(getPoeticFlowerName('Tulip'));
    expect(POETIC_DICTIONARY.some((e) => e.alias.includes('eustoma'))).toBe(true);
  });

  it('enriches flowers missing a poetic name from the deterministic dictionary', () => {
    const story = { bunga: [{ nama: 'Eustoma', alasan: 'x' }, { nama: 'Lavender', alasan: 'y' }] };
    enrichFlowerNames(story);
    expect(story.bunga[0].namaPuitis).toBe('Lalita');
    expect(story.bunga[1].namaPuitis).toBe('Sakina');
  });

  it('replaces multi-word or plain-flower-name poetic names', () => {
    const story = {
      bunga: [
        { nama: 'Eustoma', namaPuitis: 'Kusuma Melati', alasan: 'x' }, // 2 kata → diganti
        { nama: 'Lavender', namaPuitis: 'Lavender', alasan: 'y' }, // nama bunga itu sendiri → diganti
      ],
    };
    enrichFlowerNames(story);
    expect(story.bunga[0].namaPuitis).toBe('Lalita');
    expect(story.bunga[1].namaPuitis).toBe('Sakina');
  });

  it('keeps a valid one-word poetic name untouched', () => {
    const story = { bunga: [{ nama: 'Eustoma', namaPuitis: 'Anjali', alasan: 'x' }] };
    enrichFlowerNames(story);
    expect(story.bunga[0].namaPuitis).toBe('Anjali');
  });

  it('is a no-op for stories without flowers', () => {
    expect(enrichFlowerNames({ bunga: [] })).toEqual({ bunga: [] });
    expect(enrichFlowerNames(null)).toBeNull();
  });
});

describe('parseStoryResponse', () => {
  it('parses clean JSON and cleans optional fields', () => {
    const raw = JSON.stringify({
      nama: 'Carin',
      namaBuket: 'Colmar',
      artiNama: 'Arti',
      maknaNama: 'Makna',
      cerita: 'Cerita',
      bunga: [
        { nama: 'Anthurium', namaPuitis: 'Hugr', alasan: 'tulus' },
        { nama: 'Tulip', alasan: 'anggun' },
      ],
      imagePrompt: 'prompt',
    });
    const story = parseStoryResponse(raw);
    expect(story.artiNama).toBe('Arti');
    expect(story.namaBuket).toBe('Colmar');
    expect(story.bunga).toHaveLength(2);
    expect(story.bunga[0].namaPuitis).toBe('Hugr'); // namaPuitis AI dipertahankan
    expect(story.bunga[1].namaPuitis).toBe(''); // yang kosong tetap kosong (di-enrich route)
  });

  it('caps flowers at 8 and drops empty ones', () => {
    const banyak = Array.from({ length: 12 }, (_, i) => ({ nama: `Bunga ${i}`, alasan: 'x' }));
    const story = parseStoryResponse(
      JSON.stringify({ artiNama: 'a', maknaNama: 'b', bunga: [...banyak, { alasan: 'tanpa nama' }] })
    );
    expect(story.bunga).toHaveLength(8);
  });

  it('strips json code fences', () => {
    const raw = '```json\n{"artiNama":"a","maknaNama":"b","bunga":[{"nama":"x","alasan":"y"}]}\n```';
    const story = parseStoryResponse(raw);
    expect(story.artiNama).toBe('a');
  });

  it('extracts JSON wrapped in extra prose', () => {
    const raw =
      'Tentu, ini jawabannya: {"artiNama":"a","maknaNama":"b","bunga":[{"nama":"x","alasan":"y"}]} semoga membantu';
    const story = parseStoryResponse(raw);
    expect(story.maknaNama).toBe('b');
  });

  it('returns null for invalid payloads', () => {
    expect(parseStoryResponse(null)).toBeNull();
    expect(parseStoryResponse('lorem ipsum')).toBeNull();
    expect(parseStoryResponse('{"artiNama":"a"}')).toBeNull(); // bunga wajib
  });
});

describe('getDummyStory', () => {
  it('builds a complete story for any name with a conversational kamu tone', () => {
    const story = getDummyStory('Carin');
    expect(story.nama).toBe('Carin');
    expect(story.artiNama).toContain('Carin');
    expect(story.maknaNama.length).toBeGreaterThan(60);
    expect(story.bunga.length).toBeGreaterThanOrEqual(6);
    expect(story.bunga.length).toBeLessThanOrEqual(8);
    expect(story.imagePrompt.length).toBeGreaterThan(10);
    expect(story.namaBuket.length).toBeGreaterThan(0);
    // tiap bunga punya nama puitis 1 kata
    for (const b of story.bunga) {
      expect(b.namaPuitis, b.nama).toBeTruthy();
      expect(b.namaPuitis.split(/\s+/), b.nama).toHaveLength(1);
      expect(b.namaPuitis, b.nama).not.toBe(b.nama);
    }
    // gaya bicara: menyapa "kamu", bukan menyebut dari luar
    expect(story.maknaNama).toContain('Kamu');
    expect(story.maknaNama).not.toMatch(/orang dengan nama/);
    expect(story.artiNama).not.toMatch(/[-–—]/);
    expect(story.maknaNama).not.toMatch(/[-–—]/);
    // imagePrompt bergaya foto katalog
    expect(story.imagePrompt.toLowerCase()).toContain('catalog');
  });

  it('picks a deterministic poetic bouquet name, never a catalog or input name', () => {
    const names = ['Alba', 'Bali', 'Colmar'];
    expect(getDummyStory('Carin', names).namaBuket).toBe(getDummyStory('Carin', names).namaBuket);
    expect(names).not.toContain(getDummyStory('Carin', names).namaBuket); // bukan salinan katalog
    expect(getDummyStory('Carin', names).namaBuket.toLowerCase()).not.toContain('carin'); // bukan nama input
    expect(getDummyStory('Bali', names).namaBuket.toLowerCase()).not.toContain('bali');
  });

  it('handles long multi-word names as one person, with a unique bouquet name', () => {
    const longName = 'Dewi Ratrika Rinupa Sejati';
    const story = getDummyStory(longName, ['Alba', 'Bali']);
    expect(story.nama).toBe(longName); // nama penuh dipertahankan
    expect(story.namaBuket).not.toBe('Ratrika');
    expect(story.namaBuket).not.toBe('Sejati');
    expect(story.namaBuket.toLowerCase()).not.toContain('ratrika');
    expect(story.namaBuket.toLowerCase()).not.toContain('sejati');
  });
});

describe('nameStoryImage', () => {
  it('derives a deterministic seed from the name key', () => {
    expect(seedFromKey('fakhriabdillah')).toBe(seedFromKey('fakhriabdillah'));
    expect(seedFromKey('selena')).toBe(seedFromKey('selena'));
    expect(seedFromKey('a')).not.toBe(seedFromKey('b'));
    expect(seedFromKey('')).toBeGreaterThanOrEqual(0);
  });

  it('builds a pollinations URL with encoded prompt and params', () => {
    const url = buildNameImageUrl('buket pastel', 1234);
    expect(url).toContain('https://image.pollinations.ai/prompt/');
    expect(url).toContain(encodeURIComponent('buket pastel'));
    expect(url).toContain('seed=1234');
    expect(url).toContain('width=1024');
    expect(url).toContain('height=1024');
    expect(url).toContain('model=flux');
    expect(url).toContain('nologo=true');
  });

  it('translates common Indonesian flower names to English', () => {
    expect(flowerEn('Mawar Merah')).toBe('deep red roses');
    expect(flowerEn('Bunga Matahari')).toBe('golden sunflowers');
    expect(flowerEn('Tulip putih')).toBe('tulips');
    expect(flowerEn('Lavender')).toBe('lavender sprigs');
    expect(flowerEn('Anggrek bulan')).toBe('orchids');
  });

  it('enforces the full flower list into imagePrompt, preferring English names', () => {
    const story = {
      imagePrompt: 'A bouquet of flowers wrapped in kraft paper.',
      bunga: [
        { nama: 'Mawar Merah', namaEn: 'deep red roses' },
        { nama: 'Lavender', namaEn: 'purple lavender sprigs' },
        { nama: 'Tulip' },
      ],
    };
    enforceImagePrompt(story);
    expect(story.imagePrompt).toMatch(/mixing 3 different flowers/i);
    expect(story.imagePrompt).toContain('deep red roses');
    expect(story.imagePrompt).toContain('purple lavender sprigs');
    expect(story.imagePrompt).toContain('tulips'); // fallback terjemahan dari nama
    expect(story.imagePrompt).not.toContain('Mawar'); // jangan nama Indonesia mentah
  });

  it('produces a stand-alone bouquet with no people or living beings', () => {
    const story = { imagePrompt: 'A bouquet.', bunga: [{ nama: 'Mawar Merah', namaEn: 'deep red roses' }] };
    enforceImagePrompt(story);
    // buket berdiri sendiri, TANPA orang / tangan / makhluk hidup
    expect(story.imagePrompt).toMatch(/not held by anyone|stands alone/i);
    expect(story.imagePrompt).not.toMatch(/held by a person/i);
    expect(story.imagePrompt).toMatch(/no people|no human hands/i);
    expect(story.imagePrompt).not.toMatch(/flower shop/i);
  });

  it('uses kraft paper wrapping and a clean studio setting', () => {
    const story = { imagePrompt: 'A bouquet.', bunga: [{ nama: 'Lavender', namaEn: 'purple lavender sprigs' }] };
    enforceImagePrompt(story);
    expect(story.imagePrompt).toMatch(/kraft paper/i);
    expect(story.imagePrompt).toMatch(/wrapped/i);
    expect(story.imagePrompt).toMatch(/studio/i);
    expect(story.imagePrompt).not.toMatch(/satin ribbon/i); // kraft, bukan ribbon warna-warni
  });

  it('enforceImagePrompt is a no-op for stories without flowers', () => {
    const story = { imagePrompt: 'x' };
    expect(enforceImagePrompt(story)).toBe(story);
    expect(enforceImagePrompt(null)).toBeNull();
  });

  it('exposes the Gemini default model and skips generation without a key', async () => {
    expect(GEMINI_IMAGE_MODEL_DEFAULT).toMatch(/^gemini-.*-image$/);
    const key = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(generateWithGemini('sebuah buket')).resolves.toBeNull();
    } finally {
      if (key) process.env.GEMINI_API_KEY = key;
    }
  });

  it('exposes the Cloudflare worker endpoint and skips generation without a key', async () => {
    expect(CLOUDFLARE_WORKER_ENDPOINT).toContain('esenel.fakritrk.workers.dev');
    const key = process.env.CLOUDFLARE_WORKER_API_KEY;
    delete process.env.CLOUDFLARE_WORKER_API_KEY;
    try {
      await expect(generateWithCloudflare('sebuah buket')).resolves.toBeNull();
    } finally {
      if (key) process.env.CLOUDFLARE_WORKER_API_KEY = key;
    }
  });

  it('posts to the worker with bearer auth and parses a raw image response', async () => {
    const key = process.env.CLOUDFLARE_WORKER_API_KEY;
    process.env.CLOUDFLARE_WORKER_API_KEY = 'test-worker-key';
    const calls = [];
    const origFetch = global.fetch;
    global.fetch = async (url, opts) => {
      calls.push({ url, opts });
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { 'content-type': 'image/png' },
      });
    };
    try {
      const out = await generateWithCloudflare('buket pastel');
      expect(out.contentType).toBe('image/png');
      expect(Buffer.from(out.buffer).length).toBe(4);
      expect(String(calls[0].url)).toContain('esenel.fakritrk.workers.dev');
      expect(calls[0].opts.headers.Authorization).toBe('Bearer test-worker-key');
      expect(calls[0].opts.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(calls[0].opts.body).prompt).toBe('buket pastel');
    } finally {
      global.fetch = origFetch;
      if (key) process.env.CLOUDFLARE_WORKER_API_KEY = key;
      else delete process.env.CLOUDFLARE_WORKER_API_KEY;
    }
  });

  it('parses a JSON base64 response from the worker', async () => {
    const key = process.env.CLOUDFLARE_WORKER_API_KEY;
    process.env.CLOUDFLARE_WORKER_API_KEY = 'test-worker-key';
    const origFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({ data: Buffer.from([1, 2, 3]).toString('base64'), content_type: 'image/jpeg' }),
        { headers: { 'content-type': 'application/json' } }
      );
    try {
      const out = await generateWithCloudflare('buket');
      expect(out.contentType).toBe('image/jpeg');
      expect(Buffer.from(out.buffer)).toEqual(Buffer.from([1, 2, 3]));
    } finally {
      global.fetch = origFetch;
      if (key) process.env.CLOUDFLARE_WORKER_API_KEY = key;
      else delete process.env.CLOUDFLARE_WORKER_API_KEY;
    }
  });

  it('skips the living-being vision check when no Gemini key is set', async () => {
    const key = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(imageHasLivingBeing(Buffer.from('x'))).resolves.toBeNull();
    } finally {
      if (key) process.env.GEMINI_API_KEY = key;
    }
  });
});
