import Hero from '@/components/hero/Hero';
import BannerSection from '@/components/banner/BannerSection';
import MorphSlider from '@/components/effects/MorphSlider';
import MoltenMetal from '@/components/effects/MoltenMetal';
import GradualBlur from '@/components/effects/GradualBlur';
import ImageCursorTrail from '@/components/effects/ImageCursorTrail';
import CoverflowCarousel from '@/components/carousel/CoverflowCarousel';
import AnimatedList from '@/components/carousel/AnimatedList';
import BouncyAccordion from '@/components/faq/BouncyAccordion';
import FromTheGarden from '@/components/editorial/FromTheGarden';
import { getFeaturedProducts } from '@/data/products';
import { collectionCopy } from '@/data/collections';
import { formatIDR } from '@/lib/format';
import { Truck } from 'lucide-react';
import Link from 'next/link';

const faqItems = [
  {
    icon: 'flower',
    q: 'How long do bouquets last?',
    a: 'With fresh water and a cool spot away from direct sunlight, most ESENEL bouquets stay beautiful for around 5–7 days, with some flowers lasting longer.',
  },
  {
    icon: 'calendar',
    q: 'Can I schedule delivery?',
    a: 'Delivery windows can be selected at checkout, subject to availability in your area.',
  },
  {
    icon: 'message',
    q: 'Can I add a message?',
    a: 'Yes — a note can be added to any order during checkout, and will be included with your delivery.',
  },
  {
    icon: 'droplets',
    q: 'How should I care for my bouquet?',
    a: 'Trim stems at an angle when they arrive, change the water every two days, and keep your bouquet away from direct heat and direct sunlight.',
  },
];

const deliverySteps = [
  {
    name: 'Cut to order',
    description: 'Arranged close to your delivery window, never ahead of time.',
    time: 'Atelier',
  },
  {
    name: 'Packed with care',
    description: 'Each arrangement is handled gently from atelier to door, end to end.',
    time: 'Studio',
  },
  {
    name: 'Arrives on your schedule',
    description: 'Pick the delivery window that works for you — confirm at checkout.',
    time: 'On time',
  },
];

const journalTrailImages = [
  '/small.jpg',
  '/medium.jpg',
  '/large.jpg',
  '/extra-large.jpg',
  '/vase.jpg',
  '/flower-board.jpg',
  'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1487070183336-b863922373d4?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=400&auto=format&fit=crop',
];

const collectionSlides = Object.entries(collectionCopy).map(([slug, copy]) => {
  return {
    image: `/${slug}.jpg`,
    caption: copy.title,
    slug,
  };
});

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <main>
      <Hero />
      <BannerSection />

      {/* 02 Featured bouquets — coverflow */}
      <section className="bg-white py-20 md:py-28">
        <div className="container-esenel">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-3">
                THIS WEEK
              </p>
              <h2 className="font-display text-3xl md:text-4xl leading-[1.1]">
                Flowers for every feeling.
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden sm:block text-[13px] font-medium tracking-nav border-b border-ink/30 pb-1 hover:border-earth transition-colors"
            >
              VIEW ALL →
            </Link>
          </div>
          <CoverflowCarousel
            slides={featured.map((product) => ({
              src: product.image,
              alt: product.name,
              title: product.name,
              subtitle: product.subtitle,
              meta: [{ label: 'Price', value: formatIDR(product.price) }],
              href: `/shop/${product.slug}`,
            }))}
            showCaption
            showNavigation
            showPagination
            label="Featured bouquets"
          />
        </div>
      </section>

      {/* 03 Shop by collection — morph slider */}
      <section className="bg-white pb-20 md:pb-28">
        <div className="container-esenel">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-3">
                COLLECTIONS
              </p>
              <h2 className="font-display text-3xl md:text-4xl leading-[1.1]">
                Shop by collection.
              </h2>
            </div>
            <Link
              href="/collections"
              className="hidden sm:block text-[13px] font-medium tracking-nav border-b border-ink/30 pb-1 hover:border-earth transition-colors"
            >
              VIEW ALL →
            </Link>
          </div>
          <div style={{ height: '520px', position: 'relative' }} className="md:max-h-[520px]">
            <MorphSlider
              items={collectionSlides}
              transition="melt"
              duration={1.1}
              intensity={0.55}
              scale={2.4}
              drift={0.4}
              radius={20}
              overlayColor="#05060a"
              autoplay
              autoplayDelay={4}
              showCaptions
              showControls
              showIndicators
            />
          </div>
        </div>
      </section>

      {/* 04 FROM THE GARDEN — storytelling card stack */}
      <FromTheGarden />

      {/* 05 SIGNATURE EXPERIENCE — Craft */}
      <section className="relative overflow-hidden bg-ink py-28 md:py-40">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/banner.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink/50" />

        {/* Top & bottom gradual blur vignettes */}
        <GradualBlur
          position="top"
          height="4rem"
          strength={2}
          divCount={4}
          curve="ease-out"
          zIndex={5}
        />
        <GradualBlur
          position="bottom"
          height="4rem"
          strength={2}
          divCount={4}
          curve="ease-out"
          zIndex={5}
        />
        <div className="container-esenel relative z-10 text-center max-w-xl mx-auto">
          <p className="text-[12px] tracking-[0.2em] font-medium text-cloud/70 mb-5">
            SIGNATURE EXPERIENCE
          </p>
          <h2 className="font-display text-3xl md:text-5xl leading-[1.15] text-cloud">
            Create something that feels like them.
          </h2>
          <p className="mt-6 text-cloud/80 leading-relaxed">
            Choose your size, your flowers, your wrapping — and build a bouquet entirely your own
            at the ESENEL craft table.
          </p>
          <Link
            href="/craft"
            className="inline-block mt-8 bg-cloud text-ink px-7 py-3.5 rounded-pill text-[13px] font-medium tracking-nav hover:bg-cloud/90 transition-colors"
          >
            START CRAFTING
          </Link>
        </div>
      </section>

      {/* 06 Delivery */}
      <section className="relative overflow-hidden bg-white py-24 md:py-32">
        <div className="absolute inset-0">
          <MoltenMetal
            color1="#23301F"
            color2="#71876A"
            color3="#B6C5A8"
            speed={0.3}
            scale={3.5}
            detail={3}
            glow={1.4}
            coreSize={0.12}
            swirl={1}
            fold={-0.2}
            blackPoint={0.08}
            brightness={1.2}
            colorMode="molten"
            grain
            grainIntensity={0.06}
            opacity={0.9}
            className="opacity-30"
          />
        </div>
        <div className="container-esenel relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">DELIVERY</p>
          <h2 className="font-display text-3xl md:text-5xl leading-[1.08]">
            Fresh flowers, carefully delivered.
          </h2>
          <p className="mt-5 text-ink/70 leading-relaxed max-w-md mx-auto">
            Bouquets are cut and arranged close to your delivery window, then handled with care
            from atelier to door. Scheduling and delivery-area details can be confirmed at
            checkout.
          </p>

          <div className="relative mt-12 h-[300px] md:h-[280px] flex flex-col overflow-hidden">
            <AnimatedList delay={1400}>
              {deliverySteps.map((step, idx) => (
                <figure
                  key={idx}
                  className="relative mx-auto min-h-fit w-full max-w-[420px] cursor-pointer overflow-hidden rounded-2xl p-4 transition-all duration-200 ease-in-out hover:scale-[103%] bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
                >
                  <div className="flex flex-row items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#23301F] text-white">
                      <Truck size={18} />
                    </div>
                    <div className="flex flex-col overflow-hidden text-left">
                      <figcaption className="flex flex-row items-center font-medium whitespace-pre text-ink">
                        <span className="font-display text-lg">{step.name}</span>
                        <span className="mx-1 text-ink/30">·</span>
                        <span className="text-xs text-ink/45">{step.time}</span>
                      </figcaption>
                      <p className="text-[13px] text-ink/60">{step.description}</p>
                    </div>
                  </div>
                </figure>
              ))}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-white to-transparent" />
          </div>

          <Link
            href="/faq"
            className="inline-block mt-8 bg-ink text-cloud px-7 py-3.5 rounded-pill text-[13px] font-medium tracking-nav hover:bg-ink/90 transition-colors"
          >
            DELIVERY INFO
          </Link>
        </div>
      </section>

      {/* 07 Journal teaser — image cursor trail */}
      <section className="bg-white">
        <ImageCursorTrail
          items={journalTrailImages}
          maxNumberOfImages={6}
          distance={20}
          imgClass="w-24 h-32 md:w-32 md:h-44"
          fadeAnimation
          className="min-h-[440px] py-24 md:min-h-[540px] md:py-32"
        >
          <div className="relative z-50 mx-auto max-w-xl px-6 text-center">
            <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-5">JOURNAL</p>
            <h2 className="font-display text-3xl md:text-4xl">Notes from the atelier.</h2>
            <p className="mt-5 text-ink/60">
              Flower care, seasonal guides, and stories from behind the counter.
            </p>
            <Link
              href="/journal"
              className="inline-block mt-7 text-[13px] font-medium tracking-nav border-b border-ink/30 pb-1"
            >
              READ THE JOURNAL →
            </Link>
          </div>
        </ImageCursorTrail>
      </section>

      {/* 08 FAQ */}
      <section className="bg-white border-t border-sand/70 py-24 md:py-32">
        <div className="container-esenel max-w-3xl mx-auto">
          <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4 text-center">
            FAQ
          </p>
          <h2 className="font-display text-3xl md:text-5xl leading-[1.08] text-center mb-12 md:mb-16">
            Questions, answered.
          </h2>
          <BouncyAccordion items={faqItems} />
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-nav bg-sand/40 p-6 md:p-8">
            <p className="font-display text-lg md:text-xl">Still have a question?</p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 bg-ink text-cloud px-6 py-3 rounded-pill text-[13px] font-medium tracking-nav hover:bg-ink/90 transition-colors"
            >
              VIEW ALL FAQ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
