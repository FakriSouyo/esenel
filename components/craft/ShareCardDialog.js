'use client';

/**
 * Tombol "BAGIKAN" → dialog/modal berisi kartu hasil (EsenelResultCard):
 *   BAGIKAN    — Web Share API (kirim PNG kartu ke story/media sosial),
 *                fallback ke clipboard / unduh.
 *   UNDUH      — simpan PNG kartu ke device.
 *   SALIN LINK — salin link /craft/name/<nameKey> (OG image dinamis).
 *
 * Desain mengikuti pola dialog modern (shadcn/ui + animasi spring ala
 * Aceternity): panel terpusat di tengah viewport (bukan full-screen),
 * overlay gelap pekat + backdrop blur, panel cloud bersih dengan header /
 * body kartu / footer aksi, masuk-keluar dengan animasi fade + zoom + spring.
 * Kartu di dalam body di-scale otomatis terhadap ukuran area yang tersedia
 * (diukur live via ResizeObserver) — selalu muat utuh, tanpa scroll.
 *
 * Export PNG memakai html-to-image terhadap klon kartu yang dirender lebar
 * (1080px) di luar layar — jadi hasilnya tajam meski kartu preview kecil.
 * Foto di-inline dulu menjadi data URL sebelum export, supaya UNDUH/BAGIKAN
 * selalu berisi gambar buket asli, bukan placeholder ✿.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, Link2, Share2, X } from 'lucide-react';
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

export default function ShareCardDialog({ story, imageSrc, imageAlt, nameKey }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // 'share' | 'download' | null
  const [msg, setMsg] = useState(null);
  const exportRef = useRef(null);
  const cardWrapRef = useRef(null);
  const cardAreaRef = useRef(null);
  // Ukuran natural kartu (belum di-scale) + skala agar muat di area panel.
  const [fit, setFit] = useState(null);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const key = nameKey || 'nama';
    return `${window.location.origin}/craft/name/${encodeURIComponent(key)}`;
  }, [nameKey]);

  // Saat dialog terbuka: tandai <body> supaya Escape halaman (kembali ke
  // /craft) tidak ikut jalan, dan Escape menutup dialog. SCROLL TIDAK
  // dikunci — user boleh scroll halaman di belakang (permintaan pemilik).
  useEffect(() => {
    if (!open) return;
    try {
      document.body.dataset.esenelDialog = 'open';
    } catch {
      // abaikan
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try {
        delete document.body.dataset.esenelDialog;
      } catch {
        // abaikan
      }
    };
  }, [open]);

  // Ukur ukuran natural kartu + ukuran AREA kartu di dalam panel (header dan
  // footer sudah mengurangi tingginya), lalu hitung skala — kartu selalu
  // muat utuh di area itu, tanpa scroll dan tanpa angka ajaib.
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      const area = cardAreaRef.current;
      const wrap = cardWrapRef.current;
      if (!area || !wrap) return;
      const aRect = area.getBoundingClientRect();
      const wRect = wrap.getBoundingClientRect();
      if (!aRect.width || !aRect.height || !wRect.width || !wRect.height) return;
      const scale = Math.min(1, aRect.width / wRect.width, aRect.height / wRect.height);
      setFit({ scale: Math.max(0.2, scale), height: wRect.height * scale });
    };
    compute();
    // font & gambar butuh waktu — hitung ulang setelah muat
    const t1 = window.setTimeout(compute, 350);
    const t2 = window.setTimeout(compute, 1200);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(compute);
    ro?.observe(cardAreaRef.current);
    ro?.observe(cardWrapRef.current);
    window.addEventListener('resize', compute);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [open]);

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
      const text = `Bouquet untuk ${story?.nama} — dibuat dengan ESENEL 💐`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        setMsg('Berhasil dibagikan!');
        return;
      }
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setMsg('Gambar disalin ke clipboard — tinggal tempel di story!');
        return;
      }
      download(dataUrl);
      setMsg('Gambar terunduh — siap diunggah ke story!');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setMsg(null);
        return;
      }
      setMsg('Gagal membagikan — coba lagi.');
    } finally {
      setBusy(null);
    }
  }, [capture, story]);

  const handleDownload = useCallback(async () => {
    setBusy('download');
    setMsg(null);
    try {
      download(await capture());
      setMsg('Gambar terunduh!');
    } catch {
      setMsg('Gagal mengunduh — coba lagi.');
    } finally {
      setBusy(null);
    }
  }, [capture]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMsg('Link disalin!');
      return;
    } catch {
      // fallback input tersembunyi
    }
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      setMsg('Link disalin!');
    } catch {
      setMsg('Gagal menyalin link.');
    }
    ta.remove();
  }, [shareUrl]);

  const busyLabel = busy === 'share' ? 'MENYIAPKAN…' : busy === 'download' ? 'MENGUNDUH…' : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-pill border border-ink/20 px-4 py-2 text-[11px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink"
      >
        <Share2 size={13} />
        BAGIKAN
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6">
            {/* overlay — hampir opak + blur SANGAT pekat, dijamin menutup
                penuh meski backdrop-filter tidak didukung browser */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/95"
              style={{
                backdropFilter: 'blur(40px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
              }}
            />

            {/* panel — terpusat, fade + zoom + spring ala Aceternity */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Kartu buket"
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-ink/5 bg-cloud text-ink shadow-[0_40px_120px_-24px_rgba(0,0,0,0.65)]"
              style={{ maxHeight: 'calc(100dvh - 40px)' }}
            >
              {/* header */}
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
                <div className="min-w-0 text-left">
                  <p className="truncate font-display text-lg tracking-[-0.01em] text-ink">
                    {story?.namaBuket || story?.nama}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                    Kartu buketmu · ESENEL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>

              {/* body: kartu — diukur lalu di-scale agar muat utuh di area ini */}
              <div
                ref={cardAreaRef}
                className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#F2EEE3] px-5 py-4"
              >
                <div
                  style={fit ? { height: fit.height } : undefined}
                  className="flex items-start justify-center"
                >
                  <div
                    style={
                      fit
                        ? { transform: `scale(${fit.scale})`, transformOrigin: 'top center' }
                        : undefined
                    }
                  >
                    <div ref={cardWrapRef} className="w-[min(440px,78vw)]">
                      <EsenelResultCard story={story} imageSrc={imageSrc} imageAlt={imageAlt} />
                    </div>
                  </div>
                </div>
              </div>

              {/* footer: aksi */}
              <div className="border-t border-ink/10 px-5 py-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={busy !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[12px] font-semibold tracking-nav text-cloud transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Share2 size={14} />
                    {busy === 'share' ? busyLabel : 'BAGIKAN'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={busy !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ink/20 bg-ink/5 px-5 py-3 text-[12px] font-semibold tracking-nav text-ink/80 transition-all hover:border-ink/40 hover:text-ink active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download size={14} />
                    {busy === 'download' ? busyLabel : 'UNDUH'}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-nav text-ink/50 transition-colors hover:text-ink"
                  >
                    <Link2 size={12} />
                    SALIN LINK
                  </button>
                </div>
                {msg && <p className="mt-2 text-center text-[11px] text-ink/55">{msg}</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* klon kartu lebar untuk export PNG — di luar layar, dirender saat
          dialog terbuka supaya gambar siap begitu user menekan BAGIKAN/UNDUH */}
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
    </>
  );
}
