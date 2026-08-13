import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-white px-6 text-center">
      <p className="mb-5 text-[12px] font-medium tracking-[0.2em] text-earth">404</p>
      <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
        This stem
        <br />
        didn&rsquo;t make it.
      </h1>
      <p className="mt-6 max-w-md leading-relaxed text-ink/60">
        The page you&rsquo;re looking for has wilted, been rearranged, or never existed in this
        arrangement. Let&rsquo;s get you back to fresher ground.
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
    </main>
  );
}
