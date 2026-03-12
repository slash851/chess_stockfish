import React from 'react';

const EvalBar = ({ evaluation, bestLines }) => {
  const value = Math.max(0, Math.min(100, (((evaluation?.value ?? 0) + 10) / 20) * 100));
  const displayValue = bestLines[0]?.display || evaluation?.display || '...';

  return (
    <div className="flex h-full flex-col items-center">
      <div className="relative h-[var(--board-size)] w-10 overflow-hidden rounded-xl border border-slate-900 bg-slate-950 shadow-xl">
        <div
          className="absolute left-0 top-0 z-0 w-full bg-black transition-[height] duration-300"
          style={{ height: `${100 - value}%` }}
        />
        <div
          className="absolute bottom-0 left-0 z-10 w-full bg-white transition-[height] duration-300"
          style={{ height: `${value}%` }}
        />
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
          {displayValue}
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[11px] font-semibold text-black">
          {displayValue}
        </div>
      </div>
    </div>
  );
};

export default EvalBar;
