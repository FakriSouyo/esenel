import CraftBuilder from '@/components/craft/CraftBuilder';

export const metadata = { title: 'Craft — ESENEL' };

const stats = [
  { value: '03', label: 'Sizes' },
  { value: '05', label: 'Flowers' },
  { value: '04', label: 'Wrappings' },
  { value: '100%', label: 'Made by hand' },
];

export default function CraftPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#23301F] pb-20 pt-36 text-cloud md:pb-24 md:pt-44">
        {/* soft radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_50%_0%,rgba(182,197,168,0.22),transparent_70%)]" />
        {/* oversized watermark */}
        <span className="pointer-events-none absolute -right-6 top-6 select-none font-display text-[22vw] leading-none text-cloud/[0.04] md:text-[16vw]">
          CRAFT
        </span>

        <div className="container-esenel relative">
          <p className="mb-5 text-[12px] tracking-[0.2em] font-medium text-cloud/60">
            THE CRAFT TABLE
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] md:text-6xl">
            Build a bouquet that feels like&nbsp;them.
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-cloud/75">
            Pick your size, your flowers, your wrapping — we compose it by hand at the atelier and
            deliver it fresh, ready to be remembered.
          </p>

          <div className="mt-12 grid max-w-xl grid-cols-2 gap-y-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl md:text-4xl text-cloud">{s.value}</p>
                <p className="mt-1 text-[11px] tracking-[0.14em] uppercase text-cloud/50">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cloud py-16 md:py-24">
        <div className="container-esenel">
          <CraftBuilder />
        </div>
      </section>
    </main>
  );
}
