import type { Difficulty, GameMode } from '../computer/types';

const STORAGE_KEY = 'openboard-chess-save';
const SETTINGS_KEY = 'openboard-chess-settings';

export function saveGame(fen: string, history: string[]): void {
  try {
    const data = JSON.stringify({ fen, history, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // localStorage may be unavailable or full
  }
}

export function loadGame(): { fen: string; history: string[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.fen === 'string' && Array.isArray(data.history)) {
      return { fen: data.fen, history: data.history };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveSettings(gameMode: GameMode, difficulty: Difficulty): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ gameMode, difficulty }));
  } catch {
    // ignore
  }
}

export function loadSettings(): { gameMode: GameMode; difficulty: Difficulty } | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      (data.gameMode === 'pvc' || data.gameMode === 'pvp') &&
      (data.difficulty === 'beginner' || data.difficulty === 'casual' || data.difficulty === 'club')
    ) {
      return { gameMode: data.gameMode, difficulty: data.difficulty };
    }
    return null;
  } catch {
    return null;
  }
}
