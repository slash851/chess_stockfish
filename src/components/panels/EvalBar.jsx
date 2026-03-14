import React from 'react';

const EvalBar = ({ evaluation, bestLines }) => {
  const value = Math.max(0, Math.min(100, (((evaluation?.value ?? 0) + 10) / 20) * 100));
  const displayValue = bestLines[0]?.display || evaluation?.display || '...';

  return (
    <div className="flex h-full flex-col sm:flex-col items-center">
      {/* Mobile: horizontal bar */}
      <div className="relative sm:hidden h-2 w-full overflow-hidden rounded-none border-none bg-slate-950 shadow-none">
        <div
          className="absolute left-0 top-0 z-0 h-full bg-black transition-[width] duration-300"
          style={{ width: `${100 - value}%` }}
        />
        <div
          className="absolute left-0 top-0 z-10 h-full bg-white transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-slate-100">
          {displayValue}
        </div>
      </div>
      {/* Desktop: vertical bar */}
      <div className="hidden sm:block relative h-[var(--board-size)] w-10 sm:w-14 overflow-visible rounded-xl border border-slate-900 bg-slate-950 shadow-xl">
        <div
          className="absolute left-0 top-0 z-0 w-full bg-black transition-[height] duration-300"
          style={{ height: `${100 - value}%` }}
        />
        <div
          className="absolute bottom-0 left-0 z-10 w-full bg-white transition-[height] duration-300"
          style={{ height: `${value}%` }}
        />
        {/* White text on top (for black's advantage) */}
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
          {displayValue}
        </div>
        {/* Black text on bottom (for white's advantage) */}
          <div className="z-10 pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[11px] font-semibold text-black">
          {displayValue}
        </div>
      </div>
    </div>
  );
};

export default EvalBar;
