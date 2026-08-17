import './globals.css';
import Chrome from '@/components/Chrome';
import FlowerPullToRefresh from '@/components/ptr/FlowerPullToRefresh';
import LenisProvider from '@/components/LenisProvider';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import ProgressiveBlur from '@/components/effects/ProgressiveBlur';

export const metadata = {
  title: 'ESENEL — Fleur Atelier',
  description: 'Fresh flowers, thoughtfully arranged. ESENEL is a contemporary fleur atelier.',
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/favicon_io/site.webmanifest',
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
          {/* NOTE: the word preloader is intentionally NOT here — it only
              plays on the homepage, so navigating between pages never shows
              it again. Rendered inside app/page.js. */}
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
            <Chrome>{children}</Chrome>
            <CartDrawer />
            {/* Custom pull-to-refresh — mobile only. Mematikan native PTR
                browser dan memastikan preloader kata hanya muncul di awal
                (reload dari PTR ditandai di sessionStorage). */}
            <FlowerPullToRefresh />
          </CartProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
