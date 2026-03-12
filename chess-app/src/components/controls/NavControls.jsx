import React from 'react';

const NavControls = ({ onStart, onUndo, onRedo, disableStart, disableUndo, disableRedo }) => (
  <div className="grid grid-cols-3 gap-3">
    <button
      onClick={onStart}
      disabled={disableStart}
      className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      ⏮
    </button>
    <button
      onClick={onUndo}
      disabled={disableUndo}
      className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      ⏪
    </button>
    <button
      onClick={onRedo}
      disabled={disableRedo}
      className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      ⏩
    </button>
  </div>
);

export default NavControls;
