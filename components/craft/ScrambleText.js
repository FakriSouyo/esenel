'use client';

import { useEffect, useRef, useState } from 'react';

/** Durasi animasi scramble (ms) — dipakai juga oleh parent untuk timing. */
export const SCRAMBLE_MS = 2200;

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Teks yang "diacak" lalu settle jadi teks asli (randomize text reveal).
 * Saat inactive: tampil redup tanpa animasi. Saat active: huruf acak
 * berjalan dari kiri ke kanan sampai seluruh nama terbaca.
 */
export default function ScrambleText({ text, active, className = '' }) {
  const [display, setDisplay] = useState('');
  const raf = useRef(null);

  useEffect(() => {
    if (!active) {
      // kosong dulu — nama baru muncul lewat animasi scramble, bukan
      // terlihat penuh sebelum reveal.
      setDisplay('');
      return;
    }
    const target = text || '';
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / SCRAMBLE_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      const resolvedCount = Math.floor(eased * (target.length + 1));
      let out = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch === ' ') {
          out += ' ';
          continue;
        }
        if (i < resolvedCount) {
          out += ch;
        } else {
          // huruf yang belum settle: kadang sudah "nyaris" benar
          const near = i === resolvedCount && Math.random() < 0.45;
          out += near ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      setDisplay(out);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, text]);

  return (
    <span className={className} aria-hidden={active}>
      {display}
    </span>
  );
}
