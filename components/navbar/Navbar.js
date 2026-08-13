'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { Search, ShoppingBag, X, ChevronDown, ArrowLeft, ArrowRight, Menu } from 'lucide-react';
import { collectionGroups, collectionCopy } from '@/data/collections';
import { useCart } from '@/components/cart/CartContext';
import SearchOverlay from '@/components/search/SearchOverlay';
import { onPreloaderExit } from '@/lib/preloaderBus';

const navLinks = [
  { label: 'SHOP', href: '/shop' },
  { label: 'COLLECTIONS', href: '/collections', dropdown: true },
  { label: 'CRAFT', href: '/craft' },
  { label: 'ABOUT', href: '/about' },
  { label: 'JOURNAL', href: '/journal' },
];

const easeOut = [0.16, 1, 0.3, 1];

const mobileItems = [
  { label: 'HOME', href: '/', number: 1 },
  { label: 'SHOP', href: '/shop', number: 2 },
  { label: 'COLLECTIONS', view: 'collections', number: 3 },
  { label: 'CRAFT', href: '/craft', number: 4 },
  { label: 'ABOUT', href: '/about', number: 5 },
  { label: 'JOURNAL', href: '/journal', number: 6 },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileView, setMobileView] = useState('main');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef(null);
  const [preloading, setPreloading] = useState(true);
  const [is404, setIs404] = useState(false);
  const { count, setIsOpen } = useCart();
  const lenis = useLenis();

  // Hidden while the preloader section holds the screen; fades in as soon
  // as the page starts hand-scrolling down into the site.
  useEffect(() => onPreloaderExit(() => setPreloading(false)), []);

  // 404 — the not-found page tags <body> with `route-notfound`. The navbar
  // stays hidden there (its inline <style> also hides it before hydration).
  useEffect(() => {
    const check = () =>
      setIs404(document.body.classList.contains('route-notfound'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  // ESENEL logo — from the home page, glide back to the top (like any
  // logo does); on other pages it navigates home as usual.
  const onLogoClick = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Pull-down-to-close for the mobile drawer. Manual pointer handling (no
  // framer drag) so it works reliably on touch; the drawer follows the finger
  // and closes when pulled past 90px (or flicked down fast).
  const onHandlePointerDown = (e) => {
    dragRef.current = { startY: e.clientY, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onHandlePointerMove = (e) => {
    if (!dragRef.current?.active) return;
    setDragY(Math.max(0, e.clientY - dragRef.current.startY));
  };
  const onHandlePointerUp = (e) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    dragRef.current = null;
    const dy = Math.max(0, e.clientY - drag.startY);
    setDragY(0);
    if (dy > 90) setMobileOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 90);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // open search via ⌘K / Ctrl+K, or "/" (unless already typing in a field).
  // Never on the 404 page — search is hidden there.
  useEffect(() => {
    const onKey = (e) => {
      if (document.body.classList.contains('route-notfound')) return;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <motion.header
        className={`navbar-root fixed left-4 right-4 top-5 z-[60] mx-auto max-w-2xl transition-all duration-700 ${
          preloading || is404
            ? '-translate-y-6 opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        }`}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <motion.div
          animate={{
            paddingLeft: scrolled ? 22 : 28,
            paddingRight: scrolled ? 22 : 28,
          }}
          transition={{ duration: 0.5, ease: easeOut }}
          className={`mx-auto flex h-[66px] items-center justify-between rounded-full transition-all duration-500 ${
            scrolled
              ? 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_6px_24px_rgba(0,0,0,0.12)]'
              : 'bg-white border border-ink/5 shadow-[0_6px_24px_rgba(0,0,0,0.06)]'
          }`}
        >
          {/* Left: logo */}
          <Link href="/" onClick={onLogoClick} className="shrink-0 group">
            <motion.span
              animate={{ opacity: scrolled ? 0.85 : 1 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="font-display text-[24px] tracking-wide block"
            >
              ESENEL
            </motion.span>
          </Link>

          {/* Center: nav links with micro-interactions */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link, i) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.dropdown && setMenuOpen(true)}
              >
                <Link
                  href={link.href}
                  onClick={(e) => {
                    if (link.dropdown) {
                      e.preventDefault();
                      setMenuOpen((o) => !o);
                    }
                  }}
                  className="group relative flex items-center gap-1 px-[10px] py-2 rounded-nav"
                >
                  <span className="text-[15px] font-medium tracking-nav text-ink transition-colors duration-300 group-hover:text-earth">
                    {link.label}
                  </span>
                  {link.dropdown && (
                    <ChevronDown
                      size={12}
                      className={`text-ink/40 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                  {/* underline animation */}
                  <span className="absolute left-[8px] right-[8px] -bottom-0.5 h-px origin-left scale-x-0 bg-earth transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
              </div>
            ))}
          </nav>

          {/* Right: search / cart / burger */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-nav hover:bg-ink/[0.05] transition-colors"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
            <button
              aria-label="Cart"
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 rounded-nav hover:bg-ink/[0.05] transition-colors"
            >
              <ShoppingBag size={18} strokeWidth={1.75} />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-ink text-cloud text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center"
                >
                  {count}
                </motion.span>
              )}
            </button>
            <button
              aria-label="Open menu"
              className="p-2.5 rounded-nav hover:bg-ink/[0.05] transition-colors lg:hidden"
              onClick={() => {
                setMobileView('main');
                setMobileOpen(true);
              }}
            >
              <Menu size={19} />
            </button>
          </div>
        </motion.div>

        {/* Global search overlay */}
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Collections dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: easeOut }}
              onMouseEnter={() => setMenuOpen(true)}
              className="mt-2 rounded-navbar bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_6px_24px_rgba(0,0,0,0.12)] overflow-hidden hidden lg:block origin-top w-[680px]"
            >
              <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-10 p-10">
                {collectionGroups.map((group, gi) => (
                  <div key={group.heading}>
                    <p className="text-[11px] tracking-nav text-ink/40 mb-4 font-medium">
                      {String(gi + 1).padStart(2, '0')} — {group.heading.toUpperCase()}
                    </p>
                    <ul className="space-y-1.5">
                      {group.items.map((item, ii) => (
                        <li key={item.slug}>
                          <Link
                            href={`/collections/${item.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className="group flex items-center gap-2"
                          >
                            <span className="font-display text-[19px] group-hover:text-earth transition-colors duration-300">
                              {item.label}
                            </span>
                            <ArrowRight
                              size={13}
                              className="text-earth opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link
                  href="/collections"
                  onClick={() => setMenuOpen(false)}
                  className="group relative rounded-nav overflow-hidden h-full min-h-[180px] block"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop)` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-cloud text-[13px] font-medium tracking-nav">
                    Explore collection →
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile menu — bottom drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[85] bg-ink/45 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: dragY }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 500, damping: 42 }}
              className="fixed inset-x-0 bottom-0 z-[90] bg-white lg:hidden rounded-t-[1.625rem] shadow-2xl flex max-h-[85dvh] flex-col overflow-hidden"
            >
              {/* drag handle — pull down to close */}
              <div
                className="w-full cursor-grab touch-none py-3 active:cursor-grabbing"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                role="button"
                aria-label="Drag down to close menu"
              >
                <span className="mx-auto block h-1.5 w-24 rounded-full bg-ink/15" />
              </div>

              {/* Collections header — stays fixed while only the list scrolls */}
              {mobileView === 'collections' && (
                <div className="flex w-full shrink-0 items-center justify-between px-1 pb-3">
                  <button
                    type="button"
                    onClick={() => setMobileView('main')}
                    className="flex items-center gap-2 rounded-full bg-sand/50 px-4 py-2 text-[13px] font-medium tracking-nav hover:bg-sand transition-colors"
                  >
                    <ArrowLeft size={15} />
                    ALL MENU
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="p-2 rounded-full hover:bg-sand/50 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="flex w-full flex-col gap-5 overflow-y-auto px-2 pb-6">
                {mobileView === 'main' ? (
                  <>
                    <nav className="flex flex-col gap-1">
                      {mobileItems.map((item) =>
                        item.view ? (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setMobileView(item.view)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 rounded-2xl hover:bg-sand/40 transition-colors"
                          >
                            <div className="flex items-baseline gap-3">
                              <span className="text-[10px] text-earth/60 tabular-nums">
                                {String(item.number).padStart(2, '0')}
                              </span>
                              <span className="font-display text-2xl leading-none">
                                {item.label}
                              </span>
                            </div>
                            <ArrowRight size={17} className="text-earth" />
                          </button>
                        ) : (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="group flex w-full items-center justify-between gap-3 px-4 py-4 rounded-2xl hover:bg-sand/40 transition-colors"
                          >
                            <div className="flex items-baseline gap-3">
                              <span className="text-[10px] text-earth/60 tabular-nums">
                                {String(item.number).padStart(2, '0')}
                              </span>
                              <span className="font-display text-2xl leading-none">
                                {item.label}
                              </span>
                            </div>
                          </Link>
                        ),
                      )}
                    </nav>

                    <div className="mt-2 flex items-center justify-between border-t border-sand px-4 pt-4">
                      <p className="text-[12px] text-ink/50">
                        ESENEL — Fleur Atelier
                        <br />
                        Fresh flowers, thoughtfully arranged.
                      </p>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          setIsOpen(true);
                        }}
                        aria-label="Open bag"
                        className="relative rounded-full bg-ink text-cloud p-3"
                      >
                        <ShoppingBag size={17} strokeWidth={1.75} />
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-earth text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="px-5 pt-2 text-[11px] tracking-nav text-ink/40 font-medium">
                      COLLECTIONS
                    </p>

                    {collectionGroups.map((group) => (
                      <div key={group.heading} className="flex flex-col gap-4">
                        <span className="pl-5 text-[12px] tracking-[0.08em] text-ink/50 font-medium">
                          {group.heading.toUpperCase()}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.slug}
                              href={`/collections/${item.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="flex flex-col gap-3 p-3 pb-4 rounded-2xl bg-sand/30 hover:bg-sand transition-colors"
                            >
                              <div className="aspect-square rounded-xl overflow-hidden bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`/${item.slug}.jpg`}
                                  alt={item.label}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col gap-0.5 px-1.5">
                                <span className="font-display text-base leading-none">
                                  {item.label}
                                </span>
                                <span className="truncate text-[11px] text-ink/50">
                                  {collectionCopy[item.slug]?.tagline}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    <Link
                      href="/collections"
                      onClick={() => setMobileOpen(false)}
                      className="mx-1 mt-1 flex items-center justify-center gap-2 rounded-full bg-ink text-cloud px-4 py-3 text-[13px] font-medium tracking-nav"
                    >
                      VIEW ALL COLLECTIONS
                      <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
