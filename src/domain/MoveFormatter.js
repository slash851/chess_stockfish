import { Chess } from 'chess.js';

export class MoveFormatter {
  static sanHistory(verboseMoves = []) {
    const g = new Chess();
    const sanList = [];
    verboseMoves.forEach((m) => {
      g.move(m);
      const h = g.history();
      sanList.push(h[h.length - 1]);
    });
    return sanList;
  }

  static chunkPairs(movesArr = []) {
    const pairs = [];
    for (let i = 0; i < movesArr.length; i += 2) {
      pairs.push({ white: movesArr[i], black: movesArr[i + 1] });
    }
    return pairs;
  }

  static pvToPrettySan(fen, pvMoves) {
    try {
      const temp = new Chess(fen);
      const fenParts = fen.split(' ');
      const fenTurn = fenParts[1] === 'b' ? 'b' : 'w';
      const fenFullmove = Number.parseInt(fenParts[5], 10);
      const startingMoveNumber = Number.isFinite(fenFullmove) && fenFullmove > 0 ? fenFullmove : 1;
      const moves = pvMoves.split(' ');
      const sanMoves = [];

      moves.forEach((m) => {
        const move = temp.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
        if (move?.san) sanMoves.push(move.san);
      });

      const pretty = [];
      let moveNumber = startingMoveNumber;
      let color = fenTurn;

      sanMoves.forEach((san) => {
        if (color === 'w') {
          pretty.push(`${moveNumber}. ${san}`);
          color = 'b';
        } else {
          pretty.push(`${moveNumber}... ${san}`);
          color = 'w';
          moveNumber += 1;
        }
      });

      return pretty.join(' ');
    } catch {
      return pvMoves;
    }
  }
}
