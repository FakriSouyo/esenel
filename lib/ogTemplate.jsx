/**
 * Template OG image bersama (satori) — dipakai route /og?page=... dan
 * /og/name/[name]. Desain minimalis tema ESENEL: latar cloud, bingkai sand,
 * aksen sudut + titik halftone + bunga pixel (warna aksen), judul Geist
 * Pixel, tagline Plus Jakarta Sans. Font diambil dari Google Fonts dengan
 * UA lama (IE11) supaya Google mengirim subset .woff — satori tidak bisa
 * parse WOFF2, hanya TTF/OTF/WOFF.
 */

import { BRAND } from '@/lib/site';

const INK = BRAND.ink;
const INK_SOFT = BRAND.inkSoft;
const CLOUD = BRAND.cloud;
const SAND = BRAND.sand;

let fontCache = null;

/** Ambil font-face dari CSS Google Fonts → daftar { url, min, max }. */
function parseFontFaces(css) {
  const blocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const seen = new Set();
  const faces = [];
  for (const b of blocks) {
    const url = b.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff)\)/)?.[1];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const w = b.match(/font-weight:\s*([\d\s]+);/)?.[1]?.trim();
    const range = w ? w.split(/\s+/).map(Number) : [400];
    faces.push({ url, min: Math.min(...range), max: Math.max(...range) });
  }
  return faces;
}

/** Font Geist Pixel + Plus Jakarta Sans (cache 1 hari), untuk ImageResponse. */
export async function loadOgFonts() {
  if (fontCache) return fontCache;
  const ua = 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko';

  const addFamily = async (family, weights) => {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap`,
      { headers: { 'user-agent': ua }, next: { revalidate: 86400 } },
    ).then((r) => r.text());
    const faces = parseFontFaces(css);
    for (const face of faces) {
      const data = await fetch(face.url, {
        next: { revalidate: 31536000 },
      }).then((r) => r.arrayBuffer());
      for (const w of weights) {
        if (w >= face.min && w <= face.max) {
          fontCache.push({ name: family, weight: w, style: 'normal', data });
        }
      }
    }
  };

  fontCache = [];
  await addFamily('Geist Pixel', [400]);
  await addFamily('Plus Jakarta Sans', [400, 500, 600, 700]);
  return fontCache;
}

/** Bunga pixel 3×3 — petal aksen + pusat ink (tanpa glyph, aman di satori). */
function PixelFlower({ size = 84, color }) {
  const cell = size / 3;
  const petals = [
    [0, 1],
    [1, 0],
    [1, 2],
    [2, 1],
  ];
  return (
    <div style={{ width: size, height: size, display: 'flex', flexWrap: 'wrap' }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        const isPetal = petals.some(([pr, pc]) => pr === r && pc === c);
        const isCenter = r === 1 && c === 1;
        const bg = isCenter ? INK : isPetal ? color : 'transparent';
        return (
          <div
            key={i}
            style={{
              width: cell,
              height: cell,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: cell * 0.74,
                height: cell * 0.74,
                borderRadius: cell * 0.24,
                backgroundColor: bg,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Klaster titik halftone kecil — aksen di pojok kanan atas. */
function HalftoneDots({ rows = 3, cols = 5, gap = 14, size = 6, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap, justifyContent: 'flex-end' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              style={{
                width: size,
                height: size,
                borderRadius: 999,
                backgroundColor: color,
                opacity: Math.max(0.15, 1 - (r + c) * 0.14),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Konten kartu OG 1200×630. `eyebrow` atas, `title` besar Geist Pixel,
 * rule aksen, `tagline` Plus Jakarta Sans, wordmark + bunga pixel bawah.
 *
 * Kalau `image` diisi (data URI gambar buket hasil generate), layout jadi
 * dua kolom: teks di kiri, foto buket di kanan — OG link hasil generate
 * langsung menampilkan buketnya, bukan cuma teks.
 */
export function OgCard({ eyebrow = 'ESENEL · FLEUR ATELIER', title, tagline, accent = BRAND.meadow, image }) {
  const showImage = Boolean(image);
  // Judul pixel diskalakan agar nama panjang tetap muat; dengan foto di
  // samping kolom teks lebih sempit, jadi ukurannya lebih kecil dan teks
  // boleh wrap ke 2 baris kalau nama sangat panjang.
  const len = String(title || '').length;
  const titleSize = showImage
    ? len > 18 ? 40 : len > 12 ? 52 : len > 9 ? 64 : 78
    : len > 12 ? 84 : len > 9 ? 104 : 132;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: CLOUD,
        color: INK,
        fontFamily: 'Plus Jakarta Sans',
      }}
    >
      {/* bingkai tipis + aksen sudut */}
      <div style={{ position: 'absolute', inset: 44, border: '1.5px solid ' + SAND }} />
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: 44,
          width: 16,
          height: 16,
          borderTop: '4px solid ' + accent,
          borderLeft: '4px solid ' + accent,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          right: 44,
          width: 16,
          height: 16,
          borderBottom: '4px solid ' + accent,
          borderRight: '4px solid ' + accent,
        }}
      />

      {/* konten */}
      <div
        style={{
          position: 'absolute',
          top: 108,
          left: 100,
          right: 100,
          bottom: 100,
          display: 'flex',
          flexDirection: showImage ? 'row' : 'column',
          justifyContent: 'space-between',
          gap: showImage ? 60 : 0,
          alignItems: showImage ? 'center' : 'stretch',
        }}
      >
        {/* kolom teks */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* baris atas: eyebrow + titik */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 20, letterSpacing: '0.42em', color: INK_SOFT, fontWeight: 500 }}>
              {eyebrow}
            </div>
            <HalftoneDots color={accent} />
          </div>

          {/* judul + rule + tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div
              style={{
                fontFamily: 'Geist Pixel',
                fontSize: titleSize,
                lineHeight: 1.08,
                letterSpacing: '0.01em',
                color: INK,
                maxWidth: showImage ? 520 : 980,
                whiteSpace: 'pre-wrap',
              }}
            >
              {title}
            </div>
            <div
              style={{
                width: 92,
                height: 5,
                backgroundColor: accent,
                marginTop: showImage ? 30 : 38,
                marginBottom: showImage ? 24 : 30,
              }}
            />
            <div
              style={{
                fontSize: showImage ? 26 : 30,
                lineHeight: 1.55,
                color: INK_SOFT,
                maxWidth: showImage ? 560 : 780,
              }}
            >
              {tagline}
            </div>
          </div>

          {/* baris bawah: wordmark + bunga pixel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 16, letterSpacing: '0.32em', color: INK_SOFT, fontWeight: 500 }}>
              FLEUR ATELIER
            </div>
            <PixelFlower size={showImage ? 68 : 88} color={accent} />
          </div>
        </div>

        {/* foto buket hasil generate (kalau ada) */}
        {showImage && (
          <div
            style={{
              width: 430,
              height: 430,
              flexShrink: 0,
              borderRadius: 28,
              overflow: 'hidden',
              border: '2px solid ' + SAND,
              backgroundColor: SAND,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={image}
              width={430}
              height={430}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
