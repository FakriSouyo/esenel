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
