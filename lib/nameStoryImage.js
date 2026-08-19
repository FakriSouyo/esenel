/**
 * Builder gambar buket untuk "buat bunga dari namamu" (/craft/name).
 *
 * Urutan provider (route /api/name-image):
 *   1. Alibaba DashScope (qwen-image-3.0-pro) — provider image generation utama.
 *      Menggunakan DashScope native endpoint untuk image generation.
 *   2. Cloudflare Worker Image Generation (fallback) — POST { prompt } ke
 *      https://esenel.fakritrk.workers.dev/ dengan header
 *      `Authorization: Bearer <CLOUDFLARE_WORKER_API_KEY>`.
 *   3. Fallback pollinations.ai (free, tanpa signup):
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

/** Style suffix untuk buket ESENEL — buket dipegang orang di depan toko.
 * TIDAK melarang manusia karena buket ESENEL asli memang dipegang customer. */
export const ESENEL_STYLE_SUFFIX =
  'Held by a person in front of an elegant flower shop with glass windows and warm interior lighting, ESENEL branding visible, natural afternoon sunlight, lifestyle photography style.';

/** Deskripsi wrapping style ESENEL — kertas wrapping berwarna-warni. */
export const WRAPPING_STYLE =
  'Wrapped in premium colorful matte wrapping paper (deep purple, navy blue, or black) with satin ribbon bow, stems gathered at the base with mesh netting detail.';

/**
 * Pastikan imagePrompt menghasilkan gambar buket yang benar.
 * 
 * OPTIMASI UNTUK QWEN IMAGE 3.0 PRO:
 * - Prompt PENDEK dan FOKUS (maks 300 karakter)
 * - Kata kunci "bouquet" harus ada di awal
 * - Jangan terlalu detail — biarkan model interpretasi
 * - Format: [shape] + [flowers] + [style]
 */
export function enforceImagePrompt(story) {
  if (!story || !Array.isArray(story.bunga)) return story;
  const flowers = story.bunga
    .map((b) => flowerEn(b.namaEn || b.nama))
    .filter(Boolean);
  if (flowers.length === 0) return story;

  // Format bunga: cukup nama saja, tanpa detail berlebihan
  const flowerList = flowers.join(', ');

  // Prompt PENDEK untuk Qwen — fokus pada bentuk bouquet, background outdoor
  story.imagePrompt =
    `A single large hand-tied bouquet of ${flowerList}, wrapped in matte purple and black paper with satin ribbon, held by a person in a beautiful garden with green trees and soft natural daylight. Professional floral photography, sharp focus on petals, photorealistic.`;
  
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

// ─────────────────────────────────────────────────────────────────────────────
// Alibaba Cloud DashScope — provider image generation (qwen-image-3.0-pro)
// Menggunakan ASYNC API: submit task → poll status → fetch image URL.
// Lebih cepat responsenya karena request tidak memblokir sampai gambar jadi.
// ─────────────────────────────────────────────────────────────────────────────

/** Workspace ID Alibaba DashScope. */
export const ALIBABA_WORKSPACE_ID =
  process.env.ALIBABA_WORKSPACE_ID || 'ws-1lzc28wlxlkdkgzm';

/** Endpoint async untuk submit task image generation. */
const alibabaSubmitUrl = () =>
  `https://${process.env.ALIBABA_WORKSPACE_ID || 'ws-1lzc28wlxlkdkgzm'}.ap-southeast-1.maas.aliyuncs.com/api/v1/services/aigc/image-generation/generation`;

/** Endpoint untuk poll status task. */
const alibabaTaskUrl = (taskId) =>
  `https://${process.env.ALIBABA_WORKSPACE_ID || 'ws-1lzc28wlxlkdkgzm'}.ap-southeast-1.maas.aliyuncs.com/api/v1/tasks/${taskId}`;

/** Model Alibaba untuk image generation. */
export const ALIBABA_IMAGE_MODEL_DEFAULT = 'qwen-image-3.0-pro';

/** Poll interval (ms) — mulai dari 3s, naik 1s tiap poll, maks 8s. */
const POLL_INITIAL_MS = 3000;
const POLL_INCREMENT_MS = 1000;
const POLL_MAX_MS = 8000;

/** Sniff content type dari magic bytes. */
function sniffContentType(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  return 'image/png';
}

/**
 * Submit async image generation task ke DashScope.
 * Mengembalikan task_id untuk di-poll.
 */
async function alibabaSubmitTask(prompt, { apiKey, model, referenceImages = [] } = {}) {
  let content = [];

  // Reference images untuk I2I (maks 3)
  if (referenceImages.length > 0) {
    for (const imgUrl of referenceImages.slice(0, 3)) {
      const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${imgUrl}`;
      content.push({ image: fullUrl });
    }
  }
  content.push({ text: String(prompt || 'a bouquet of flowers') });

  const res = await fetch(alibabaSubmitUrl(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model,
      input: { messages: [{ role: 'user', content }] },
      parameters: {
        prompt_extend: false,
        enable_thinking: false,
        size: '1024*1024',
        n: 1,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`submit failed ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const taskId = data?.output?.task_id;
  if (!taskId) throw new Error('no task_id in response');
  return taskId;
}

/**
 * Poll task sampai selesai (SUCCEEDED / FAILED).
 * Mengembalikan image URL atau null.
 */
async function alibabaPollTask(taskId, { apiKey, timeoutMs = 180000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let interval = POLL_INITIAL_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    interval = Math.min(interval + POLL_INCREMENT_MS, POLL_MAX_MS);

    const res = await fetch(alibabaTaskUrl(taskId), {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[name-image] poll ${res.status} — retrying`);
      continue;
    }

    const data = await res.json();
    const status = data?.output?.task_status;

    if (status === 'SUCCEEDED') {
      const imageUrl = data?.output?.choices?.[0]?.message?.content?.[0]?.image;
      if (imageUrl) return imageUrl;
      throw new Error('SUCCEEDED but no image URL');
    }
    if (status === 'FAILED') {
      throw new Error(`task failed: ${JSON.stringify(data.output).slice(0, 200)}`);
    }
    // PENDING / RUNNING → keep polling
  }
  throw new Error('poll timeout');
}

/**
 * Fetch gambar dari URL dan return buffer + contentType.
 */
async function fetchImageBuffer(imageUrl, { timeoutMs = 60000 } = {}) {
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(timeoutMs) });
  if (!imgRes.ok) throw new Error(`fetch image ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  return { buffer: buf, contentType: sniffContentType(buf) };
}

/**
 * Generate gambar via Alibaba Cloud DashScope ASYNC API (qwen-image-3.0-pro).
 *
 * Flow: submit task → poll status → fetch image → download buffer.
 * Lebih cepat daripada sync karena request submit langsung return task_id.
 *
 * @param {string} prompt prompt foto katalog (dari story.imagePrompt)
 * @param {{ timeoutMs?: number, referenceImages?: string[] }} [opts]
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 */
export async function generateWithAlibaba(prompt, { timeoutMs = 180000, referenceImages = [] } = {}) {
  const apiKey = process.env.ALIBABA_API_KEY;
  if (!apiKey) return null;

  const model = process.env.ALIBABA_IMAGE_MODEL || ALIBABA_IMAGE_MODEL_DEFAULT;
  const startTime = Date.now();

  try {
    // 1) Submit async task
    console.log(`[name-image] Alibaba: submitting task (model=${model})`);
    const taskId = await alibabaSubmitTask(prompt, { apiKey, model, referenceImages });
    console.log(`[name-image] Alibaba: task submitted (${taskId}) — polling...`);

    // 2) Poll sampai selesai
    const imageUrl = await alibabaPollTask(taskId, { apiKey, timeoutMs });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[name-image] Alibaba: image ready (${elapsed}s)`);

    // 3) Download gambar
    const result = await fetchImageBuffer(imageUrl, { timeoutMs: 60000 });
    console.log(`[name-image] Alibaba: downloaded ${result.buffer.length} bytes (${result.contentType})`);

    return result;
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const reason = String(err?.message || err).slice(0, 300);
    console.error(`[name-image] Alibaba gagal (${elapsed}s): ${reason}`);
    return null;
  }
}
