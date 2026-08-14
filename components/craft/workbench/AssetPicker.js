'use client';

import { useState } from 'react';
import { CRAFT_ASSETS, CRAFT_CATEGORIES, POSE_LABELS, getFlowerPoseSrc } from '@/lib/craftAssets';

export function AssetPicker({ onSelect }) {
  const [category, setCategory] = useState('flowers');
  const [expandedFlowerId, setExpandedFlowerId] = useState(null);
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
      <div className="no-scrollbar flex flex-col gap-2 overflow-x-auto px-4 py-3">
        <div className="flex gap-3">
          {assets.length === 0 && <p className="py-4 text-xs text-ink/40">More coming soon</p>}
          {assets.map((asset) => (
            <div key={asset.id} className="flex shrink-0 flex-col">
              <button
                onClick={() => setExpandedFlowerId(expandedFlowerId === asset.id ? null : asset.id)}
                title={`Select ${asset.name} pose`}
                className="group flex shrink-0 flex-col items-center gap-1 transition-transform active:scale-95"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-cloud shadow-sm transition-all duration-200 group-hover:border-earth/50 group-hover:shadow-[0_6px_16px_rgba(35,48,31,0.12)] ${
                  expandedFlowerId === asset.id ? 'border-earth/70 shadow-[0_6px_16px_rgba(35,48,31,0.12)]' : 'border-sand/70'
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFlowerPoseSrc(asset.id, 'front')}
                    alt={asset.name}
                    className="h-11 w-11 object-contain transition-transform duration-200 group-hover:scale-110"
                    draggable={false}
                  />
                </span>
                <span className="text-[11px] text-ink/55">{asset.name}</span>
              </button>

              {/* Expandable pose picker panel */}
              {expandedFlowerId === asset.id && asset.poses && (
                <div className="mt-2 flex gap-2 rounded-xl border border-sand/70 bg-white p-2 shadow-lg">
                  {asset.poses.map((pose) => (
                    <button
                      key={pose}
                      onClick={() => {
                        onSelect(asset.id, pose);
                        setExpandedFlowerId(null);
                      }}
                      title={`Drop ${asset.name} - ${POSE_LABELS[pose]}`}
                      className="group flex flex-col items-center gap-1 transition-transform hover:scale-105 active:scale-95"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-sand/50 bg-cloud shadow-sm transition-all duration-200 group-hover:border-earth/50 group-hover:shadow-[0_4px_12px_rgba(35,48,31,0.12)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFlowerPoseSrc(asset.id, pose)}
                          alt={`${asset.name} - ${POSE_LABELS[pose]}`}
                          className="h-14 w-14 object-contain transition-transform duration-200 group-hover:scale-110"
                          draggable={false}
                        />
                      </span>
                      <span className="text-[10px] font-medium text-ink/65">{POSE_LABELS[pose]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
