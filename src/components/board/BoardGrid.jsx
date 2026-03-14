import React from 'react';
import { BOARD_FILES, BOARD_RANKS } from '../../controllers/GameController';

const Square = ({
  square,
  piece,
  isLight,
  isSelected,
  isPossible,
  isLastMove,
  evaluation,
  showRank,
  showFile,
  onClick,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
}) => {
  const base = isLight ? 'bg-board-light text-amber-900' : 'bg-board-dark text-slate-50';
  const stateClasses = [
    isSelected && 'ring-4 ring-emerald-300/60',
    isLastMove && 'outline outline-2 outline-emerald-500/80',
    isPossible && 'after:absolute after:w-6 after:h-6 after:rounded-full after:bg-black/25 after:shadow-lg',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`relative flex items-center justify-center text-5xl select-none transition-all duration-200 aspect-square ${base} ${stateClasses}`}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {showRank && <span className="absolute left-1 top-1 text-xs font-semibold text-slate-600">{square.rank}</span>}
      {showFile && <span className="absolute right-1 bottom-1 text-xs font-semibold text-slate-600">{square.file}</span>}

      {piece && (
        piece.image ? (
          <img
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            src={piece.image.src}
            alt=""
            className="z-10 h-full w-full object-contain"
          />
        ) : (
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`z-10 ${piece.color === 'w' ? 'text-slate-50 drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]' : 'text-slate-900 drop-shadow-[0_3px_5px_rgba(255,255,255,0.25)]'}`}
          >
            {piece.symbol}
          </span>
        )
      )}

      {isPossible && evaluation && (
        <div className="pointer-events-none absolute right-1 top-1 z-20">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-lg ${
              evaluation.startsWith('-') ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-slate-900'
            }`}
          >
            {evaluation}
          </span>
        </div>
      )}
    </div>
  );
};

const BoardGrid = ({
  squares,
  selectedSquare,
  possibleTargets,
  lastMoveSquares,
  moveEvaluations,
  onSquareClick,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
}) => {
  const files = BOARD_FILES;
  const ranks = BOARD_RANKS;

  return (
    <div className="relative grid h-[var(--board-size)] w-[var(--board-size)] grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border border-slate-900 shadow-xl">
      {ranks.map((rank, rowIdx) =>
        files.map((file, colIdx) => {
          const squareId = `${file}${rank}`;
          const entry = squares[squareId] ?? {};
          const piece = entry.piece;
          const isSelected = selectedSquare === squareId;
          const isPossible = possibleTargets.includes(squareId);
          const isLastMove = lastMoveSquares.includes(squareId);

          return (
            <Square
              key={squareId}
              square={{ file, rank, rowIdx, colIdx }}
              piece={piece}
              isLight={entry.isLight ?? (rowIdx + colIdx) % 2 === 0}
              isSelected={isSelected}
              isPossible={isPossible}
              isLastMove={isLastMove}
              evaluation={moveEvaluations[squareId]}
              showRank={colIdx === 0}
              showFile={rowIdx === 7}
              onClick={() => onSquareClick(squareId)}
              onDragStart={() => onDragStart(squareId)}
              onDragEnd={onDragEnd}
              onDrop={(e) => onDrop(e, squareId)}
              onDragOver={onDragOver}
            />
          );
        }),
      )}
    </div>
  );
};

export default BoardGrid;
