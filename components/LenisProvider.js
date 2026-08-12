'use client';

import { ReactLenis } from 'lenis/react';

export default function LenisProvider({ children }) {
  return (
    <ReactLenis root options={{ duration: 1.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}