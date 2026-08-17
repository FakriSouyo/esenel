'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

// Routes rendered without the site chrome (navbar + footer) — fullscreen
// experiences where the page owns the whole viewport.
export const BARE_ROUTES = ['/craft/name'];

export default function Chrome({ children }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((r) => pathname?.startsWith(r));

  return (
    <>
      {!bare && <Navbar />}
      {children}
      {!bare && <Footer />}
    </>
  );
}
