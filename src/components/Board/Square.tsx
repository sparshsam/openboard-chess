import type { Square as ChessSquare } from 'chess.js';
import Piece from '../Piece/Piece';
import type { PieceSet } from '../../types';

export interface PieceInfo {
  color: 'w' | 'b';
  type: string;
}

interface SquareProps {
  square: ChessSquare;
  piece: PieceInfo | null;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  rankLabel: string | null;
  fileLabel: string | null;
  onClick: () => void;
  pieceSet?: PieceSet;
}

export default function Square({
  square,
  piece,
  isLight,
  isSelected,
  isLegalMove,
  rankLabel,
  fileLabel,
  onClick,
  pieceSet = 'unicode',
}: SquareProps) {
  const colorClass = isLight ? 'square-light' : 'square-dark';

  return (
    <div
      className={'square ' + colorClass + (isSelected ? ' square-selected' : '')}
      data-square={square}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      {rankLabel && <span className="label-rank">{rankLabel}</span>}
      {fileLabel && <span className="label-file">{fileLabel}</span>}
      {piece && <Piece piece={piece} pieceSet={pieceSet} />}
      {isLegalMove && <span className="legal-move-dot" />}
    </div>
  );
}
