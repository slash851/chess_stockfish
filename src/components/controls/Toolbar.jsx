import React from 'react';

const Toolbar = ({
  onNew,
  onCopyPgn,
  onCopyFen,
  onLoad,
  isGameOver,
  stockfishReady,
  turnText,
}) => (
  <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#121218] px-4 py-4 shadow-xl">
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Board Lens logo" className="h-12 w-12 rounded-sm object-contain" />
        <p className="text-base font-semibold text-slate-100">Board Lens</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
        <span className="rounded-lg bg-slate-900 px-3 py-1 font-semibold">{turnText}</span>
        {isGameOver && <span className="font-semibold text-rose-400">Game Over</span>}
      </div>
    </div>

    <div className={`text-sm font-semibold ${stockfishReady ? 'text-emerald-400' : 'text-amber-300'}`}>
      Stockfish: {stockfishReady ? '✓ Ready' : 'Loading...'}
    </div>

    <div className="grid grid-cols-1 gap-2">
      <button
        onClick={onNew}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 shadow-inner transition hover:bg-slate-700"
      >
        New Game
      </button>
      <button
        onClick={onCopyPgn}
        className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/60"
      >
        Copy PGN
      </button>
      <button
        onClick={onCopyFen}
        className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/60"
      >
        Copy FEN
      </button>
      <button
        onClick={onLoad}
        className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/60"
      >
        Load PGN/FEN
      </button>
    </div>
  </div>
);

export default Toolbar;
