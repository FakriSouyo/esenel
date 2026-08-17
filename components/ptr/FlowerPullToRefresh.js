'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom pull-to-refresh — MOBILE ONLY (pointer: coarse).
 *
 * Animasi bunga pixel-art 240 frame (public/floral-ptr.mp4) di-scrub oleh
 * jarak tarikan jari, lalu perayaan (frame 211–240) diputar saat user
 * melepas pada pull maksimal → halaman di-reload.
 *
 * Optimasi:
 *  - Video (3.2MB) di-lazy-mount: baru diunduh saat jari pertama kali
 *    menarik, bukan saat halaman dibuka.
 *  - H.264 MP4 (support semua mobile, termasuk iOS lama) + poster kecil.
 *  - Native pull-to-refresh browser dimatikan (overscroll-behavior + touch
 *    preventDefault), jadi preloader kata di homepage tidak ikut muncul
 *    saat pull — reload lewat sini menandai sessionStorage (esenel.ptr)
 *    yang dibaca Preloader untuk melewati animasi kata.
 */

const VIDEO_SRC = '/floral-ptr.mp4';
const POSTER_SRC = '/floral-ptr-poster.webp';
const THRESHOLD = 96; // px tarikan jari untuk mencapai pull 100%
const FPS = 24;
const SCRUB_FRAMES = 210; // frame 0–210 di-scrub saat menarik (0–87%)
const SCRUB_END = SCRUB_FRAMES / FPS; // 8.75s
const CELEBRATION_START = 211 / FPS; // frame 211 → perayaan flower shower
const PTR_KEY = 'esenel.ptr';

const isCoarse = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

export default function FlowerPullToRefresh() {
  const [mounted, setMounted] = useState(false); // lazy-mount <video>
  const [progress, setProgress] = useState(0); // 0..1 (untuk translate lembut)
  const [pulling, setPulling] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    startY: null,
    startX: null,
    progress: 0,
    targetTime: 0,
    active: false,
    videoReady: false,
    pulling: false,
  });

  // Scrub video ke frame sesuai progress (rAF, tidak spam set currentTime).
  const scrubTo = useCallback((p) => {
    const s = stateRef.current;
    s.progress = p;
    s.targetTime = p * SCRUB_END;
    if (rafRef.current) return;
    const tick = () => {
      const v = videoRef.current;
      if (v && s.videoReady) {
        const t = s.targetTime;
        if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t;
      }
      if (s.active || s.progress > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!isCoarse()) return;
    const s = stateRef.current;

    const onTouchStart = (e) => {
      if (releasing) return;
      const touch = e.touches[0];
      s.startY = touch.clientY;
      s.startX = touch.clientX;
      s.pulling = window.scrollY <= 0;
      if (!s.pulling) return;
      // unduh video hanya saat pertama kali menarik
      setMounted(true);
      s.active = false;
    };

    const onTouchMove = (e) => {
      if (!s.pulling || releasing || !s.startY) return;
      const touch = e.touches[0];
      const dy = touch.clientY - s.startY;
      const dx = touch.clientX - s.startX;
      // gestur horizontal (carousel dll.) — jangan ganggu
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        if (s.progress > 0) {
          s.active = false;
          s.progress = 0;
          setProgress(0);
          scrubTo(0);
        }
        return;
      }
      // hanya saat benar-benar di posisi paling atas
      if (window.scrollY > 0) return;
      e.preventDefault();
      e.lenisStopPropagation = true;
      const p = Math.min(1, dy / THRESHOLD);
      s.active = true;
      setPulling(true);
      setProgress(p);
      scrubTo(p);
    };

    const doReload = () => {
      try {
        sessionStorage.setItem(PTR_KEY, '1');
      } catch {
        // private mode — tetap reload
      }
      window.location.reload();
    };

    const finish = () => {
      s.active = false;
      s.pulling = false;
      if (s.progress >= 0.95) {
        // pull maksimal → putar perayaan lalu muat ulang
        setReleasing(true);
        const v = videoRef.current;
        if (v && s.videoReady) {
          let done = false;
          const reload = () => {
            if (done) return;
            done = true;
            v.removeEventListener('ended', reload);
            doReload();
          };
          v.addEventListener('ended', reload);
          v.currentTime = CELEBRATION_START;
          v.play().catch(reload);
          // pengaman: kalau video macet, tetap reload
          setTimeout(reload, 5000);
        } else {
          doReload();
        }
      } else {
        setProgress(0);
        scrubTo(0);
        setPulling(false);
        setReleasing(false);
      }
    };

    const onTouchEnd = () => {
      if (s.pulling) finish();
    };
    const onTouchCancel = () => {
      s.active = false;
      s.pulling = false;
      setPulling(false);
      setProgress(0);
      scrubTo(0);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onTouchCancel, { capture: true });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [releasing, scrubTo]);

  const show = mounted && (pulling || releasing || progress > 0);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80]"
      style={{
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        transition: releasing ? 'none' : 'opacity 260ms ease',
        backgroundColor: '#F8F9F5',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${(progress * 26).toFixed(1)}px) scale(${(
            1 + progress * 0.045
          ).toFixed(4)})`,
          transition: releasing ? 'transform 80ms linear' : 'transform 120ms ease-out',
        }}
      >
        {mounted && (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            muted
            playsInline
            preload="auto"
            onLoadedData={() => {
              stateRef.current.videoReady = true;
            }}
            onCanPlay={() => {
              stateRef.current.videoReady = true;
            }}
            className="h-full w-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>
    </div>
  );
}
