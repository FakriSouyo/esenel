'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLenis } from 'lenis/react';
import { Search, CornerDownLeft, LayoutGrid, FileText } from 'lucide-react';
import { products } from '@/data/products';
import { collectionGroups, collectionCopy } from '@/data/collections';
import { posts, journalCategories } from '@/data/journal';
import { formatIDR } from '@/lib/format';

const pages = [
  { label: 'Shop', href: '/shop', hint: 'All arrangements' },
  { label: 'Craft your bouquet', href: '/craft', hint: 'Build your own' },
  { label: 'Collections', href: '/collections', hint: 'Browse by category' },
  { label: 'Journal', href: '/journal', hint: 'Notes from the atelier' },
  { label: 'About', href: '/about', hint: 'Our story' },
  { label: 'FAQ', href: '/faq', hint: 'Questions, answered' },
];

const matches = (str, q) => str.toLowerCase().includes(q);

export default function SearchOverlay({ open, onClose }) {
  const router = useRouter();
  const lenis = useLenis();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // While open, lock the page: no native scroll, and Lenis is stopped so
  // the mouse wheel only ever scrolls the results panel, never the page.
  // Also tells the page's videos to pause (blurring a playing video is
  // expensive — this is what made playback stutter while searching).
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    window.dispatchEvent(new CustomEvent('esenel:search', { detail: { open } }));
    if (open) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      lenis?.start();
      // clean exit — resume anything we paused
      window.dispatchEvent(new CustomEvent('esenel:search', { detail: { open: false } }));
    };
  }, [open, lenis]);

  // focus input + reset state on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // default: quick links so the overlay is useful before typing
      return [
        {
          group: 'QUICK LINKS',
          items: pages.map((p) => ({ type: 'page', ...p })),
        },
        {
          group: 'COLLECTIONS',
          items: collectionGroups
            .flatMap((g) => g.items)
            .map((i) => ({ type: 'collection', ...i, tagline: collectionCopy[i.slug]?.tagline })),
        },
      ].filter((g) => g.items.length);
    }

    const productItems = products
      .filter(
        (p) =>
          matches(p.name, q) ||
          matches(p.subtitle, q) ||
          matches(p.description, q) ||
          p.composition.some((c) => matches(c, q))
      )
      .slice(0, 5)
      .map((p) => ({ type: 'product', ...p }));

    const postItems = posts
      .filter((p) => matches(p.title, q) || matches(p.excerpt, q) || p.body.some((b) => matches(b, q)))
      .slice(0, 4)
      .map((p) => ({
        type: 'post',
        ...p,
        categoryLabel: journalCategories.find((c) => c.slug === p.category)?.label,
      }));

    const collectionItems = collectionGroups
      .flatMap((g) => g.items)
      .filter((i) => matches(i.label, q) || matches(collectionCopy[i.slug]?.tagline || '', q))
      .slice(0, 4)
      .map((i) => ({ type: 'collection', ...i, tagline: collectionCopy[i.slug]?.tagline }));

    const pageItems = pages
      .filter((p) => matches(p.label, q) || matches(p.hint, q))
      .slice(0, 4)
      .map((p) => ({ type: 'page', ...p }));

    return [
      { group: 'PRODUCTS', items: productItems },
      { group: 'JOURNAL', items: postItems },
      { group: 'COLLECTIONS', items: collectionItems },
      { group: 'PAGES', items: pageItems },
    ].filter((g) => g.items.length);
  }, [query]);

  const flat = useMemo(
    () => results.flatMap((g) => g.items.map((item) => ({ ...item, group: g.group }))),
    [results]
  );

  const total = flat.length;

  const hrefOf = (item) => {
    switch (item.type) {
      case 'product':
        return `/shop/${item.slug}`;
      case 'post':
        return `/journal/${item.slug}`;
      case 'collection':
        return `/collections/${item.slug}`;
      default:
        return item.href;
    }
  };

  const goTo = (index) => {
    const item = flat[index];
    if (!item) return;
    onClose();
    router.push(hrefOf(item));
  };

  // keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(total - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        goTo(activeIndex);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, total, activeIndex, flat]);

  // keep active item in view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  // Keep wheel events inside the overlay (backdrop + panel) so scrolling
  // the mouse over search never scrolls the page behind it.
  const swallowWheel = (e) => e.stopPropagation();

  // Portal to <body>: the navbar header has a transform, which would turn it
  // into the containing block for `position: fixed` and shrink the overlay
  // to the navbar pill. Out in <body> the backdrop truly covers the viewport
  // (the whole page blurs), outside clicks hit the backdrop and close, and
  // nothing blocks the navbar buttons.
  return createPortal(
    <div className="fixed inset-0 z-[120]" onWheel={swallowWheel}>
      {/* backdrop — heavy blur so ALL content behind (navbar included) melts
          away while searching, not just the navbar's own glass */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* panel */}
      <div className="relative mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          {/* input row */}
          <div className="flex items-center gap-3 border-b border-sand px-5">
            <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink/40" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search flowers, articles, collections…"
              aria-label="Search the site"
              className="h-16 w-full bg-transparent text-[15px] focus:outline-none placeholder:text-ink/35"
            />
            <kbd className="hidden shrink-0 rounded-md border border-sand bg-cloud px-2 py-1 text-[11px] font-medium text-ink/50 sm:block">
              ESC
            </kbd>
          </div>

          {/* results — data-lenis-prevent: Lenis lets this list scroll
              natively instead of hijacking the wheel. */}
          <div ref={listRef} data-lenis-prevent className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
            {total === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="font-display text-xl text-ink/60">No results for &ldquo;{query}&rdquo;</p>
                <p className="mt-2 text-sm text-ink/45">Try a flower name, a category, or an article title.</p>
              </div>
            ) : (
              <>
                {results.map((group) => (
                  <div key={group.group} className="mb-1">
                    <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium tracking-[0.18em] text-ink/40">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      // flat items are spread copies ({...item, group}), so
                      // identity comparison always fails — match by content
                      // instead, or every item resolves to the same index.
                      const idx = flat.findIndex(
                        (f) =>
                          f.type === item.type &&
                          (f.slug || f.href || f.label) ===
                            (item.slug || item.href || item.label)
                      );
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={`${item.type}-${item.slug || item.href || item.label}`}
                          data-active={active}
                          onClick={() => goTo(idx)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ${
                            active ? 'bg-sand/70' : 'hover:bg-sand/40'
                          }`}
                        >
                          {item.type === 'product' && (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt=""
                                className="size-10 shrink-0 rounded-lg object-cover"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-display text-[15px] leading-tight">
                                  {item.name}
                                </span>
                                <span className="block truncate text-[11px] text-ink/45">
                                  {item.subtitle}
                                </span>
                              </span>
                              <span className="shrink-0 text-[12px] font-medium tabular-nums text-ink/55">
                                {formatIDR(item.price)}
                              </span>
                            </>
                          )}

                          {item.type === 'post' && (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt=""
                                className="size-10 shrink-0 rounded-lg object-cover"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-display text-[15px] leading-tight">
                                  {item.title}
                                </span>
                                <span className="block text-[11px] text-ink/45">
                                  {item.categoryLabel} · {item.readTime}
                                </span>
                              </span>
                            </>
                          )}

                          {item.type === 'collection' && (
                            <>
                              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sand/50 text-earth">
                                <LayoutGrid size={16} strokeWidth={1.6} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-display text-[15px] leading-tight">
                                  {item.label}
                                </span>
                                <span className="block truncate text-[11px] text-ink/45">
                                  {item.tagline || 'Collection'}
                                </span>
                              </span>
                            </>
                          )}

                          {item.type === 'page' && (
                            <>
                              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sand/50 text-earth">
                                <FileText size={16} strokeWidth={1.6} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-display text-[15px] leading-tight">
                                  {item.label}
                                </span>
                                <span className="block truncate text-[11px] text-ink/45">
                                  {item.hint}
                                </span>
                              </span>
                            </>
                          )}

                          <CornerDownLeft
                            size={14}
                            className={`shrink-0 ${active ? 'text-earth' : 'text-ink/25'}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* footer hint */}
                <div className="flex items-center gap-4 border-t border-sand/60 px-3 py-2.5 text-[10.5px] tracking-nav text-ink/40">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-sand bg-cloud px-1.5 py-0.5">↑</kbd>
                    <kbd className="rounded border border-sand bg-cloud px-1.5 py-0.5">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-sand bg-cloud px-1.5 py-0.5">↵</kbd>
                    open
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <kbd className="rounded border border-sand bg-cloud px-1.5 py-0.5">⌘K</kbd>
                    anywhere
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
