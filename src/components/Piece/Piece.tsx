interface PieceProps {
  piece: { color: 'w' | 'b'; type: string };
  pieceSet?: 'unicode' | 'symbols' | 'outlined' | 'merida';
}

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export default function Piece({ piece, pieceSet = 'unicode' }: PieceProps) {
  const char = PIECE_UNICODE[piece.color]?.[piece.type] ?? '';
  const resolvedSet = pieceSet || 'unicode';
  const setClass = 'piece-set-' + resolvedSet;

  return (
    <span
      className={'piece piece-' + piece.color + ' ' + setClass}
      data-piece={piece.color + piece.type}
      data-piece-set={resolvedSet}
    >
      {char}
    </span>
  );
}
