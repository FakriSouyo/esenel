'use client';

import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { CalendarIcon, ClockIcon } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const toLocalDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 09:00 → 18:00 every 15 minutes (same grid as the reference design).
const TIME_SLOTS = Array.from({ length: 37 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour = Math.floor(totalMinutes / 60) + 9;
  const minute = totalMinutes % 60;
  return `${pad(hour)}:${pad(minute)}`;
});

function formatSummary(datetimeLocal) {
  if (!datetimeLocal) return '';
  const [datePart, timePart] = String(datetimeLocal).split('T');
  const d = new Date(`${datePart}T00:00:00`);
  const day = d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${day} · ${timePart.slice(0, 5)}`;
}

/**
 * Appointment-style date + time picker: a button opens a dialog with a
 * calendar on the left and a scrollable list of 15-minute time slots on
 * the right. Output stays "YYYY-MM-DDTHH:MM" so formatTanggal and the
 * WhatsApp message keep working unchanged.
 */
export default function DateTimePicker({ value = '', onChange }) {
  const [open, setOpen] = useState(false);
  const [datePart, setDatePart] = useState(value ? value.split('T')[0] : '');
  const [timePart, setTimePart] = useState(value && value.includes('T') ? value.split('T')[1].slice(0, 5) : '');

  const selected = datePart ? new Date(`${datePart}T00:00:00`) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const openDialog = () => {
    setDatePart(value ? value.split('T')[0] : '');
    setTimePart(value && value.includes('T') ? value.split('T')[1].slice(0, 5) : '');
    setOpen(true);
  };

  const handleSelect = (d) => {
    if (!d) return;
    setDatePart(toLocalDate(d));
  };

  const save = () => {
    if (!datePart || !timePart) return;
    onChange(`${datePart}T${timePart}`);
    setOpen(false);
  };

  const summary = formatSummary(value);
  const pendingSummary = formatSummary(datePart ? `${datePart}T${timePart || '00:00'}` : '');
  const ready = Boolean(datePart && timePart);

  return (
    <div>
      {/* Trigger button — looks like an input */}
      <button
        type="button"
        onClick={openDialog}
        className="flex w-full items-center gap-3 rounded-pill border border-sand bg-white px-5 py-3.5 text-left text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
      >
        <CalendarIcon size={16} aria-hidden="true" className="shrink-0 text-ink/40" />
        <span className={summary ? 'text-ink' : 'text-ink/35'}>{summary || 'Choose pickup/delivery date & time'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose date & time"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-cloud shadow-2xl"
          >
            {/* Header */}
            <div className="flex h-max items-center justify-between border-b border-sand px-6 py-4">
              <div>
                <p className="font-display text-xl leading-tight">Choose date &amp; time</p>
                <p className="mt-0.5 text-xs text-ink/50">Pick up or deliver your bouquet</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-ink/60 transition-colors hover:bg-sand/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Body: calendar left, time slots right */}
            <div className="relative flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-6 md:flex-row md:overflow-hidden md:pr-52">
              <div className="mx-auto md:mx-0 md:flex-1 md:pr-2">
                <DayPicker
                  mode="single"
                  selected={selected}
                  onSelect={handleSelect}
                  disabled={{ before: today }}
                  showOutsideDays={false}
                  className="esenel-datepicker bg-transparent p-0"
                />
              </div>
              <div className="flex flex-col gap-2 border-t border-sand pt-4 md:absolute md:inset-y-0 md:right-0 md:w-48 md:border-l md:border-t-0 md:pt-0">
                <p className="flex items-center gap-2 px-6 pt-4 text-[12px] tracking-nav text-ink/50 md:px-4 md:pt-5">
                  <ClockIcon size={14} aria-hidden="true" /> TIME
                </p>
                <div className="max-h-48 overflow-y-auto px-4 pb-5 md:max-h-none md:flex-1">
                  <div className="flex flex-col gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimePart(t)}
                        className={`w-full rounded-pill py-2 text-[13px] font-medium tracking-nav transition-colors ${
                          timePart === t
                            ? 'bg-ink text-cloud'
                            : 'border border-sand bg-white text-ink/70 hover:bg-sand/50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-sand px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink/70">
                {ready ? (
                  <>
                    Schedule:{' '}
                    <span className="font-medium text-ink">{pendingSummary.replace(' · 00:00', '')}</span>
                  </>
                ) : (
                  'Pick a date and time to continue.'
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-pill border border-sand bg-white px-5 py-2.5 text-[12px] font-medium tracking-nav text-ink/70 transition-colors hover:bg-sand/50"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={!ready}
                  onClick={save}
                  className="rounded-pill bg-ink px-6 py-2.5 text-[12px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90 disabled:opacity-40"
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
