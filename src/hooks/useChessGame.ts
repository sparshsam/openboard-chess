import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PromotionChoice } from '../types';
import type { Difficulty, GameMode } from '../computer/types';
import { getComputerMove } from '../computer/computerOpponent';
import { saveGame, loadGame, clearGame, saveSettings, loadSettings } from '../utils/storage';

interface InitBundle {
  game: Chess;
  fen: string;
  history: string[];
  status: string;
  gameMode: GameMode;
  difficulty: Difficulty;
}

function buildInitStatus(g: Chess): string {
  const turn = g.turn() === 'w' ? 'White' : 'Black';
  if (g.isCheckmate()) return `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins!`;
  if (g.isStalemate()) return 'Stalemate! The game is a draw.';
  if (g.isDraw()) return 'Draw!';
  if (g.isCheck()) return `${turn} is in check`;
  return `${turn} to move`;
}

/** Lazily initialize all game state from localStorage (runs once). */
function createInitBundle(): InitBundle {
  const game = new Chess();
  const saved = loadGame();
  let fen = game.fen();
  let history: string[] = [];
  const settings = loadSettings();

  if (saved) {
    try {
      game.load(saved.fen);
      fen = game.fen();
      history = saved.history;
    } catch {
      // Saved state invalid, use fresh game
    }
  }

  return {
    game,
    fen,
    history,
    status: buildInitStatus(game),
    gameMode: settings?.gameMode ?? 'pvc',
    difficulty: settings?.difficulty ?? 'beginner',
  };
}

export function useChessGame() {
  const [bundle] = useState(createInitBundle);
  const {
    game,
    fen: initialFen,
    history: initialHistory,
    status: initialStatus,
    gameMode: initialGameMode,
    difficulty: initialDifficulty,
  } = bundle;

  const [fen, setFen] = useState(initialFen);
  const [history, setHistory] = useState(initialHistory);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PromotionChoice | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [gameMode, setGameModeState] = useState<GameMode>(initialGameMode);
  const [difficulty, setDifficultyState] = useState<Difficulty>(initialDifficulty);
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
          if (gameMode === 'pvc' && game.turn() === 'b' && !game.isGameOver()) {
            triggerComputerMove();
          }
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
    [game, selectedSquare, updateState, isThinking, gameMode, triggerComputerMove],
  );

  const promote = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      game.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      updateState();
      if (gameMode === 'pvc' && game.turn() === 'b' && !game.isGameOver()) {
        triggerComputerMove();
      }
    },
    [game, pendingPromotion, updateState, gameMode, triggerComputerMove],
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
