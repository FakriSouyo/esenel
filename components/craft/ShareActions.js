'use client';

/**
 * Aksi bagikan — muncul sebagai TEKS di bawah tombol utama (CHECKOUT /
 * TULIS NAMA LAIN). Klik teksnya → card kecil melebar (expand) berisi:
 *   BAGIKAN   — Web Share API (PNG kartu + url link buket), fallback ke
 *               salin link di clipboard.
 *   SALIN LINK— salin link permanen <origin>/craft/name/<nameKey>.
 *
 * Tombol PREVIEW (dialog flip card) sengaja di-HIDE untuk sementara sampai
 * tampilannya disepakati — kode dialognya masih ada di bawah (previewOpen /
 * flipped / zoomOpen), tinggal dipanggil lagi saat mau dikembalikan.
 *
 * Default TERTUTUP — user sendiri yang membuka (expand).
 *
 * Export PNG memakai html-to-image terhadap klon kartu yang dirender lebar
 * (1080px) di luar layar (hanya saat card terbuka). Foto di-inline dulu
 * menjadi data URL sebelum export, supaya BAGIKAN/UNDUH KARTU selalu berisi
 * gambar buket asli, bukan placeholder ✿.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { ChevronDown, Download, Link2, RotateCw, Share2, X } from 'lucide-react';
import EsenelResultCard from '@/components/craft/EsenelResultCard';

/* ---- Font embed untuk export PNG ----
 * html-to-image tidak bisa membaca @font-face dari stylesheet Google Fonts
 * (cross-origin cssRules), jadi export otomatis jatuh ke font fallback.
 * Solusi: ambil CSS font sendiri (fonts.googleapis.com mengirim CORS
 * header), ubah url woff2 jadi data URI, lalu kirim sebagai fontEmbedCSS. */
const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Geist+Pixel&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap';

let fontEmbedCache = null;

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function buildFontEmbedCSS() {
  if (fontEmbedCache) return fontEmbedCache;
  try {
    const css = await fetch(FONT_CSS_URL).then((r) => r.text());
    const blocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
    let out = '';
    for (const body of blocks) {
      // hanya subset latin (unicode-range U+0000-00FF) — cukup untuk teks kartu
      if (!/U\+0000-00FF/i.test(body)) continue;
      const urlMatch = body.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
      if (!urlMatch) continue;
      const blob = await fetch(urlMatch[1]).then((r) => r.blob());
      const dataUrl = await toDataUrl(blob);
      out += `@font-face{${body.replace(urlMatch[0], `url(${dataUrl})`)}}`;
    }
    fontEmbedCache = out || undefined;
  } catch {
    fontEmbedCache = undefined;
  }
  return fontEmbedCache;
}

function fileName(story) {
  const base = String(story?.namaBuket || story?.nama || 'buket')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `buket-${base || 'nama'}.png`;
}

/** Arti nama singkat untuk sisi depan flip card — potong sampai titik pertama. */
function shortArti(text) {
  if (!text) return '';
  const t = String(text).trim();
  const idx = t.indexOf('.');
  return (idx === -1 ? t : t.slice(0, idx + 1)).trim();
}

export default function ShareActions({ story, nameKey, imageSrc, imageAlt }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // 'share' | 'download' | 'link' | null
  const [msg, setMsg] = useState(null);
  // Preview dialog — flip card: front foto+nama+arti singkat, back bunga.
  const [previewOpen, setPreviewOpen] = useState(false);
  // Apakah card ter-flip ke sisi back (bunga).
  const [flipped, setFlipped] = useState(false);
  // Zoom foto di dalam pratinjau (klik foto di front).
  const [zoomOpen, setZoomOpen] = useState(false);
  const exportRef = useRef(null);

  // Link permanen untuk nama ini — dipakai tombol "SALIN LINK" dan ikut
  // disertakan saat BAGIKAN (Web Share). Dibangun dari origin aktif supaya
  // selalu mengarah ke domain yang sedang dibuka (dev vs production).
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const key = String(nameKey || '').trim();
    return key ? `${origin}/craft/name/${encodeURIComponent(key)}` : origin + '/craft/name';
  }, [nameKey]);

  const copyLink = useCallback(async () => {
    setBusy('link');
    setMsg(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMsg('Link disalin — bagikan ke siapa pun!');
    } catch {
      setMsg('Gagal menyalin link.');
    } finally {
      setBusy(null);
    }
  }, [shareUrl]);

  // Tutup dialog dengan Escape — zoom dulu (yang dibuka terakhir), baru
  // pratinjau. Tandai <body> supaya handler global "kembali ke /craft"
  // tidak ikut jalan saat dialog terbuka.
  const anyDialogOpen = previewOpen || zoomOpen;
  useEffect(() => {
    try {
      if (anyDialogOpen) document.body.dataset.esenelDialog = 'open';
      else delete document.body.dataset.esenelDialog;
    } catch {
      // abaikan
    }
    if (!anyDialogOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (zoomOpen) setZoomOpen(false);
        else setPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyDialogOpen, zoomOpen]);

  // Foto di-inline menjadi data URL di klon export. Data URL tidak butuh
  // CORS sama sekali, jadi toPng selalu bisa membacanya → UNDUH/BAGIKAN
  // berisi gambar buket asli, bukan fallback ✿.
  const inlineImage = useCallback(
    async (node) => {
      if (!imageSrc || imageSrc.startsWith('data:')) return;
      const img = node.querySelector('.ec-photo-frame img');
      if (!img) return;
      try {
        const res = await fetch(imageSrc, { cache: 'force-cache' });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await toDataUrl(blob);
        img.src = dataUrl;
        await img.decode?.().catch(() => {});
      } catch {
        // biarkan src asli — kalau tetap gagal, fallback ✿ menangani
      }
    },
    [imageSrc]
  );

  const capture = useCallback(async () => {
    const container = exportRef.current;
    if (!container) throw new Error('Kartu belum siap');
    // Ambil .ec-stage di dalam container, BUKAN container-nya: container
    // punya left:-10000px (untuk menyembunyikan), dan html-to-image menyalin
    // posisi itu ke klon SVG → isi kartu jadi 10000px di luar viewport
    // (hasil export kosong). Stage tidak punya posisi negatif.
    const node = container.querySelector('.ec-stage') || container;
    await inlineImage(node);
    const fontEmbedCSS = await buildFontEmbedCSS();
    const opts = { pixelRatio: 1, cacheBust: true, backgroundColor: '#F8F9F5', fontEmbedCSS };
    try {
      return await toPng(node, opts);
    } catch {
      // Masih gagal (mis. foto memang tidak bisa dimuat) → sembunyikan dan
      // pakai fallback ✿ yang sudah dirender di belakang foto.
      const img = node.querySelector('.ec-photo-frame img');
      if (img) img.style.display = 'none';
      try {
        return await toPng(node, { ...opts, cacheBust: false });
      } finally {
        if (img) img.style.display = '';
      }
    }
  }, [inlineImage]);

  const download = (dataUrl) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName(story);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = useCallback(async () => {
    setBusy('share');
    setMsg(null);
    try {
      const dataUrl = await capture();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName(story), { type: 'image/png' });
      const title = `Buket ${story?.namaBuket || story?.nama}`;
      const text = `Buket ${story?.namaBuket || story?.nama} untuk ${story?.nama} — buat dengan ESENEL 💐 ${shareUrl}`;
      // Bagikan KARTU (PNG) sekaligus LINK-nya kalau platform mendukung URL.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text, url: shareUrl });
        setMsg('Berhasil dibagikan!');
        return;
      }
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setMsg('Gambar disalin ke clipboard — tinggal tempel di story!');
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setMsg('Link disalin — bagikan ke siapa pun!');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setMsg(null);
        return;
      }
      setMsg('Gagal membagikan — coba lagi.');
    } finally {
      setBusy(null);
    }
  }, [capture, story, shareUrl]);

  // Unduh KARTU PNG — dipakai tombol "UNDUH KARTU" di dalam dialog pratinjau.
  const handleDownloadCard = useCallback(async () => {
    setBusy('download');
    setMsg(null);
    try {
      download(await capture());
      setMsg('Kartu PNG terunduh!');
    } catch {
      setMsg('Gagal mengunduh kartu — coba lagi.');
    } finally {
      setBusy(null);
    }
  }, [capture]);

  const busyLabel =
    busy === 'share'
      ? 'MENYIAPKAN…'
      : busy === 'download'
        ? 'MENGUNDUH…'
        : busy === 'link'
          ? '…'
          : null;

  return (
    <>
      {/* teks pembuka — klik untuk membuka card aksi (default tertutup) */}
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="mx-auto mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/45 transition-colors hover:text-ink/75"
      >
        <Share2 size={12} />
        Bagikan buket ini
        <ChevronDown
          size={12}
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-auto mt-3 w-full max-w-sm rounded-2xl border border-ink/10 bg-white/80 p-3 shadow-sm">
              <button
                type="button"
                onClick={handleShare}
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[11px] font-semibold tracking-nav text-cloud transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
              >
                <Share2 size={13} />
                {busy === 'share' ? busyLabel : 'BAGIKAN'}
              </button>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={copyLink}
                  disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/20 bg-ink/5 px-4 py-2.5 text-[11px] font-semibold tracking-nav text-ink/80 transition-all hover:border-ink/40 hover:text-ink active:scale-[0.98] disabled:opacity-50"
                >
                  <Link2 size={13} />
                  SALIN LINK
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-ink/45">
                Bagikan kartu & link, atau salin link-nya.
              </p>
              {msg && <p className="mt-1 text-center text-[11px] text-ink/55">{msg}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* klon kartu lebar untuk export PNG — di luar layar, dirender hanya
          saat card aksi terbuka supaya gambar siap begitu user menekan */}
      {open && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: 1080,
            zIndex: -1,
            pointerEvents: 'none',
          }}
          ref={exportRef}
        >
          <EsenelResultCard story={story} imageSrc={imageSrc} imageAlt={imageAlt} maxWidth="1080px" />
        </div>
      )}

      {/* ── Dialog pratinjau — flip card (front foto+nama+arti, back bunga) ── */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            className="fixed inset-0 z-[95] flex min-h-screen items-center justify-center bg-ink/60 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Pratinjau buket ${story.namaBuket || story.nama}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md"
            >
              {/* tombol tutup — melayang di pojok kanan atas card */}
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Tutup pratinjau"
                className="absolute -right-2 -top-2 z-[2] grid size-9 place-items-center rounded-full bg-cloud text-ink/70 shadow-lg ring-1 ring-ink/10 transition-colors hover:bg-white hover:text-ink"
              >
                <X size={16} />
              </button>

              {/* panggung flip */}
              <div className="mx-auto w-full [perspective:1600px]" style={{ height: 'min(72vh, 30rem)' }}>
                <div
                  className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
                  style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  {/* ===== SISI DEPAN (front): foto + nama + arti singkat ===== */}
                  <div className="absolute inset-0 m-0.5 flex flex-col overflow-hidden rounded-3xl bg-cloud shadow-2xl [backface-visibility:hidden]">
                    {/* foto buket — klik → perbesar */}
                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      aria-label="Perbesar foto buket"
                      className="relative min-h-0 flex-1 w-full overflow-hidden bg-sand/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={imageAlt || `Buket ${story.namaBuket || story.nama}`}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                    </button>
                    {/* nama + arti nama singkat */}
                    <div className="shrink-0 border-t border-ink/10 bg-white/85 px-5 py-4 text-left">
                      <p className="font-display text-2xl leading-none tracking-[-0.01em] text-ink">
                        {story.nama}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/40">
                        {story.namaBuket || 'ESENEL'} · buket personal
                      </p>
                      {shortArti(story.artiNama) && (
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/70">
                          {shortArti(story.artiNama)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ===== SISI BELAKANG (back): bunga yang cocok ===== */}
                  <div className="absolute inset-0 m-0.5 flex flex-col overflow-hidden rounded-3xl bg-cloud shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="shrink-0 border-b border-ink/10 px-5 py-3 text-left">
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink/40">
                        Bunga yang cocok
                      </p>
                      <p className="mt-0.5 font-display text-lg leading-none text-ink">
                        {story.nama} 💐
                      </p>
                    </div>
                    <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 text-left">
                      {Array.isArray(story.bunga) &&
                        story.bunga.map((f, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1 size-2.5 shrink-0 rounded-[4px] bg-meadow" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-ink">
                                {f?.namaPuitis || f?.nama}
                              </span>
                              {f?.alasan && (
                                <span className="block text-xs leading-relaxed text-ink/60">
                                  {f.alasan}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* footer: flip + unduh */}
              <div className="mt-3 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFlipped((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[11px] font-semibold tracking-nav text-cloud transition-colors hover:bg-ink/90"
                >
                  <RotateCw size={13} />
                  {flipped ? 'KEMBALI' : 'LIHAT BUNGA'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/20 bg-cloud px-4 py-2.5 text-[11px] font-semibold tracking-nav text-ink/80 transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-50"
                >
                  <Download size={13} />
                  {busy === 'download' ? busyLabel : 'UNDUH KARTU'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom foto buket — klik foto di pratinjau (gaya zoom bouquet) */}
      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            className="fixed inset-0 z-[99] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Perbesar buket ${story.namaBuket || story.nama}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-cloud p-2 shadow-2xl"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-sand/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={imageAlt || `Buket ${story.namaBuket || story.nama}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-1 pt-2">
                <div className="min-w-0 text-left">
                  <p className="truncate font-display text-base tracking-[-0.01em] text-ink">
                    {story.namaBuket || story.nama}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                    ESENEL · buket personal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomOpen(false)}
                  aria-label="Tutup"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
