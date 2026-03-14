import { pieceSymbols } from './ChessGame';

const MATERIAL_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export class MaterialService {
  static tally(chessInstance) {
    const startCounts = { w: { p: 8, n: 2, b: 2, r: 2, q: 1 }, b: { p: 8, n: 2, b: 2, r: 2, q: 1 } };
    const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    let materialW = 0;
    let materialB = 0;

    chessInstance.board().flat().forEach((piece) => {
      if (!piece) return;
      counts[piece.color][piece.type] += 1;
      const val = MATERIAL_VALUES[piece.type] ?? 0;
      if (piece.color === 'w') materialW += val;
      else materialB += val;
    });

    const missing = {
      w: Object.keys(startCounts.w).flatMap((t) => Array(startCounts.w[t] - counts.w[t]).fill(t)),
      b: Object.keys(startCounts.b).flatMap((t) => Array(startCounts.b[t] - counts.b[t]).fill(t)),
    };

    const groupCaptured = (list, color) => {
      const grouped = {};
      list.forEach((t) => {
        grouped[t] = (grouped[t] || 0) + 1;
      });
      return Object.entries(grouped).map(([type, count]) => ({
        symbol: pieceSymbols[color === 'b' ? type : type.toUpperCase()],
        color,
        count,
      }));
    };

    const capturedByWhite = groupCaptured(missing.b, 'b');
    const capturedByBlack = groupCaptured(missing.w, 'w');
    const materialDiff = materialW - materialB;

    return { capturedByWhite, capturedByBlack, materialDiff };
  }
}
