import { ogImage } from '@/lib/site';

/** Metadata untuk halaman checkout — page.js-nya client component, jadi
 *  metadata diekspor dari layout server ini. */
export const metadata = {
  title: 'Checkout — ESENEL',
  description: 'Selesaikan pesanan bunga ESENEL dengan mudah.',
  openGraph: {
    title: 'Checkout — ESENEL',
    description: 'Selesaikan pesanan bunga ESENEL dengan mudah.',
    images: [ogImage('checkout')],
  },
};

export default function CheckoutLayout({ children }) {
  return children;
}
