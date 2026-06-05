import type { Difficulty } from '../../chess/difficulty';
import { DIFFICULTY_OPTIONS, DISCLAIMER_TEXT } from '../../chess/difficulty';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  visible: boolean;
}

export default function DifficultySelector({ value, onChange, visible }: DifficultySelectorProps) {
  if (!visible) return null;

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
      <p className="settings-disclaimer">{DISCLAIMER_TEXT}</p>
    </div>
  );
}
