import type { Chess, Square as ChessSquare, Color } from 'chess.js';
import Square from './Square';
import type { PieceInfo } from './Square';
import type { BoardOrientation, BoardTheme, PieceSet } from '../../types';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

interface BoardProps {
  game: Chess;
  selectedSquare: ChessSquare | null;
  legalMoves: ChessSquare[];
  onSquareClick: (square: ChessSquare) => void;
  boardOrientation?: BoardOrientation;
  boardTheme?: BoardTheme;
  pieceSet?: PieceSet;
  isComputerThinking?: boolean;
}

export default function Board({
  game,
  selectedSquare,
  legalMoves,
  onSquareClick,
  boardOrientation = 'white-bottom',
  boardTheme = 'classic',
  pieceSet = 'merida',
  isComputerThinking = false,
}: BoardProps) {
  const currentTurn: Color = game.turn();
  const flipped = boardOrientation === 'flip-turn' && currentTurn === 'b';

  // Display ranks: when flipped, reverse so Black's rank 8 is at bottom
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;

  // Which color is on each side
  const bottomColor: Color = flipped ? 'b' : 'w';
  const topColor: Color = flipped ? 'w' : 'b';

  const squares: React.ReactNode[] = [];

  displayRanks.forEach((rank, ri) => {
    FILES.forEach((file, fi) => {
      const square = (file + rank) as ChessSquare;
      const isLight = (ri + fi) % 2 === 0;
      const piece = game.get(square) as PieceInfo | null;
      const isSelected = selectedSquare === square;
      const isLegalMove = legalMoves.includes(square);

      // Rank labels on left edge (file a)
      const rankLabel = fi === 0 ? rank : null;
      // File labels on bottom edge (last displayed rank)
      const fileLabel = ri === displayRanks.length - 1 ? file.toUpperCase() : null;

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
      const focusedSquare = document.activeElement?.getAttribute('data-square') as ChessSquare | null;
      if (!focusedSquare) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        return;
      }

      const file = focusedSquare.charCodeAt(0) - 97;
      const rank = parseInt(focusedSquare[1]) - 1;

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
  const flipClass = flipped ? ' board-flipped' : '';

  return (
    <div className={'board-wrapper' + flipClass}>
      {/* Top side: white or black label */}
      <div className="board-side-label board-side-top">
        <span className={`side-color-dot side-dot-${topColor}`} />
        <span className="side-color-name">{topColor === 'w' ? 'White' : 'Black'}</span>
        {topColor === currentTurn && (
          <span className="side-turn-dot" title="Current turn to move">●</span>
        )}
      </div>

      <div
        className={'board theme-' + boardTheme + thinkingClass}
        role="grid"
        aria-label={`Chess board — ${topColor === 'w' ? 'White' : 'Black'} at top, ${bottomColor === 'w' ? 'White' : 'Black'} at bottom`}
        onKeyDown={handleKeyDown}
      >
        {squares}
      </div>

      {/* Bottom side: white or black label */}
      <div className="board-side-label board-side-bottom">
        <span className={`side-color-dot side-dot-${bottomColor}`} />
        <span className="side-color-name">{bottomColor === 'w' ? 'White' : 'Black'}</span>
        {bottomColor === currentTurn && (
          <span className="side-turn-dot" title="Current turn to move">●</span>
        )}
      </div>
    </div>
  );
}
