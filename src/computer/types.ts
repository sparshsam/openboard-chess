export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'pvc' | 'pvp';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
export const GAME_MODES: GameMode[] = ['pvc', 'pvp'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  pvc: 'User vs Computer',
  pvp: 'Local Two Player',
};
