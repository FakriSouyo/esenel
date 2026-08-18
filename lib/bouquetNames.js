/**
 * Nama buket puitis untuk "buat bunga dari namamu" (/craft/name).
 *
 * Aturan pemilik ESENEL:
 *  - TIDAK boleh sama dengan nama katalog (Alba, Bali, Colmar, ...) — daftar
 *    katalog hanya jadi referensi NADA penamaan, bukan sumber nama.
 *  - TIDAK boleh memakai nama input (atau bagian kata dari nama input).
 *  - Unik, puitis, estetik, sastra; boleh bernuansa Old English, Jepang,
 *    atau Jawa.
 *  - WAJIB SATU KATA.
 *  - DUA nama berbeda TIDAK boleh mendapat nama buket yang sama — karena itu
 *    pickBouquetName menyusun nama dari 3 suku kata deterministik (65³ ≈
 *    274.000 kombinasi), jauh melampaui kolam, sehingga duplikat praktis
 *    mustahil.
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
  'Ravenshade',
  'Fennore',
  'Eldwren',
  'Hearthlyn',
  // Jepang — satu kata, tenang, berlapis makna
  'Yūgen',
  'Tsukiyo',
  'Hazakura',
  'Amanogawa',
  'Shizukaze',
  'Kagerō',
  'Hikaribana',
  'Mizutama',
  'Uzushio',
  'Komorebi',
  'Akatsuki',
  'Yūrakuchō',
  // Jawa — bunga, bulan, cahaya, keharuman
  'Kusuma',
  'Sekar',
  'Wulan',
  'Larasati',
  'Puspita',
  'Aruming',
  'Cahyaning',
  'Raras',
  'Tunjung',
  'Rengganis',
  'Dyah',
  'Widuri',
  // puitis universal
  'Serein',
  'Vespera',
  'Nimue',
  'Larkspur',
  'Aurelle',
  'Meadowlark',
  'Celestine',
  'Briarwen',
  'Solstice',
  'Everglen',
  'Lunaria',
  'Ambrose',
];

/** Suku kata pilihan — bunyi Indonesia/Jepang yang lembut & puitis, untuk
 *  kata kedua nama buket (deterministik per nama, ruang 65² ≈ 4.225). */
const SYLLABLES = [
  'ka', 'ki', 'ku', 'ke', 'ko',
  'sa', 'shi', 'su', 'se', 'so',
  'na', 'ni', 'nu', 'ne', 'no',
  'ha', 'hi', 'fu', 'he', 'ho',
  'ma', 'mi', 'mu', 'me', 'mo',
  'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro',
  'wa', 'ta', 'chi', 'tsu', 'te', 'to',
  'za', 'ji', 'zu', 'ze', 'zo',
  'da', 'di', 'du', 'de', 'do',
  'ba', 'bi', 'bu', 'be', 'bo',
  'pa', 'pi', 'pu', 'pe', 'po',
  'ga', 'gi', 'gu', 'ge', 'go',
  'la', 'li', 'lu', 'le', 'lo',
];

/**
 * Pilih nama buket secara deterministik dari seed: SATU KATA yang tersusun
 * dari 3 suku kata pilihan (65³ ≈ 274.000 kombinasi) yang dipilih lewat tiga
 * hash berbeda. Nama selalu 1 kata (sesuai aturan penamaan ESENEL), dan dua
 * nama input berbeda praktis mustahil mendapat nama buket yang sama. Kata
 * yang dilarang (case/aksen-insensitive) dilewati.
 */
export function pickBouquetName(seedStr, { exclude = [] } = {}) {
  const excluded = new Set(
    (exclude || []).filter(Boolean).map((s) => normalizeName(s))
  );
  const s = String(seedStr || '');
  let h1 = 0;
  let h2 = 5381;
  let h3 = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 31 + c) >>> 0;
    h2 = (h2 * 33 + c) >>> 0;
    h3 = ((h3 ^ c) * 0x01000193) >>> 0;
  }
  const syl = SYLLABLES.length;
  const badWord = (w) => excluded.has(normalizeName(w));
  for (let i = 0; i < syl * 4; i++) {
    const raw =
      SYLLABLES[(h2 + i * 13) % syl] +
      SYLLABLES[(h3 + i * 29) % syl] +
      SYLLABLES[(h1 + i * 7) % syl];
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (!badWord(name)) return name;
  }
  const fallback =
    SYLLABLES[h1 % syl] + SYLLABLES[h2 % syl] + SYLLABLES[h3 % syl];
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

/**
 * Jaring pengaman nama buket: kalau AI/dummy memberi nama yang sama dengan
 * nama katalog, sama persis dengan nama input, sama dengan salah satu kata
 * nama input (>=3 huruf), ATAU memakai ulang nama dari kolam fallback
 * (BOUQUET_NAMES — kolam kecil, AI suka memakai ulang sehingga dua nama
 * berbeda bisa kebagian nama buket sama), ganti dengan nama puitis
 * deterministik dari seed. Dipanggil di route /api/name-story untuk story
 * baru ATAU yang di-cache.
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
  // ATAU memakai ulang nama dari kolam fallback (mis. AI memberi "Kusuma"
  // untuk dua nama berbeda) → diganti supaya tiap orang dapat nama unik.
  const poolNorm = new Set(BOUQUET_NAMES.map(normalizeName));
  const usesPoolName = candidateWords.some((cw) => poolNorm.has(cw));
  if (
    forbidden.has(normCurrent) ||
    containsInputWord ||
    derivesFromInput ||
    usesPoolName
  ) {
    // exclude TANPA kolam — pickBouquetName justru memilih DARI kolam.
    story.namaBuket = pickBouquetName(inputName || current, {
      exclude: [...forbidden, normCurrent].filter(Boolean),
    });
  }
  return story;
}
