'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  PenLine,
  Sparkles,
  PackageCheck,
} from 'lucide-react';
import { craftSizes, craftFlowers, craftWrappings } from '@/data/flowers';
import { useCart } from '@/components/cart/CartContext';
import { formatIDR } from '@/lib/format';
import BouquetPreview from './BouquetPreview';

const STEPS = [
  { id: 1, label: 'Size', title: 'Choose your size.', desc: 'Every bouquet starts with a size — from a quiet gesture to a statement.' },
  { id: 2, label: 'Flowers', title: 'Mix your flowers.', desc: 'Add a few stems of each. The composition is arranged by hand, never from a mould.' },
  { id: 3, label: 'Wrapping', title: 'Pick a wrapping.', desc: 'Finish it in something that suits the moment — from crisp linen to deep ink paper.' },
  { id: 4, label: 'Note', title: 'Add a note.', desc: 'A few words go a long way. We hand-write it and tuck it in with the bouquet.' },
  { id: 5, label: 'Review', title: 'Almost ready.', desc: 'Take a look before it goes to the atelier.' },
];

const sizeImages = {
  small: '/small.jpg',
  medium: '/medium.jpg',
  large: '/large.jpg',
};

const noteSuggestions = [
  'Happy anniversary',
  'Get well soon',
  'Just because',
  'Thinking of you',
];

const ease = [0.16, 1, 0.3, 1];

export default function CraftBuilder() {
  const [step, setStep] = useState(1);
  const [sizeId, setSizeId] = useState(craftSizes[1].id);
  const [quantities, setQuantities] = useState({});
  const [wrappingId, setWrappingId] = useState(craftWrappings[0].id);
  const [note, setNote] = useState('');
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const size = craftSizes.find((s) => s.id === sizeId);
  const wrapping = craftWrappings.find((w) => w.id === wrappingId);
  const totalStems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const selectedFlowers = useMemo(
    () =>
      craftFlowers
        .filter((f) => quantities[f.id] > 0)
        .map((f) => ({ ...f, qty: quantities[f.id] })),
    [quantities]
  );

  const flowersPrice = selectedFlowers.reduce((sum, f) => sum + f.pricePerStem * f.qty, 0);
  const total = size.basePrice + flowersPrice;

  const updateQty = (id, delta) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const canNext =
    (step === 1 && sizeId) ||
    (step === 2 && totalStems > 0) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  const handleAdd = () => {
    addItem({
      id: `craft-${Date.now()}`,
      name: 'Craft Bouquet',
      price: total,
      image: selectedFlowers[0]?.image || craftFlowers[0].image,
      craft: {
        size: size.label,
        flowers: selectedFlowers.map((f) => ({ name: f.name, qty: f.qty })),
        wrapping: wrapping.name,
        note,
      },
    });
    setAdded(true);
  };

  const current = STEPS.find((s) => s.id === step);

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
      {/* ── Left: live preview (sticky on desktop) — the full order
          summary and ADD TO BAG live in the final review step. ── */}
      <div className="lg:sticky lg:top-28">
        <BouquetPreview selectedFlowers={selectedFlowers} wrappingId={wrappingId} />
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink/45">
            {totalStems > 0 ? `${totalStems} stems selected` : 'No flowers selected yet'}
          </span>
          <span className="font-display text-xl">{formatIDR(total)}</span>
        </div>
      </div>

      {/* ── Right: stepper + step content ── */}
      <div>
        {/* progress header */}
        <div className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] font-medium text-earth">
              STEP {step} / {STEPS.length}
            </span>
            <span className="text-[11px] tabular-nums text-ink/40">
              {Math.round((step / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-sand">
            <motion.div
              className="h-full rounded-full bg-ink"
              animate={{ width: `${(step / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease }}
            />
          </div>

          <div className="mt-3 flex justify-between">
            {STEPS.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  aria-label={s.title}
                  className={`group flex items-center gap-1.5 ${active || done ? 'text-ink' : 'text-ink/30'}`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full border text-[10px] font-medium transition-colors ${
                      done
                        ? 'border-ink bg-ink text-cloud'
                        : active
                          ? 'border-ink bg-ink text-cloud'
                          : 'border-ink/20 group-hover:border-ink/40'
                    }`}
                  >
                    {done ? <Check size={10} /> : s.id}
                  </span>
                  <span className="hidden text-[10px] tracking-nav sm:block">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyed remount (no AnimatePresence): reliable step switching —
            the old view unmounts instantly and the new view fades up. */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
            <div className="mb-8">
              <h2 className="font-display text-3xl leading-tight md:text-4xl">{current.title}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/55">{current.desc}</p>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-3 gap-3">
                {craftSizes.map((s) => {
                  const selected = sizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSizeId(s.id)}
                      className={`group overflow-hidden rounded-2xl border bg-white text-left transition-all duration-300 ${
                        selected
                          ? 'border-ink shadow-[0_10px_28px_rgba(32,34,30,0.14)]'
                          : 'border-sand hover:border-ink/30'
                      }`}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-sand/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sizeImages[s.id]}
                          alt={s.label}
                          className="h-full w-full object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.05]"
                        />
                        <span
                          className={`absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full transition-all duration-300 ${
                            selected ? 'bg-ink text-cloud scale-100' : 'bg-white/85 text-ink/0 scale-75'
                          }`}
                        >
                          <Check size={13} />
                        </span>
                      </div>
                      <div className="px-3 py-3.5">
                        <p className="font-display text-lg leading-none">{s.label}</p>
                        <p className="mt-1.5 text-[11px] text-ink/45">{s.stemCount} stems (approx.)</p>
                        <p className="mt-2 text-[13px] font-medium">{formatIDR(s.basePrice)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {craftFlowers.map((f) => {
                  const qty = quantities[f.id] || 0;
                  const selected = qty > 0;
                  return (
                    <div
                      key={f.id}
                      className={`rounded-2xl border p-4 transition-all duration-300 ${
                        selected
                          ? 'border-ink bg-white shadow-[0_8px_24px_rgba(32,34,30,0.08)]'
                          : 'border-sand bg-white/60 hover:border-ink/25'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.image}
                            alt={f.name}
                            className="size-14 rounded-full border border-white object-cover shadow-sm"
                          />
                          {selected && (
                            <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-earth text-white">
                              <Check size={11} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-base leading-tight">{f.name}</p>
                          <p className="mt-0.5 text-xs text-ink/45">
                            {formatIDR(f.pricePerStem)} / stem
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className={`text-xs ${selected ? 'text-earth' : 'text-ink/35'}`}>
                          {selected ? `${qty} ${qty === 1 ? 'stem' : 'stems'} in bouquet` : 'Tap + to add'}
                        </p>
                        <div className="flex items-center gap-0.5 rounded-pill border border-sand bg-white p-1">
                          <button
                            onClick={() => updateQty(f.id, -1)}
                            aria-label={`Remove ${f.name}`}
                            className={`grid size-7 place-items-center rounded-full transition-colors ${
                              qty > 0
                                ? 'text-ink hover:bg-sand/50'
                                : 'cursor-not-allowed text-ink/20'
                            }`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-7 text-center text-sm font-medium tabular-nums">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQty(f.id, 1)}
                            aria-label={`Add ${f.name}`}
                            className="grid size-7 place-items-center rounded-full text-ink transition-colors hover:bg-sand/50"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {craftWrappings.map((w) => {
                  const selected = wrappingId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWrappingId(w.id)}
                      className={`group rounded-2xl border p-4 text-left transition-all duration-300 ${
                        selected
                          ? 'border-ink bg-white shadow-[0_10px_28px_rgba(32,34,30,0.12)]'
                          : 'border-sand bg-white/60 hover:border-ink/25'
                      }`}
                    >
                      <div className="relative h-24 overflow-hidden rounded-xl border border-ink/5">
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: w.hex }}
                        />
                        {/* paper folds */}
                        <div className="absolute inset-0 opacity-50">
                          <div className="absolute left-[16%] top-0 h-full w-px rotate-[16deg] bg-ink/10" />
                          <div className="absolute left-[42%] top-0 h-full w-px rotate-[-8deg] bg-ink/10" />
                          <div className="absolute left-[68%] top-0 h-full w-px rotate-[12deg] bg-ink/10" />
                        </div>
                        <span
                          className={`absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full transition-all duration-300 ${
                            selected ? 'bg-ink text-cloud scale-100' : 'bg-white/85 text-ink/0 scale-75'
                          }`}
                        >
                          <Check size={13} />
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-lg leading-none">{w.name}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink/45">
                        {w.id === 'cloud' && 'Soft and minimal'}
                        {w.id === 'earth' && 'Warm kraft paper'}
                        {w.id === 'sand' && 'Textured linen feel'}
                        {w.id === 'ink' && 'Bold deep paper'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="rounded-2xl border border-sand bg-white p-5 transition-colors focus-within:border-ink/40">
                  <div className="mb-3 flex items-center gap-2 text-ink/50">
                    <PenLine size={15} />
                    <span className="text-[11px] tracking-[0.14em] uppercase">Your note</span>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={200}
                    rows={4}
                    placeholder="Write a short note to include with this bouquet…"
                    className="w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-ink/35">We hand-write it on a card</span>
                    <span className="text-[11px] tabular-nums text-ink/35">{note.length}/200</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {noteSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNote(s)}
                      className={`rounded-pill border px-3.5 py-1.5 text-[12px] transition-colors ${
                        note === s
                          ? 'border-ink bg-ink text-cloud'
                          : 'border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="overflow-hidden rounded-2xl border border-sand bg-white">
                <div className="flex items-center gap-2 border-b border-sand/70 bg-cloud/60 px-5 py-4">
                  <PackageCheck size={15} className="text-earth" />
                  <span className="text-[11px] tracking-[0.14em] uppercase text-ink/50">
                    Order summary
                  </span>
                </div>
                <div className="space-y-3.5 px-5 py-5 text-sm">
                  <SummaryRow label="Size" value={`${size.label} (${size.stemCount} stems)`} />
                  <SummaryRow
                    label="Flowers"
                    value={
                      selectedFlowers.length
                        ? selectedFlowers.map((f) => `${f.name} × ${f.qty}`).join(', ')
                        : '—'
                    }
                  />
                  <SummaryRow label="Wrapping" value={wrapping.name} />
                  <SummaryRow label="Note" value={note || '—'} />
                  <div className="flex items-end justify-between border-t border-sand/70 pt-4">
                    <span className="text-[11px] tracking-[0.2em] text-ink/45">TOTAL</span>
                    <span className="font-display text-2xl">{formatIDR(total)}</span>
                  </div>
                </div>
                <div className="border-t border-sand/70 px-5 py-4">
                  <button
                    onClick={handleAdd}
                    disabled={totalStems === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-pill bg-ink py-4 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Sparkles size={14} />
                    {added ? 'ADDED TO BAG ✓' : 'SEND TO THE ATELIER'}
                  </button>
                </div>
              </div>
            )}
        </motion.div>

        {/* nav buttons */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 text-[13px] tracking-nav font-medium text-ink/60 transition-colors hover:text-ink disabled:opacity-25"
          >
            <ArrowLeft size={15} />
            BACK
          </button>
          {step < 5 ? (
            <button
              onClick={() => canNext && setStep((s) => Math.min(5, s + 1))}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-pill bg-ink px-7 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              CONTINUE
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-[13px] tracking-nav font-medium text-ink/60 transition-colors hover:text-ink"
            >
              START OVER
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="shrink-0 text-ink/45">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}
