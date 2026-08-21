'use client';

import { useEffect, useState } from 'react';

/** Loads an <img> and returns it once decoded (null until then). */
export function useHtmlImage(src) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let cancelled = false;
    const img = new window.Image();
    img.decoding = 'async';
    // CORS-load the image (Supabase Storage sends Access-Control-Allow-Origin).
    // Without this the canvas would draw a cross-origin image, become
    // "tainted", and stage.toDataURL() would throw a SecurityError — which is
    // why saved bouquet snapshots were missing the flowers.
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return image;
}
