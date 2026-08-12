'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { posts, journalCategories } from '@/data/journal';

function PostCard({ post, compact = false }) {
  return (
    <article className="group cursor-pointer">
      <Link href={`/journal/${post.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand/40">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.04]"
          />
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] tracking-nav">
          <span className="font-medium text-earth">
            {journalCategories.find((c) => c.slug === post.category)?.label.toUpperCase()}
          </span>
          <span className="text-ink/30">·</span>
          <span className="text-ink/45">{post.date}</span>
          <span className="text-ink/30">·</span>
          <span className="text-ink/45">{post.readTime}</span>
        </div>
        <h3
          className={`mt-2.5 font-display leading-[1.2] transition-colors duration-300 group-hover:text-earth ${
            compact ? 'text-xl' : 'text-2xl'
          }`}
        >
          {post.title}
        </h3>
        {!compact && <p className="mt-3 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>}
      </Link>
    </article>
  );
}

export default function JournalGrid() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.body.some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const pills = [{ slug: 'all', label: 'All' }, ...journalCategories];
  const countOf = (slug) =>
    slug === 'all' ? posts.length : posts.filter((p) => p.category === slug).length;

  return (
    <div>
      {/* search + filters */}
      <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => {
            const isActive = category === pill.slug;
            return (
              <button
                key={pill.slug}
                onClick={() => setCategory(pill.slug)}
                className={`h-[36px] rounded-pill border px-4 text-[12.5px] tracking-nav font-medium transition-all duration-300 ${
                  isActive
                    ? 'border-ink bg-ink text-cloud'
                    : 'border-ink/15 bg-transparent text-ink hover:border-ink/40 hover:bg-ink/[0.03]'
                }`}
              >
                {pill.label.toUpperCase()}
                <span className={`ml-1.5 ${isActive ? 'text-cloud/60' : 'text-ink/40'}`}>
                  {countOf(pill.slug)}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full lg:w-[260px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles"
            aria-label="Search articles"
            className="h-[42px] w-full rounded-pill border border-ink/15 bg-white pl-11 pr-4 text-sm transition-colors placeholder:text-ink/35 focus:border-ink/50 focus:outline-none"
          />
        </label>
      </div>

      {/* results line */}
      <p className="mb-7 text-[12px] tracking-nav text-ink/45">
        {filtered.length} {filtered.length === 1 ? 'ARTICLE' : 'ARTICLES'}
        {query && (
          <>
            {' '}
            MATCHING &ldquo;
            <span className="text-ink">{query}</span>
            &rdquo;
          </>
        )}
      </p>

      {/* grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-sand bg-white py-20 text-center">
          <p className="font-display text-2xl">No articles found</p>
          <p className="mt-2 text-sm text-ink/50">Try a different search or category.</p>
          <button
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
            className="mt-6 rounded-pill bg-ink px-6 py-3 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
          >
            RESET FILTERS
          </button>
        </div>
      )}
    </div>
  );
}
