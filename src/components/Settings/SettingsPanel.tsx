import type { AppSettings, GameMode, BoardOrientation } from '../../types';
import type { Difficulty } from '../../chess/difficulty';
import ModeSelector from './ModeSelector';
import DifficultySelector from './DifficultySelector';

interface SettingsPanelProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onGameModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onBoardOrientationChange: (orientation: BoardOrientation) => void;
}

export default function SettingsPanel({
  settings,
  isOpen,
  onClose,
  onGameModeChange,
  onDifficultyChange,
  onBoardOrientationChange,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="settings-panel"
        role="dialog"
        aria-label="Game settings"
        aria-modal="true"
      >
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-body">
          <ModeSelector value={settings.gameMode} onChange={onGameModeChange} />

          <DifficultySelector
            value={settings.difficulty}
            onChange={onDifficultyChange}
            visible={settings.gameMode === 'computer'}
          />

          <div className="settings-field">
            <label htmlFor="board-orientation" className="settings-label">
              Board Orientation
            </label>
            <select
              id="board-orientation"
              className="settings-select"
              value={settings.boardOrientation}
              onChange={(e) => onBoardOrientationChange(e.target.value as BoardOrientation)}
              aria-label="Select board orientation"
            >
              <option value="white-bottom">White always at bottom</option>
              <option value="flip-turn">Flip to match current turn</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
