'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SmartVideo — performance-first <video>.
 *
 * - Does not start downloading the file until the element is within
 *   `loadMargin` of the viewport (preload="metadata" before that), so a
 *   multi-megabyte hero/banner clip never competes with first paint.
 * - Fades in once the first frame is ready — no stalled black box.
 * - Pauses (stops decoding) as soon as it leaves the viewport or the tab
 *   is hidden, and resumes when visible again.
 * - `srcMobile` swaps in a mobile-optimized file on small screens
 *   (≤ 767px), and reacts to viewport changes at runtime.
 *
 * Detection: an immediate rect check (above-fold elements load right away,
 * even where IntersectionObserver never fires) + IntersectionObserver + a
 * passive scroll fallback.
 */
export default function SmartVideo({
  src,
  srcMobile,
  className = '',
  loadMargin = '1200px 0px',
  ...rest
}) {
  const videoRef = useRef(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);

  // Track the viewport size so the correct video file is used.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const source = mobile && srcMobile ? srcMobile : src;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const margin = parseInt(loadMargin, 10) || 1200;
    let done = false;
    let io = null;

    const finish = () => {
      if (done) return;
      done = true;
      if (io) io.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      setNear(true);
    };

    const check = () => {
      if (done) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + margin && rect.bottom > -margin) finish();
    };

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => entry.isIntersecting && finish(), {
        rootMargin: `${margin}px 0px`,
      });
      io.observe(el);
    }

    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();

    return () => {
      if (io) io.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [loadMargin]);

  // Play when visible & loaded; pause the instant it leaves the viewport.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const update = () => {
      if (!video) return;
      const rect = video.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight && !document.hidden;
      if (visible) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    // While the search overlay is open the page behind it is blurred —
    // decoding a video under a backdrop-blur is expensive and makes the
    // video stutter. Pause until the overlay closes.
    const onSearch = (e) => {
      if (e.detail?.open) video.pause();
      else update();
    };

    update();
    const io = new IntersectionObserver(update, { threshold: 0 });
    io.observe(video);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', update);
    window.addEventListener('esenel:search', onSearch);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('esenel:search', onSearch);
    };
  }, [ready]);

  return (
    <video
      ref={videoRef}
      className={`${className} transition-opacity duration-700 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
      src={near ? source : undefined}
      preload={near ? 'auto' : 'metadata'}
      onLoadedData={() => setReady(true)}
      onError={() => setReady(true)}
      {...rest}
    />
  );
}
