import type { GameMode, Difficulty } from '../computer/types';
import { GAME_MODES, DIFFICULTIES, GAME_MODE_LABELS, DIFFICULTY_LABELS } from '../computer/types';

interface ModeSelectorProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  onGameModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function ModeSelector({
  gameMode,
  difficulty,
  onGameModeChange,
  onDifficultyChange,
}: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      <div className="mode-selector-group">
        <label className="mode-selector-label">Mode</label>
        <div className="mode-selector-buttons">
          {GAME_MODES.map((mode) => (
            <button
              key={mode}
              className={`mode-btn ${gameMode === mode ? 'mode-btn-active' : ''}`}
              onClick={() => onGameModeChange(mode)}
            >
              {GAME_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="mode-selector-group">
        <label className="mode-selector-label">Difficulty</label>
        <div className="mode-selector-buttons">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              className={`mode-btn ${difficulty === diff ? 'mode-btn-active' : ''}`}
              onClick={() => onDifficultyChange(diff)}
              data-testid={`difficulty-${diff}`}
            >
              {DIFFICULTY_LABELS[diff]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
