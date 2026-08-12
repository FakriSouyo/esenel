'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function EditorialSection({
  eyebrow,
  heading,
  paragraph,
  ctaLabel,
  ctaHref = '#',
  image,
  bg = 'bg-cloud',
  reverse = false,
}) {
  return (
    <section className={`${bg} py-24 md:py-32`}>
      <div className="container-esenel">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${
            reverse ? 'md:[direction:rtl]' : ''
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] rounded-nav overflow-hidden [direction:ltr]"
          >
            <Image src={image} alt={heading} fill className="object-cover" sizes="50vw" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="[direction:ltr]"
          >
            <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">{eyebrow}</p>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.08]">{heading}</h2>
            <p className="mt-5 text-ink/70 leading-relaxed max-w-md">{paragraph}</p>
            <a
              href={ctaHref}
              className="inline-block mt-7 text-[13px] font-medium tracking-nav border-b border-ink/30 pb-1 hover:border-ink transition-colors"
            >
              {ctaLabel}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
