import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PromotionChoice, AppSettings, GameMode } from '../types';
import type { Difficulty } from '../chess/difficulty';
import { getComputerMove, COMPUTER_DELAY_MS } from '../chess/computer';
import { saveGame, loadGame, clearGame } from '../lib/storage';

interface UseChessGameOptions {
  settings: AppSettings;
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
  const prevModeRef = useRef<GameMode>(settings.gameMode);
  const prevDifficultyRef = useRef<Difficulty>(settings.difficulty);
  const settingsRef = useRef(settings);
  const gameRef = useRef(game);
  const computerMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setFen(newFen);
    setHistory(newHistory);
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

  // ── Schedule computer move (called after user plays) ───────────
  const scheduleComputerMove = useCallback(() => {
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
    }

    setIsComputerThinking(true);

    computerMoveTimeoutRef.current = setTimeout(async () => {
      const g = gameRef.current;
      const s = settingsRef.current;
      if (s.gameMode !== 'computer' || g.turn() !== 'b' || g.isGameOver()) {
        setIsComputerThinking(false);
        return;
      }

      try {
        const move = await getComputerMove(g, s.difficulty);
        g.move({ from: move.from, to: move.to, promotion: move.promotion });
        setSelectedSquare(null);
        setLegalMoves([]);

        const newFen = g.fen();
        const newHistory = g.history();
        setFen(newFen);
        setHistory(newHistory);
        saveGame(newFen, newHistory);

        const turn = g.turn() === 'w' ? 'White' : 'Black';
        let msg = `${turn} to move`;
        if (g.isCheckmate()) {
          msg = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins!`;
        } else if (g.isStalemate()) {
          msg = 'Stalemate! The game is a draw.';
        } else if (g.isDraw()) {
          msg = 'Draw!';
        } else if (g.isCheck()) {
          msg = `${turn} is in check`;
        }
        setStatus(msg);
      } catch (err) {
        console.error('Computer move failed:', err);
      } finally {
        setIsComputerThinking(false);
        computerMoveTimeoutRef.current = null;
      }
    }, COMPUTER_DELAY_MS + Math.random() * 300);
  }, []);

  // ── New game ───────────────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
      computerMoveTimeoutRef.current = null;
    }

    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setIsComputerThinking(false);
    clearGame();
    updateState();
  }, [game, updateState]);

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
        updateState();
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch {
        // invalid state, start fresh
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (computerMoveTimeoutRef.current) {
        clearTimeout(computerMoveTimeoutRef.current);
      }
    };
  }, []);

  // ── Helper: after a user move, let computer respond ────────────
  const afterUserMove = useCallback(() => {
    const isComputerTurn =
      settingsRef.current.gameMode === 'computer' && game.turn() === 'b' && !game.isGameOver();
    if (isComputerTurn) {
      scheduleComputerMove();
    }
  }, [game, scheduleComputerMove]);

  // ── User interaction ───────────────────────────────────────────
  const selectSquare = useCallback(
    (square: Square) => {
      if (isComputerThinking) return;
      if (settings.gameMode === 'computer' && game.turn() === 'b') return;

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

          game.move({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalMoves([]);
          updateState();
          afterUserMove();
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
    [game, selectedSquare, updateState, afterUserMove, isComputerThinking, settings.gameMode]
  );

  const promote = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      game.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      updateState();
      afterUserMove();
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
        updateState();
        afterUserMove();
        return true;
      } catch {
        return false;
      }
    },
    [game, updateState, afterUserMove]
  );

  return {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    isComputerThinking,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
  };
}
