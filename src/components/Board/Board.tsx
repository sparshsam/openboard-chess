import type { Chess, Square as ChessSquare } from 'chess.js';
import Square from './Square';
import type { PieceInfo } from './Square';
import type { BoardTheme, PieceSet } from '../../types';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

interface BoardProps {
  game: Chess;
  selectedSquare: ChessSquare | null;
  legalMoves: ChessSquare[];
  onSquareClick: (square: ChessSquare) => void;
  boardTheme?: BoardTheme;
  pieceSet?: PieceSet;
  isComputerThinking?: boolean;
}

export default function Board({
  game,
  selectedSquare,
  legalMoves,
  onSquareClick,
  boardTheme = 'classic',
  pieceSet = 'merida',
  isComputerThinking = false,
}: BoardProps) {
  const squares: React.ReactNode[] = [];

  RANKS.forEach((rank, ri) => {
    FILES.forEach((file, fi) => {
      const square = (file + rank) as ChessSquare;
      const isLight = (ri + fi) % 2 === 0;
      const piece = game.get(square) as PieceInfo | null;
      const isSelected = selectedSquare === square;
      const isLegalMove = legalMoves.includes(square);

      // Rank labels on left edge (file a)
      const rankLabel = fi === 0 ? rank : null;
      // File labels on bottom edge (rank 1)
      const fileLabel = ri === 7 ? file.toUpperCase() : null;

      squares.push(
        <Square
          key={square}
          square={square}
          piece={piece}
          isLight={isLight}
          isSelected={isSelected}
          isLegalMove={isLegalMove}
          rankLabel={rankLabel}
          fileLabel={fileLabel}
          onClick={() => onSquareClick(square)}
          pieceSet={pieceSet}
        />
      );
    });
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (document.activeElement === e.currentTarget) {
      // Board-level key handler for arrow navigation between squares
      const focusedSquare = document.activeElement?.getAttribute('data-square') as ChessSquare | null;
      if (!focusedSquare) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        return;
      }

      const file = focusedSquare.charCodeAt(0) - 97; // a=0, h=7
      const rank = parseInt(focusedSquare[1]) - 1; // 1=0, 8=7

      let newFile = file;
      let newRank = rank;
      switch (e.key) {
        case 'ArrowUp':
          newRank = Math.min(rank + 1, 7);
          break;
        case 'ArrowDown':
          newRank = Math.max(rank - 1, 0);
          break;
        case 'ArrowLeft':
          newFile = Math.max(file - 1, 0);
          break;
        case 'ArrowRight':
          newFile = Math.min(file + 1, 7);
          break;
        default:
          return;
      }

      e.preventDefault();
      const targetSquare =
        String.fromCharCode(97 + newFile) + (newRank + 1);
      const target = document.querySelector(
        `[data-square="${targetSquare}"]`
      );
      if (target instanceof HTMLElement) target.focus();
    }
  };

  const thinkingClass = isComputerThinking ? ' board-computer-thinking' : '';

  return (
    <div
      className={'board theme-' + boardTheme + thinkingClass}
      role="grid"
      aria-label="Chess board"
      onKeyDown={handleKeyDown}
    >
      {squares}
    </div>
  );
}
