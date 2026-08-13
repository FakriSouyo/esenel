'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  // 404 — mark <body> so the global chrome (preloader + navbar + footer) is
  // suppressed. useLayoutEffect fires before any passive effect, so the
  // preloader's own effect (in the layout) sees the class and bails out.
  useLayoutEffect(() => {
    document.body.classList.add('route-notfound');
    return () => document.body.classList.remove('route-notfound');
  }, []);

  return (
    <>
      {/* Kill the global chrome at first paint (this style ships in the
          server HTML, before hydration), and keep it hidden afterwards via
          the .route-notfound rules in globals.css. */}
      <style>{`.preloader-root, .navbar-root, .footer-root { display: none !important; }`}</style>

      <main className="flex min-h-[100svh] flex-col items-center justify-center bg-white px-6 py-20 text-center">
        <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-10 md:flex-row md:gap-16 md:text-left">
          {/* copy */}
          <div className="flex flex-col items-center md:items-start">
            <p className="text-[12px] font-medium tracking-[0.2em] text-earth">404</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-6xl">
              This stem
              <br />
              didn&rsquo;t make it.
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-ink/60">
              The page you&rsquo;re looking for has wilted, been rearranged, or never
              existed in this arrangement. Let&rsquo;s get you back to fresher ground.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="rounded-pill bg-ink px-7 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
              >
                BACK TO HOME
              </Link>
              <Link
                href="/shop"
                className="rounded-pill border border-ink/20 px-7 py-3.5 text-[13px] font-medium tracking-nav text-ink transition-colors hover:bg-sand/40"
              >
                SEE THE SHOP
              </Link>
            </div>
          </div>

          {/* wilted-flower illustration — transparent PNG, no background */}
          <Image
            src="/notfound.png"
            alt="A wilted flower illustration"
            width={1254}
            height={1254}
            priority
            className="w-48 shrink-0 md:w-64"
          />
        </div>
      </main>
    </>
  );
}
