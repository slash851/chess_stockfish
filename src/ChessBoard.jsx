import React, { useCallback, useEffect, useMemo, useState } from "react";
import BoardGrid from "./components/board/BoardGrid";
import MaterialPanel from "./components/panels/MaterialPanel";
import TopLinesPanel from "./components/panels/TopLinesPanel";
import MoveHistoryPanel from "./components/panels/MoveHistoryPanel";
import EvalBar from "./components/panels/EvalBar";
import Toolbar from "./components/controls/Toolbar";
import NavControls from "./components/controls/NavControls";
import { ChessGame } from "./domain/ChessGame";
import { GameController } from "./controllers/GameController";
import { StockfishEngine } from "./services/StockfishEngine";

const buildSelection = (game, square) => {
  const piece = game.chess.get(square);
  if (!piece) return null;
  const isWhiteTurn = game.turn() === "w";
  const isOwnPiece =
    (isWhiteTurn && piece.color === "w") ||
    (!isWhiteTurn && piece.color === "b");
  return isOwnPiece ? piece : null;
};

const ChessBoard = () => {
  const engine = useMemo(() => new StockfishEngine(), []);
  const controller = useMemo(() => new GameController(engine), [engine]);

  const [{ game, moves, plyIndex, lastMoveSquares }, setGameState] = useState(
    () => controller.initialState(),
  );
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [moveEvaluations, setMoveEvaluations] = useState({});
  const [bestLines, setBestLines] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [stockfishReady, setStockfishReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(3000);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    engine.init(() => {
      setStockfishReady(true);
      controller.analysis(game, setBestLines, setEvaluation);
    });
    return () => engine.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAnalysis = useCallback(
    (currentGame) => {
      setBestLines([]);
      setEvaluation(null);
      if (stockfishReady) {
        controller.analysis(currentGame, setBestLines, setEvaluation);
      }
    },
    [controller, stockfishReady],
  );

  const handleSquareClick = useCallback(
    (square) => {
      if (!selectedSquare) {
        const piece = buildSelection(game, square);
        if (!piece) return;
        const movesFromSquare = game.legalMoves(square);
        setSelectedSquare(square);
        setPossibleMoves(movesFromSquare);
        setMoveEvaluations({});
        if (stockfishReady) {
          controller.preview(
            game,
            movesFromSquare,
            (sq, text) => {
              setMoveEvaluations((prev) => ({ ...prev, [sq]: text }));
            },
            () => refreshAnalysis(game),
          );
        }
        return;
      }

      if (square === selectedSquare) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        setMoveEvaluations({});
        return;
      }

      const movesFromSelected = game.legalMoves(selectedSquare);
      const chosenMove = controller.findMove(movesFromSelected, square);

      if (chosenMove) {
        const next = controller.applyMove(
          { game, moves, plyIndex },
          selectedSquare,
          square,
        );
        if (next) {
          setGameState(next);
          setSelectedSquare(null);
          setPossibleMoves([]);
          setMoveEvaluations({});
          refreshAnalysis(next.game);
        }
        return;
      }

      // allow switching selection to another own piece
      const piece = buildSelection(game, square);
      if (piece) {
        const nextMoves = game.legalMoves(square);
        setSelectedSquare(square);
        setPossibleMoves(nextMoves);
        setMoveEvaluations({});
        if (stockfishReady) {
          controller.preview(
            game,
            nextMoves,
            (sq, text) => {
              setMoveEvaluations((prev) => ({ ...prev, [sq]: text }));
            },
            () => refreshAnalysis(game),
          );
        }
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
        setMoveEvaluations({});
      }
    },
    [
      controller,
      game,
      moves,
      plyIndex,
      refreshAnalysis,
      selectedSquare,
      stockfishReady,
    ],
  );

  const handleDragStart = useCallback(
    (square) => {
      const piece = buildSelection(game, square);
      if (!piece) return;
      const movesFromSquare = game.legalMoves(square);
      setSelectedSquare(square);
      setPossibleMoves(movesFromSquare);
      setMoveEvaluations({});
      if (stockfishReady) {
        controller.preview(
          game,
          movesFromSquare,
          (sq, text) => {
            setMoveEvaluations((prev) => ({ ...prev, [sq]: text }));
          },
          () => refreshAnalysis(game),
        );
      }
    },
    [controller, game, refreshAnalysis, stockfishReady],
  );

  const handleDrop = useCallback(
    (event, targetSquare) => {
      event.preventDefault();
      if (!selectedSquare) return;
      const movesFromSelected = game.legalMoves(selectedSquare);
      const chosenMove = controller.findMove(movesFromSelected, targetSquare);
      if (chosenMove) {
        const next = controller.applyMove(
          { game, moves, plyIndex },
          selectedSquare,
          targetSquare,
        );
        if (next) {
          setGameState(next);
          setSelectedSquare(null);
          setPossibleMoves([]);
          setMoveEvaluations({});
          refreshAnalysis(next.game);
        }
      }
    },
    [controller, game, moves, plyIndex, refreshAnalysis, selectedSquare],
  );

  const resetGame = () => {
    const nextState = controller.initialState();
    setGameState(nextState);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    refreshAnalysis(nextState.game);
  };

  const copyPgn = async () => {
    try {
      await navigator.clipboard.writeText(game.pgn());
    } catch {
      alert("Unable to copy PGN to clipboard.");
    }
  };

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(game.fen());
    } catch {
      alert("Unable to copy FEN to clipboard.");
    }
  };

  const loadPosition = () => {
    const input = window.prompt("Paste FEN or PGN to load:");
    if (!input) return;
    const loaded = controller.loadPosition(input.trim());
    if (!loaded) {
      alert("Could not load position. Please check the FEN/PGN text.");
      return;
    }
    setGameState(loaded);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    refreshAnalysis(loaded.game);
  };

  const handleThinkingTimeChange = (newTime) => {
    setThinkingTime(newTime);
    engine.setThinkingTime(newTime);
    refreshAnalysis(game);
  };

  const undoMove = () => {
    const prev = controller.syncToIndex(moves, plyIndex - 1);
    setGameState((state) => ({ ...state, ...prev, moves: state.moves }));
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    refreshAnalysis(prev.game);
  };

  const redoMove = () => {
    const next = controller.syncToIndex(moves, plyIndex + 1);
    setGameState((state) => ({ ...state, ...next, moves: state.moves }));
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    refreshAnalysis(next.game);
  };

  const goToStart = () => {
    const start = controller.syncToIndex(moves, 0);
    setGameState((state) => ({ ...state, ...start, moves: state.moves }));
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    refreshAnalysis(start.game);
  };

  const goToEnd = () => {
    const end = controller.syncToIndex(moves, moves.length);
    setGameState((state) => ({ ...state, ...end, moves: state.moves }));
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveEvaluations({});
    refreshAnalysis(end.game);
  };

  const boardSquares = controller.boardSquares(game);
  const possibleTargets = controller.possibleMoveTargets(possibleMoves);
  const materialInfo = controller.material(game);
  const sanHistory = controller.historyPairs(moves);
  const currentPly = Math.max(0, plyIndex - 1);

  const toolbar = (
    <Toolbar
      onNew={() => {
        resetGame();
        closeMenu();
      }}
      onCopyPgn={copyPgn}
      onCopyFen={copyFen}
      onLoad={loadPosition}
      isGameOver={game.chess.isGameOver()}
      stockfishReady={stockfishReady}
      turnText={game.turn() === "w" ? "White to move" : "Black to move"}
      thinkingTime={thinkingTime}
      onThinkingTimeChange={handleThinkingTimeChange}
    />
  );

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      {/* Mobile menu trigger (hidden on larger screens) */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-sm font-semibold text-slate-100">Board Lens</span>
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-100 shadow hover:bg-slate-700"
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 p-4 sm:hidden">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-100">Menu</span>
              <button
                onClick={closeMenu}
                className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            {toolbar}
          </div>
        </div>
      )}

      <div className="hidden w-[700px] xl:block">{toolbar}</div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full flex-1 flex flex-col gap-4 rounded-none sm:rounded-2xl border-none sm:border border-white/10 bg-slate-900/70 p-0 sm:p-4 shadow-none sm:shadow-2xl overflow-hidden">
          <div className="w-full flex flex-col">
            {/* Mobile: stacked layout */}
            <div className="sm:hidden w-full flex flex-col">
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <BoardGrid
                  squares={boardSquares}
                  selectedSquare={selectedSquare}
                  possibleTargets={possibleTargets}
                  lastMoveSquares={lastMoveSquares}
                  moveEvaluations={moveEvaluations}
                  boardEvaluation={bestLines[0]?.display || evaluation?.display}
                  onSquareClick={handleSquareClick}
                  onDragStart={handleDragStart}
                  onDragEnd={() => {
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                    setMoveEvaluations({});
                  }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                />
              </div>
              <EvalBar evaluation={evaluation} bestLines={bestLines} />
            </div>
            {/* Desktop: grid layout */}
            <div
              className="hidden sm:grid grid-cols-[auto,1fr] grid-rows-[auto,var(--board-size),auto] gap-x-2 gap-y-4 justify-items-center"
              style={{ "--board-size": "min(80vh, 70vw)" }}
            >
              <div className="col-start-1 row-start-2 h-[var(--board-size)]">
                <EvalBar evaluation={evaluation} bestLines={bestLines} />
              </div>
              <div className="col-start-2 row-start-1">
                <MaterialPanel
                  title="Black"
                  captured={materialInfo.capturedByBlack}
                  materialDiff={
                    materialInfo.materialDiff < 0
                      ? Math.abs(materialInfo.materialDiff)
                      : 0
                  }
                />
              </div>
              <div className="col-start-2 row-start-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <BoardGrid
                  squares={boardSquares}
                  selectedSquare={selectedSquare}
                  possibleTargets={possibleTargets}
                  lastMoveSquares={lastMoveSquares}
                  moveEvaluations={moveEvaluations}
                  boardEvaluation={bestLines[0]?.display || evaluation?.display}
                  onSquareClick={handleSquareClick}
                  onDragStart={handleDragStart}
                  onDragEnd={() => {
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                    setMoveEvaluations({});
                  }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                />
              </div>
              <div className="col-start-2 row-start-3">
                <MaterialPanel
                  title="White"
                  captured={materialInfo.capturedByWhite}
                  materialDiff={
                    materialInfo.materialDiff > 0
                      ? materialInfo.materialDiff
                      : 0
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[280px] flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl">
        <TopLinesPanel bestLines={bestLines} />
        <MoveHistoryPanel pairs={sanHistory} currentPly={currentPly} />
        <NavControls
          onStart={goToStart}
          onUndo={undoMove}
          onRedo={redoMove}
          onEnd={goToEnd}
          disableStart={moves.length === 0}
          disableUndo={plyIndex === 0}
          disableRedo={plyIndex >= moves.length}
          disableEnd={plyIndex >= moves.length}
        />
      </div>
      </div>
    </div>
  );
};

export default ChessBoard;
