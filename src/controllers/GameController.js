import { ChessGame } from '../domain/ChessGame';
import { MoveFormatter } from '../domain/MoveFormatter';
import { MaterialService } from '../domain/MaterialService';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export class GameController {
  constructor(engine) {
    this.engine = engine;
  }

  initialState() {
    const game = ChessGame.create();
    return { game, moves: [], plyIndex: 0, lastMoveSquares: [] };
  }

  applyMove(state, from, to) {
    const { game, moves, plyIndex } = state;
    const clone = game.clone();
    const result = clone.move({ from, to, promotion: 'q' });
    if (!result) return null;
    const nextMoves = [...moves.slice(0, plyIndex), result];
    return {
      game: clone,
      moves: nextMoves,
      plyIndex: nextMoves.length,
      lastMoveSquares: [result.from, result.to],
    };
  }

  syncToIndex(moves, targetIndex) {
    const idx = Math.max(0, Math.min(targetIndex, moves.length));
    const game = ChessGame.fromMoves(moves.slice(0, idx));
    const lastMoveSquares = idx > 0 ? [moves[idx - 1].from, moves[idx - 1].to] : [];
    return { game, plyIndex: idx, lastMoveSquares };
  }

  loadPosition(text) {
    const loader = ChessGame.create().load(text);
    if (!loader) return null;
    const history = loader.historyVerbose();
    const last = history.length ? history[history.length - 1] : null;
    return {
      game: loader,
      moves: history,
      plyIndex: history.length,
      lastMoveSquares: last ? [last.from, last.to] : [],
    };
  }

  boardSquares(game) {
    const map = game.boardMap();
    const squares = {};
    RANKS.forEach((rank, rowIdx) => {
      FILES.forEach((file, colIdx) => {
        const id = `${file}${rank}`;
        squares[id] = {
          square: id,
          row: rowIdx,
          col: colIdx,
          isLight: (rowIdx + colIdx) % 2 === 0,
          piece: map[id] ?? null,
        };
      });
    });
    return squares;
  }

  possibleMoveTargets(moves = []) {
    return moves.map((m) => m.to);
  }

  findMove(moves, targetSquare) {
    return moves.find((m) => m.to === targetSquare);
  }

  previewQueue(game, moves) {
    const queue = [];

    moves.forEach((moveInfo) => {
      const clone = game.clone();
      const result = clone.move(moveInfo);
      if (result) {
        queue.push({ fen: clone.fen(), toSquare: moveInfo.to, turn: clone.turn() });
      }
    });

    return queue;
  }

  analysis(game, setLines, setEvaluation) {
    this.engine.analyzePosition({
      fen: game.fen(),
      turn: game.turn(),
      onLines: (updater) => {
        setLines((prev) => updater(prev));
      },
      onEvaluation: (payload) => setEvaluation(payload),
    });
  }

  preview(game, moves, onResult, onComplete) {
    const queue = this.previewQueue(game, moves);
    this.engine.previewMoves({ queue, onResult, onComplete });
  }

  material(game) {
    return MaterialService.tally(game.chess);
  }

  historyPairs(moves) {
    return MoveFormatter.chunkPairs(MoveFormatter.sanHistory(moves));
  }
}

export const BOARD_FILES = FILES;
export const BOARD_RANKS = RANKS;
