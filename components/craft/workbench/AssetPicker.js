'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CRAFT_ASSETS, CRAFT_CATEGORIES, POSE_LABELS, getFlowerPoseSrc } from '@/lib/craftAssets';
import { formatIDR } from '@/lib/format';

export function AssetPicker({ onSelect, counts = {} }) {
  const [category, setCategory] = useState('flowers');
  const [expandedId, setExpandedId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const assets = CRAFT_ASSETS.filter((a) => a.category === category);

  const drop = (assetId, pose) => {
    onSelect(assetId, pose);
    setExpandedId(null);
    setFlashId(assetId);
    setTimeout(() => setFlashId((f) => (f === assetId ? null : f)), 450);
  };

  const switchCategory = (id) => {
    setCategory(id);
    setExpandedId(null);
  };

  return (
    <div className="border-t border-ink/8 bg-white/85 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-md">
      {/* category tabs */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pt-3">
        {CRAFT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => switchCategory(c.id)}
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
        {assets.map((asset) => {
          const count = counts[asset.id] || 0;
          const expanded = expandedId === asset.id;
          const flashing = flashId === asset.id;
          return (
            <div key={asset.id} className="flex shrink-0 flex-col">
              {/* main tile — one tap drops the flower */}
              <button
                onClick={() => drop(asset.id, 'front')}
                title={`Drop ${asset.name}`}
                className={`group relative flex w-[76px] flex-col items-center gap-1 rounded-2xl border p-2 pt-2.5 transition-all duration-150 active:scale-95 ${
                  flashing
                    ? 'border-earth/80 bg-[#23301F]/[0.06] ring-2 ring-[#23301F]/25'
                    : 'border-transparent hover:border-earth/40 hover:bg-cloud/80 hover:shadow-[0_6px_16px_rgba(35,48,31,0.1)]'
                }`}
              >
                {/* count badge */}
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 z-10 grid min-w-5 place-items-center rounded-full bg-[#23301F] px-1 py-0.5 text-[10px] font-semibold text-cloud shadow-md">
                    {count}
                  </span>
                )}
                <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-sand/70 bg-cloud shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFlowerPoseSrc(asset.id, 'front')}
                    alt={asset.name}
                    className="h-12 w-12 object-contain transition-transform duration-200 group-hover:scale-110"
                    draggable={false}
                  />
                </span>
                <span className="text-[11px] leading-tight text-ink/60">{asset.name}</span>
                <span className="text-[10px] font-medium text-ink/35">{formatIDR(asset.price)}</span>

                {/* pose chevron — opens the variant picker */}
                {asset.poses && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`${asset.name} poses`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expanded ? null : asset.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setExpandedId(expanded ? null : asset.id);
                      }
                    }}
                    className={`absolute -bottom-1.5 right-1 z-10 grid size-5 place-items-center rounded-full border shadow-sm transition-colors ${
                      expanded ? 'border-[#23301F] bg-[#23301F] text-cloud' : 'border-sand bg-white text-ink/45 hover:bg-ink/[0.06]'
                    }`}
                  >
                    {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </span>
                )}
              </button>

              {/* pose panel */}
              {expanded && asset.poses && (
                <div className="mt-2 flex gap-2 rounded-xl border border-sand/70 bg-white p-2 shadow-lg">
                  {asset.poses.map((pose) => (
                    <button
                      key={pose}
                      onClick={() => drop(asset.id, pose)}
                      title={`Drop ${asset.name} — ${POSE_LABELS[pose]}`}
                      className="group flex flex-col items-center gap-1 rounded-lg p-1 transition-all hover:bg-cloud hover:shadow-[0_4px_12px_rgba(35,48,31,0.1)] active:scale-95"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-sand/50 bg-cloud">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFlowerPoseSrc(asset.id, pose)}
                          alt={`${asset.name} — ${POSE_LABELS[pose]}`}
                          className="h-12 w-12 object-contain transition-transform duration-200 group-hover:scale-110"
                          draggable={false}
                        />
                      </span>
                      <span className="text-[10px] font-medium text-ink/65">{POSE_LABELS[pose]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
