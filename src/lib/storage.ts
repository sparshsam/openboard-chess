import type { AppSettings } from '../types';

const GAME_STORAGE_KEY = 'chess-by-sparsh-save';
const SETTINGS_STORAGE_KEY = 'chess-by-sparsh-settings';

/** Saved game state */
interface SavedGame {
  fen: string;
  history: string[];
  timestamp: number;
}

// ── Game persistence ───────────────────────────────────────────────

export function saveGame(fen: string, history: string[]): void {
  try {
    const data: SavedGame = { fen, history, timestamp: Date.now() };
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable or full
  }
}

export function loadGame(): { fen: string; history: string[] } | null {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const data: SavedGame = JSON.parse(raw);
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
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Settings persistence ───────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  gameMode: 'computer',
  difficulty: 'casual',
  boardOrientation: 'white-bottom',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      gameMode: parsed.gameMode ?? DEFAULT_SETTINGS.gameMode,
      difficulty: parsed.difficulty ?? DEFAULT_SETTINGS.difficulty,
      boardOrientation: parsed.boardOrientation ?? DEFAULT_SETTINGS.boardOrientation,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export { DEFAULT_SETTINGS };
