import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import LenisProvider from '@/components/LenisProvider';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import ProgressiveBlur from '@/components/effects/ProgressiveBlur';

export const metadata = {
  title: 'ESENEL — Fleur Atelier',
  description: 'Fresh flowers, thoughtfully arranged. ESENEL is a contemporary fleur atelier.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body antialiased bg-cloud text-ink">
        <LenisProvider>
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
