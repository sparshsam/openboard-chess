interface PromotionDialogProps {
  color: 'w' | 'b';
  onPromote: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞' },
};

const PIECES: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];

export default function PromotionDialog({ color, onPromote, onCancel }: PromotionDialogProps) {
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="promotion-title">Choose promotion:</p>
        <div className="promotion-choices">
          {PIECES.map((p) => (
            <button
              key={p}
              className="promotion-btn"
              onClick={() => onPromote(p)}
              aria-label={`Promote to ${p === 'q' ? 'Queen' : p === 'r' ? 'Rook' : p === 'b' ? 'Bishop' : 'Knight'}`}
            >
              {PIECE_UNICODE[color][p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
