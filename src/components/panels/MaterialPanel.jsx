import React from 'react';

const CapturedGroup = ({ group, side }) => (
  <div className="flex items-center gap-2">
    {group.map((p, idx) => (
      <span
        key={`${side}-${p.symbol}-${idx}`}
        className={`relative inline-flex items-center justify-center text-xl ${
          p.color === 'w'
            ? 'text-slate-50'
            : 'text-slate-900 [text-shadow:0_0_1px_rgba(255,255,255,0.9),0_0_4px_rgba(255,255,255,0.7)]'
        }`}
      >
        {p.symbol}
        {p.count > 1 && (
          <span className="absolute -right-2 -bottom-2 rounded-full bg-black/70 px-1 text-[10px] text-white">
            {p.count}
          </span>
        )}
      </span>
    ))}
  </div>
);

const MaterialPanel = ({ title, captured, materialDiff }) => (
  <div className="w-[var(--board-size)] max-w-full px-0 py-1">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{title}</p>
      {materialDiff !== 0 && (
        <span className={`text-sm font-semibold ${materialDiff > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {materialDiff > 0 ? `+${materialDiff}` : materialDiff}
        </span>
      )}
    </div>
    <div className="mt-1 flex flex-wrap items-center gap-2 text-base">
      <CapturedGroup group={captured} side={title} />
    </div>
  </div>
);

export default MaterialPanel;
