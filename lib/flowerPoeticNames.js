/**
 * Nama puitis 1 kata untuk tiap bunga di daftar kecocokan (/craft/name).
 *
 * Aturan pemilik ESENEL (Agent "Flower Naming Agent"):
 *  - SATU kata, indah dan bermakna, lahir dari MAKNA bunga itu sendiri
 *    (arti nama, simbolisme, karakter, filosofi) — bukan sekadar kata
 *    asing yang terdengar bagus.
 *  - Berasal dari 5 bahasa: Arab, Inggris, Sanskerta, Nordik (Old Norse),
 *    dan Jepang.
 *  - Bukan nama orang, bukan terjemahan literal yang biasa, tanpa
 *    konotasi negatif, elegan, puitis, unik, memorable.
 *
 * Modul ini adalah JARING PENGAMAN deterministik: DeepSeek yang memberi
 * nama puitis di story (kolom namaPuitis), tapi kalau AI tidak memberi,
 * memberi kata majemuk, atau memberi nama bunga itu sendiri, kamus ini
 * yang mengisi — supaya tiap bunga SELALU punya nama puitis 1 kata.
 * Pilihan deterministik: bunga yang sama selalu dapat nama yang sama
 * (konsisten lintas story & user).
 */
import { normalizeFlowerName } from '@/lib/flowerPrices';

/**
 * Kamus bunga umum pasar Indonesia → nama puitis 1 kata. `arti` hanya
 * dokumentasi (tidak pernah tampil ke user) supaya pemilihan terjaga
 * maknanya. Alias memakai pola yang sama dengan FLOWER_PRICE_DATA
 * (ID + EN), dicocokkan lewat normalizeFlowerName.
 */
export const POETIC_DICTIONARY = [
  { namaPuitis: 'Prema', arti: 'cinta (Sanskerta) — mawar', alias: ['mawar', 'rose', 'mawar merah', 'mawar putih', 'mawar pink', 'mawar import', 'red rose', 'white rose', 'pink rose', 'ecuador rose', 'long stem rose'] },
  { namaPuitis: 'Ananga', arti: 'asmara yang tak berwujud (Sanskerta) — tulip, cinta sempurna', alias: ['tulip', 'tulips', 'tulip putih', 'tulip pink', 'tulip merah', 'tulip kuning', 'white tulip'] },
  { namaPuitis: 'Botan', arti: 'raja bunga, kemakmuran (Jepang) — peony', alias: ['peony', 'peonies', 'peony import'] },
  { namaPuitis: 'Niji', arti: 'pelangi (Jepang) — iris, bunga pembawa pesan', alias: ['iris', 'irises', 'bunga iris', 'iris import'] },
  { namaPuitis: 'Tejas', arti: 'keberanian yang menyala (Sanskerta) — protea', alias: ['protea', 'proteas', 'protea king', 'bunga protea'] },
  { namaPuitis: 'Hikari', arti: 'cahaya yang berkilau (Jepang) — ranunculus', alias: ['ranunculus', 'bunga ranunculus'] },
  { namaPuitis: 'Kaze', arti: 'angin (Jepang) — anemone, bunga yang lahir dari angin', alias: ['anemone', 'bunga anemone'] },
  { namaPuitis: 'Sora', arti: 'langit (Jepang) — delphinium biru langit', alias: ['delphinium', 'delphiniums', 'bunga delphinium'] },
  { namaPuitis: 'Skylark', arti: 'burung yang terbang tinggi (Inggris) — larkspur', alias: ['larkspur', 'larkspurs'] },
  { namaPuitis: 'Itr', arti: 'parfum, wewangian (Arab) — stock flower', alias: ['stock', 'stock flower', 'bunga stock'] },
  { namaPuitis: 'Ryū', arti: 'naga (Jepang) — snapdragon', alias: ['snapdragon', 'snapdragons', 'bunga mulut naga'] },
  { namaPuitis: 'Jun', arti: 'murni (Jepang) — freesia, kepolosan', alias: ['freesia', 'freesias'] },
  { namaPuitis: 'Salām', arti: 'kedamaian (Arab) — scabiosa, bunga merpati', alias: ['scabiosa', 'scabiosas'] },
  { namaPuitis: 'Sakina', arti: 'ketenangan yang turun (Arab) — lavender', alias: ['lavender', 'lavender sprigs', 'lavender import', 'bunga lavender'] },
  { namaPuitis: 'Lalita', arti: 'anggun, lembut (Sanskerta) — eustoma', alias: ['eustoma', 'eustomas', 'eustoma grandiflorum'] },
  { namaPuitis: 'Rasa', arti: 'esensi, rasa yang indah (Sanskerta) — lisianthus', alias: ['lisianthus', 'lisianthus import'] },
  { namaPuitis: 'Hugr', arti: 'hati & keberanian (Old Norse) — anthurium', alias: ['anthurium', 'bunga anthurium'] },
  { namaPuitis: 'Sol', arti: 'matahari (Old Norse / Inggris puitis) — bunga matahari', alias: ['bunga matahari', 'sunflowers', 'golden sunflowers', 'sunflower', 'bunga matahari kecil', 'matahari'] },
  { namaPuitis: 'Nur', arti: 'cahaya (Arab) — lily putih', alias: ['lily', 'lilies', 'lili', 'lilium', 'bunga lili', 'lily putih', 'lily pink', 'lily merah'] },
  { namaPuitis: 'Ajisai', arti: 'kesetiaan & pemahaman (Jepang) — hydrangea', alias: ['hydrangea', 'hydrangeas', 'bunga hydrangea', 'hortensia'] },
  { namaPuitis: 'Uruwashi', arti: 'indah (Jepang) — dahlia', alias: ['dahlia', 'dahlias', 'bunga dahlia'] },
  { namaPuitis: 'Kiku', arti: 'bunga keabadian (Jepang) — krisan', alias: ['krisan', 'chrysanthemum', 'chrysanthemums', 'bunga krisan', 'seruni'] },
  { namaPuitis: 'Husn', arti: 'keindahan (Arab) — anyelir', alias: ['anyelir', 'carnation', 'carnations', 'bunga anyelir'] },
  { namaPuitis: 'Yorokobi', arti: 'kegembiraan (Jepang) — gerbera', alias: ['gerbera', 'gerbera daisies', 'bunga gerbera', 'hebras'] },
  { namaPuitis: 'Hoshi', arti: 'bintang (Jepang) — aster', alias: ['aster', 'asters', 'bunga aster'] },
  { namaPuitis: 'Akari', arti: 'cahaya yang lembut (Jepang) — amarilis', alias: ['amarilis', 'amaryllis', 'bunga amarilis', 'amaryllis merah'] },
  { namaPuitis: 'Ran', arti: 'anggrek (Jepang)', alias: ['anggrek', 'orchid', 'orchids', 'anggrek bulan', 'bunga anggrek', 'phalaenopsis'] },
  { namaPuitis: 'Mallika', arti: 'melati (Sanskerta)', alias: ['melati', 'jasmine', 'bunga melati'] },
  { namaPuitis: 'Anbar', arti: 'wangi yang berharga (Arab) — kenanga', alias: ['kenanga', 'ylang ylang', 'bunga kenanga'] },
  { namaPuitis: 'Ratri', arti: 'malam (Sanskerta) — sedap malam, yang mekar di malam hari', alias: ['sedap malam', 'tuberose', 'bunga sedap malam'] },
  { namaPuitis: 'Nar', arti: 'api (Arab) — celosia, jengger yang menyala', alias: ['celosia', 'bunga celosia', 'jengger ayam'] },
  { namaPuitis: 'Suvarṇa', arti: 'emas (Sanskerta) — craspedia, bola emas', alias: ['craspedia', 'bunga drumstick', 'bunga craspedia'] },
  { namaPuitis: 'Mitra', arti: 'sahabat (Sanskerta) — alstroemeria', alias: ['alstroemeria', 'bunga alstroemeria', 'bunga lili peru'] },
  { namaPuitis: 'Shin', arti: 'kesetiaan (Jepang) — veronica', alias: ['veronica', 'bunga veronica'] },
  { namaPuitis: 'Kogane', arti: 'emas (Jepang) — solidago, goldenrod', alias: ['solidago', 'goldenrod', 'bunga solidago'] },
  { namaPuitis: 'Madhu', arti: 'madu, manis (Sanskerta) — wax flower', alias: ['wax flower', 'waxflower', 'bunga lilin'] },
  { namaPuitis: 'Breeze', arti: 'angin sepoi (Inggris) — pampas yang bergoyang', alias: ['pampas', 'pampas grass', 'rumput pampas'] },
  { namaPuitis: 'Kumo', arti: 'awan (Jepang) — gypsophila, baby breath', alias: ['gypsophila', 'baby breath', 'babys breath', "baby's breath", 'bunga babys breath'] },
  { namaPuitis: 'Argent', arti: 'perak (Inggris puitis) — dusty miller keperakan', alias: ['dusty miller', 'silvery dusty miller', 'bunga dusty miller'] },
  { namaPuitis: 'Shifa', arti: 'kesembuhan (Arab) — eucalyptus', alias: ['eucalyptus', 'eucalyptus silver dollar', 'daun eucalyptus'] },
  { namaPuitis: 'Mori', arti: 'hutan (Jepang) — ruscus yang selalu hijau', alias: ['ruscus', 'daun ruscus'] },
  { namaPuitis: 'Kage', arti: 'naungan (Jepang) — salal', alias: ['salal', 'daun salal'] },
  { namaPuitis: 'Sabi', arti: 'keindahan yang sederhana (Jepang) — rumput hias', alias: ['rumput', 'grass', 'daun padi', 'pampas kecil'] },
];

/**
 * Kolam cadangan untuk bunga yang tidak ada di kamus — kata 1 suku kata
 * yang indah dari 5 bahasa (Arab, Inggris, Sanskerta, Nordik, Jepang),
 * dipilih deterministik dari hash nama bunga.
 */
export const POETIC_POOL = [
  'Everbloom', 'Glimmer', 'Ember', 'Dawn', 'Whisper',
  'Rasa', 'Sundara', 'Madhura', 'Nila', 'Yūhi',
  'Shizuku', 'Kokoro', 'Tsumugi', 'Qamar', 'Fajr',
  'Sahar', 'Vindr', 'Bjartr', 'Runa', 'Saga',
  'Aoi', 'Tsuki', 'Aru', 'Miyabi',
];

const ONE_WORD = /^[\p{L}\p{M}'-]+$/u;

/** Nama puitis deterministik untuk sebuah bunga (kamus → hash pool). */
export function getPoeticFlowerName(nama) {
  const input = normalizeFlowerName(nama);
  if (!input) return null;
  for (const entry of POETIC_DICTIONARY) {
    for (const a of entry.alias) {
      if (normalizeFlowerName(a) === input) return entry.namaPuitis;
    }
  }
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return POETIC_POOL[h % POETIC_POOL.length];
}

/** True kalau namaPuitis cuma mengulang nama bunga / nama Inggrisnya. */
function isPlainFlowerName(candidate, nama, namaEn) {
  const c = normalizeFlowerName(candidate);
  if (!c) return true;
  return [nama, namaEn].some((n) => n && normalizeFlowerName(n) === c);
}

/**
 * Jaring pengaman di route /api/name-story: pastikan SEMUA bunga di daftar
 * kecocokan punya namaPuitis valid (1 kata, bukan nama bunga itu sendiri).
 * Kalau AI tidak memberi / memberi kata majemuk / mengulang nama bunga,
 * diisi dari kamus deterministik. Berjalan untuk story baru, dummy, ATAU
 * yang di-cache (cache lama tanpa namaPuitis otomatis ikut ter-enrich).
 */
export function enrichFlowerNames(story) {
  if (!story || !Array.isArray(story.bunga)) return story;
  story.bunga.forEach((b) => {
    const cur = String(b.namaPuitis || '').trim();
    if (!ONE_WORD.test(cur) || isPlainFlowerName(cur, b.nama, b.namaEn)) {
      b.namaPuitis = getPoeticFlowerName(b.nama) || '';
    }
  });
  return story;
}
