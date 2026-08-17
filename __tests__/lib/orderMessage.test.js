import { describe, it, expect } from 'vitest';
import {
  buildOrderMessage,
  buildWhatsAppLink,
  formatRupiah,
  formatTanggal,
  mapJenisProduk,
  toWaDigits,
  FLORIST_WA,
} from '@/lib/orderMessage';

describe('orderMessage helpers', () => {
  it('formats rupiah with id-ID separators and no Rp', () => {
    expect(formatRupiah(250000)).toBe('250.000');
    expect(formatRupiah(50000)).toBe('50.000');
    expect(formatRupiah(0)).toBe('0');
  });

  it('formats datetime-local into the florist date format', () => {
    expect(formatTanggal('2026-08-12T10:00')).toBe('12, Agustus 2026, 10.00');
    expect(formatTanggal('2026-01-05T09:30')).toBe('5, Januari 2026, 09.30');
    expect(formatTanggal('')).toBe('');
  });

  it('maps product subtitles to bouquet / papan / vas', () => {
    expect(mapJenisProduk('Small Bouquet')).toBe('bouquet');
    expect(mapJenisProduk('Large Bouquet')).toBe('bouquet');
    expect(mapJenisProduk('Arrangement in Vase')).toBe('vas');
    expect(mapJenisProduk('Flower Board')).toBe('papan');
    expect(mapJenisProduk('')).toBe('bouquet');
  });

  it('normalizes phone numbers for wa.me', () => {
    expect(toWaDigits('082225828290')).toBe('6282225828290');
    expect(toWaDigits('+6288805637985')).toBe('6288805637985');
    expect(toWaDigits('62888 0563 7985')).toBe('6288805637985');
  });
});

describe('buildOrderMessage', () => {
  const base = {
    pemesanNama: 'Fakri abdillah',
    pemesanWa: '082225828290',
    penerimaNama: 'Carin',
    penerimaWa: '+6288805637985',
    produk: 'colmar',
    jenis: 'bouquet',
    jumlah: 1,
    harga: 250000,
    ambilDikirim: 'Ambil',
    tanggal: '2026-08-12T10:00',
    status: 'Lunas',
    metode: 'QRIS',
    request: 'sesuai katalog',
    ucapan: '',
  };

  it('builds the full message with all sections in order', () => {
    const msg = buildOrderMessage(base);
    const lines = msg.split('\n');
    expect(lines[0]).toBe('*Data Pemesan*');
    expect(lines[1]).toBe('• Nama lengkap: Fakri abdillah');
    expect(lines[2]).toBe('• No Whatsapp: 082225828290');
    expect(lines).toContain('*Data Penerima*');
    expect(lines).toContain('• Nama lengkap: Carin');
    expect(lines).toContain('• No Whatsapp: +6288805637985');
    expect(lines).toContain('*Detail Pesanan*');
    expect(lines).toContain('• Nama produk: colmar');
    expect(lines).toContain('• Jenis Produk: bouquet');
    expect(lines).toContain('• Jumlah: 1');
    expect(lines).toContain('• Harga: 250.000');
    expect(lines).toContain('• Ambil/dikirim: Ambil');
    expect(lines).toContain('• Tanggal & Jam: 12, Agustus 2026, 10.00');
    expect(lines).toContain('• pembayaran lunas / DP: Lunas');
    expect(lines).toContain('• Request: sesuai katalog');
    expect(lines).toContain('• Ucapan: ');
    expect(lines).toContain('*Alamat Florist*');
    expect(lines.some((l) => l.startsWith('• https://maps.app.goo.gl'))).toBe(true);
    expect(lines).toContain('*Pembayaran*');
    expect(lines).toContain('• Metode: QRIS');
    expect(lines).toContain('• Mandiri: 1370027759980 an Sinyo Herde Keleyan');
    expect(lines).toContain('• QRIS');
    expect(lines).toContain('• Status: Lunas');
    expect(lines).toContain('*Ketentuan*');
    expect(lines).toContain('• Dp minimal 50% dari total pesanan');
    expect(lines).toContain('• jika buket dikirim, pemesan yang melakukan pemesanan ojol');
    // sections in the florist's order
    const sectionIdx = lines.map((l, i) => (l.startsWith('*') ? i : -1)).filter((i) => i >= 0);
    const sectionTexts = sectionIdx.map((i) => lines[i]);
    expect(sectionTexts).toEqual([
      '*Data Pemesan*',
      '*Data Penerima*',
      '*Detail Pesanan*',
      '*Alamat Florist*',
      '*Pembayaran*',
      '*Ketentuan*',
    ]);
  });

  it('reflects DP with nominal in both detail and payment lines', () => {
    const msg = buildOrderMessage({ ...base, status: 'DP', dpNominal: 150000 });
    expect(msg).toContain('• pembayaran lunas / DP: DP 150.000');
    expect(msg).toContain('• Status: DP 150.000');
  });

  it('includes the delivery address when Dikirim', () => {
    const msg = buildOrderMessage({
      ...base,
      ambilDikirim: 'Dikirim',
      alamat: 'Jl. Kaliurang KM 7, Sleman',
    });
    expect(msg).toContain('• Ambil/dikirim: Dikirim');
    expect(msg).toContain('• Alamat pengiriman: Jl. Kaliurang KM 7, Sleman');
  });

  it('puts the payment proof URL in the message when provided', () => {
    const msg = buildOrderMessage({
      ...base,
      buktiUrl: 'https://x.supabase.co/storage/v1/object/public/payments/abc.jpg',
    });
    expect(msg).toContain(
      '• Bukti pembayaran: https://x.supabase.co/storage/v1/object/public/payments/abc.jpg'
    );
  });
});

describe('buildWhatsAppLink', () => {
  it('targets the florist number and encodes the message', () => {
    const msg = buildOrderMessage({
      pemesanNama: 'Fakri', pemesanWa: '082225828290',
      penerimaNama: 'Carin', penerimaWa: '+6288805637985',
      produk: 'colmar', jenis: 'bouquet', jumlah: 1, harga: 250000,
      ambilDikirim: 'Ambil', tanggal: '2026-08-12T10:00',
      status: 'Lunas', metode: 'QRIS', request: 'sesuai katalog', ucapan: '',
    });
    const link = buildWhatsAppLink(msg);
    expect(link.startsWith(`https://wa.me/${FLORIST_WA}?text=`)).toBe(true);
    expect(decodeURIComponent(link.split('?text=')[1])).toBe(msg);
  });
});
