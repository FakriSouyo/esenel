'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { formatIDR } from '@/lib/format';
import { createOrder, uploadPaymentProof } from '@/lib/supabase';
import DateTimePicker from '@/components/checkout/DateTimePicker';
import ContactFields from '@/components/checkout/ContactFields';
import { getContactHistory, saveContactHistory } from '@/lib/orderHistory';
import {
  buildOrderMessage,
  buildWhatsAppLink,
  formatRupiah,
  mapJenisProduk,
  toWaDigits,
  REKENING_MANDIRI,
  QRIS_IMAGE,
  QRIS_NMID,
  KETENTUAN,
} from '@/lib/orderMessage';

const inputClass =
  'w-full border border-sand rounded-pill bg-white px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-ink transition-colors';
const labelClass = 'text-[12px] tracking-nav text-ink/50 block mb-2';
const segBtn = (active) =>
  `flex-1 py-3 rounded-pill text-[13px] font-medium tracking-nav transition-colors ${
    active ? 'bg-ink text-cloud' : 'text-ink/60 hover:bg-sand/50'
  }`;

/**
 * Buket hasil "buat bunga dari namamu" (/craft/name) TIDAK masuk cart —
 * diteruskan langsung lewat sessionStorage dan digabung dengan item cart
 * hanya di halaman checkout ini. Dibersihkan setelah pesanan terkirim.
 */
const DIRECT_ITEM_KEY = 'esenel.directItem.v1';

function readDirectItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(DIRECT_ITEM_KEY);
    if (!raw) return [];
    const item = JSON.parse(raw);
    return item && item.id ? [{ ...item, quantity: item.quantity || 1 }] : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [directItems, setDirectItems] = useState(() => readDirectItems());
  const [form, setForm] = useState({
    pemesanNama: '',
    pemesanWa: '',
    email: '',
    penerimaNama: '',
    penerimaWa: '',
    ambilDikirim: 'Ambil',
    alamat: '',
    tanggal: '',
    request: 'sesuai katalog',
    ucapan: '',
    metode: 'QRIS', // QRIS | Rekening
    status: 'Lunas', // Lunas | DP
    dpNominal: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showQris, setShowQris] = useState(false);
  const [history, setHistory] = useState(() => getContactHistory());

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Gabung buket nama (langsung dari /craft/name) dengan item cart biasa.
  const allItems = [...directItems, ...items];
  const subtotalAll = allItems.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
  const dpMin = Math.round(subtotalAll * 0.5);
  const totalQty = allItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const productNames = allItems.map((i) => i.name).join(', ');
  const jenisList = [
    ...new Set(allItems.map((i) => (i.craft ? 'bouquet' : mapJenisProduk(i.subtitle)))),
  ];

  function onProofChange(e) {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(file ? URL.createObjectURL(file) : null);
  }

  async function sendOrder(e) {
    e.preventDefault();
    if (sending) return;
    setError('');
    setSending(true);

    // Date & time validation (the picker has no native `required`).
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(form.tanggal)) {
      setError('Silakan pilih tanggal & jam ambil/kirim terlebih dahulu.');
      setSending(false);
      return;
    }

    // Payment proof is required.
    if (!proofFile) {
      setError('Bukti pembayaran wajib dilampirkan (screenshot transfer/QRIS).');
      setSending(false);
      return;
    }

    // DP validation: required and at least 50%.
    let dpNominal = 0;
    if (form.status === 'DP') {
      dpNominal = Number(String(form.dpNominal).replace(/\D/g, ''));
      if (!dpNominal || dpNominal < dpMin) {
        setError(`DP minimal 50% dari total (Rp ${formatRupiah(dpMin)}).`);
        setSending(false);
        return;
      }
    }

    // Upload the payment proof first (best effort — if it fails, the message
    // still goes out and says it will be attached manually).
    let buktiUrl = null;
    if (proofFile) {
      try {
        buktiUrl = await uploadPaymentProof(proofFile);
      } catch (err) {
        console.error('Payment proof upload failed:', err);
        buktiUrl = null;
      }
    }

    const message = buildOrderMessage({
      pemesanNama: form.pemesanNama.trim(),
      pemesanWa: form.pemesanWa.trim(),
      penerimaNama: form.penerimaNama.trim(),
      penerimaWa: form.penerimaWa.trim(),
      produk: productNames,
      jenis: jenisList.join('/') || 'bouquet',
      jumlah: totalQty,
      harga: subtotalAll,
      ambilDikirim: form.ambilDikirim,
      alamat: form.alamat.trim(),
      tanggal: form.tanggal,
      status: form.status,
      dpNominal,
      metode: form.metode,
      request: form.request.trim(),
      ucapan: form.ucapan.trim(),
      buktiUrl,
    });
    const waLink = buildWhatsAppLink(message);

    // Open WhatsApp first — that is the order.
    window.open(waLink, '_blank', 'noopener,noreferrer');

    // Remember these contacts for next time (localStorage dropdown).
    const contacts = [
      { nama: form.pemesanNama.trim(), wa: form.pemesanWa.trim(), email: form.email.trim() },
      { nama: form.penerimaNama.trim(), wa: form.penerimaWa.trim() },
    ];
    saveContactHistory(contacts);
    setHistory(getContactHistory());

    // Keep a record in Supabase (best effort, never blocks the send).
    try {
      const number = await createOrder({
        customer_name: form.pemesanNama.trim(),
        customer_email: form.email.trim() || `${toWaDigits(form.pemesanWa)}@wa.esenel`,
        customer_phone: form.pemesanWa.trim(),
        shipping_address: {
          address: form.alamat.trim(),
          delivery: form.ambilDikirim,
          pickup_date: form.tanggal,
        },
        note: `Request: ${form.request.trim()} | Ucapan: ${form.ucapan.trim()}`,
        subtotal: subtotalAll,
        shipping: 0,
        total: subtotalAll,
        items: allItems.map((i) => ({
          id: i.id,
          name: i.name,
          subtitle: i.subtitle || null,
          quantity: i.quantity || 1,
          price: i.price,
          ...(i.craft ? { craft: i.craft } : {}),
        })),
      });
      setOrderNumber(number);
    } catch (err) {
      console.error('Order record failed (WhatsApp already opened):', err);
    } finally {
      setSending(false);
      clear();
      try {
        window.sessionStorage.removeItem(DIRECT_ITEM_KEY);
        setDirectItems([]);
      } catch {
        // abaikan
      }
    }
  }

  if (orderNumber) {
    return (
      <main className="pt-40 pb-28">
        <div className="container-esenel max-w-2xl text-center">
          <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">
            ORDER {orderNumber}
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-6">
            Pesanan terkirim ke atelier. ✿
          </h1>
          <p className="text-ink/60 mb-4 max-w-md mx-auto">
            WhatsApp sudah terbuka dengan pesanan kamu terisi otomatis — tinggal tekan kirim.
          </p>
          <p className="text-ink/40 text-sm mb-10 max-w-md mx-auto">
            Jangan lupa lampirkan bukti pembayaran di chat kalau belum termasuk dalam pesan.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-ink text-cloud px-7 py-3.5 rounded-pill text-[13px] font-medium tracking-nav"
          >
            BACK TO THE SHOP
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-40 pb-28">
      <div className="container-esenel max-w-2xl">
        <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">CHECKOUT</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-12">Review your order</h1>

        {allItems.length === 0 ? (
          <div>
            <p className="text-ink/60 mb-6">Your bag is currently empty.</p>
            <Link
              href="/shop"
              className="inline-block bg-ink text-cloud px-7 py-3.5 rounded-pill text-[13px] font-medium tracking-nav"
            >
              BROWSE THE SHOP
            </Link>
          </div>
        ) : (
          <>
          <form onSubmit={sendOrder}>
            {/* Order summary */}
            <div className="divide-y divide-sand border-t border-b border-sand mb-10">
              {allItems.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-center justify-between py-5">
                  <div className="flex items-center gap-4">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 rounded-2xl border border-sand object-cover"
                      />
                    )}
                    <div>
                      <p className="font-display text-lg">{item.name}</p>
                      <p className="text-[12px] text-ink/50">
                        {item.subtitle || item.craft?.size} · Qty {item.quantity || 1}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">{formatIDR(item.price * (item.quantity || 1))}</p>
                </div>
              ))}
              <div className="flex items-center justify-between py-5">
                <span className="text-ink/60">Total</span>
                <span className="font-display text-2xl">{formatIDR(subtotalAll)}</span>
              </div>
            </div>

            {/* Data Pemesan */}
            <section className="border-t border-sand pt-8 mb-8">
              <p className="text-[12px] tracking-nav text-earth font-medium mb-5">DATA PEMESAN</p>
              <ContactFields
                history={history}
                nama={form.pemesanNama}
                wa={form.pemesanWa}
                onNama={(v) => setForm((f) => ({ ...f, pemesanNama: v }))}
                onWa={(v) => setForm((f) => ({ ...f, pemesanWa: v }))}
                onPick={(h) => setForm((f) => ({ ...f, pemesanNama: h.nama, pemesanWa: h.wa }))}
                namaPlaceholder="Nama kamu"
              />
              <label className="block mt-5">
                <span className={labelClass}>EMAIL (OPSIONAL, UNTUK CATATAN)</span>
                <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="you@email.com" />
              </label>
            </section>

            {/* Data Penerima */}
            <section className="border-t border-sand pt-8 mb-8">
              <p className="text-[12px] tracking-nav text-earth font-medium mb-5">DATA PENERIMA</p>
              <ContactFields
                history={history}
                nama={form.penerimaNama}
                wa={form.penerimaWa}
                onNama={(v) => setForm((f) => ({ ...f, penerimaNama: v }))}
                onWa={(v) => setForm((f) => ({ ...f, penerimaWa: v }))}
                onPick={(h) => setForm((f) => ({ ...f, penerimaNama: h.nama, penerimaWa: h.wa }))}
                namaPlaceholder="Nama penerima"
                waPlaceholder="+62… / 08…"
              />
            </section>

            {/* Detail Pesanan */}
            <section className="border-t border-sand pt-8 mb-8">
              <p className="text-[12px] tracking-nav text-earth font-medium mb-5">DETAIL PESANAN</p>

              <div className="flex rounded-pill border border-sand p-1 mb-5">
                {['Ambil', 'Dikirim'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ambilDikirim: opt }))}
                    className={segBtn(form.ambilDikirim === opt)}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>

              {form.ambilDikirim === 'Dikirim' && (
                <label className="block mb-5">
                  <span className={labelClass}>ALAMAT PENGIRIMAN *</span>
                  <textarea required value={form.alamat} onChange={set('alamat')} rows={2} className={`${inputClass} rounded-2xl resize-none`} placeholder="Alamat lengkap penerima" />
                </label>
              )}

              <div className="mb-5">
                <span className={labelClass}>TANGGAL & JAM (AMBIL/KIRIM) *</span>
                <DateTimePicker
                  value={form.tanggal}
                  onChange={(v) => setForm((f) => ({ ...f, tanggal: v }))}
                />
              </div>

              <label className="block mb-5">
                <span className={labelClass}>REQUEST (KOSONGKAN = SESUAI KATALOG)</span>
                <input value={form.request} onChange={set('request')} className={inputClass} placeholder="sesuai katalog" />
              </label>

              <label className="block">
                <span className={labelClass}>UCAPAN UNTUK PENERIMA (OPSIONAL)</span>
                <input value={form.ucapan} onChange={set('ucapan')} className={inputClass} placeholder="Selamat ulang tahun…" />
              </label>
            </section>

            {/* Pembayaran */}
            <section className="border-t border-sand pt-8 mb-8">
              <p className="text-[12px] tracking-nav text-earth font-medium mb-5">PEMBAYARAN</p>

              <div className="flex rounded-pill border border-sand p-1 mb-5">
                {['QRIS', 'Rekening'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, metode: opt }))}
                    className={segBtn(form.metode === opt)}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>

              {form.metode === 'QRIS' ? (
                <div className="rounded-2xl bg-sand/30 px-5 py-4 mb-6">
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => setShowQris(true)}
                      className="shrink-0 rounded-xl overflow-hidden border border-sand bg-white"
                      aria-label="Lihat QRIS lebih besar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={QRIS_IMAGE} alt="QRIS ESENEL" className="h-28 w-28 object-contain" />
                    </button>
                    <div className="min-w-0">
                      <p className="font-medium text-ink mb-1">QRIS</p>
                      <p className="text-[12px] leading-relaxed text-ink/70">{QRIS_NMID}</p>
                      <p className="text-[12px] text-ink/50 mt-1">
                        Scan dengan m-Banking / e-wallet mana pun.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQris(true)}
                          className="rounded-pill border border-ink/20 px-4 py-2 text-[12px] font-medium tracking-nav hover:bg-sand/50 transition-colors"
                        >
                          LIHAT QRIS
                        </button>
                        <a
                          href={QRIS_IMAGE}
                          download="qris-esenel.jpg"
                          className="rounded-pill bg-ink text-cloud px-4 py-2 text-[12px] font-medium tracking-nav hover:bg-ink/90 transition-colors"
                        >
                          UNDUH QRIS
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-sand/30 px-5 py-4 text-sm text-ink/80 mb-6">
                  <p className="font-medium text-ink mb-1">Transfer Rekening</p>
                  <p>Mandiri — {REKENING_MANDIRI}</p>
                </div>
              )}

              <div className="flex rounded-pill border border-sand p-1 mb-5">
                {['Lunas', 'DP'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: opt }))}
                    className={segBtn(form.status === opt)}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>

              {form.status === 'DP' && (
                <label className="block mb-5">
                  <span className={labelClass}>NOMINAL DP * (MINIMAL 50% = Rp {formatRupiah(dpMin)})</span>
                  <input
                    required
                    inputMode="numeric"
                    value={form.dpNominal}
                    onChange={set('dpNominal')}
                    className={inputClass}
                    placeholder={`Minimal ${formatRupiah(dpMin)}`}
                  />
                </label>
              )}

              <label className="block">
                <span className={labelClass}>BUKTI PEMBAYARAN * (SCREENSHOT TRANSFER / QRIS)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onProofChange}
                  className="block w-full text-sm text-ink/60 file:mr-4 file:rounded-pill file:border-0 file:bg-ink file:px-5 file:py-3 file:text-[12px] file:font-medium file:tracking-nav file:text-cloud hover:file:bg-ink/90"
                />
                {proofPreview && (
                  <div className="mt-4 flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proofPreview} alt="Payment proof preview" className="h-24 w-24 rounded-2xl object-cover border border-sand" />
                    <span className="text-xs text-ink/50 truncate max-w-[220px]">{proofFile?.name}</span>
                  </div>
                )}
              </label>
            </section>

            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="mx-auto block text-[12px] text-ink/50 underline underline-offset-4 hover:text-earth transition-colors mb-6"
            >
              Lihat ketentuan pembayaran & pengiriman
            </button>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-ink text-cloud py-4 rounded-pill text-[13px] tracking-nav font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
            >
              {sending ? 'SENDING…' : 'SEND ORDER VIA WHATSAPP'}
            </button>
            <p className="text-ink/40 text-xs text-center mt-4">
              WhatsApp terbuka dengan pesanan terisi otomatis — tinggal tekan kirim. Nomor atelier
              0822-2582-8290.
            </p>
          </form>

          {/* Ketentuan dialog */}
          {showTerms && (
            <div
              className="fixed inset-0 z-[95] bg-ink/45 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowTerms(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Ketentuan"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-cloud p-7 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-2xl">Ketentuan</h2>
                  <button
                    type="button"
                    onClick={() => setShowTerms(false)}
                    aria-label="Tutup"
                    className="p-2 rounded-full hover:bg-sand/60 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <ul className="space-y-3">
                  {KETENTUAN.map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm text-ink/80 leading-relaxed">
                      <span className="text-earth shrink-0">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* QRIS lightbox */}
          {showQris && (
            <div
              className="fixed inset-0 z-[95] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowQris(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="QRIS ESENEL"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl bg-cloud p-6 shadow-2xl text-center"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[12px] tracking-nav text-earth font-medium">QRIS</p>
                  <button
                    type="button"
                    onClick={() => setShowQris(false)}
                    aria-label="Tutup"
                    className="p-2 rounded-full hover:bg-sand/60 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={QRIS_IMAGE}
                  alt="QRIS ESENEL — scan untuk membayar"
                  className="mx-auto h-64 w-64 rounded-2xl border border-sand bg-white object-contain"
                />
                <p className="mt-4 text-[12px] text-ink/70 leading-relaxed">{QRIS_NMID}</p>
                <p className="text-[12px] text-ink/50 mt-1 mb-5">
                  Scan dengan m-Banking / e-wallet mana pun.
                </p>
                <a
                  href={QRIS_IMAGE}
                  download="qris-esenel.jpg"
                  className="inline-block w-full bg-ink text-cloud py-3 rounded-pill text-[13px] font-medium tracking-nav hover:bg-ink/90 transition-colors"
                >
                  UNDUH QRIS
                </a>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </main>
  );
}
