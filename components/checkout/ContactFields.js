'use client';

import { useRef, useState } from 'react';

const inputClass =
  'w-full border border-sand rounded-pill bg-white px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-ink transition-colors';
const labelClass = 'text-[12px] tracking-nav text-ink/50 block mb-2';

/**
 * Nama + No WhatsApp inputs with a dropdown of saved contact history
 * (localStorage). Typing filters the list; picking fills both fields.
 */
export default function ContactFields({
  history = [],
  nama,
  wa,
  onNama,
  onWa,
  onPick,
  namaLabel = 'NAMA LENGKAP *',
  waLabel = 'NO WHATSAPP *',
  namaPlaceholder = 'Nama',
  waPlaceholder = '0822…',
  inputMode = 'tel',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const q = `${nama} ${wa}`.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const list = history
    .filter((h) => {
      if (!q) return true;
      const hay = `${h.nama || ''} ${h.wa || ''}`.toLowerCase();
      const hayDigits = (h.wa || '').replace(/\D/g, '');
      return hay.includes(q) || (qDigits && hayDigits.includes(qDigits));
    })
    .slice(0, 6);

  const pick = (h) => {
    onPick(h);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{namaLabel}</span>
          <input
            required
            value={nama}
            onChange={(e) => onNama(e.target.value)}
            onFocus={() => setOpen(true)}
            className={inputClass}
            placeholder={namaPlaceholder}
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className={labelClass}>{waLabel}</span>
          <input
            required
            inputMode={inputMode}
            value={wa}
            onChange={(e) => onWa(e.target.value)}
            onFocus={() => setOpen(true)}
            className={inputClass}
            placeholder={waPlaceholder}
            autoComplete="off"
          />
        </label>
      </div>

      {open && list.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-sand bg-white py-2 shadow-xl">
          {list.map((h, i) => (
            <li key={`${h.nama}|${h.wa}|${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(h)}
                className="flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left transition-colors hover:bg-sand/50"
              >
                <span className="truncate text-sm text-ink">{h.nama || '—'}</span>
                <span className="shrink-0 text-xs text-ink/45">{h.wa}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
