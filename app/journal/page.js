import Link from 'next/link';
import Image from 'next/image';
import JournalGrid from '@/components/journal/JournalGrid';
import NewsletterForm from '@/components/journal/NewsletterForm';
import { posts, journalCategories } from '@/data/journal';

export const metadata = { title: 'Journal — ESENEL' };

export default function JournalPage() {
  const featured = posts.filter((p) => p.featured).slice(0, 4);
  const [lead, ...rest] = featured;

  return (
    <main className="bg-white pb-28 pt-32 md:pt-40">
      <div className="container-esenel">
        {/* ── Header ── */}
        <div className="mb-16 grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-5 text-[12px] tracking-[0.2em] font-medium text-earth">
              THE JOURNAL
            </p>
            <h1 className="font-display text-4xl leading-[1.06] md:text-6xl">
              Notes from the atelier.
            </h1>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-md leading-relaxed text-ink/60">
              Flower care, seasonal guides, and stories from behind the counter — written between
              orders, with the worktable still in view.
            </p>
          </div>
        </div>

        {/* ── Featured editorial layout ── */}
        <section className="mb-20" aria-label="Featured articles">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-[11px] tracking-[0.2em] font-medium text-ink/45">
              FEATURED THIS MONTH
            </p>
            <span className="text-[11px] tracking-nav text-ink/35">{featured.length} STORIES</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Lead card */}
            <Link
              href={`/journal/${lead.slug}`}
              className="group relative min-h-[420px] overflow-hidden rounded-[24px] lg:col-span-2 lg:row-span-2 lg:min-h-0"
            >
              <Image
                src={lead.image}
                alt={lead.title}
                fill
                priority
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
                <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-nav">
                  <span className="rounded-pill bg-white/90 px-2.5 py-1 font-medium text-ink">
                    {journalCategories.find((c) => c.slug === lead.category)?.label.toUpperCase()}
                  </span>
                  <span className="text-cloud/70">
                    {lead.date} · {lead.readTime}
                  </span>
                </div>
                <h2 className="mt-4 max-w-xl font-display text-2xl leading-[1.15] text-cloud md:text-4xl">
                  {lead.title}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-cloud/80">
                  {lead.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium tracking-nav text-cloud transition-colors group-hover:text-white">
                  READ ARTICLE
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>

            {/* Stacked cards */}
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-sand bg-white transition-shadow duration-300 hover:shadow-[0_14px_40px_rgba(32,34,30,0.1)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-[11px] tracking-nav">
                    <span className="font-medium text-earth">
                      {journalCategories.find((c) => c.slug === post.category)?.label.toUpperCase()}
                    </span>
                    <span className="text-ink/30">·</span>
                    <span className="text-ink/45">{post.date}</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-xl leading-[1.2] transition-colors duration-300 group-hover:text-earth">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/60">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── All articles with search + filters ── */}
        <section aria-label="All articles">
          <div className="mb-8 border-t border-sand pt-8">
            <h2 className="font-display text-2xl md:text-3xl">All articles</h2>
          </div>
          <JournalGrid />
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="relative mt-24 overflow-hidden rounded-[28px] bg-[#23301F] px-7 py-14 text-cloud md:px-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_80%_0%,rgba(182,197,168,0.22),transparent_70%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-[12px] tracking-[0.2em] font-medium text-cloud/60">
                LETTERS FROM THE ATELIER
              </p>
              <h2 className="font-display text-3xl leading-[1.12] md:text-4xl">
                One letter a month.
                <br />
                Only when the flowers are good.
              </h2>
            </div>
            <NewsletterForm />
          </div>
        </section>
      </div>
    </main>
  );
}
