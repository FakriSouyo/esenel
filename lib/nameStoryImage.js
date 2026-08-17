/**
 * Builder gambar buket untuk "buat bunga dari namamu" (/craft/name).
 *
 * Urutan provider (route /api/name-image):
 *   1. Cloudflare Worker Image Generation (UTAMA) — POST { prompt } ke
 *      https://esenel.fakritrk.workers.dev/ dengan header
 *      `Authorization: Bearer <CLOUDFLARE_WORKER_API_KEY>`. Worker user punya
 *      sendiri — di sini hanya klien yang memanggilnya (server-side).
 *   2. Fallback pollinations.ai (free, tanpa signup):
 *        GET https://image.pollinations.ai/prompt/{prompt}?seed=&model=flux
 *
 * Gemini TIDAK dipakai untuk generate gambar (kuota gambar free tier sering
 * 0) — perannya sekarang text-only: verifikasi anti-makhluk-hidup atas hasil
 * pollinations (imageHasLivingBeing) lewat model teks-gambar.
 *
 * Seed diturunkan dari kunci nama (normalizeName) supaya nama yang sama
 * selalu menghasilkan gambar yang sama — cocok dengan cache Supabase yang
 * juga berkunci nama.
 */

// pollinations: 'sana' lebih variatif TAPI bandel menambahkan orang/model yang
// memegang buket. 'flux' + prompt semua-bunga (enforceImagePrompt) justru
// menghasilkan variasi bunga + TANPA manusia — kombinasi yang dipakai.
export const NAME_IMAGE_MODEL = 'flux';
export const NAME_IMAGE_SIZE = { width: 1024, height: 1024 };

/** Model gambar Gemini — bisa di-override lewat env GEMINI_IMAGE_MODEL. */
export const GEMINI_IMAGE_MODEL_DEFAULT = 'gemini-3.1-flash-image';

/** Endpoint Cloudflare Worker — bisa di-override lewat env CLOUDFLARE_WORKER_ENDPOINT. */
export const CLOUDFLARE_WORKER_ENDPOINT =
  process.env.CLOUDFLARE_WORKER_ENDPOINT || 'https://esenel.fakritrk.workers.dev/';

/** Seed deterministik 0..99999 dari string (kunci nama). */
export function seedFromKey(key) {
  let h = 0;
  const s = String(key || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}

/** Bangun URL pollinations untuk prompt + seed. Prompt di-encode penuh. */
export function buildNameImageUrl(prompt, seed, { width, height } = {}) {
  const w = width || NAME_IMAGE_SIZE.width;
  const h = height || NAME_IMAGE_SIZE.height;
  const params = new URLSearchParams({
    width: String(w),
    height: String(h),
    seed: String(seed == null ? seedFromKey('') : seed),
    nologo: 'true',
    model: NAME_IMAGE_MODEL,
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    String(prompt || 'a bouquet of flowers')
  )}?${params.toString()}`;
}

const FLOWER_EN_NAMES = {
  mawar: 'red roses',
  matahari: 'sunflowers',
  lavender: 'lavender sprigs',
  tulip: 'tulips',
  peony: 'peonies',
  iris: 'irises',
  eustoma: 'eustoma',
  lisianthus: 'lisianthus',
  anthurium: 'anthurium',
  gypsophila: 'gypsophila baby breath',
  'baby breath': 'gypsophila baby breath',
  'dusty miller': 'silvery dusty miller',
  anggrek: 'orchids',
  melati: 'jasmine',
  lily: 'lilies',
  lili: 'lilies',
  krisan: 'chrysanthemums',
  anyelir: 'carnations',
  gerbera: 'gerbera daisies',
  hydrangea: 'hydrangeas',
  ranunculus: 'ranunculus',
  dahlia: 'dahlias',
  aster: 'asters',
  protea: 'protea',
  amarilis: 'amaryllis',
  eucalyptus: 'eucalyptus',
  'bunga matahari': 'golden sunflowers',
  'mawar merah': 'deep red roses',
  'mawar putih': 'white roses',
  'mawar pink': 'pink roses',
};

/** Terjemahan sederhana nama bunga (ID → EN); nama asing dibiarkan. */
export function flowerEn(nama) {
  const key = String(nama || '').trim().toLowerCase();
  if (FLOWER_EN_NAMES[key]) return FLOWER_EN_NAMES[key];
  // cocokkan kata pertama untuk "Tulip putih" → tulips, dst.
  const first = key.split(/\s+/)[0];
  return FLOWER_EN_NAMES[first] || String(nama || '').trim();
}

/** Kalimat penutup yang WAJIB ada di tiap imagePrompt: hanya buket, tanpa
 *  manusia / tangan / makhluk hidup. Generator gambar suka menambahkan orang
 *  atau model memegang buket kalau tidak dikunci komposisinya. */
export const NO_LIVING_BEINGS_SUFFIX =
  'The bouquet is NOT held by anyone and no living being appears in the frame: no people, no human hands, no arms, no models, no animals, no insects, no pets.';

/**
 * Pastikan imagePrompt: (1) menyebut SEMUA bunga dari daftar kecocokan satu
 * per satu dalam Bahasa Inggris (biar tidak monoton), dan (2) dikunci sebagai
 * foto STILL LIFE — buket berdiri sendiri di atas permukaan netral, bukan
 * dipegang orang. Dua-duanya teruji: prompt "bouquet photo" saja sering
 * memunculkan model/orang, sedangkan framing still life konsisten bebas
 * manusia. Dipakai di route untuk story baru ATAU yang sudah di-cache.
 */
export function enforceImagePrompt(story) {
  if (!story || !Array.isArray(story.bunga)) return story;
  const flowers = story.bunga
    .map((b) => flowerEn(b.namaEn || b.nama))
    .filter(Boolean);
  if (flowers.length === 0) return story;
  // Dibangun deterministik & kompak, still-life DI DEPAN. Teruji: prompt
  // pendek yang mengunci komposisi "buket berdiri di atas meja" jauh lebih
  // jarang memunculkan orang daripada prompt panjang bergaya "catalog photo"
  // yang justru mengundang model memegang buket.
  story.imagePrompt =
    `Still life product photograph: a bouquet standing upright alone on a plain wooden table against a warm beige wall, wrapped in kraft paper. ` +
    `The bouquet clearly shows ALL of these flower varieties, each with a distinct color and shape: ${flowers.join(', ')}. ` +
    NO_LIVING_BEINGS_SUFFIX;
  return story;
}

/**
 * Cek apakah gambar berisi manusia / tangan / makhluk hidup, pakai Gemini
 * vision (model teks-gambar; key sama dengan GEMINI_API_KEY — kuota gambar
 * generate bisa 0, tapi kuota vision/teks tetap jalan).
 *
 * @returns {boolean|null} true = ada makhluk hidup, false = bersih,
 *   null = pemeriksaan tidak tersedia (tanpa key / gagal) → panggil harus
 *   menerima gambar apa adanya (best effort).
 */
export async function imageHasLivingBeing(buffer, contentType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch {
    return null;
  }
  const model = process.env.GEMINI_VISION_MODEL || 'gemini-flash-latest';
  const ai = new GoogleGenAI({ apiKey });
  // Gemini kadang 503/429 sesaat ("high demand") — ulangi check beberapa kali
  // dengan jeda singkat sebelum menyerah, supaya gambar tidak lolos begitu
  // saja tanpa terverifikasi.
  for (let check = 0; check < 3; check++) {
    try {
      const r = await Promise.race([
        ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Does this image contain any human person, human hands, animal, insect, or other living creature? Reply with exactly YES or NO.',
                },
                {
                  inlineData: {
                    mimeType: contentType,
                    data: Buffer.from(buffer).toString('base64'),
                  },
                },
              ],
            },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('vision timeout')), 25000)),
      ]);
      const text = String(r?.text || '').trim().toUpperCase();
      if (text.startsWith('YES')) return true;
      if (text.startsWith('NO')) return false;
      return null; // jawaban tidak jelas — serahkan ke pengambil keputusan
    } catch (err) {
      const reason = String(err?.message || err).replace(/AIza[\w-]+/g, '[key]');
      console.error(`[name-image] cek makhluk hidup gagal (${check + 1}/3): ${reason.slice(0, 160)}`);
      if (check < 2) await new Promise((r) => setTimeout(r, 1500 * (check + 1)));
    }
  }
  return null;
}

/**
 * Generate gambar via Gemini Interactions API.
 *
 * CATATAN: tidak dipakai lagi di rantai /api/name-image (Cloudflare →
 * pollinations). Dipertahankan + di-tes sebagai cadangan kalau nanti mau
 * diaktifkan lagi, mis. saat akun punya kuota gambar.
 *
 * @param {string} prompt prompt foto katalog (dari story.imagePrompt)
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 *   null kalau tidak ada GEMINI_API_KEY, gagal, timeout, atau model tidak
 *   mengembalikan gambar.
 */
export async function generateWithGemini(prompt, { timeoutMs = 150000 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch {
    return null; // paket tidak terpasang — biarkan fallback pollinations
  }

  const model = process.env.GEMINI_IMAGE_MODEL || GEMINI_IMAGE_MODEL_DEFAULT;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await Promise.race([
      ai.interactions.create({ model, input: String(prompt || 'a bouquet of flowers') }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('gemini timeout')), timeoutMs)
      ),
    ]);
    const img = interaction?.output_image;
    if (!img?.data) return null;
    return {
      buffer: Buffer.from(img.data, 'base64'),
      contentType: img.mime_type || 'image/png',
    };
  } catch (err) {
    // Alasan kegagalan Gemini dicatat di server log (tanpa bocorkan key) —
    // mis. 429 quota, model tidak tersedia, dll. Fallback pollinations tetap jalan.
    const reason = String(err?.message || err).replace(/AIza[\w-]+/g, '[key]');
    console.error(`[name-image] Gemini ${model} gagal: ${reason.slice(0, 300)}`);
    return null;
  }
}

/**
 * Generate gambar via Cloudflare Worker Image Generation (provider UTAMA).
 *
 * Endpoint milik user sendiri: POST { prompt } ke CLOUDFLARE_WORKER_ENDPOINT
 * dengan header `Authorization: Bearer <CLOUDFLARE_WORKER_API_KEY>`.
 * Key hanya dibaca di server (env biasa, tanpa NEXT_PUBLIC_) — tidak pernah
 * bocor ke browser.
 *
 * Respon yang didukung:
 *   - body image langsung (content-type image/*)  → dipakai apa adanya
 *   - JSON { data | image | base64 | url, content_type? } → base64 (boleh data
 *     URI) atau URL gambar yang di-fetch ulang.
 *
 * @param {string} prompt prompt foto katalog (dari story.imagePrompt)
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 *   null kalau CLOUDFLARE_WORKER_API_KEY kosong, gagal, timeout, atau respon
 *   tidak bisa dibaca → panggil harus lanjut ke provider berikutnya.
 */
export async function generateWithCloudflare(prompt, { timeoutMs = 120000 } = {}) {
  const apiKey = process.env.CLOUDFLARE_WORKER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(CLOUDFLARE_WORKER_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: String(prompt || 'a bouquet of flowers') }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.error(`[name-image] Cloudflare Worker ${res.status}: ${(res.statusText || '').slice(0, 160)}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (contentType.startsWith('image/')) {
      // Sniff magic bytes: worker mengirim content-type image/jpeg tapi bytes
      // PNG — normalisasi supaya ekstensi + content-type di Storage benar.
      const sniffed =
        buf.length >= 8 &&
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
          ? 'image/png'
          : buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
            ? 'image/jpeg'
            : contentType;
      return { buffer: buf, contentType: sniffed };
    }

    // Bukan gambar langsung — coba JSON (base64 / data URI / URL gambar).
    let json = null;
    try {
      json = JSON.parse(buf.toString('utf8'));
    } catch {
      // bukan JSON juga — gagal
    }
    if (json) {
      const raw = json.data ?? json.image ?? json.base64 ?? json.output ?? json.url;
      if (typeof raw === 'string') {
        if (raw.startsWith('http')) {
          const img = await fetch(raw, { signal: AbortSignal.timeout(timeoutMs) });
          if (img.ok) {
            return {
              buffer: Buffer.from(await img.arrayBuffer()),
              contentType: img.headers.get('content-type') || 'image/png',
            };
          }
        } else {
          const b64 = raw.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          return {
            buffer: Buffer.from(b64, 'base64'),
            contentType: json.content_type || json.mime_type || 'image/png',
          };
        }
      }
    }
    console.error('[name-image] Cloudflare Worker: respon tidak dikenali (bukan image/* atau JSON base64/url)');
    return null;
  } catch (err) {
    // Key tidak pernah dicatat; pesan error fetch tidak mengandung header auth.
    const reason = String(err?.message || err).slice(0, 300);
    console.error(`[name-image] Cloudflare Worker gagal: ${reason}`);
    return null;
  }
}
