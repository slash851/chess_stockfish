import React, { useEffect, useRef } from 'react';

const MoveRow = ({ index, pair, currentPly }) => {
  const whiteIdx = index * 2;
  const blackIdx = index * 2 + 1;
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-slate-800/60">
      <span className="w-10 text-right text-xs font-semibold text-slate-400">{index + 1}.</span>
      <span className={`min-w-[80px] text-sm ${currentPly === whiteIdx ? 'text-emerald-300 font-semibold' : 'text-slate-100'}`}>
        {pair.white || ''}
      </span>
      <span className={`min-w-[80px] text-sm ${currentPly === blackIdx ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
        {pair.black || ''}
      </span>
    </div>
  );
};

const MoveHistoryPanel = ({ pairs, currentPly }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [pairs.length, currentPly]);

  return (
    <div className="flex h-[360px] flex-col rounded-xl border border-slate-900 bg-[#16161d] p-4 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Move History</h3>
      <div ref={listRef} className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1 text-sm">
        {pairs.map((pair, idx) => (
          <MoveRow key={idx} index={idx} pair={pair} currentPly={currentPly} />
        ))}
      </div>
    </div>
  );
};

export default MoveHistoryPanel;
