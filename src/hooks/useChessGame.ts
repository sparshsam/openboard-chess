import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PromotionChoice, AppSettings, GameMode, StockfishStatus, MoveFeedback } from '../types';
import type { Difficulty } from '../chess/difficulty';
import { getComputerMove, getStockfishComputerMove, computeMoveFeedback } from '../chess/computer';
import { StockfishEngine } from '../chess/stockfish';
import type { StockfishMove, StockfishEngineState } from '../chess/stockfish';
import { saveGame, loadGame, clearGame } from '../lib/storage';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playCheckmateSound,
  playPromotionSound,
} from '../lib/sounds';

interface UseChessGameOptions {
  settings: AppSettings;
}

export type GameResult = { winner: 'w' | 'b'; reason: 'checkmate' | 'resign' | 'draw' } | null;

const PIECE_VALUE: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
  k: 0,
};

function rebuildMoveFens(history: string[]): string[] {
  const fens: string[] = [new Chess().fen()];
  for (let i = 0; i < history.length; i++) {
    const g2 = new Chess();
    const moves = history.slice(0, i + 1);
    for (const m of moves) {
      g2.move(m);
    }
    fens.push(g2.fen());
  }
  return fens;
}

/** Rebuild the FEN list from scratch using the full history */
function rebuildFensFromHistory(history: string[]): string[] {
  return rebuildMoveFens(history);
}

export function useChessGame({ settings }: UseChessGameOptions) {
  const [game] = useState(() => {
    const g = new Chess();
    return g;
  });
  const [fen, setFen] = useState(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PromotionChoice | null>(null);
  const [status, setStatus] = useState<string>('White to move');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);

  // Stockfish state
  const [stockfishStatus, setStockfishStatus] = useState<StockfishStatus>('unloaded');
  const [stockfishError, setStockfishError] = useState<string | null>(null);
  const [stockfishProgress, setStockfishProgress] = useState<{
    depth: number;
    score: number;
  } | null>(null);

  // Move review state
  const [moveFens, setMoveFens] = useState<string[]>([game.fen()]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(-1);

  // Move feedback analysis state
  const [moveFeedback, setMoveFeedback] = useState<Map<number, MoveFeedback>>(new Map());

  const prevModeRef = useRef<GameMode>(settings.gameMode);
  const prevDifficultyRef = useRef<Difficulty>(settings.difficulty);
  const settingsRef = useRef(settings);
  const gameRef = useRef(game);
  const computerMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stockfishEngineRef = useRef<StockfishEngine | null>(null);
  const stockfishStateRef = useRef<StockfishEngineState>('idle');

  // Keep track of FEN before each human move (for feedback computation)
  const preMoveFenRef = useRef<string | null>(null);

  // Keep refs in sync via effect (not during render)
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateState = useCallback(() => {
    const newFen = game.fen();
    const newHistory = game.history();
    const newMoveFens = rebuildFensFromHistory(newHistory);
    setFen(newFen);
    setHistory(newHistory);
    setMoveFens(newMoveFens);
    saveGame(newFen, newHistory);

    const turn = game.turn() === 'w' ? 'White' : 'Black';
    let msg = `${turn} to move`;

    if (game.isCheckmate()) {
      msg = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins!`;
    } else if (game.isStalemate()) {
      msg = 'Stalemate! The game is a draw.';
    } else if (game.isDraw()) {
      if (game.isInsufficientMaterial()) {
        msg = 'Draw due to insufficient material.';
      } else if (game.isThreefoldRepetition()) {
        msg = 'Draw due to threefold repetition.';
      } else {
        msg = 'Draw!';
      }
    } else if (game.isCheck()) {
      msg = `${turn} is in check`;
    }

    setStatus(msg);
  }, [game]);

  // ── Stockfish integration ─────────────────────────────────────

  /** Start Stockfish engine (called when computer mode is activated) */
  const initStockfish = useCallback(() => {
    if (stockfishStatus !== 'unloaded') return;

    setStockfishStatus('loading');
    setStockfishError(null);
    setStockfishProgress(null);

    const engine = new StockfishEngine();
    stockfishEngineRef.current = engine;

    engine.init({
      onStateChange: (state: StockfishEngineState) => {
        stockfishStateRef.current = state;
        if (state === 'ready') {
          setStockfishStatus('ready');
        } else if (state === 'error') {
          setStockfishStatus('error');
        }
      },
      onBestMove: (move: StockfishMove) => {
        const g = gameRef.current;
        if (g.turn() !== 'b' || g.isGameOver()) {
          setStockfishProgress(null);
          return;
        }

        try {
          g.move({
            from: move.from as Square,
            to: move.to as Square,
            promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
          });
          setSelectedSquare(null);
          setLegalMoves([]);
          setStockfishProgress(null);
          updateState();

          const s = settingsRef.current;
          if (s.soundEnabled) {
            const hist = g.history({ verbose: true });
            if (hist.length > 0) {
              const last = hist[hist.length - 1];
              if (last.captured) playCaptureSound();
              else playMoveSound();
            }
          }
        } catch (err) {
          console.error('Failed to apply Stockfish move:', err);
        } finally {
          setIsComputerThinking(false);
        }
      },
      onError: (error: string) => {
        setStockfishError(error);
        setStockfishStatus('error');
        setIsComputerThinking(false);
      },
      onProgress: (info: { depth: number; score: number }) => {
        setStockfishProgress({ depth: info.depth, score: info.score });
      },
    }).catch((err: unknown) => {
      setStockfishStatus('error');
      setStockfishError(
        `Failed to initialize Stockfish: ${err instanceof Error ? err.message : String(err)}`
      );
      setIsComputerThinking(false);
    });
  }, [stockfishStatus, updateState]);

  /** Stop and cleanup Stockfish */
  const terminateStockfish = useCallback(() => {
    if (stockfishEngineRef.current) {
      stockfishEngineRef.current.terminate();
      stockfishEngineRef.current = null;
    }
    stockfishStateRef.current = 'idle';
    setStockfishStatus('unloaded');
    setStockfishError(null);
    setStockfishProgress(null);
  }, []);

  /** Async-based computer move using Stockfish + fallback */
  const scheduleComputerMoveViaStockfish = useCallback(async () => {
    setIsComputerThinking(true);

    try {
      const g = gameRef.current;
      const engine = stockfishEngineRef.current;
      const difficulty = settingsRef.current.difficulty;

      if (!engine?.isReady) {
        // Fallback to custom engine
        const move = await getComputerMove(g, difficulty, null);
        g.move({ from: move.from, to: move.to, promotion: move.promotion });
      } else {
        const move = await getStockfishComputerMove(g, difficulty, engine);
        if (move) {
          g.move({ from: move.from, to: move.to, promotion: move.promotion });
        } else {
          // Stockfish returned nothing — fallback
          const fallback = await getComputerMove(g, difficulty, null);
          g.move({ from: fallback.from, to: fallback.to, promotion: fallback.promotion });
        }
      }

      setSelectedSquare(null);
      setLegalMoves([]);
      updateState();
    } catch (err) {
      console.error('Computer move failed:', err);
    } finally {
      setIsComputerThinking(false);
    }
  }, [updateState]);

  // ── Schedule computer move (called after user plays) ──────────
  const scheduleComputerMove = useCallback(() => {
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
    }

    setIsComputerThinking(true);

    const thinkTime = 300 + Math.random() * 400;

    computerMoveTimeoutRef.current = setTimeout(() => {
      scheduleComputerMoveViaStockfish();
      computerMoveTimeoutRef.current = null;
    }, thinkTime);
  }, [scheduleComputerMoveViaStockfish]);

  /* Stockfish move scheduling is handled by scheduleComputerMoveViaStockfish for all difficulties */

  // ── Move Feedback Computation ─────────────────────────────────

  const computeFeedback = useCallback(
    async (moveIndex: number, fenBefore: string, fenAfter: string, playerColor: 'w' | 'b') => {
      const engine = stockfishEngineRef.current;
      if (!engine?.isReady) return;

      const feedback = await computeMoveFeedback(fenBefore, fenAfter, playerColor, engine, false);
      if (feedback) {
        setMoveFeedback((prev) => {
          const next = new Map(prev);
          next.set(moveIndex, {
            moveIndex,
            tag: feedback.tag,
            centipawnLoss: feedback.centipawnLoss,
            evalBefore: Math.round(feedback.evalBefore / 100),
            evalAfter: Math.round(feedback.evalAfter / 100),
            isBook: false,
          });
          return next;
        });
      }
    },
    []
  );

  // ── New game ──────────────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
      computerMoveTimeoutRef.current = null;
    }

    // Stop Stockfish if it's searching
    if (stockfishEngineRef.current) {
      stockfishEngineRef.current.stop();
    }

    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setIsComputerThinking(false);
    setGameResult(null);
    setReviewMode(false);
    setReviewIndex(-1);
    setStockfishProgress(null);
    setMoveFeedback(new Map());
    clearGame();
    updateState();
  }, [game, updateState]);

  // ── Helper: after a user move, let computer respond ───────────
  const afterUserMove = useCallback(
    (wasPromotion: boolean = false, fenBefore?: string) => {
      const s = settingsRef.current;
      const g = gameRef.current;

      // Sound effect
      if (s.soundEnabled) {
        if (g.isCheckmate()) {
          playCheckmateSound();
        } else if (g.isCheck()) {
          playCheckSound();
        } else {
          const hist = g.history({ verbose: true });
          if (hist.length > 0) {
            const last = hist[hist.length - 1];
            if (last.captured) {
              playCaptureSound();
            } else if (wasPromotion) {
              playPromotionSound();
            } else {
              playMoveSound();
            }
          } else {
            playMoveSound();
          }
        }
      }

      // Compute move feedback if Stockfish is available
      const engine = stockfishEngineRef.current;
      if (engine?.isReady && fenBefore) {
        const hist = g.history({ verbose: true });
        if (hist.length > 0) {
          const lastMove = hist[hist.length - 1];
          const moveIndex = hist.length - 1;
          computeFeedback(moveIndex, fenBefore, g.fen(), lastMove.color as 'w' | 'b');
        }
      }

      // Schedule computer response
      const isComputerTurn =
        settingsRef.current.gameMode === 'computer' && g.turn() === 'b' && !g.isGameOver();
      if (isComputerTurn) {
        scheduleComputerMove();
      }
    },
    [game, scheduleComputerMove, computeFeedback]
  );

  // ── Move Review ─────────────────────────────────────────────
  const enterReviewMode = useCallback(() => {
    if (history.length === 0) return;
    setReviewMode(true);
    setReviewIndex(history.length - 1);
  }, [history.length]);

  const exitReviewMode = useCallback(() => {
    setReviewMode(false);
    setReviewIndex(-1);
    setFen(game.fen());
  }, [game]);

  const goToMove = useCallback(
    (index: number) => {
      if (index < -1 || index >= moveFens.length - 1) return;
      setReviewIndex(index);
      if (index === -1) {
        setFen(moveFens[0]);
      } else {
        setFen(moveFens[index + 1]);
      }
    },
    [moveFens]
  );

  // ── User interaction ───────────────────────────────────────────
  const selectSquare = useCallback(
    (square: Square) => {
      if (isComputerThinking) return;
      if (settings.gameMode === 'computer' && game.turn() === 'b') return;
      if (game.isGameOver()) return;

      // If in review mode, exit on any interaction
      if (reviewMode) {
        exitReviewMode();
      }

      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }

      if (selectedSquare) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const targetMove = moves.find((m) => m.to === square);

        if (targetMove) {
          if (targetMove.promotion) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }

          // Save FEN before the move for feedback computation
          preMoveFenRef.current = game.fen();

          game.move({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalMoves([]);
          updateState();
          afterUserMove(false, preMoveFenRef.current);
          return;
        }

        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const newMoves = game.moves({ square, verbose: true });
          setLegalMoves(newMoves.map((m) => m.to as Square));
          return;
        }

        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [game, selectedSquare, updateState, afterUserMove, isComputerThinking, settings.gameMode, reviewMode, exitReviewMode]
  );

  const promote = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      preMoveFenRef.current = game.fen();
      game.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      updateState();
      afterUserMove(true, preMoveFenRef.current);
    },
    [game, pendingPromotion, updateState, afterUserMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const newGame = useCallback(() => {
    handleNewGame();
  }, [handleNewGame]);

  const exportFen = useCallback(() => {
    return game.fen();
  }, [game]);

  const importFen = useCallback(
    (fenStr: string) => {
      try {
        game.load(fenStr);
        setSelectedSquare(null);
        setLegalMoves([]);
        setPendingPromotion(null);
        setGameResult(null);
        setReviewMode(false);
        setReviewIndex(-1);
        setMoveFeedback(new Map());
        updateState();
        afterUserMove(false);
        return true;
      } catch {
        return false;
      }
    },
    [game, updateState, afterUserMove]
  );

  // ── Undo Move ────────────────────────────────────────────────
  const undoMove = useCallback(() => {
    if (history.length === 0) return;
    if (game.isGameOver() && gameResult) {
      setGameResult(null);
    }

    // In computer mode, undo 2 moves if possible (player + computer)
    const undoCount = settingsRef.current.gameMode === 'computer' ? Math.min(2, history.length) : 1;

    // Remove associated move feedback
    setMoveFeedback((prev) => {
      const next = new Map(prev);
      for (let i = 0; i < undoCount; i++) {
        next.delete(history.length - 1 - i);
      }
      return next;
    });

    for (let i = 0; i < undoCount; i++) {
      game.undo();
    }
    setMoveFens(rebuildFensFromHistory(game.history()));
    setReviewMode(false);
    setReviewIndex(-1);
    updateState();
  }, [game, history.length, moveFens, updateState, gameResult]);

  // ── Resign ───────────────────────────────────────────────────
  const resign = useCallback(() => {
    const winner = game.turn() === 'w' ? 'b' : 'w';
    setGameResult({ winner, reason: 'resign' });
    const winnerName = winner === 'w' ? 'White' : 'Black';
    const loserName = winner === 'w' ? 'Black' : 'White';
    setStatus(`${loserName} resigned — ${winnerName} wins!`);

    if (settingsRef.current.soundEnabled) {
      playCheckmateSound();
    }
  }, [game]);

  // ── PGN Export ───────────────────────────────────────────────
  const exportPgn = useCallback(() => {
    return game.pgn();
  }, [game]);

  // ── Captured Pieces ──────────────────────────────────────────
  const capturedPieces = useCallback(() => {
    const whiteCaptured: string[] = [];
    const blackCaptured: string[] = [];

    const verboseHistory = game.history({ verbose: true });
    for (const move of verboseHistory) {
      if (move.captured) {
        if (move.color === 'w') {
          whiteCaptured.push(move.captured);
        } else {
          blackCaptured.push(move.captured);
        }
      }
    }

    const sortPieces = (pieces: string[]) =>
      pieces.sort((a, b) => (PIECE_VALUE[b] ?? 0) - (PIECE_VALUE[a] ?? 0));

    return {
      white: sortPieces(whiteCaptured),
      black: sortPieces(blackCaptured),
    };
  }, [game]);

  // ── Effects ────────────────────────────────────────────────────

  // Restore saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      try {
        game.load(saved.fen);
        /* eslint-disable react-hooks/set-state-in-effect */
        setFen(saved.fen);
        setHistory(saved.history);
        const fens = rebuildFensFromHistory(saved.history);
        setMoveFens(fens);
        updateState();
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch {
        // invalid state, start fresh
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize or terminate Stockfish when game mode or difficulty changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const isComputerMode = settings.gameMode === 'computer';

    if (isComputerMode && stockfishStatus === 'unloaded') {
      initStockfish();
    }

    if (!isComputerMode && stockfishStatus !== 'unloaded') {
      terminateStockfish();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.gameMode, stockfishStatus]);

  // Reset board when game mode or difficulty changes
  useEffect(() => {
    if (
      prevModeRef.current !== settings.gameMode ||
      prevDifficultyRef.current !== settings.difficulty
    ) {
      prevModeRef.current = settings.gameMode;
      prevDifficultyRef.current = settings.difficulty;
      handleNewGame();
    }
  }, [settings.gameMode, settings.difficulty, handleNewGame]);

  // Cleanup timeouts and Stockfish on unmount
  useEffect(() => {
    return () => {
      if (computerMoveTimeoutRef.current) {
        clearTimeout(computerMoveTimeoutRef.current);
      }
      if (stockfishEngineRef.current) {
        stockfishEngineRef.current.terminate();
        stockfishEngineRef.current = null;
      }
    };
  }, []);

  return {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    isComputerThinking,
    gameResult,
    reviewMode,
    reviewIndex,
    moveFens,
    stockfishStatus,
    stockfishError,
    stockfishProgress,
    moveFeedback,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
    undoMove,
    resign,
    exportPgn,
    capturedPieces,
    enterReviewMode,
    exitReviewMode,
    goToMove,
  };
}
