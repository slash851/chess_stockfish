import React from 'react';

const NavControls = ({ onStart, onUndo, onRedo, onEnd, disableStart, disableUndo, disableRedo, disableEnd }) => (
  <div className="flex gap-2 justify-center">
    <button
      onClick={onStart}
      disabled={disableStart}
      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 hover:border-emerald-400 hover:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-40"
      title="Go to start"
    >
      ⏮
    </button>
    <button
      onClick={onUndo}
      disabled={disableUndo}
      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 hover:border-emerald-400 hover:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-40"
      title="Previous move"
    >
      ◀
    </button>
    <button
      onClick={onRedo}
      disabled={disableRedo}
      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 hover:border-emerald-400 hover:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-40"
      title="Next move"
    >
      ▶
    </button>
    <button
      onClick={onEnd}
      disabled={disableEnd}
      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 hover:border-emerald-400 hover:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-40"
      title="Go to end"
    >
      ⏭
    </button>
  </div>
);

export default NavControls;
