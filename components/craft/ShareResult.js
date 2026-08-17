'use client';

/**
 * Kartu hasil "Buat bunga dari namamu" — format Instagram Story 1080×1920.
 * Digambar manual ke <canvas> (tanpa dependency gambar-ke-png), berisi:
 *   nama, foto buket hasil generate, nama buket, arti nama, makna nama,
 *   daftar bunga yang cocok, dan footer "Made with love by ESENEL".
 *
 * Dua tombol:
 *   BAGIKAN HASIL — Web Share API (kirim file PNG ke IG story); kalau device
 *                   tidak mendukung file share, salin ke clipboard.
 *   UNDUH HASIL   — simpan PNG langsung ke device.
 */

import { useState } from 'react';
import { Share2 } from 'lucide-react';

const W = 1080;
const H = 1920;
const PAD = 72;
const MAXW = W - PAD * 2;

const C = {
  ink: '#20221E',
  earth: '#A58F78',
  earthDeep: '#8A7A64',
  meadow: '#B6C5A8',
  sand: '#DED4C2',
  cloud: '#F8F9F5',
  white: '#FFFFFF',
};

const DISPLAY_FONT = '"Geist Pixel", monospace';
const BODY_FONT = '"Plus Jakarta Sans", sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function truncateLines(ctx, text, maxWidth, maxLines) {
  const lines = wrapText(ctx, text, maxWidth);
  if (lines.length <= maxLines) return lines;
  const out = lines.slice(0, maxLines);
  let last = out[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
    last = last.slice(0, -1);
  }
  out[maxLines - 1] = `${last}…`;
  return out;
}

function fitFontSize(ctx, text, baseSize, maxWidth, font) {
  let size = baseSize;
  ctx.font = `400 ${size}px ${font}`;
  while (size > 22 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `400 ${size}px ${font}`;
  }
  return size;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function setLetterSpacing(ctx, px) {
  try {
    ctx.letterSpacing = `${px}px`;
  } catch {
    // browser lama — abaikan
  }
}

async function preloadFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 80px Geist Pixel'),
      document.fonts.load('500 40px "Plus Jakarta Sans"'),
      document.fonts.load('600 40px "Plus Jakarta Sans"'),
      document.fonts.load('700 40px "Plus Jakarta Sans"'),
    ]);
  } catch {
    // fonts tetap dipakai dengan fallback sistem
  }
}

/** Gambar satu blok: label kecil + teks yang di-wrap, kembalikan y terakhir. */
function textBlock(ctx, label, text, x, y, maxLines) {
  ctx.font = `600 20px ${BODY_FONT}`;
  setLetterSpacing(ctx, 4);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.earthDeep;
  ctx.fillText(label, x, y);
  setLetterSpacing(ctx, 0);
  y += 46;
  const lines = truncateLines(ctx, text, MAXW, maxLines);
  ctx.font = `500 32px ${BODY_FONT}`;
  ctx.fillStyle = C.ink;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += 50;
  }
  return y;
}

/**
 * Gambar kartu story ke canvas. Mengembalikan Promise; lempar error
 * SecurityError kalau foto menodai canvas (CORS) — panggil ulang tanpa foto.
 */
export async function drawStoryCard(canvas, { story, imageUrl, fallbackImage } = {}) {
  const ctx = canvas.getContext('2d');
  await preloadFonts();

  // ---- latar: gradien krem hangat + glow sage lembut ----
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, C.cloud);
  bg.addColorStop(0.55, '#F1EEE6');
  bg.addColorStop(1, '#E6DECE');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 140, 0, W / 2, 140, 720);
  glow.addColorStop(0, 'rgba(182,197,168,0.38)');
  glow.addColorStop(1, 'rgba(182,197,168,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 760);

  // ---- eyebrow + nama ----
  let y = 118;
  ctx.font = `700 22px ${BODY_FONT}`;
  setLetterSpacing(ctx, 8);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.earthDeep;
  ctx.fillText('ESENEL · BUAT BUNGA DARI NAMAMU', W / 2, y);
  setLetterSpacing(ctx, 0);
  y += 92;

  const name = story?.nama || '';
  const nameSize = fitFontSize(ctx, name, 106, MAXW, DISPLAY_FONT);
  ctx.font = `400 ${nameSize}px ${DISPLAY_FONT}`;
  ctx.fillStyle = C.ink;
  ctx.fillText(name, W / 2, y);
  y += 44;

  // garis aksen pendek di bawah nama
  ctx.strokeStyle = C.earth;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 46, y);
  ctx.lineTo(W / 2 + 46, y);
  ctx.stroke();
  y += 62;

  // ---- foto buket ----
  const img = (await loadImage(imageUrl)) || (await loadImage(fallbackImage));
  const imgSize = 560;
  const imgX = (W - imgSize) / 2;
  const imgY = y;

  ctx.fillStyle = 'rgba(32,34,30,0.12)';
  roundRect(ctx, imgX + 10, imgY + 16, imgSize, imgSize, 36);
  ctx.fill();

  ctx.fillStyle = C.white;
  roundRect(ctx, imgX - 12, imgY - 12, imgSize + 24, imgSize + 24, 44);
  ctx.fill();

  roundRect(ctx, imgX, imgY, imgSize, imgSize, 32);
  if (img) {
    ctx.save();
    ctx.clip();
    const scale = Math.max(imgSize / img.width, imgSize / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, imgX - (dw - imgSize) / 2, imgY - (dh - imgSize) / 2, dw, dh);
    ctx.restore();
  } else {
    const g = ctx.createLinearGradient(imgX, imgY, imgX + imgSize, imgY + imgSize);
    g.addColorStop(0, C.meadow);
    g.addColorStop(1, '#A9C9D8');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(248,249,245,0.85)';
    ctx.font = `400 200px ${DISPLAY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('✿', W / 2, imgY + imgSize / 2 + 74);
  }
  y = imgY + imgSize + 64;

  // ---- nama buket ----
  ctx.font = `600 20px ${BODY_FONT}`;
  setLetterSpacing(ctx, 4);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.earthDeep;
  ctx.fillText('NAMA BUKET', PAD, y);
  setLetterSpacing(ctx, 0);
  y += 54;
  const bk = story?.namaBuket || '';
  const bkSize = fitFontSize(ctx, bk, 74, MAXW, DISPLAY_FONT);
  ctx.font = `400 ${bkSize}px ${DISPLAY_FONT}`;
  ctx.fillStyle = C.ink;
  ctx.fillText(bk, PAD, y);
  y += 52;

  // divider
  ctx.strokeStyle = 'rgba(165,143,120,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 46;

  // ---- arti & makna ----
  y = textBlock(ctx, 'ARTI NAMA', story?.artiNama, PAD, y, 3);
  y += 34;
  y = textBlock(ctx, 'MAKNA NAMA', story?.maknaNama, PAD, y, 4);
  y += 30;

  // ---- bunga yang cocok (chips) ----
  ctx.font = `600 20px ${BODY_FONT}`;
  setLetterSpacing(ctx, 4);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.earthDeep;
  ctx.fillText('BUNGA YANG COCOK', PAD, y);
  setLetterSpacing(ctx, 0);
  y += 40;

  const chips = (story?.bunga || []).map((b) => String(b?.nama || '')).filter(Boolean);
  let chipFont = 27;
  let chipH = 56;
  ctx.font = `500 ${chipFont}px ${BODY_FONT}`;
  let cx = PAD;
  let cy = y;
  for (const chip of chips) {
    const tw = ctx.measureText(chip).width;
    const cw = tw + 52;
    if (cx + cw > W - PAD && cx > PAD) {
      cx = PAD;
      cy += chipH + 18;
      // kalau baris berikutnya sudah hampir mentok footer, kecilkan chip
      if (cy + chipH > H - 170 && chipFont > 21) {
        chipFont -= 3;
        chipH = Math.round(chipH * 0.92);
        ctx.font = `500 ${chipFont}px ${BODY_FONT}`;
      }
    }
    ctx.fillStyle = 'rgba(182,197,168,0.45)';
    roundRect(ctx, cx, cy - chipH + 8, cw, chipH, chipH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(165,143,120,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.fillText(chip, cx + 26, cy + 2);
    cx += cw + 16;
  }

  // ---- footer: Made with love by ESENEL ----
  const fy = H - 148;
  ctx.strokeStyle = 'rgba(165,143,120,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, fy - 46);
  ctx.lineTo(W - PAD, fy - 46);
  ctx.stroke();
  ctx.font = `700 21px ${BODY_FONT}`;
  setLetterSpacing(ctx, 5);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.fillText('MADE WITH LOVE BY ESENEL', W / 2, fy);
  setLetterSpacing(ctx, 0);
  ctx.font = `500 18px ${BODY_FONT}`;
  ctx.fillStyle = C.earthDeep;
  ctx.fillText('Buat bunga dari namamu', W / 2, fy + 38);
}

/** Hasilkan data URL PNG kartu story; retry tanpa foto kalau foto menodai canvas. */
export async function storyCardDataUrl({ story, imageUrl, fallbackImage }) {
  const render = async (withImg) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    await drawStoryCard(canvas, {
      story,
      imageUrl: withImg ? imageUrl : null,
      fallbackImage: withImg ? fallbackImage : null,
    });
    return canvas.toDataURL('image/png');
  };
  try {
    return await render(true);
  } catch (err) {
    if (err && err.name === 'SecurityError') return render(false);
    throw err;
  }
}

function fileName(story) {
  const base = String(story?.nama || 'nama')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `buket-${base || 'nama'}.png`;
}

export default function ShareResultButtons({ story, imageUrl, fallbackImage }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const download = (dataUrl) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName(story);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await storyCardDataUrl({ story, imageUrl, fallbackImage });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName(story), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Buket ${story?.namaBuket || story?.nama}`,
          text: `Bouquet untuk ${story?.nama} — dibuat dengan ESENEL 💐`,
        });
        setMsg('Berhasil dibagikan!');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setMsg('Gambar disalin ke clipboard — tinggal tempel di story!');
        return;
      }
      // fallback: unduh PNG langsung (inilah fungsi "unduh" yang diminta)
      download(dataUrl);
      setMsg('Gambar terunduh — siap diunggah ke story!');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setMsg(null); // user batal — tidak perlu pesan
        return;
      }
      setMsg('Gagal berbagi — coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-pill border border-ink/20 bg-cloud px-4 py-2 text-[11px] font-medium tracking-nav text-ink transition-colors hover:border-ink/45 disabled:opacity-50"
      >
        <Share2 size={13} />
        {busy ? 'MENYIAPKAN…' : 'BAGIKAN HASIL'}
      </button>
      {msg && <p className="mt-1.5 text-[11px] text-ink/55">{msg}</p>}
    </div>
  );
}
