'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * DeferredMount — renders children only when the wrapper approaches the
 * viewport. Heavy WebGL / canvas sections below the fold (morph slider,
 * molten metal) don't initialize until the user scrolls near them, so
 * first load and initial scroll stay fast. The wrapper keeps its own
 * dimensions (give it a className/style with the intended size) so there
 * is no layout shift when children mount.
 *
 * Detection: an immediate rect check (catches above-fold elements even in
 * environments where IntersectionObserver never fires) + IntersectionObserver
 * + a passive scroll/resize fallback.
 */
export default function DeferredMount({
  children,
  className,
  style,
  rootMargin = '800px 0px',
}) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const margin = parseInt(rootMargin, 10) || 800;
    let done = false;
    let io = null;

    const finish = () => {
      if (done) return;
      done = true;
      if (io) io.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      setMounted(true);
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
  }, [rootMargin]);

  return (
    <div ref={ref} className={className} style={style}>
      {mounted ? children : null}
    </div>
  );
}
