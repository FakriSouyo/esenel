'use client';

/**
 * Tombol "BAGIKAN" → dialog berisi kartu hasil (EsenelResultCard) + aksi:
 *   SHARE      — Web Share API (kirim PNG kartu ke story/media sosial),
 *                fallback ke clipboard / unduh.
 *   UNDUH      — simpan PNG kartu ke device.
 *   SALIN LINK — salin link /craft/name/<nameKey> (OG image dinamis menampilkan
 *                nama buket hasil generate + deskripsi singkat).
 *
 * Export PNG memakai html-to-image terhadap klon kartu yang dirender lebar
 * (1080px) di luar layar — jadi hasilnya tajam meski kartu preview kecil.
 * Kalau foto buket gagal di-inline (CORS storage), export otomatis memakai
 * fallback ✿ (selalu dirender di belakang foto oleh EsenelResultCard).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const exportRef = useRef(null);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const key = nameKey || 'nama';
    return `${window.location.origin}/craft/name/${encodeURIComponent(key)}`;
  }, [nameKey]);

  // Escape menutup dialog; tandai <body> supaya Escape halaman (kembali ke
  // /craft) tidak ikut jalan saat dialog terbuka.
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

  const capture = useCallback(async () => {
    const container = exportRef.current;
    if (!container) throw new Error('Kartu belum siap');
    // Ambil .ec-stage di dalam container, BUKAN container-nya: container
    // punya left:-10000px (untuk menyembunyikan), dan html-to-image menyalin
    // posisi itu ke klon SVG → isi kartu jadi 10000px di luar viewport
    // (hasil export kosong). Stage tidak punya posisi negatif.
    const node = container.querySelector('.ec-stage') || container;
    const fontEmbedCSS = await buildFontEmbedCSS();
    const opts = { pixelRatio: 1, cacheBust: true, backgroundColor: '#F8F9F5', fontEmbedCSS };
    try {
      return await toPng(node, opts);
    } catch {
      // Foto kemungkinan gagal di-inline (CORS storage) → sembunyikan dan
      // pakai fallback ✿ yang sudah dirender di belakang foto.
      const img = node.querySelector('.ec-photo-frame img');
      if (img) img.style.display = 'none';
      try {
        return await toPng(node, { ...opts, cacheBust: false });
      } finally {
        if (img) img.style.display = '';
      }
    }
  }, []);

  const download = (dataUrl) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName(story);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = useCallback(async () => {
    setBusy(true);
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
      setBusy(false);
    }
  }, [capture, story]);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      download(await capture());
      setMsg('Gambar terunduh!');
    } catch {
      setMsg('Gagal mengunduh — coba lagi.');
    } finally {
      setBusy(false);
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

      {open && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Kartu buket"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-cloud p-3 shadow-2xl"
          >
            {/* header */}
            <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
              <div className="min-w-0 text-left">
                <p className="font-display text-base tracking-[-0.01em] text-ink">
                  Kartu buketmu
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                  {story?.namaBuket || story?.nama} · ESENEL
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

            {/* kartu preview — bisa di-scroll kalau lebih tinggi dari dialog */}
            <div className="no-scrollbar -mx-1 overflow-y-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <EsenelResultCard story={story} imageSrc={imageSrc} imageAlt={imageAlt} />
            </div>

            {/* aksi */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              <button
                type="button"
                onClick={handleShare}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-[11px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90 disabled:opacity-50"
              >
                <Share2 size={13} />
                {busy ? 'MENYIAPKAN…' : 'SHARE'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-pill border border-ink/20 px-4 py-2 text-[11px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink disabled:opacity-50"
              >
                <Download size={13} />
                UNDUH
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-pill border border-ink/20 px-4 py-2 text-[11px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink"
              >
                <Link2 size={13} />
                SALIN LINK
              </button>
            </div>
            {msg && <p className="pt-2 text-center text-[11px] text-ink/55">{msg}</p>}
          </div>
        </div>
      )}

      {/* klon kartu lebar untuk export PNG — di luar layar, dirender saat
          dialog terbuka supaya gambar siap begitu user menekan SHARE/UNDUH */}
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
