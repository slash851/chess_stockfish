import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import './ChessBoard.css';

// Use filled-style glyphs for both colors; color is handled by CSS.
const PIECE_SYMBOLS = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚'
};

function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [moveEvaluations, setMoveEvaluations] = useState({});
  const [bestLines, setBestLines] = useState([]);
  const [evaluation, setEvaluation] = useState(null); // {display, value}
  const [moves, setMoves] = useState([]); // raw move objects
  const [plyIndex, setPlyIndex] = useState(0); // current ply position
  const [lastMoveSquares, setLastMoveSquares] = useState([]);
  const [stockfishReady, setStockfishReady] = useState(false);
  const stockfishRef = useRef(null);
  const dragFromRef = useRef(null);
  const movesListRef = useRef(null);
  const evaluationQueueRef = useRef([]);
  const currentEvaluationTargetRef = useRef(null);
  const currentEvaluationTurnRef = useRef('w');
  const isEvaluatingRef = useRef(false);
  const processQueueRef = useRef(null);
  const multiPVReadyRef = useRef(false);
  const analysisTurnRef = useRef('w');
  const lastAnalyzedFenRef = useRef(new Chess().fen());

  const MATERIAL_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  const cloneGame = (srcGame) => {
    const copy = new Chess();
    copy.loadPgn(srcGame.pgn());
    return copy;
  };

  const syncToIndex = (index) => {
    const g = new Chess();
    const target = Math.max(0, Math.min(index, moves.length));
    for (let i = 0; i < target; i += 1) {
      g.move(moves[i]);
    }
    setGame(g);
    setPlyIndex(target);
    setLastMoveSquares(target > 0 ? [moves[target - 1].from, moves[target - 1].to] : []);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    analyzePosition(g);
  };

  const applyMove = (from, to) => {
    const gameCopy = cloneGame(game);
    const result = gameCopy.move({ from, to, promotion: 'q' });
    if (!result) return;
    const nextMoves = [...moves.slice(0, plyIndex), result];
    setMoves(nextMoves);
    setGame(gameCopy);
    setPlyIndex(nextMoves.length);
    setLastMoveSquares([result.from, result.to]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    analyzePosition(gameCopy);
  };

  // Initialize Stockfish
  useEffect(() => {
    const stockfish = new Worker('/stockfish.js');
    stockfishRef.current = stockfish;

    stockfish.onmessage = (event) => {
      const data = event.data;

      // MultiPV/top lines handling
      if (data.startsWith('info') && data.includes('multipv')) {
        handleTopLineInfo(data);
      }
      
      // Get evaluation results for individual move previews
      if (data.startsWith('info') && (data.includes('cp') || data.includes('mate')) && currentEvaluationTargetRef.current) {
        const cpMatch = data.match(/cp\s+(-?\d+)/);
        const mateMatch = data.match(/mate\s+(-?\d+)/);

        const toSquare = currentEvaluationTargetRef.current;
        if (!toSquare) return;

        let evalText = null;
        if (mateMatch && mateMatch[1]) {
          const mateValue = parseInt(mateMatch[1], 10);
          const signedMate = currentEvaluationTurnRef.current === 'w' ? mateValue : -mateValue;
          evalText = signedMate > 0 ? `+M${Math.abs(mateValue)}` : `-M${Math.abs(mateValue)}`;
        } else if (cpMatch && cpMatch[1]) {
          const cp = parseInt(cpMatch[1], 10) / 100;
          const signed = currentEvaluationTurnRef.current === 'w' ? cp : -cp;
          evalText = signed > 0 ? `+${signed.toFixed(1)}` : signed.toFixed(1);
        }

        if (evalText) {
          setMoveEvaluations(prev => ({ ...prev, [toSquare]: evalText }));
        }
      }
    };

    stockfish.postMessage('uci');
    stockfish.postMessage('setoption name MultiPV value 2');
    multiPVReadyRef.current = true;
    
    setTimeout(() => {
      setStockfishReady(true);
    }, 1500);

    return () => {
      stockfish.terminate();
    };
  }, []);

  // Trigger full-position analysis for top lines and eval bar
  function analyzePosition(currentGame) {
    if (!stockfishReady || !stockfishRef.current) return;
    const fen = currentGame.fen();
    lastAnalyzedFenRef.current = fen;
    analysisTurnRef.current = currentGame.turn();
    setBestLines([]);
    setEvaluation(null);
    stockfishRef.current.postMessage(`position fen ${fen}`);
    stockfishRef.current.postMessage('go depth 14 multipv 2');
  }

  const evaluateMoves = useCallback((moves, currentGame) => {
    if (!stockfishRef.current || !stockfishReady) return;
    
    // pause ongoing deep search so single-move evals respond quickly
    stockfishRef.current.postMessage('stop');
    setMoveEvaluations({});
    
    const fen = currentGame.fen();
    const queue = [];
    
    moves.forEach(moveInfo => {
      const tempGame = new Chess(fen);
      try {
        const result = tempGame.move(moveInfo);
        if (result) {
          queue.push({ fen: tempGame.fen(), toSquare: moveInfo.to, turn: tempGame.turn() });
        }
      } catch (e) {
        console.error('Error:', e);
      }
    });
    
    evaluationQueueRef.current = queue;
    
    const processNext = (index) => {
      if (index >= queue.length) {
        currentEvaluationTargetRef.current = null;
        // resume full position analysis after previews
        analyzePosition(currentGame);
        return;
      }
      
      const item = queue[index];
      currentEvaluationTargetRef.current = item.toSquare;
      currentEvaluationTurnRef.current = item.turn;
      if (stockfishRef.current) {
        stockfishRef.current.postMessage(`position fen ${item.fen}`);
        // deeper search for previews to avoid misleading evals on blunders
        stockfishRef.current.postMessage('go depth 12');
        
        setTimeout(() => {
          processNext(index + 1);
        }, 1200);
      }
    };
    
    processNext(0);
  }, [stockfishReady]);

  // Parse Stockfish info lines for top-2 lines and evaluation bar
  const handleTopLineInfo = (infoLine) => {
    if (!multiPVReadyRef.current) return;
    const isWhiteTurn = analysisTurnRef.current === 'w';
    const fen = lastAnalyzedFenRef.current || game.fen();

    const multipvMatch = infoLine.match(/multipv\s+(\d+)/);
    if (!multipvMatch) return;
    const idx = parseInt(multipvMatch[1], 10);
    if (idx < 1 || idx > 2) return;

    let score = null;
    let display = null;

    const mateMatch = infoLine.match(/score\s+mate\s+(-?\d+)/);
    const cpMatch = infoLine.match(/score\s+cp\s+(-?\d+)/);

    if (mateMatch && mateMatch[1]) {
      const mate = parseInt(mateMatch[1], 10);
      const signedMate = isWhiteTurn ? mate : -mate;
      score = Math.max(-10, Math.min(10, signedMate > 0 ? 10 : -10));
      display = signedMate > 0 ? `+M${Math.abs(mate)}` : `-M${Math.abs(mate)}`;
    } else if (cpMatch && cpMatch[1]) {
      const cp = parseInt(cpMatch[1], 10) / 100;
      const signed = isWhiteTurn ? cp : -cp;
      score = Math.max(-10, Math.min(10, signed));
      display = signed > 0 ? `+${signed.toFixed(2)}` : signed.toFixed(2);
    } else {
      return;
    }

    const pvIndex = infoLine.indexOf(' pv ');
    if (pvIndex === -1) return;
    const pvMoves = infoLine.slice(pvIndex + 4).trim();
    const sanLine = pvToPrettySan(fen, pvMoves);

    setBestLines(prev => {
      const next = [...prev];
      next[idx - 1] = { display, san: sanLine };
      return next.slice(0, 2);
    });

    if (idx === 1) {
      setEvaluation({ display, value: score });
    }
  };

  // Convert PV moves (UCI) to SAN continuation starting from a FEN
  const pvToPrettySan = (fen, pvMoves) => {
    try {
      const temp = new Chess(fen);
      const startingPly = temp.history().length;
      const moves = pvMoves.split(' ');
      const sanMoves = [];
      moves.forEach(m => {
        const move = temp.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
        if (move && move.san) sanMoves.push(move.san);
      });
      // add move numbers like Move History style
      const pretty = [];
      let moveNumber = Math.floor(startingPly / 2) + 1;
      let color = startingPly % 2 === 0 ? 'w' : 'b';
      sanMoves.forEach((san, idx) => {
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
    } catch (e) {
      return pvMoves;
    }
  };

  const handleSquareClick = (square) => {
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece) {
        const isWhiteTurn = game.turn() === 'w';
        if ((isWhiteTurn && piece.color === 'w') || (!isWhiteTurn && piece.color === 'b')) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          setPossibleMoves(moves);
          evaluateMoves(moves, game);
        }
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        setMoveEvaluations({});
        return;
      }
      
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const move = moves.find(m => m.to === square);
      
      if (move) {
        applyMove(selectedSquare, square);
      } else {
        const piece = game.get(square);
        if (piece) {
          const isWhiteTurn = game.turn() === 'w';
          if ((isWhiteTurn && piece.color === 'w') || (!isWhiteTurn && piece.color === 'b')) {
            setSelectedSquare(square);
            const newMoves = game.moves({ square, verbose: true });
            setPossibleMoves(newMoves);
            evaluateMoves(newMoves, game);
          } else {
            setSelectedSquare(null);
            setPossibleMoves([]);
            setMoveEvaluations({});
          }
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
          setMoveEvaluations({});
        }
      }
    }
  };

  const handleDragStart = (square) => {
    const piece = game.get(square);
    if (!piece) return;

    const isWhiteTurn = game.turn() === 'w';
    if ((isWhiteTurn && piece.color !== 'w') || (!isWhiteTurn && piece.color !== 'b')) return;

    dragFromRef.current = square;
    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    setPossibleMoves(moves);
    evaluateMoves(moves, game);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, targetSquare) => {
    event.preventDefault();
    const fromSquare = dragFromRef.current || selectedSquare;
    if (!fromSquare) return;

    const moves = game.moves({ square: fromSquare, verbose: true });
    const move = moves.find(m => m.to === targetSquare);

    if (move) {
      applyMove(fromSquare, targetSquare);
    }

    dragFromRef.current = null;
  };

  const handleDragEnd = () => {
    dragFromRef.current = null;
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
  };

  const getSquareColor = (row, col) => (row + col) % 2 === 0 ? 'light' : 'dark';

  const getPieceAt = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const square = files[col] + ranks[row];
    const piece = game.get(square);
    return piece ? { ...piece, symbol: PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] } : null;
  };

  const isSquareSelected = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const square = files[col] + ranks[row];
    return selectedSquare === square;
  };

  const isLastMoveSquare = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const square = files[col] + ranks[row];
    return lastMoveSquares.includes(square);
  };

  const isPossibleMove = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const square = files[col] + ranks[row];
    return possibleMoves.some(m => m.to === square);
  };

  const getEvaluationForSquare = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const square = files[col] + ranks[row];
    return moveEvaluations[square] || null;
  };

  const computeMaterialInfo = useCallback(() => {
    const startCounts = { w: { p: 8, n: 2, b: 2, r: 2, q: 1 }, b: { p: 8, n: 2, b: 2, r: 2, q: 1 } };
    const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    let materialW = 0;
    let materialB = 0;

    game.board().flat().forEach(piece => {
      if (!piece) return;
      counts[piece.color][piece.type] += 1;
      const val = MATERIAL_VALUES[piece.type] || 0;
      if (piece.color === 'w') materialW += val;
      else materialB += val;
    });

    const missing = {
      w: Object.keys(startCounts.w).flatMap(t => Array(startCounts.w[t] - counts.w[t]).fill(t)),
      b: Object.keys(startCounts.b).flatMap(t => Array(startCounts.b[t] - counts.b[t]).fill(t)),
    };

    const groupCaptured = (list, color) => {
      const grouped = {};
      list.forEach(t => {
        grouped[t] = (grouped[t] || 0) + 1;
      });
      return Object.entries(grouped).map(([t, c]) => ({
        symbol: PIECE_SYMBOLS[color === 'b' ? t : t.toUpperCase()],
        color,
        count: c,
      }));
    };

    const capturedByWhite = groupCaptured(missing.b, 'b'); // white captured black pieces
    const capturedByBlack = groupCaptured(missing.w, 'w'); // black captured white pieces

    const materialDiff = materialW - materialB; // positive means white is ahead

    return { capturedByWhite, capturedByBlack, materialDiff };
  }, [game, MATERIAL_VALUES]);

  const chunkMoves = (movesArr) => {
    const pairs = [];
    for (let i = 0; i < movesArr.length; i += 2) {
      pairs.push({ white: movesArr[i], black: movesArr[i + 1] });
    }
    return pairs;
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoves([]);
    setPlyIndex(0);
    setLastMoveSquares([]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    evaluationQueueRef.current = [];
    analyzePosition(new Chess());
  };

  const undoMove = () => {
    if (plyIndex === 0) return;
    syncToIndex(plyIndex - 1);
  };

  const redoMove = () => {
    if (plyIndex >= moves.length) return;
    syncToIndex(plyIndex + 1);
  };

  const goToStart = () => {
    syncToIndex(0);
  };

  // Auto-analyze on initial load
  useEffect(() => {
    if (stockfishReady) {
      analyzePosition(game);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockfishReady]);

  const history = (() => {
    const g = new Chess();
    const sanList = [];
    moves.forEach(m => {
      g.move(m);
      const h = g.history();
      sanList.push(h[h.length - 1]);
    });
    return sanList;
  })();
  const currentPly = Math.max(0, plyIndex - 1);
  const materialInfo = computeMaterialInfo();

  useEffect(() => {
    if (movesListRef.current) {
      movesListRef.current.scrollTop = movesListRef.current.scrollHeight;
    }
  }, [history.length, plyIndex]);

  return (
    <div className="chess-container">
      <div className="header">
        <h1>Chess with Stockfish Analysis</h1>
        <div className="status">
          <span className={`turn-indicator ${game.turn() === 'w' ? 'white' : 'black'}`}>
            {game.turn() === 'w' ? 'White to move' : 'Black to move'}
          </span>
          {game.isCheck() && <span className="check-indicator"> - CHECK!</span>}
          {game.isGameOver() && <span className="game-over"> - GAME OVER</span>}
        </div>
        <div className="controls">
          <button onClick={resetGame}>New Game</button>
        </div>
        <div className="stockfish-status">
          Stockfish: {stockfishReady ? '✓ Ready' : 'Loading...'}
        </div>
        </div>

      <div className="main-area">
        <div className="board-wrapper">
          <div className="material-panel top">
            <div className="material-row">
              <div className="side-name">Black</div>
              <div className="captured">
                {materialInfo.capturedByBlack.map((p, idx) => (
                  <span key={`bcap-${idx}`} className="captured-group">
                    <span className="captured-piece white">{p.symbol}</span>
                    {p.count > 1 && <span className="captured-count">{p.count}</span>}
                  </span>
                ))}
                {materialInfo.materialDiff < 0 && (
                  <span className="material-score negative">+{Math.abs(materialInfo.materialDiff)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="board-area">
            <div className="eval-stack">
              <div className="eval-bar">
                <div
                  className="eval-segment-black"
                  style={{ height: `${100 - Math.max(0, Math.min(100, ((evaluation ? evaluation.value : 0) + 10) / 20 * 100))}%` }}
                />
                <div
                  className="eval-segment-white"
                  style={{ height: `${Math.max(0, Math.min(100, ((evaluation ? evaluation.value : 0) + 10) / 20 * 100))}%` }}
                />
              </div>
              <div className="eval-label">
                {bestLines[0]?.display || (evaluation ? evaluation.display : '...')}
              </div>
            </div>
            <div className="chess-board">
            {Array.from({ length: 8 }, (_, row) => (
              <div key={row} className="board-row">
                {Array.from({ length: 8 }, (_, col) => {
                  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
                  const square = `${files[col]}${ranks[row]}`;
                  const piece = getPieceAt(row, col);
                  const isSelected = isSquareSelected(row, col);
                  const isPossible = isPossibleMove(row, col);
                  const evaluation = isPossible ? getEvaluationForSquare(row, col) : null;
                  const wasLastMove = isLastMoveSquare(row, col);
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`square ${getSquareColor(row, col)} ${isSelected ? 'selected' : ''} ${isPossible ? 'possible-move' : ''} ${wasLastMove ? 'last-move' : ''}`}
                      onClick={() => handleSquareClick(square)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, square)}
                    >
                      {col === 0 && <span className="rank-label">{8 - row}</span>}
                      {row === 7 && <span className="file-label">{files[col]}</span>}
                      
                      {piece && (
                        <span
                          className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}
                          draggable
                          onDragStart={() => handleDragStart(square)}
                          onDragEnd={handleDragEnd}
                        >
                          {piece.symbol}
                        </span>
                      )}
                      
                    {isPossible && evaluation && (
                      <div className="move-indicator">
                        <span className={`evaluation ${evaluation.startsWith('+') || evaluation.startsWith('M') ? 'positive' : 'negative'}`}>
                          {evaluation}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            ))}
            </div>

          </div>

          <div className="material-panel bottom">
            <div className="material-row">
              <div className="side-name">White</div>
              <div className="captured">
                {materialInfo.capturedByWhite.map((p, idx) => (
                  <span key={`wcap-${idx}`} className="captured-group">
                    <span className="captured-piece black">{p.symbol}</span>
                    {p.count > 1 && <span className="captured-count">{p.count}</span>}
                  </span>
                ))}
                {materialInfo.materialDiff > 0 && (
                  <span className="material-score positive">+{materialInfo.materialDiff}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="side-panel">
          <div className="analysis-panel">
            <h4>Top Lines</h4>
            {bestLines.length === 0 && <div>Analyzing...</div>}
            {bestLines.map((line, idx) => (
              <div key={idx} className="line-entry">
                <span className={`line-score ${line.display?.startsWith('-') ? 'negative' : 'positive'}`}>
                  {line.display}
                </span>
                <span className="line-moves">{line.san}</span>
              </div>
            ))}
          </div>

          <div className="move-history">
            <h3>Move History</h3>
            <div className="moves-list" ref={movesListRef}>
              {chunkMoves(history).map((pair, idx) => {
                const whiteIdx = idx * 2;
                const blackIdx = idx * 2 + 1;
                return (
                  <div key={idx} className="move-row">
                    <span className="move-number">{idx + 1}.</span>
                    <span className={`white-move ${currentPly === whiteIdx ? 'current' : ''}`}>{pair.white || ''}</span>
                    <span className={`black-move ${currentPly === blackIdx ? 'current' : ''}`}>{pair.black || ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="nav-controls">
            <button onClick={goToStart} disabled={moves.length === 0}>⏮</button>
            <button onClick={undoMove} disabled={plyIndex === 0}>⏪</button>
            <button onClick={redoMove} disabled={plyIndex >= moves.length}>⏩</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessBoard;
