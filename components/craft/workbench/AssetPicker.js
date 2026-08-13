'use client';

import { useState } from 'react';
import { CRAFT_ASSETS, CRAFT_CATEGORIES } from '@/lib/craftAssets';

export function AssetPicker({ onSelect }) {
  const [category, setCategory] = useState('flowers');
  const assets = CRAFT_ASSETS.filter((a) => a.category === category);

  return (
    <div className="border-t border-ink/8 bg-white/85 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-md">
      {/* category tabs */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pt-3">
        {CRAFT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              category === c.id
                ? 'bg-[#23301F] text-cloud shadow-[0_4px_12px_rgba(35,48,31,0.3)]'
                : 'bg-ink/[0.05] text-ink/55 hover:bg-ink/[0.09] hover:text-ink'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* asset tiles */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-3">
        {assets.length === 0 && <p className="py-4 text-xs text-ink/40">More coming soon</p>}
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => onSelect(asset.id)}
            title={`Drop ${asset.name} into the bouquet`}
            className="group flex shrink-0 flex-col items-center gap-1 transition-transform active:scale-95"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sand/70 bg-cloud shadow-sm transition-all duration-200 group-hover:border-earth/50 group-hover:shadow-[0_6px_16px_rgba(35,48,31,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.src}
                alt={asset.name}
                className="h-11 w-11 object-contain transition-transform duration-200 group-hover:scale-110"
                draggable={false}
              />
            </span>
            <span className="text-[11px] text-ink/55">{asset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
