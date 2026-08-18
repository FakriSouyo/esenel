'use client';

/**
 * Kartu hasil generate nama — desain pixel-art "EsenelCard" (kartu kiri gelap
 * + panel kanan terang dengan tepi zig-zag). Data diambil dari story yang
 * sudah kita punya:
 *   - kiri: eyebrow, headline (nama input, font Geist Pixel), foto buket,
 *           nama buket, blurb (cerita), MADE WITH LOVE + swatches brand;
 *   - kanan: ARTI NAMA, MAKNA NAMA (tanpa ikon bintang), BUNGA YANG COCOK.
 *
 * Tweak sesuai permintaan:
 *   - teks rata kiri (bukan justify);
 *   - cerita & teks section tampil PENUH (tanpa line-clamp) — kartu tumbuh
 *     mengikuti isi, jadi cerita tidak pernah kepotong;
 *   - MAKNA NAMA tanpa ikon bintang;
 *   - daftar bunga: font kecil, swatch KOTAK rounded (bukan bulat);
 *   - foto bisa diklik → dialog perbesar (onPhotoClick).
 */

import { useEffect, useRef, useState } from 'react';

const BRAND = {
  ink: '#20221E',
  inkSoft: '#4A4B44',
  inkFaint: 'rgba(32,34,30,0.22)',
  cream: '#F6F3EA',
  creamSoft: 'rgba(246,243,234,0.8)',
  creamFaint: 'rgba(246,243,234,0.26)',
  bgLight: '#F2EEE3',
  earth: '#A58F78',
  meadow: '#B6C5A8',
  sand: '#DED4C2',
  sky: '#A9C9D8',
};

const DEFAULT_SWATCHES = [BRAND.ink, BRAND.earth, BRAND.meadow, BRAND.sky];

/** Warna per bunga: baca kata warna dari namaEn/nama/alasan, fallback palette. */
const COLOR_WORDS = [
  { words: ['merah', 'red', 'crimson', 'scarlet', 'ruby'], color: '#C0392B' },
  { words: ['putih', 'white', 'ivory'], color: '#F2EFE7' },
  { words: ['pink', 'rose', 'salmon', 'merah muda'], color: '#E8A0B4' },
  { words: ['lavender', 'ungu', 'purple', 'violet', 'lilac'], color: '#B79AC9' },
  { words: ['kuning', 'yellow', 'golden', 'gold', 'sun'], color: '#E7C25A' },
  { words: ['blue', 'biru', 'sky', 'azure'], color: '#7FA8C9' },
  { words: ['orange', 'peach', 'apricot'], color: '#E89B5A' },
  { words: ['hijau', 'green', 'sage', 'mint'], color: '#9BB08A' },
  { words: ['dusty', 'grey', 'abu', 'silver'], color: '#A8A49A' },
];

const FALLBACK_PALETTE = [
  '#C96F4A',
  '#E8C4A0',
  '#B6C5A8',
  '#A9C9D8',
  '#D9A7B0',
  '#8B8087',
  '#E0D2A6',
  '#C2B0D6',
];

function flowerColor(flower, index) {
  const text = `${flower?.nama || ''} ${flower?.namaEn || ''} ${flower?.alasan || ''}`.toLowerCase();
  for (const entry of COLOR_WORDS) {
    if (entry.words.some((w) => text.includes(w))) return entry.color;
  }
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

const STYLE = `
  .ec-stage {
    container-type: inline-size;
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    --cream: ${BRAND.cream};
    --cream-soft: ${BRAND.creamSoft};
    --cream-faint: ${BRAND.creamFaint};
    --bg-light: ${BRAND.bgLight};
    --ink: ${BRAND.ink};
    --ink-soft: ${BRAND.inkSoft};
    --ink-faint: ${BRAND.inkFaint};
  }

  .ec-card {
    position: relative;
    display: grid;
    grid-template-columns: 53.4% 46.6%;
    width: 100%;
    background: var(--bg-light);
    color: var(--ink);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 24px 60px -32px rgba(32, 34, 30, 0.45);
  }

  /* ---------- grain halftone ---------- */
  .ec-grain {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0.5;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.5'/></svg>");
    background-size: 160px 160px;
  }

  /* ---------- halftone corner dots ---------- */
  .ec-dots {
    position: absolute;
    z-index: 1;
    pointer-events: none;
    background-image: radial-gradient(currentColor 1.15px, transparent 1.6px);
    background-size: 7px 7px;
  }
  .ec-dots.ec-tl {
    top: 0; left: 0; width: 34%; height: 16%;
    color: rgba(220, 216, 204, 0.4);
    -webkit-mask-image: radial-gradient(circle at 0% 0%, #000 0%, transparent 78%);
    mask-image: radial-gradient(circle at 0% 0%, #000 0%, transparent 78%);
  }
  .ec-dots.ec-br {
    bottom: 0; right: 0; width: 20%; height: 42%;
    color: rgba(48, 47, 41, 0.3);
    -webkit-mask-image: radial-gradient(circle at 100% 100%, #000 0%, transparent 75%);
    mask-image: radial-gradient(circle at 100% 100%, #000 0%, transparent 75%);
  }
  .ec-dots.ec-rspine {
    top: 0; right: 0; width: 4%; height: 100%;
    color: rgba(48, 47, 41, 0.32);
    -webkit-mask-image: linear-gradient(to left, #000 0%, transparent 100%);
    mask-image: linear-gradient(to left, #000 0%, transparent 100%);
  }

  /* ---------- LEFT PANEL ---------- */
  .ec-left {
    position: relative;
    z-index: 0;
    padding: 6.4cqw 8.4cqw 5cqw 7.2cqw;
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: var(--cream);
    background: linear-gradient(160deg, #262823 0%, var(--ink) 70%);
  }

  .ec-eyebrow {
    font-size: 1.55cqw;
    letter-spacing: 0.42em;
    color: var(--cream-soft);
    font-weight: 500;
    text-align: left;
  }

  .ec-headline {
    font-family: 'Geist Pixel', 'Geist Mono', monospace;
    font-size: 12.2cqw;
    line-height: 0.86;
    letter-spacing: 0.005em;
    color: var(--cream);
    margin-top: 1.6cqw;
    -webkit-font-smoothing: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
    text-align: left;
  }

  .ec-headline-rule {
    width: 17%;
    height: 2px;
    background: var(--cream-soft);
    margin: 3.4cqw 0 4.4cqw 0.5%;
  }

  .ec-photo-frame {
    position: relative;
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    border-radius: 16px;
    overflow: hidden;
    background: #8b8087;
  }
  .ec-photo-frame img {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 18%;
    display: block;
  }
  .ec-photo-click {
    cursor: zoom-in;
  }
  .ec-photo-click:hover::after {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 2px rgba(246, 243, 234, 0.5);
    border-radius: 16px;
    pointer-events: none;
  }
  .ec-photo-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, ${BRAND.meadow} 0%, ${BRAND.sky} 100%);
    color: rgba(248, 249, 245, 0.85);
    font-family: 'Geist Pixel', monospace;
    font-size: 18cqw;
  }

  .ec-identity {
    margin-top: 5.4cqw;
    min-width: 0;
  }
  .ec-identity-value {
    font-family: 'Geist Pixel', 'Geist Mono', monospace;
    font-size: 6.6cqw;
    font-weight: 400;
    color: var(--cream);
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .ec-hr {
    height: 1px;
    background: var(--cream-faint);
    margin: 3.6cqw 0 4.4cqw 0;
  }

  .ec-blurb {
    font-size: 2.05cqw;
    line-height: 1.6;
    color: var(--cream-soft);
    max-width: 96%;
    text-align: left;
  }

  .ec-spacer {
    flex: 1 1 auto;
    min-height: 3cqw;
  }

  .ec-madewith {
    font-size: 1.55cqw;
    letter-spacing: 0.24em;
    color: var(--cream-soft);
    font-weight: 500;
    margin-top: 6cqw;
    margin-bottom: 2.6cqw;
    text-align: left;
  }
  .ec-swatches {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2.2%;
    height: 4.2cqw;
    justify-items: start;
  }
  .ec-swatches span {
    display: block;
    height: 100%;
    border-radius: 1.2cqw;
  }

  /* ---------- RIGHT PANEL ---------- */
  .ec-right {
    position: relative;
    z-index: 0;
    background: var(--bg-light);
    color: var(--ink);
    padding: 4.8cqw 5.6cqw 4.4cqw 7.6cqw;
    display: flex;
    flex-direction: column;
    min-width: 0;
    clip-path: polygon(0.0% 0.0%, 1.1% 3.85%, 0.51% 7.69%, 2.21% 11.54%, 0.25% 15.38%, 1.82% 19.23%, 1.24% 23.08%, 0.2% 26.92%, 1.73% 30.77%, 0.13% 34.62%, 1.47% 38.46%, 0.24% 42.31%, 0.31% 46.15%, 1.44% 50.0%, 2.81% 53.85%, 0.42% 57.69%, 0.76% 61.54%, 2.13% 65.38%, 3.22% 69.23%, 1.96% 73.08%, 1.35% 76.92%, 3.32% 80.77%, 0.16% 84.62%, 2.92% 88.46%, 0.98% 92.31%, 0.49% 96.15%, 0.0% 100.0%, 100% 100%, 100% 0%);
  }

  .ec-section-label {
    font-size: 1.55cqw;
    letter-spacing: 0.16em;
    font-weight: 700;
    color: var(--ink);
    text-transform: uppercase;
    text-align: left;
  }
  .ec-section-rule {
    width: 15%;
    height: 2px;
    background: var(--ink);
    margin: 1.3cqw 0 2cqw 0;
  }
  .ec-section-body {
    font-size: 1.84cqw;
    line-height: 1.46;
    color: var(--ink-soft);
    text-align: left;
  }

  .ec-arti {
    margin-bottom: 2.6cqw;
  }

  .ec-makna {
    margin-bottom: 2.6cqw;
  }

  .ec-bunga {
    margin-top: 2.6cqw;
  }
  .ec-bunga-table {
    margin-top: 1.4cqw;
    border: 1px solid var(--ink-faint);
  }
  .ec-bunga-row {
    display: flex;
    align-items: center;
    gap: 2.4cqw;
    padding: 1.5cqw 2.2cqw;
    border-bottom: 1px solid var(--ink-faint);
    text-align: left;
  }
  .ec-bunga-name-wrap {
    flex: 1 1 auto;
    min-width: 0;
    text-align: left;
  }
  .ec-bunga-row:last-child {
    border-bottom: none;
  }
  .ec-bunga-dot {
    flex: 0 0 auto;
    width: 3.8cqw;
    height: 3.8cqw;
    border-radius: 0.9cqw; /* kotak kecil rounded, bukan bulat */
  }
  .ec-bunga-name {
    font-family: 'Geist Pixel', 'Geist Mono', monospace;
    font-size: 1.85cqw;
    font-weight: 400;
    color: var(--ink);
    letter-spacing: 0.005em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }
  .ec-bunga-en {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.35cqw;
    font-weight: 400;
    color: var(--ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    margin-top: 0.6cqw;
  }
`;

/** Sesuaikan ukuran headline pixel agar muat satu baris di panel kiri. */
function useFitHeadline(ref, text) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      if (!el.isConnected) return;
      el.style.fontSize = '';
      const base = parseFloat(getComputedStyle(el).fontSize) || 40;
      el.style.fontSize = `${base}px`;
      let px = base;
      // container-query font-size sudah ter-render → mulai dari ukuran itu
      while (px > 9 && el.scrollWidth > el.clientWidth + 1) {
        px -= 0.5;
        el.style.fontSize = `${px}px`;
      }
      setReady(true);
    };
    // tunggu font pixel ter-load supaya ukuran final akurat
    const t = window.setTimeout(fit, 60);
    document.fonts?.ready?.then(fit).catch(() => {});
    return () => window.clearTimeout(t);
  }, [ref, text]);
  return ready;
}

export default function EsenelResultCard({
  story,
  imageSrc,
  imageAlt,
  onPhotoClick,
  swatches = DEFAULT_SWATCHES,
  maxWidth = '620px',
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const headlineRef = useRef(null);
  useFitHeadline(headlineRef, story?.nama || '');

  const name = story?.nama || '';
  const bouquet = story?.namaBuket || name;
  const flowers = story?.bunga || [];
  const photoOk = Boolean(imageSrc) && !imgFailed;

  return (
    <>
      <style>{STYLE}</style>
      <div className="ec-stage" style={{ maxWidth }}>
        <div className="ec-card">
          {/* ============ LEFT ============ */}
          <div className="ec-left">
            <div className="ec-eyebrow">ESENEL · FLEUR ATELIER</div>
            <div className="ec-headline" ref={headlineRef}>
              {name}
            </div>
            <div className="ec-headline-rule" />

            <button
              type="button"
              onClick={onPhotoClick}
              disabled={!photoOk && !onPhotoClick}
              aria-label={onPhotoClick ? 'Perbesar gambar buket' : undefined}
              className={`ec-photo-frame ${onPhotoClick && photoOk ? 'ec-photo-click' : ''}`}
              style={!onPhotoClick ? { pointerEvents: 'none' } : undefined}
            >
              {/* Fallback ✿ selalu dirender di belakang foto — kalau foto
                  gagal dimuat/di-export (CORS), tinggal menyembunyikan <img>
                  dan fallback langsung terlihat. */}
              <div className="ec-photo-fallback">✿</div>
              {photoOk && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={imageAlt || `Buket ${bouquet}`}
                  onError={() => setImgFailed(true)}
                />
              )}
            </button>

            <div className="ec-identity">
              <div className="ec-identity-value">{bouquet}</div>
            </div>

            <div className="ec-hr" />

            <p className="ec-blurb">{story?.cerita || ''}</p>

            <div className="ec-spacer" />

            <div className="ec-madewith">MADE WITH LOVE</div>
            <div className="ec-swatches">
              {swatches.map((c, i) => (
                <span key={i} style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* ============ RIGHT ============ */}
          <div className="ec-right">
            <div className="ec-arti">
              <div className="ec-section-label">Arti Nama</div>
              <div className="ec-section-rule" />
              <p className="ec-section-body">{story?.artiNama || ''}</p>
            </div>

            <div className="ec-makna">
              <div className="ec-section-label">Makna Nama</div>
              <div className="ec-section-rule" />
              <p className="ec-section-body">{story?.maknaNama || ''}</p>
            </div>

            <div className="ec-bunga">
              <div className="ec-section-label">Bunga yang Cocok</div>
              <div className="ec-bunga-table">
                {flowers.map((f, i) => (
                  <div className="ec-bunga-row" key={i}>
                    <span
                      className="ec-bunga-dot"
                      style={{ background: flowerColor(f, i) }}
                    />
                    <div className="ec-bunga-name-wrap">
                      <div className="ec-bunga-name">{f?.namaPuitis || f?.nama || ''}</div>
                      {f?.namaEn ? <div className="ec-bunga-en">{f.namaEn}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ec-dots ec-tl" />
          <div className="ec-dots ec-br" />
          <div className="ec-dots ec-rspine" />
          <div className="ec-grain" />
        </div>
      </div>
    </>
  );
}
