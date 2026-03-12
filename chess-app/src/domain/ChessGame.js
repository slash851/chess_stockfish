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
    copy.loadPgn(this.chess.pgn());
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
    let loaded = false;

    try {
      loaded = next.load(text);
    } catch {
      loaded = false;
    }

    if (!loaded) {
      try {
        loaded = next.loadPgn(text);
      } catch {
        loaded = false;
      }
    }

    if (!loaded) return null;
    return new ChessGame(next);
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
