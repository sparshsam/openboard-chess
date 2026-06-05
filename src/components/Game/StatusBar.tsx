import type { GameMode } from '../../types';

interface StatusBarProps {
  status: string;
  fen: string;
  gameMode: GameMode;
  isComputerThinking?: boolean;
}

export default function StatusBar({ status, fen, gameMode, isComputerThinking }: StatusBarProps) {
  const modeLabel = gameMode === 'computer' ? 'Computer' : 'Local 2P';
  const thinkingLabel = isComputerThinking ? ' (thinking…)' : '';

  return (
    <div className="status-bar">
      <span className="status-mode">{modeLabel}{thinkingLabel}</span>
      <span className="status-text">{status}</span>
      <span className="status-fen" title={fen}>
        {fen.length > 30 ? fen.slice(0, 30) + '…' : fen}
      </span>
    </div>
  );
}
