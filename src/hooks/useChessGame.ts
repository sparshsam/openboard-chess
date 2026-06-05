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
  const [difficulty, setDifficultyState] = useState<Difficulty>('easy');
  const [isThinking, setIsThinking] = useState(false);

  // Ref to prevent concurrent computer moves
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

  /** Trigger a computer move asynchronously. */
  const triggerComputerMove = useCallback(() => {
    if (thinkingRef.current) return;
    if (game.isGameOver()) return;
    if (game.turn() !== 'b') return; // Computer only plays black for now

    thinkingRef.current = true;
    setIsThinking(true);

    // Use setTimeout to yield to the UI thread so the "thinking" state renders
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
        // If the computer move fails somehow, just release the thinking lock
      } finally {
        thinkingRef.current = false;
        setIsThinking(false);
      }
    }, 150); // Brief delay so the user perceives the computer is "thinking"
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

  // After every state update, check if computer should move
  useEffect(() => {
    if (gameMode === 'pvc' && game.turn() === 'b' && !game.isGameOver()) {
      triggerComputerMove();
    }
  }, [fen, gameMode, triggerComputerMove, game]);

  const selectSquare = useCallback(
    (square: Square) => {
      // Block interaction during computer's turn
      if (isThinking || thinkingRef.current) return;

      // If it's the computer's turn in PVC mode, block human input
      if (gameMode === 'pvc' && game.turn() === 'b') return;

      // If there's a piece of the current turn's color, select it
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }

      // If a square is already selected, try to move
      if (selectedSquare) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const targetMove = moves.find((m) => m.to === square);

        if (targetMove) {
          // If this is a promotion move, show dialog
          if (targetMove.promotion) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }

          // Regular move
          game.move({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalMoves([]);
          updateState();
          return;
        }

        // Clicked on own piece of current turn — switch selection
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const newMoves = game.moves({ square, verbose: true });
          setLegalMoves(newMoves.map((m) => m.to as Square));
          return;
        }

        // Illegal destination — deselect
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
      // If switching to PVC and it's black's turn, trigger computer move
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
