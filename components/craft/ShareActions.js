'use client';

/**
 * Aksi bagikan tanpa dialog — muncul sebagai TEKS di bawah tombol utama
 * (CHECKOUT / TULIS NAMA LAIN). Klik teksnya → card kecil melebar (expand)
 * berisi dua tombol:
 *   BAGIKAN — Web Share API (kirim PNG kartu ke story/media sosial),
 *             fallback ke clipboard / unduh.
 *   UNDUH   — simpan PNG kartu ke device.
 *
 * Default TERTUTUP — user sendiri yang membuka (expand). Tidak ada modal/
 * dialog sama sekali; card-nya inline mengikuti alur halaman.
 *
 * Export PNG memakai html-to-image terhadap klon kartu yang dirender lebar
 * (1080px) di luar layar (hanya saat card terbuka). Foto di-inline dulu
 * menjadi data URL sebelum export, supaya UNDUH/BAGIKAN selalu berisi gambar
 * buket asli, bukan placeholder ✿.
 */

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { ChevronDown, Download, Share2 } from 'lucide-react';
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

export default function ShareActions({ story, imageSrc, imageAlt }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // 'share' | 'download' | null
  const [msg, setMsg] = useState(null);
  const exportRef = useRef(null);

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

  const busyLabel = busy === 'share' ? 'MENYIAPKAN…' : busy === 'download' ? 'MENGUNDUH…' : null;

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
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[11px] font-semibold tracking-nav text-cloud transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
                >
                  <Share2 size={13} />
                  {busy === 'share' ? busyLabel : 'BAGIKAN'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/20 bg-ink/5 px-4 py-2.5 text-[11px] font-semibold tracking-nav text-ink/80 transition-all hover:border-ink/40 hover:text-ink active:scale-[0.98] disabled:opacity-50"
                >
                  <Download size={13} />
                  {busy === 'download' ? busyLabel : 'UNDUH'}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-ink/45">
                Kartu PNG siap dibagikan ke story atau disimpan.
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
    </>
  );
}
