/**
 * Builds the checkout WhatsApp message in the florist's exact format.
 * Pure functions — easy to unit test and reused by the checkout page.
 */

export const FLORIST_WA = '6282225828290'; // 082225828290 (test number)
export const FLORIST_ALAMAT = 'https://maps.app.goo.gl/XYuHhCuEA9xzH8qo7?g_st=ic';
export const REKENING_MANDIRI = '1370027759980 an Sinyo Herde Keleyan';

// QRIS — image in /public, plus the NMID label shown with it.
export const QRIS_IMAGE = '/qris.jpg';
export const QRIS_NMID = 'ESENEL FLEUR, TOKO BUNGA NMID: ID1026534002625';

// Shared single source of truth — shown in the checkout Ketentuan dialog
// AND embedded in the WhatsApp message.
export const KETENTUAN = [
  'Dp minimal 50% dari total pesanan',
  'Pelunasan wajib dilakukan sebelum pesanan dikirim/diambil',
  'Bisa langsung bayar lunas 100%',
  'Bentuk & tampilan diusahakan sangat mirip katalog tapi tidak bisa 100% sama',
  'jika buket dikirim, pemesan yang melakukan pemesanan ojol',
];

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** "250000" -> "250.000" (id-ID thousands separator, no Rp). */
export function formatRupiah(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

/** "2026-08-12T10:00" -> "12, Agustus 2026, 10.00" */
export function formatTanggal(datetimeLocal) {
  if (!datetimeLocal) return '';
  const [datePart, timePart] = String(datetimeLocal).split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = (timePart || '00:00').split(':');
  return `${d}, ${BULAN[m - 1]} ${y}, ${String(hh).padStart(2, '0')}.${String(mm).padStart(2, '0')}`;
}

/** Map a product subtitle to the florist's jenis: bouquet / papan / vas. */
export function mapJenisProduk(subtitle = '') {
  const s = subtitle.toLowerCase();
  if (s.includes('vase')) return 'vas';
  if (s.includes('board') || s.includes('papan')) return 'papan';
  return 'bouquet';
}

/** "082225828290" / "+62888..." -> digits for wa.me (62…). */
export function toWaDigits(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return digits;
}

/**
 * Compose the full message. `data`:
 *   pemesanNama, pemesanWa, penerimaNama, penerimaWa
 *   produk (nama), jenis (bouquet/papan/vas), jumlah, harga
 *   ambilDikirim ('Ambil'|'Dikirim'), alamat (bila dikirim), tanggal (datetime-local)
 *   metode ('QRIS'|'Rekening'), status ('Lunas'|'DP'), dpNominal
 *   request, ucapan, buktiUrl (opsional)
 */
export function buildOrderMessage(data) {
  const L = [];
  const add = (s = '') => L.push(s);

  add('*Data Pemesan*');
  add(`• Nama lengkap: ${data.pemesanNama || ''}`);
  add(`• No Whatsapp: ${data.pemesanWa || ''}`);
  add('');

  add('*Data Penerima*');
  add(`• Nama lengkap: ${data.penerimaNama || ''}`);
  add(`• No Whatsapp: ${data.penerimaWa || ''}`);
  add('');

  add('*Detail Pesanan*');
  add(`• Nama produk: ${data.produk || ''}`);
  add(`• Jenis Produk: ${data.jenis || 'bouquet'}`);
  add(`• Jumlah: ${data.jumlah ?? 0}`);
  add(`• Harga: ${formatRupiah(data.harga)}`);
  add(`• Ambil/dikirim: ${data.ambilDikirim || 'Ambil'}`);
  if (data.ambilDikirim === 'Dikirim' && data.alamat) {
    add(`• Alamat pengiriman: ${data.alamat}`);
  }
  add(`• Tanggal & Jam: ${formatTanggal(data.tanggal)}`);
  add(`• pembayaran lunas / DP: ${data.status === 'DP' ? `DP ${formatRupiah(data.dpNominal)}` : 'Lunas'}`);
  add(`• Request: ${data.request || ''}`);
  add(`• Ucapan: ${data.ucapan || ''}`);
  add('');

  add('*Alamat Florist*');
  add(`• ${FLORIST_ALAMAT}`);
  add('');

  add('*Pembayaran*');
  add(`• Metode: ${data.metode || 'QRIS'}`);
  add(`• Mandiri: ${REKENING_MANDIRI}`);
  add('• QRIS');
  add(`• Status: ${data.status === 'DP' ? `DP ${formatRupiah(data.dpNominal)}` : 'Lunas'}`);
  add(data.buktiUrl
    ? `• Bukti pembayaran: ${data.buktiUrl}`
    : '• Bukti pembayaran: akan dilampirkan manual di chat');
  add('');

  add('*Ketentuan*');
  KETENTUAN.forEach((k) => add(`• ${k}`));

  return L.join('\n');
}

/** wa.me link with the message pre-filled. */
export function buildWhatsAppLink(message) {
  return `https://wa.me/${FLORIST_WA}?text=${encodeURIComponent(message)}`;
}
