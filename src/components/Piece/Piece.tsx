interface PieceProps {
  piece: { color: 'w' | 'b'; type: string };
  pieceSet?: 'unicode' | 'symbols' | 'outlined';
}

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
  b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
};

export default function Piece({ piece, pieceSet = 'unicode' }: PieceProps) {
  const char = PIECE_UNICODE[piece.color]?.[piece.type] ?? '';
  const setClass = 'piece-set-' + pieceSet;

  return (
    <span
      className={'piece piece-' + piece.color + ' ' + setClass}
      data-piece={piece.color + piece.type}
    >
      {char}
    </span>
  );
}
