import type { Difficulty } from '../../chess/difficulty';
import { DIFFICULTY_OPTIONS, DISCLAIMER_TEXT, DIFFICULTIES } from '../../chess/difficulty';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  visible: boolean;
}

export default function DifficultySelector({ value, onChange, visible }: DifficultySelectorProps) {
  if (!visible) return null;

  const isNightmare = value === 'nightmare';
  const nightmareConfig = DIFFICULTIES.nightmare;

  return (
    <div className="settings-field">
      <label htmlFor="difficulty" className="settings-label">Difficulty</label>
      <select
        id="difficulty"
        className="settings-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Difficulty)}
        aria-label="Select difficulty level"
      >
        {DIFFICULTY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isNightmare && (
        <p className="settings-disclaimer settings-disclaimer--warning">
          ⚠ Nightmare is powered by Stockfish WASM — a real chess engine in your browser.
          Requires <strong>SharedArrayBuffer</strong> support (modern Chrome, Edge, or Firefox).
          <br />
          The engine (~150KB gzipped) loads on-demand when you select this difficulty.
          <br />
          <em>{nightmareConfig.description}</em>
        </p>
      )}
      <p className="settings-disclaimer">{DISCLAIMER_TEXT}</p>
    </div>
  );
}
