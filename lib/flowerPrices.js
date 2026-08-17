/**
 * Database harga bunga per tangkai — pasar florist retail Indonesia
 * (acuan Jakarta/Bandung, 2024–2026). Dipakai untuk:
 *   1. Menghitung perkiraan harga buket dari daftar bunga kecocokan
 *      (story.bunga) sebelum tombol CHECKOUT muncul.
 *   2. Mencocokkan nama bunga dari AI (DeepSeek/dummy) ke harga — alias
 *      Indonesia + Inggris + nama umum, jadi jarang "miss".
 *
 * Harga adalah perkiraan pasar retail, bukan harga resmi penjual.
 */
export const WRAP_FEE = 35000; // kertas pembungkus & jasa rangkai

export const FLOWER_PRICE_DATA = [
  // ---- mawar & mawar import ----
  { nama: 'Mawar Merah', namaEn: 'red rose', alias: ['mawar', 'rose', 'red roses', 'mawar merah', 'deep red roses'], harga: 25000 },
  { nama: 'Mawar Putih', namaEn: 'white rose', alias: ['mawar putih', 'white roses'], harga: 25000 },
  { nama: 'Mawar Pink', namaEn: 'pink rose', alias: ['mawar pink', 'pink roses'], harga: 25000 },
  { nama: 'Mawar Import', namaEn: 'ecuador rose', alias: ['mawar import', 'mawar ecuador', 'long stem rose'], harga: 85000 },
  // ---- tulip & import Eropa ----
  { nama: 'Tulip', namaEn: 'tulip', alias: ['tulips', 'tulip putih', 'tulip pink', 'tulip merah', 'tulip kuning', 'white tulip'], harga: 90000 },
  { nama: 'Peony', namaEn: 'peony', alias: ['peonies', 'peony import'], harga: 120000 },
  { nama: 'Iris', namaEn: 'iris', alias: ['irises', 'iris import', 'bunga iris'], harga: 60000 },
  { nama: 'Protea', namaEn: 'protea', alias: ['proteas', 'protea king', 'bunga protea'], harga: 85000 },
  { nama: 'Ranunculus', namaEn: 'ranunculus', alias: ['ranunculus', 'bunga ranunculus'], harga: 45000 },
  { nama: 'Anemone', namaEn: 'anemone', alias: ['anemone', 'bunga anemone'], harga: 40000 },
  { nama: 'Delphinium', namaEn: 'delphinium', alias: ['delphinium', 'delphiniums', 'bunga delphinium'], harga: 50000 },
  { nama: 'Larkspur', namaEn: 'larkspur', alias: ['larkspur', 'larkspurs'], harga: 50000 },
  { nama: 'Stock', namaEn: 'stock flower', alias: ['stock', 'stock flower', 'bunga stock'], harga: 30000 },
  { nama: 'Snapdragon', namaEn: 'snapdragon', alias: ['snapdragon', 'snapdragons', 'bunga mulut naga'], harga: 25000 },
  { nama: 'Freesia', namaEn: 'freesia', alias: ['freesia', 'freesias'], harga: 30000 },
  { nama: 'Scabiosa', namaEn: 'scabiosa', alias: ['scabiosa', 'scabiosas'], harga: 35000 },
  // ---- lokal & populer ----
  { nama: 'Lavender', namaEn: 'lavender', alias: ['lavender sprigs', 'lavender import', 'bunga lavender'], harga: 75000 },
  { nama: 'Eustoma', namaEn: 'eustoma', alias: ['eustoma', 'eustomas', 'lisianthus', 'eustoma grandiflorum'], harga: 30000 },
  { nama: 'Lisianthus', namaEn: 'lisianthus', alias: ['lisianthus', 'lisianthus import'], harga: 35000 },
  { nama: 'Anthurium', namaEn: 'anthurium', alias: ['anthurium', 'bunga anthurium'], harga: 40000 },
  { nama: 'Bunga Matahari', namaEn: 'sunflower', alias: ['bunga matahari', 'sunflowers', 'golden sunflowers', 'sunflower', 'bunga matahari kecil', 'matahari'], harga: 30000 },
  { nama: 'Lily', namaEn: 'lily', alias: ['lily', 'lilies', 'lili', 'lilium', 'bunga lili', 'lily putih', 'lily pink', 'lily merah'], harga: 50000 },
  { nama: 'Hydrangea', namaEn: 'hydrangea', alias: ['hydrangea', 'hydrangeas', 'bunga hydrangea', 'hortensia'], harga: 55000 },
  { nama: 'Dahlia', namaEn: 'dahlia', alias: ['dahlia', 'dahlias', 'bunga dahlia'], harga: 30000 },
  { nama: 'Krisan', namaEn: 'chrysanthemum', alias: ['krisan', 'chrysanthemum', 'chrysanthemums', 'bunga krisan', 'seruni'], harga: 15000 },
  { nama: 'Anyelir', namaEn: 'carnation', alias: ['anyelir', 'carnation', 'carnations', 'bunga anyelir'], harga: 15000 },
  { nama: 'Gerbera', namaEn: 'gerbera daisy', alias: ['gerbera', 'gerbera daisies', 'bunga gerbera', 'hebras'], harga: 18000 },
  { nama: 'Aster', namaEn: 'aster', alias: ['aster', 'asters', 'bunga aster'], harga: 20000 },
  { nama: 'Amarilis', namaEn: 'amaryllis', alias: ['amarilis', 'amaryllis', 'bunga amarilis', 'amaryllis merah'], harga: 60000 },
  { nama: 'Anggrek', namaEn: 'orchid', alias: ['anggrek', 'orchid', 'orchids', 'anggrek bulan', 'bunga anggrek', 'phalaenopsis'], harga: 60000 },
  { nama: 'Melati', namaEn: 'jasmine', alias: ['melati', 'jasmine', 'bunga melati'], harga: 20000 },
  { nama: 'Kenanga', namaEn: 'ylang ylang', alias: ['kenanga', 'ylang ylang', 'bunga kenanga'], harga: 18000 },
  { nama: 'Sedap Malam', namaEn: 'tuberose', alias: ['sedap malam', 'tuberose', 'bunga sedap malam'], harga: 15000 },
  { nama: 'Celosia', namaEn: 'celosia', alias: ['celosia', 'bunga celosia', 'jengger ayam'], harga: 25000 },
  { nama: 'Craspedia', namaEn: 'craspedia', alias: ['craspedia', 'bunga drumstick', 'bunga craspedia'], harga: 30000 },
  { nama: 'Alstroemeria', namaEn: 'alstroemeria', alias: ['alstroemeria', 'bunga alstroemeria', 'bunga lili peru'], harga: 25000 },
  { nama: 'Veronica', namaEn: 'veronica', alias: ['veronica', 'bunga veronica'], harga: 30000 },
  { nama: 'Solidago', namaEn: 'solidago', alias: ['solidago', 'goldenrod', 'bunga solidago'], harga: 20000 },
  { nama: 'Wax Flower', namaEn: 'wax flower', alias: ['wax flower', 'waxflower', 'bunga lilin'], harga: 25000 },
  { nama: 'Pampas', namaEn: 'pampas grass', alias: ['pampas', 'pampas grass', 'rumput pampas'], harga: 40000 },
  // ---- filler & foliage ----
  { nama: 'Gypsophila', namaEn: 'baby breath', alias: ['gypsophila', 'baby breath', 'babys breath', 'baby\'s breath', 'bunga babys breath'], harga: 15000 },
  { nama: 'Dusty Miller', namaEn: 'dusty miller', alias: ['dusty miller', 'silvery dusty miller', 'bunga dusty miller'], harga: 25000 },
  { nama: 'Eucalyptus', namaEn: 'eucalyptus', alias: ['eucalyptus', 'eucalyptus silver dollar', 'daun eucalyptus'], harga: 35000 },
  { nama: 'Ruscus', namaEn: 'ruscus', alias: ['ruscus', 'daun ruscus'], harga: 30000 },
  { nama: 'Salal', namaEn: 'salal', alias: ['salal', 'daun salal'], harga: 20000 },
  { nama: 'Bunga Rumput', namaEn: 'grass', alias: ['rumput', 'grass', 'daun padi', 'pampas kecil'], harga: 12000 },
];

/** Normalisasi nama bunga untuk pencocokan (lowercase, buang aksen/spasi). */
export function normalizeFlowerName(nama) {
  return String(nama || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Cari harga untuk sebuah nama bunga (alias ID/EN). Exact match diprioritaskan
 *  ("Mawar pink" → Mawar Pink, bukan Mawar generik); kalau tidak ketemu, cocok
 *  awalan ("Tulip putih" → "Tulip"). Kembalikan entri atau null. */
export function getFlowerPrice(nama) {
  const input = normalizeFlowerName(nama);
  if (!input) return null;
  const keysOf = (entry) =>
    [entry.nama, entry.namaEn, ...(entry.alias || [])].map(normalizeFlowerName);
  // pass 1: exact
  for (const entry of FLOWER_PRICE_DATA) {
    for (const key of keysOf(entry)) {
      if (input === key) return entry;
    }
  }
  // pass 2: awalan (".startsWith(key + ' ')")
  for (const entry of FLOWER_PRICE_DATA) {
    for (const key of keysOf(entry)) {
      if (input.startsWith(`${key} `)) return entry;
    }
  }
  return null;
}

/** Format angka ke Rupiah Indonesia: 25000 → "Rp 25.000". */
export function formatIDR(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(Number(value) || 0))}`;
}

/**
 * Pecahan harga buket dari daftar bunga kecocokan (story.bunga).
 * Bunga yang tidak ketemu di database tetap tampil dengan harga pasar
 * default supaya tidak ada yang "miss" dari daftar.
 * @returns {{ items: Array<{ id, nama, namaResolved, harga, matched }>, subtotal, wrapFee, total }}
 */
export function flowerBreakdown(story) {
  const bunga = Array.isArray(story?.bunga) ? story.bunga : [];
  let subtotal = 0;
  const items = bunga.map((b, i) => {
    const nama = String(b?.nama || 'Bunga').trim();
    const entry = getFlowerPrice(nama);
    const harga = entry ? entry.harga : 30000; // harga pasar default
    subtotal += harga;
    return {
      id: `fl-${i}-${normalizeFlowerName(nama) || i}`,
      nama,
      namaResolved: entry ? entry.nama : null,
      harga,
      matched: !!entry,
    };
  });
  const wrapFee = bunga.length > 0 ? WRAP_FEE : 0;
  return { items, subtotal, wrapFee, total: subtotal + wrapFee };
}

/** Perkiraan total harga buket (dipakai untuk harga item checkout). */
export function estimateBouquetPrice(story) {
  const { total } = flowerBreakdown(story);
  return Math.max(total, 99000);
}
