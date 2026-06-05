import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PromotionChoice } from '../types';
import type { Difficulty, GameMode } from '../computer/types';
import { getComputerMove } from '../computer/computerOpponent';
import { saveGame, loadGame, clearGame, saveSettings, loadSettings } from '../utils/storage';

export function useChessGame() {
  const [game] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PromotionChoice | null>(null);
  const [status, setStatus] = useState<string>('White to move');

  // Game mode and difficulty
  const [gameMode, setGameModeState] = useState<GameMode>('pvc');
  const [difficulty, setDifficultyState] = useState<Difficulty>('beginner');
  const [isThinking, setIsThinking] = useState(false);

  const thinkingRef = useRef(false);

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

  const triggerComputerMove = useCallback(() => {
    if (thinkingRef.current) return;
    if (game.isGameOver()) return;
    if (game.turn() !== 'b') return;

    thinkingRef.current = true;
    setIsThinking(true);

    setTimeout(() => {
      try {
        const move = getComputerMove(game, difficulty);
        if (move) {
          game.move({ from: move.from, to: move.to, promotion: move.promotion });
          setSelectedSquare(null);
          setLegalMoves([]);
          updateState();
        }
      } catch {
        // Computer move failed — release lock
      } finally {
        thinkingRef.current = false;
        setIsThinking(false);
      }
    }, 200);
  }, [game, difficulty, updateState]);

  // Restore saved game and settings on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      try {
        game.load(saved.fen);
        setFen(saved.fen);
        setHistory(saved.history);
        updateState();
      } catch {
        // Saved state is invalid, start fresh
      }
    }

    const settings = loadSettings();
    if (settings) {
      setGameModeState(settings.gameMode);
      setDifficultyState(settings.difficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After state updates, check if computer should move
  useEffect(() => {
    if (gameMode === 'pvc' && game.turn() === 'b' && !game.isGameOver()) {
      triggerComputerMove();
    }
  }, [fen, gameMode, triggerComputerMove, game]);

  const selectSquare = useCallback(
    (square: Square) => {
      if (isThinking || thinkingRef.current) return;
      if (gameMode === 'pvc' && game.turn() === 'b') return;

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
    [game, selectedSquare, updateState, isThinking, gameMode],
  );

  const promote = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      game.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      updateState();
    },
    [game, pendingPromotion, updateState],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const newGame = useCallback(() => {
    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setIsThinking(false);
    thinkingRef.current = false;
    clearGame();
    updateState();
  }, [game, updateState]);

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
        setIsThinking(false);
        thinkingRef.current = false;
        updateState();
        return true;
      } catch {
        return false;
      }
    },
    [game, updateState],
  );

  const setGameMode = useCallback(
    (mode: GameMode) => {
      setGameModeState(mode);
      saveSettings(mode, difficulty);
      if (mode === 'pvc' && game.turn() === 'b' && !game.isGameOver()) {
        triggerComputerMove();
      }
    },
    [difficulty, game, triggerComputerMove],
  );

  const setDifficulty = useCallback(
    (diff: Difficulty) => {
      setDifficultyState(diff);
      saveSettings(gameMode, diff);
    },
    [gameMode],
  );

  return {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    gameMode,
    difficulty,
    isThinking,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
    setGameMode,
    setDifficulty,
  };
}
