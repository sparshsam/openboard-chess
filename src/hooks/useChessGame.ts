import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PromotionChoice } from '../types';
import { saveGame, loadGame, clearGame } from '../utils/storage';

export function useChessGame() {
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

  // Restore saved game on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSquare = useCallback(
    (square: Square) => {
      // If there's a piece of the current turn's color, select it
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        // Get legal moves for this piece
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }

      // If a square is already selected, try to move
      if (selectedSquare) {
        // Check if destination is a legal move
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
    [game, selectedSquare, updateState]
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
    [game, pendingPromotion, updateState]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const newGame = useCallback(() => {
    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
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
        updateState();
        return true;
      } catch {
        return false;
      }
    },
    [game, updateState]
  );

  return {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
  };
}
