'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { uploadBouquetImage, saveSubmittedBouquet } from '@/lib/supabase';

/**
 * Modal "Save your bouquet" — lets the maker name the bouquet + themselves.
 * Uploads the captured PNG to the public gallery and persists it to the
 * shared gallery. On success it calls onSaved (auto-closes + hides the Save
 * button in the review step).
 */
export function SaveBouquetModal({ open, previewImage, flowers = [], size, wrapping, onClose, onSaved }) {
  const [bouquetName, setBouquetName] = useState('');
  const [makerName, setMakerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || done) return;
    if (!bouquetName.trim()) {
      setError('Give your bouquet a name first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let imageUrl = null;
      if (previewImage) {
        imageUrl = await uploadBouquetImage(previewImage);
      }
      await saveSubmittedBouquet({
        bouquet_name: bouquetName.trim(),
        maker_name: makerName.trim() || null,
        image_url: imageUrl,
        size: size || null,
        wrapping: wrapping || null,
        flowers,
      });
      setDone(true);
      // Auto-close after a short beat so the user sees the success state.
      setTimeout(() => onSaved(), 800);
    } catch (err) {
      setError(err?.message || 'Failed to save — try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Save your bouquet"
      onClick={done ? undefined : onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(ev) => ev.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-[#23301F] text-cloud">
              <Check size={26} />
            </span>
            <h3 className="font-display text-2xl">Saved ✿</h3>
            <p className="max-w-[30ch] text-sm text-ink/60">
              <span className="font-medium text-ink">“{bouquetName}”</span> is now part of our
              community gallery.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-ink/40">Save to gallery</p>
                <h3 className="mt-1 font-display text-2xl">Name your bouquet</h3>
              </div>
              {!saving && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full text-ink/50 hover:bg-ink/[0.06] hover:text-ink"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {previewImage && (
              <div className="mb-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt="Your bouquet"
                  className="h-40 w-40 rounded-2xl border border-sand object-contain"
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink/60">Bouquet name *</span>
                <input
                  value={bouquetName}
                  onChange={(e) => setBouquetName(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. Yūgen"
                  className="w-full rounded-xl border border-sand px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink/60">Your name</span>
                <input
                  value={makerName}
                  onChange={(e) => setMakerName(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. Carin"
                  className="w-full rounded-xl border border-sand px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
                />
              </label>

              {error && <p className="text-[12px] text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-ink py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving…
                  </>
                ) : (
                  'Save to gallery'
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}