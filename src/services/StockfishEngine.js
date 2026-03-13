import { MoveFormatter } from '../domain/MoveFormatter';

export class StockfishEngine {
  constructor(workerPath) {
    // Use the app's base URL so the worker loads correctly on sub-path deployments (e.g. GitHub Pages or Firebase sites that aren't at domain root).
    const base = import.meta?.env?.BASE_URL ?? '/';
    this.workerPath = workerPath ?? `${base}stockfish.js`;
    this.worker = null;
    this.multiPVReady = false;
    this.ready = false;
    this.currentPreviewTarget = null;
    this.currentPreviewTurn = 'w';
    this.analysisTurn = 'w';
    this.lastAnalyzedFen = null;
    this.previewQueue = [];
    this.previewIndex = 0;
    this.handlers = {
      onLineUpdate: null,
      onEvaluationUpdate: null,
      onMovePreview: null,
      onPreviewComplete: null,
    };
  }

  async init(onReady) {
    if (this.worker) return;

    // Try multiple candidate URLs to be resilient to base-path issues in dev/hosting.
    const candidates = [];
    if (this.workerPath.startsWith('http')) {
      candidates.push(this.workerPath);
    } else {
      candidates.push(this.workerPath);
      candidates.push(new URL(this.workerPath, window.location.origin).toString());
    }

    let worker = null;
    let lastError = null;
    for (const url of candidates) {
      try {
        worker = new Worker(url);
        // eslint-disable-next-line no-console
        console.log('[Stockfish] Worker started from', url);
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!worker) {
      // eslint-disable-next-line no-console
      console.error('[Stockfish] Failed to start worker', lastError);
      return;
    }

    this.worker = worker;

    this.worker.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.error('Stockfish worker error', event?.message ?? event);
    };
    this.worker.onmessage = (event) => this.handleMessage(event.data, onReady);

    this.worker.postMessage('uci');

    // Safety net: some builds may drop the initial 'uciok'. Retry readiness after a short delay.
    setTimeout(() => {
      if (!this.ready) {
        // eslint-disable-next-line no-console
        console.log('[Stockfish] Forcing isready (fallback)');
        this.worker.postMessage('isready');
      }
    }, 1200);
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
    this.multiPVReady = false;
    this.currentPreviewTarget = null;
    this.previewQueue = [];
    this.previewIndex = 0;
  }

  handleMessage(data, onReady) {
    if (!data || typeof data !== 'string') return;
    const line = data.trim();

    if (line === 'uciok') {
      // Configure MultiPV only after the engine reports its options, then request readiness.
      this.worker.postMessage('setoption name MultiPV value 2');
      this.worker.postMessage('isready');
      return;
    }

    if (line === 'readyok') {
      this.multiPVReady = true;
      this.ready = true;
      this.worker.postMessage('ucinewgame');
      if (onReady) onReady();
      return;
    }

    if (line === 'not ready') {
      // Rare engines respond with this when busy; retry readiness.
      this.worker.postMessage('isready');
      return;
    }

    if (line.startsWith('info') && line.includes('multipv')) {
      const parsed = this.parseMultiPV(line);
      if (parsed && this.handlers.onLineUpdate) {
        this.handlers.onLineUpdate(parsed);
      }
    }

    // Some builds omit multipv tag even when MultiPV=2; treat as main line
    if (line.startsWith('info') && !line.includes('multipv') && line.includes('score') && this.handlers.onLineUpdate) {
      const parsed = this.parseMultiPV(line, true);
      if (parsed) this.handlers.onLineUpdate(parsed);
    }

    if (line.startsWith('info') && (line.includes('cp') || line.includes('mate')) && this.currentPreviewTarget) {
      const evalText = this.parsePreviewEval(line, this.currentPreviewTurn);
      if (evalText && this.handlers.onMovePreview) {
        this.handlers.onMovePreview(this.currentPreviewTarget, evalText);
      }
    }
  }

  analyzePosition({ fen, turn, onLines, onEvaluation }) {
    if (!this.worker || !this.ready) return;
    this.worker.postMessage('stop');
    this.analysisTurn = turn;
    this.lastAnalyzedFen = fen;
    this.handlers.onLineUpdate = (payload) => {
      const nextLines = (prev = []) => {
        const clone = [...prev];
        clone[payload.index - 1] = { display: payload.display, san: payload.san, value: payload.value };
        return clone.slice(0, 2);
      };
      onLines(nextLines);
      if (payload.index === 1 && onEvaluation) {
        onEvaluation({ display: payload.display, value: payload.value });
      }
    };

    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage('go depth 14 multipv 2');
  }

  previewMoves({ queue, onResult, onComplete }) {
    if (!this.worker || !this.ready) return;

    this.handlers.onMovePreview = onResult;
    this.handlers.onPreviewComplete = onComplete;

    this.previewQueue = queue;
    this.previewIndex = 0;
    this.runPreviewBatch();
  }

  runPreviewBatch() {
    if (this.previewIndex >= this.previewQueue.length) {
      this.currentPreviewTarget = null;
      if (this.handlers.onPreviewComplete) this.handlers.onPreviewComplete();
      return;
    }

    const item = this.previewQueue[this.previewIndex];
    this.currentPreviewTarget = item.toSquare;
    this.currentPreviewTurn = item.turn;

    this.worker.postMessage('stop');
    this.worker.postMessage(`position fen ${item.fen}`);
    this.worker.postMessage('go depth 12');

    setTimeout(() => {
      this.previewIndex += 1;
      this.runPreviewBatch();
    }, 1100);
  }

  parsePreviewEval(infoLine, turn) {
    const cpMatch = infoLine.match(/cp\s+(-?\d+)/);
    const mateMatch = infoLine.match(/mate\s+(-?\d+)/);

    if (mateMatch?.[1]) {
      const mateValue = parseInt(mateMatch[1], 10);
      const signedMate = turn === 'w' ? mateValue : -mateValue;
      return signedMate > 0 ? `+M${Math.abs(mateValue)}` : `-M${Math.abs(mateValue)}`;
    }

    if (cpMatch?.[1]) {
      const cp = parseInt(cpMatch[1], 10) / 100;
      const signed = turn === 'w' ? cp : -cp;
      const rounded = signed > 0 ? `+${signed.toFixed(1)}` : signed.toFixed(1);
      return rounded;
    }

    return null;
  }

  parseMultiPV(infoLine, forceIdx1 = false) {
    if (!this.multiPVReady) return null;

    const multipvMatch = infoLine.match(/multipv\s+(\d+)/);
    const idx = forceIdx1 ? 1 : multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
    if (idx < 1 || idx > 2) return null;

    const isWhiteTurn = this.analysisTurn === 'w';
    const mateMatch = infoLine.match(/score\s+mate\s+(-?\d+)/);
    const cpMatch = infoLine.match(/score\s+cp\s+(-?\d+)/);

    let score = null;
    let display = null;

    if (mateMatch?.[1]) {
      const mate = parseInt(mateMatch[1], 10);
      const signedMate = isWhiteTurn ? mate : -mate;
      score = Math.max(-10, Math.min(10, signedMate > 0 ? 10 : -10));
      display = signedMate > 0 ? `+M${Math.abs(mate)}` : `-M${Math.abs(mate)}`;
    } else if (cpMatch?.[1]) {
      const cp = parseInt(cpMatch[1], 10) / 100;
      const signed = isWhiteTurn ? cp : -cp;
      score = Math.max(-10, Math.min(10, signed));
      display = signed > 0 ? `+${signed.toFixed(2)}` : signed.toFixed(2);
    }

    const pvIndex = infoLine.indexOf(' pv ');
    if (score === null || pvIndex === -1 || !this.lastAnalyzedFen) return null;

    const pvMoves = infoLine.slice(pvIndex + 4).trim();
    const sanLine = MoveFormatter.pvToPrettySan(this.lastAnalyzedFen, pvMoves);

    return { index: idx, display, value: score, san: sanLine };
  }
}
