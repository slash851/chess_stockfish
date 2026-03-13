import { Chess } from 'chess.js';

const PIECE_SYMBOLS = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♟',
  R: '♜',
  N: '♞',
  B: '♝',
  Q: '♛',
  K: '♚',
};

export class ChessGame {
  constructor(chess = new Chess()) {
    this.chess = chess;
  }

  static create() {
    return new ChessGame(new Chess());
  }

  static fromMoves(moves = []) {
    const instance = new Chess();
    moves.forEach((move) => instance.move(move));
    return new ChessGame(instance);
  }

  clone() {
    const copy = new Chess();
    try {
      copy.loadPgn(this.chess.pgn());
    } catch {
      // Fallback: copy by moves
      this.chess.history({ verbose: true }).forEach(move => {
        copy.move(move);
      });
    }
    return new ChessGame(copy);
  }

  fen() {
    return this.chess.fen();
  }

  pgn() {
    return this.chess.pgn();
  }

  turn() {
    return this.chess.turn();
  }

  move(move) {
    return this.chess.move({ ...move, promotion: move.promotion ?? 'q' });
  }

  legalMoves(square) {
    return this.chess.moves({ square, verbose: true });
  }

  historyVerbose() {
    return this.chess.history({ verbose: true });
  }

  load(text) {
    const next = new Chess();
    
    // Trim input
    const cleanText = text.trim();
    
    // Try FEN first (FEN contains '/' for rank separators)
    if (cleanText.includes('/') && !cleanText.includes('[')) {
      try {
        next.load(cleanText);
        // If we get here without exception, FEN loaded successfully
        return new ChessGame(next);
      } catch {
        // FEN parsing failed, try PGN
      }
    }
    
    // Try PGN (contains metadata brackets or move notation)
    try {
      next.loadPgn(cleanText);
      return new ChessGame(next);
    } catch {
      // PGN parsing failed
    }
    
    // If text doesn't look like FEN or PGN, try both
    try {
      next.load(cleanText);
      return new ChessGame(next);
    } catch {
      try {
        next.loadPgn(cleanText);
        return new ChessGame(next);
      } catch {
        return null;
      }
    }
  }

  boardMap() {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const squares = {};

    ranks.forEach((rank, rowIdx) => {
      files.forEach((file, colIdx) => {
        const square = `${file}${rank}`;
        const piece = this.chess.get(square);
        if (piece) {
          const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
          squares[square] = {
            square,
            row: rowIdx,
            col: colIdx,
            color: piece.color,
            type: piece.type,
            symbol: PIECE_SYMBOLS[key],
          };
        }
      });
    });

    return squares;
  }
}

export const pieceSymbols = PIECE_SYMBOLS;
