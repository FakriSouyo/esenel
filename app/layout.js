import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import LenisProvider from '@/components/LenisProvider';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import ProgressiveBlur from '@/components/effects/ProgressiveBlur';
import Preloader from '@/components/preloader/Preloader';

export const metadata = {
  title: 'ESENEL — Fleur Atelier',
  description: 'Fresh flowers, thoughtfully arranged. ESENEL is a contemporary fleur atelier.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts as a parallel stylesheet link (with preconnect) instead of
            a render-blocking @import inside CSS — the navbar and type render
            noticeably sooner on first load. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist+Pixel&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
        />
      </head>
      <body className="font-body antialiased bg-cloud text-ink">
        <LenisProvider>
          {/* Word preloader — the first section of the document. When its
              greetings finish, the page hand-scrolls down into the site
              (like scrolling between two sections). Only on initial load. */}
          <Preloader />
          <CartProvider>
            {/* Global progressive blur — blurs content scrolling past the
                top/bottom of the viewport on every page, footer included.
                z-40: above page content, below navbar/drawer/menu. */}
            <ProgressiveBlur
              position="top"
              fixed
              zIndex={40}
              height="104px"
              blurAmount="3px"
              backgroundColor="transparent"
            />
            <ProgressiveBlur
              position="bottom"
              fixed
              zIndex={40}
              height="104px"
              blurAmount="3px"
              backgroundColor="transparent"
            />
            <Navbar />
            {children}
            <Footer />
            <CartDrawer />
          </CartProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
