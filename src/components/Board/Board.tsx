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
}

export default function Board({
  game,
  selectedSquare,
  legalMoves,
  onSquareClick,
  boardTheme = 'classic',
  pieceSet = 'unicode',
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

  return <div className={'board theme-' + boardTheme}>{squares}</div>;
}
