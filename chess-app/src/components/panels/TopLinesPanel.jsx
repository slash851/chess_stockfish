import React from 'react';

const TopLinesPanel = ({ bestLines }) => (
  <div className="flex h-[260px] flex-col rounded-xl border border-slate-900 bg-[#16161d] p-4 shadow-lg">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Top Lines</h4>
      {bestLines.length === 0 && <span className="text-xs text-amber-300">Analyzing…</span>}
    </div>
    <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
      {bestLines.map((line, idx) => (
        <details
          key={idx}
          className="rounded-lg bg-slate-900 px-3 py-2"
          data-testid={`top-line-${idx}`}
        >
          <summary className="flex items-start gap-2 list-none cursor-pointer">
            <span
              className={`text-sm font-semibold ${
                line.display?.startsWith('-') ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              {line.display}
            </span>
            <span className="flex-1 min-w-0 text-xs font-mono text-slate-300 truncate">{line.san}</span>
          </summary>
          <div className="mt-2 text-xs font-mono text-slate-300 whitespace-pre-wrap break-words">{line.san}</div>
        </details>
      ))}
      {bestLines.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-slate-900 px-3 py-2">
          <span className="text-sm font-semibold text-slate-400">...</span>
          <span className="text-xs font-mono text-slate-500">Waiting for analysis</span>
        </div>
      )}
      {bestLines.length === 1 && <div className="h-[44px] rounded-lg bg-slate-900/60" />}
    </div>
  </div>
);

export default TopLinesPanel;
