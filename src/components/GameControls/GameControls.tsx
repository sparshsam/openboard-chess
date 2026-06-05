import { useState, useCallback } from 'react';

interface GameControlsProps {
  onNewGame: () => void;
  onExportFen: () => string;
  onImportFen: (fen: string) => boolean;
}

export default function GameControls({ onNewGame, onExportFen, onImportFen }: GameControlsProps) {
  const [fenInput, setFenInput] = useState('');
  const [fenCopied, setFenCopied] = useState(false);
  const [fenError, setFenError] = useState('');
  const [showFenInput, setShowFenInput] = useState(false);

  const handleExport = useCallback(() => {
    const fen = onExportFen();
    navigator.clipboard.writeText(fen).then(() => {
      setFenCopied(true);
      setTimeout(() => setFenCopied(false), 2000);
    });
  }, [onExportFen]);

  const handleImport = useCallback(() => {
    const trimmed = fenInput.trim();
    if (!trimmed) return;
    const ok = onImportFen(trimmed);
    if (ok) {
      setFenInput('');
      setFenError('');
      setShowFenInput(false);
    } else {
      setFenError('Invalid FEN string');
    }
  }, [fenInput, onImportFen]);

  return (
    <div className="game-controls">
      <button className="btn" onClick={onNewGame}>
        New Game
      </button>

      <button className="btn" onClick={handleExport}>
        {fenCopied ? 'FEN Copied!' : 'Copy FEN'}
      </button>

      <button className="btn" onClick={() => setShowFenInput(!showFenInput)}>
        {showFenInput ? 'Close Import' : 'Import FEN'}
      </button>

      {showFenInput && (
        <div className="fen-import-area">
          <input
            type="text"
            className="fen-input"
            placeholder="Paste FEN string..."
            value={fenInput}
            onChange={(e) => {
              setFenInput(e.target.value);
              setFenError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleImport();
            }}
          />
          <button className="btn btn-sm" onClick={handleImport}>
            Load
          </button>
          {fenError && <p className="fen-error">{fenError}</p>}
        </div>
      )}
    </div>
  );
}
