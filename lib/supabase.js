/**
 * Minimal Supabase/PostgREST client — thin fetch wrapper, no extra
 * dependency. The anon key is public by design (meant for browsers);
 * RLS on the server decides what anonymous callers may do.
 *
 * Env (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL      https://<project-ref>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY anon key from `supabase projects api-keys`
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Map a local asset path to its Supabase Storage public URL.
 *
 *   /katalog_esenel/<Folder>/<file>.webp -> {url}/storage/v1/object/public/katalog/<Folder>/<file>.webp
 *   /flowers/<flower>/<pose>.webp        -> {url}/storage/v1/object/public/craft/<flower>/<pose>.webp
 *
 * Falls back to the local path when the Supabase env isn't set (e.g. tests,
 * or a build without .env.local) so nothing breaks without the backend.
 */
export function storageUrl(path) {
  if (!SUPABASE_URL || typeof path !== 'string') return path;
  let bucket;
  if (path.startsWith('/katalog_esenel/')) bucket = 'katalog';
  else if (path.startsWith('/flowers/')) bucket = 'craft';
  else return path;
  const key = path.split('/').slice(2).join('/');
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encoded}`;
}

/** Public storage URL for a bucket + key (no auth needed; bucket is public). */
export function storagePublicUrl(bucket, key) {
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${key}`;
}

/**
 * fetch helper against /rest/v1/<path>.
 * @param {string} path e.g. '/newsletter_subscribers?on_conflict=email'
 * @param {{method?: string, body?: object, prefer?: string, headers?: Record<string,string>}} opts
 */
export async function supabaseFetch(path, { method = 'GET', body, prefer, headers = {} } = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase env — copy .env.example to .env.local and fill in the URL + anon key.'
    );
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const json = await res.json();
      detail = json.message || json.details || json.hint || '';
    } catch {
      // not JSON
    }
    throw new Error(`Supabase ${res.status}: ${detail || res.statusText}`);
  }
  return res;
}

/**
 * Subscribe an email. RLS only grants anonymous INSERT (no UPDATE), so
 * upserts via on_conflict are not allowed — we insert plainly and treat
 * the unique-email 409 (23505) as "already subscribed", i.e. success.
 */
export async function subscribeNewsletter(email) {
  try {
    await supabaseFetch('/newsletter_subscribers', {
      method: 'POST',
      body: { email },
      prefer: 'return=minimal',
    });
  } catch (err) {
    if (err.message.includes('23505') || err.message.includes('duplicate key')) {
      return; // already on the list — no-op success
    }
    throw err;
  }
}

/**
 * Upload a payment-proof screenshot to the public `payments` bucket and
 * return its public URL (uuid key — unguessable). Used by checkout so the
 * proof can ride along inside the WhatsApp order message.
 */
export async function uploadPaymentProof(file) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase env — copy .env.example to .env.local.');
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `${crypto.randomUUID()}.${ext}`;
  // No x-upsert on purpose: it needs a SELECT policy (anon has none here),
  // and uuid keys never collide anyway.
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/payments/${key}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type || 'image/jpeg',
    },
    body: file,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const json = await res.json();
      detail = json.message || json.details || '';
    } catch {
      // not JSON
    }
    throw new Error(`Supabase upload ${res.status}: ${detail || res.statusText}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/payments/${key}`;
}

/**
 * ---- "Buat bunga dari namamu" (craft/name) cache helpers ----
 * name_stories: story DeepSeek per nama (kunci = normalizeName),
 * name-bouquets: gambar buket hasil generate, kunci <nameKey>.jpg.
 */

/** Ambil story yang sudah di-cache untuk sebuah nama (atau null). */
export async function getCachedNameStory(nameKey) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const res = await supabaseFetch(
    `/name_stories?name_key=eq.${encodeURIComponent(nameKey)}&select=name,story&limit=1`
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] && rows[0].story ? rows[0] : null;
}

/**
 * Simpan story ke cache. Kalau nama sudah ada dengan story VALID, biarkan
 * yang lama (cache-hit path tidak pernah sampai ke sini). Tapi kalau row
 * ada dengan story kosong/rusak (mis. dibersihkan untuk memaksa regenerasi),
 * merge-duplicates menimpa dengan story baru — kalau pakai ignore-duplicates,
 * nama itu tidak akan pernah ter-cache lagi.
 */
export async function saveNameStoryCache(nameKey, name, story) {
  await supabaseFetch('/name_stories?on_conflict=name_key', {
    method: 'POST',
    body: { name_key: nameKey, name, story },
    prefer: 'resolution=merge-duplicates',
  });
}

/**
 * Upload gambar buket hasil generate ke bucket name-bouquets dengan kunci
 * deterministik <nameKey>.<ext> (ekstensi ikut content-type: png/jpg).
 * x-upsert supaya nama yang sama bisa menimpa gambar lama (bucket punya
 * policy select+insert+update).
 */
export async function uploadNameImage(nameKey, body, contentType = 'image/jpeg') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase env — copy .env.example to .env.local.');
  }
  const ext = String(contentType).includes('png') ? 'png' : 'jpg';
  const key = `${nameKey}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/name-bouquets/${key}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const json = await res.json();
      detail = json.message || json.details || '';
    } catch {
      // not JSON
    }
    throw new Error(`Supabase upload ${res.status}: ${detail || res.statusText}`);
  }
  return storagePublicUrl('name-bouquets', key);
}

/**
 * Cari gambar buket yang sudah pernah di-generate untuk sebuah nama.
 * Cek .jpg dulu (legacy era pollinations), lalu .png (Gemini). Kembalikan
 * URL publik yang bisa di-HEAD, atau null kalau belum ada sama sekali.
 */
export async function findNameImage(nameKey) {
  if (!SUPABASE_URL) return null;
  for (const ext of ['jpg', 'png']) {
    const url = storagePublicUrl('name-bouquets', `${nameKey}.${ext}`);
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head.ok) return url;
    } catch {
      // coba ekstensi berikutnya
    }
  }
  return null;
}

/**
 * Place an order via the place_order RPC. RLS blocks anon reads of
 * orders (and PostgREST can't return the inserted row), so a SECURITY
 * DEFINER function inserts as the owner and returns just the number
 * (e.g. ES-000042).
 */
export async function createOrder(order) {
  const res = await supabaseFetch('/rpc/place_order', {
    method: 'POST',
    body: {
      p_customer_name: order.customer_name,
      p_customer_email: order.customer_email,
      p_customer_phone: order.customer_phone ?? null,
      p_shipping_address: order.shipping_address ?? {},
      p_note: order.note ?? null,
      p_subtotal: order.subtotal ?? 0,
      p_shipping: order.shipping ?? 0,
      p_total: order.total ?? 0,
      p_items: order.items ?? [],
    },
  });
  const data = await res.json();
  return typeof data === 'string' ? data : null;
}
