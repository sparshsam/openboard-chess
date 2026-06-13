interface GameEndModalProps {
  result: { winner: 'w' | 'b'; reason: 'checkmate' | 'resign' | 'draw' } | null;
  onNewGame: () => void;
  onEnterReview: () => void;
}

const WINNER_LABEL: Record<'w' | 'b', string> = {
  w: 'White',
  b: 'Black',
};

export default function GameEndModal({ result, onNewGame, onEnterReview }: GameEndModalProps) {
  if (!result) return null;

  const { winner, reason } = result;

  let title: string;
  let message: string;

  switch (reason) {
    case 'checkmate':
      title = 'Checkmate!';
      message = `${WINNER_LABEL[winner]} wins by checkmate.`;
      break;
    case 'resign':
      title = 'Resignation';
      message = `${WINNER_LABEL[winner]} wins by resignation.`;
      break;
    case 'draw':
      title = 'Draw';
      message = 'The game ended in a draw.';
      break;
  }

  return (
    <div className="game-end-overlay">
      <div className="game-end-modal">
        <div className="game-end-result">{title}</div>
        <div className="game-end-message">{message}</div>
        <div className="game-end-actions">
          <button className="btn btn-sm" onClick={onNewGame}>
            New Game
          </button>
          <button className="btn btn-sm btn-review" onClick={onEnterReview}>
            Review Game
          </button>
        </div>
      </div>
    </div>
  );
}
