/**
 * Nama buket puitis untuk "buat bunga dari namamu" (/craft/name).
 *
 * Aturan pemilik ESENEL:
 *  - TIDAK boleh sama dengan nama katalog (Alba, Bali, Colmar, ...) — daftar
 *    katalog hanya jadi referensi NADA penamaan, bukan sumber nama.
 *  - TIDAK boleh memakai nama input (atau bagian kata dari nama input).
 *  - Unik, puitis, estetik, sastra; boleh bernuansa Old English, Jepang,
 *    atau Jawa.
 *  - Pilihan deterministik dari seed (nama) supaya nama yang sama selalu
 *    dapat nama buket yang sama (cocok dengan cache Supabase).
 */
import { normalizeName } from '@/lib/nameNormalize';

export const BOUQUET_NAMES = [
  // Old English / sastra — pendek, hangat, berkesan
  'Wynmere',
  'Morrowvale',
  'Hallowmere',
  'Wistmere',
  'Emberlyn',
  'Thornhaven',
  'Alderwake',
  'Mistholm',
  // Jepang — satu kata, tenang, berlapis makna
  'Yūgen',
  'Tsukiyo',
  'Hazakura',
  'Amanogawa',
  'Shizukaze',
  'Kagerō',
  'Hikaribana',
  'Mizutama',
  // Jawa — bunga, bulan, cahaya, keharuman
  'Kusuma',
  'Sekar Arum',
  'Wulan',
  'Larasati',
  'Puspita',
  'Aruming',
  'Cahyaning',
  'Raras',
  // puitis universal
  'Serein',
  'Vespera',
  'Nimue',
  'Larkspur',
  'Aurelle',
  'Meadowlark',
];

/**
 * Pilih nama buket secara deterministik dari seed, melewati nama yang
 * dilarang (case/aksen-insensitive lewat normalizeName).
 */
export function pickBouquetName(seedStr, { exclude = [] } = {}) {
  const excluded = new Set(
    (exclude || []).filter(Boolean).map((s) => normalizeName(s))
  );
  const s = String(seedStr || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  for (let i = 0; i < BOUQUET_NAMES.length; i++) {
    const cand = BOUQUET_NAMES[(h + i) % BOUQUET_NAMES.length];
    if (!excluded.has(normalizeName(cand))) return cand;
  }
  return BOUQUET_NAMES[h % BOUQUET_NAMES.length];
}

/**
 * Jaring pengaman nama buket: kalau AI/dummy memberi nama yang sama dengan
 * nama katalog, sama persis dengan nama input, atau sama dengan salah satu
 * kata nama input (>=3 huruf), ganti dengan nama puitis deterministik.
 * Dipanggil di route /api/name-story untuk story baru ATAU yang di-cache.
 */
export function ensureUniqueBouquetName(story, inputName, catalogNames = []) {
  if (!story) return story;
  const current = String(story.namaBuket || '');
  const normCurrent = normalizeName(current);
  const inputWords = String(inputName || '')
    .split(/\s+/)
    .map(normalizeName)
    .filter((w) => w.length >= 3);
  const forbidden = new Set(
    [
      ...(catalogNames || []).map(normalizeName),
      ...inputWords,
      ...(inputName ? [normalizeName(inputName)] : []),
    ].filter(Boolean)
  );
  // Terlarang kalau: sama persis dengan katalog/input/kata input, ATAU
  // mengandung kata input (>=4 huruf) sebagai bagian dari namanya —
  // mis. input "Ratrika" dan AI memberi "Ratrika Bloom" → tetap diganti.
  const containsInputWord = inputWords.some(
    (w) => w.length >= 4 && normCurrent.includes(w)
  );
  // ATAU kata nama buket menurun dari kata input lewat awalan yang sama
  // (kontraksi): input "Ratrika" dan AI memberi "Ratrī Kusuma" → diganti.
  const candidateWords = String(current)
    .split(/\s+/)
    .map(normalizeName)
    .filter((w) => w.length >= 4);
  const derivesFromInput = candidateWords.some((cw) =>
    inputWords.some(
      (iw) => iw.length >= 4 && (cw.startsWith(iw) || iw.startsWith(cw))
    )
  );
  if (forbidden.has(normCurrent) || containsInputWord || derivesFromInput) {
    story.namaBuket = pickBouquetName(inputName || current, {
      exclude: [...forbidden, current],
    });
  }
  return story;
}
