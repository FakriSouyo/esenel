'use client';

import { useRef } from 'react';

/**
 * ImageCursorTrail
 * A magnetic image trail that follows the cursor: as the mouse moves, flower
 * images appear at the cursor position and fade behind it — adapted from
 * Skiper UI's "Image cursor trail" (skiper18, https://skiper-ui.com/v1/skiper18),
 * inspired by befreaky.co. Free to use with attribution to Skiper UI.
 *
 * Props:
 * - items:            array of image src strings used in the trail
 * - maxNumberOfImages: how many images stay visible in the trail at once
 * - distance:          movement threshold before a new image spawns (px, of viewport width)
 * - imgClass:          classes applied to each trail image
 * - className:         classes applied to the container
 * - fadeAnimation:     auto-fade trail images after 1.5s
 * - children:          content rendered on top of the trail
 */
export default function ImageCursorTrail({
  items = [],
  children,
  className = '',
  maxNumberOfImages = 5,
  imgClass = 'w-40 h-48',
  distance = 20,
  fadeAnimation = false,
}) {
  const containerRef = useRef(null);
  const imageRefs = useRef([]);
  const zIndexRef = useRef(1);
  const indexRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handleMove = (clientX, clientY) => {
    const last = lastPosRef.current;
    if (Math.hypot(clientX - last.x, clientY - last.y) <= window.innerWidth / distance) {
      return;
    }

    const img = imageRefs.current[indexRef.current % items.length];
    const prev = imageRefs.current[(indexRef.current - maxNumberOfImages) % items.length];

    const rect = containerRef.current?.getBoundingClientRect();
    if (img && rect) {
      img.style.left = `${clientX - rect.left}px`;
      img.style.top = `${clientY - rect.top}px`;
      if (zIndexRef.current > 40) zIndexRef.current = 1;
      img.style.zIndex = String(zIndexRef.current);
      zIndexRef.current += 1;
      img.dataset.status = 'active';
      if (fadeAnimation) {
        setTimeout(() => {
          img.dataset.status = 'inactive';
        }, 1500);
      }
      lastPosRef.current = { x: clientX, y: clientY };
    }
    if (prev) prev.dataset.status = 'inactive';
    indexRef.current += 1;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) handleMove(touch.clientX, touch.clientY);
      }}
      onMouseLeave={() => {
        imageRefs.current.forEach((el) => {
          if (el) el.dataset.status = 'inactive';
        });
      }}
      className={`relative grid w-full place-content-center overflow-hidden ${className}`.trim()}
    >
      {items.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          ref={(el) => {
            imageRefs.current[i] = el;
          }}
          src={src}
          alt={`Trail image ${i + 1}`}
          data-index={i}
          data-status="inactive"
          loading="lazy"
          decoding="async"
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 scale-0 object-cover opacity-0 transition-[transform,opacity] duration-300 data-[status=active]:scale-100 data-[status=active]:opacity-100 data-[status=active]:duration-500 ${imgClass}`}
        />
      ))}
      {children}
    </div>
  );
}
