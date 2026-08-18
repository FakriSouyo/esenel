import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { getPostBySlug, posts, journalCategories } from '@/data/journal';
import { ogImage } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Journal — ESENEL' };
  return {
    title: `${post.title} — ESENEL`,
    openGraph: {
      title: `${post.title} — ESENEL`,
      description: post.excerpt || 'Journal ESENEL — catatan bunga, kerajinan, dan hidup yang tenang.',
      images: [ogImage('journal')],
    },
  };
}

export default function JournalArticlePage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const category = journalCategories.find((c) => c.slug === post.category);
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="bg-white pb-28 pt-28 md:pt-32">
      <div className="container-esenel">
        {/* Return */}
        <Link
          href="/journal"
          className="mb-12 inline-flex items-center gap-2 text-[13px] tracking-nav font-medium text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          RETURN TO THE JOURNAL
        </Link>

        <article className="mx-auto max-w-3xl">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <Link
                href="/journal"
                className="rounded-pill bg-meadow/50 px-3 py-1 text-[11px] font-medium tracking-nav text-ink transition-colors hover:bg-meadow"
              >
                {category.label.toUpperCase()}
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-5 font-display text-3xl leading-[1.12] md:text-5xl">{post.title}</h1>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-sand py-4 text-[13px] text-ink/55">
            <span className="flex items-center gap-2">
              <CalendarDays size={14} className="text-earth" />
              {post.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-earth" />
              {post.readTime}
            </span>
            <span className="text-ink/40">Written at the ESENEL worktable</span>
          </div>

          {/* Hero image */}
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[24px]">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>

          {/* Body */}
          <div className="mt-12 space-y-6">
            <p className="font-display text-xl leading-relaxed text-ink/85 md:text-2xl">
              {post.excerpt}
            </p>
            {post.body.map((paragraph, i) => (
              <p key={i} className="text-[15px] leading-[1.9] text-ink/70">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Closing CTA */}
          <div className="mt-14 rounded-[24px] border border-sand bg-cloud p-8 md:p-10">
            <p className="text-[11px] tracking-[0.2em] font-medium text-earth mb-3">
              FROM THE SAME TABLE
            </p>
            <h2 className="font-display text-2xl leading-[1.15] md:text-3xl">
              Feeling inspired? Build your own.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Choose your size, your flowers, and your wrapping at the craft table — we compose it
              by hand and deliver it fresh.
            </p>
            <Link
              href="/craft"
              className="mt-6 inline-flex items-center gap-2 rounded-pill bg-ink px-7 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
            >
              START CRAFTING
              <ArrowRight size={14} />
            </Link>
          </div>
        </article>

        {/* Related */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="mb-7 flex items-center justify-between">
            <p className="text-[11px] tracking-[0.2em] font-medium text-ink/45">KEEP READING</p>
            <Link
              href="/journal"
              className="text-[13px] tracking-nav font-medium text-earth transition-colors hover:text-ink"
            >
              ALL ARTICLES →
            </Link>
          </div>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/journal/${p.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand/40">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3.5 text-[11px] tracking-nav text-earth font-medium">
                  {journalCategories.find((c) => c.slug === p.category)?.label.toUpperCase()}
                  <span className="mx-1.5 text-ink/30">·</span>
                  <span className="text-ink/45">{p.date}</span>
                </p>
                <h3 className="mt-1.5 font-display text-lg leading-[1.2] transition-colors duration-300 group-hover:text-earth">
                  {p.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
