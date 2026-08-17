import { describe, expect, it } from 'vitest';
import {
  NAME_STORY_SYSTEM_PROMPT,
  buildNamePrompt,
  parseStoryResponse,
} from '@/lib/nameStoryPrompt';
import { getDummyStory } from '@/lib/nameStoryDummy';
import {
  buildNameImageUrl,
  CLOUDFLARE_WORKER_ENDPOINT,
  enforceImagePrompt,
  flowerEn,
  generateWithCloudflare,
  generateWithGemini,
  GEMINI_IMAGE_MODEL_DEFAULT,
  imageHasLivingBeing,
  NO_LIVING_BEINGS_SUFFIX,
  seedFromKey,
} from '@/lib/nameStoryImage';

describe('buildNamePrompt', () => {
  it('embeds the name and demands JSON-only output', () => {
    const prompt = buildNamePrompt('Carin');
    expect(prompt).toContain('Carin');
    expect(prompt.toLowerCase()).toContain('nama');
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
    for (const key of ['artiNama', 'maknaNama', 'cerita', 'bunga', 'imagePrompt', 'namaBuket']) {
      expect(NAME_STORY_SYSTEM_PROMPT).toContain(key);
    }
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
      bunga: [{ nama: 'Anthurium', alasan: 'tulus' }],
      imagePrompt: 'prompt',
    });
    const story = parseStoryResponse(raw);
    expect(story.artiNama).toBe('Arti');
    expect(story.namaBuket).toBe('Colmar');
    expect(story.bunga).toHaveLength(1);
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
    // gaya bicara: menyapa "kamu", bukan menyebut dari luar
    expect(story.maknaNama).toContain('Kamu');
    expect(story.maknaNama).not.toMatch(/orang dengan nama/);
    expect(story.artiNama).not.toMatch(/[-–—]/);
    expect(story.maknaNama).not.toMatch(/[-–—]/);
    // imagePrompt bergaya foto katalog
    expect(story.imagePrompt.toLowerCase()).toContain('catalog');
  });

  it('picks the bouquet name deterministically from the catalog list', () => {
    const names = ['Alba', 'Bali', 'Colmar'];
    expect(getDummyStory('Carin', names).namaBuket).toBe(getDummyStory('Carin', names).namaBuket);
    expect(names).toContain(getDummyStory('Carin', names).namaBuket);
    expect(getDummyStory('Carin', names).namaBuket).not.toBe('Annecy'); // di luar daftar
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
    expect(story.imagePrompt).toContain('ALL of these flower varieties');
    expect(story.imagePrompt).toContain('deep red roses');
    expect(story.imagePrompt).toContain('purple lavender sprigs');
    expect(story.imagePrompt).toContain('tulips'); // fallback terjemahan dari nama
    expect(story.imagePrompt).not.toContain('Mawar'); // jangan nama Indonesia mentah
  });

  it('always forbids people and living creatures in the image prompt', () => {
    const story = { imagePrompt: 'A bouquet.', bunga: [{ nama: 'Mawar Merah', namaEn: 'deep red roses' }] };
    enforceImagePrompt(story);
    expect(story.imagePrompt).toContain(NO_LIVING_BEINGS_SUFFIX);
    expect(story.imagePrompt).toMatch(/no people, no human hands/i);
    expect(story.imagePrompt).toMatch(/no animals, no insects/i);
    expect(story.imagePrompt).toMatch(/NOT held by anyone/i);
  });

  it('locks the composition as still life on a surface so the bouquet is not held', () => {
    const story = { imagePrompt: 'A bouquet.', bunga: [{ nama: 'Lavender', namaEn: 'purple lavender sprigs' }] };
    enforceImagePrompt(story);
    expect(story.imagePrompt).toMatch(/^Still life product photograph/i);
    expect(story.imagePrompt).toMatch(/standing upright alone on a plain wooden table/i);
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
