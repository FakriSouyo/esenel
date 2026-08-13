import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Music2, MessageCircle } from 'lucide-react';

const collectionLinks = [
  { label: 'Bouquets', href: '/shop' },
  { label: 'Vase', href: '/collections/vase' },
  { label: 'Custom Bouquet', href: '/craft' },
  { label: 'Flower Box', href: '/collections/flower-board' },
  { label: 'Wedding', href: '/craft' },
  { label: 'Gifts', href: '/shop' },
];

const esenelLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Story', href: '/about' },
  { label: 'Gallery', href: '/collections' },
  { label: 'Contact', href: '/about' },
  { label: 'FAQ', href: '/faq' },
];

const infoLinks = [
  { label: 'Shipping', href: '/faq' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

const socials = [
  { label: 'Instagram', icon: Instagram, href: '#' },
  { label: 'TikTok', icon: Music2, href: '#' },
  { label: 'WhatsApp', icon: MessageCircle, href: '#' },
];

function LinkGroup({ heading, links, className = '' }) {
  return (
    <div className={className}>
      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40">
        {heading}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[15px] text-ink/65 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer-root relative overflow-hidden bg-white text-ink">
      {/* Main columns */}
      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-y-12 pb-16 pt-20 md:grid-cols-2 md:gap-y-16 md:pt-28 md:pb-20 lg:grid-cols-12 lg:gap-x-12">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-5">
            <Link href="/" className="font-display text-[30px] tracking-wide">
              ESENEL
            </Link>
            <p className="mt-4 max-w-[260px] text-[14px] leading-relaxed text-ink/55">
              Flowers, thoughtfully arranged.
            </p>
            <div className="mt-8 flex items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="rounded-full border border-ink/10 bg-white/60 p-2.5 text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
                >
                  <social.icon size={16} strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          <LinkGroup
            heading="Collection"
            links={collectionLinks}
            className="lg:col-span-2"
          />
          <LinkGroup
            heading="Esenel"
            links={esenelLinks}
            className="lg:col-span-2"
          />
          <LinkGroup
            heading="Information"
            links={infoLinks}
            className="md:col-span-2 lg:col-span-3"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-2 border-t border-ink/10 py-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-ink/45">© 2026 Esenel. All rights reserved.</p>
          <p className="text-[12px] text-ink/45">Made with flowers &amp; care</p>
        </div>
      </div>

      {/* Botanical illustration */}
      <div className="pointer-events-none relative z-0 select-none">
        <div className="relative h-[220px] sm:h-[280px] md:h-[330px] lg:h-[380px]">
          <Image
            src="/footer.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-bottom"
          />
          {/* Soft cream fade at the very top, blending illustration into the footer */}
          <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white to-transparent" />
        </div>
      </div>
    </footer>
  );
}