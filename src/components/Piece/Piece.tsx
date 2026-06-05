interface PieceProps {
  piece: { color: 'w' | 'b'; type: string };
}

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export default function Piece({ piece }: PieceProps) {
  const char = PIECE_UNICODE[piece.color]?.[piece.type] ?? '';
  return (
    <span className={`piece piece-${piece.color}`} data-piece={`${piece.color}${piece.type}`}>
      {char}
    </span>
  );
}
