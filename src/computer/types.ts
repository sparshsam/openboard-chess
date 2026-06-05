export type Difficulty = 'beginner' | 'casual' | 'club';
export type GameMode = 'pvc' | 'pvp';

export const DIFFICULTIES: Difficulty[] = ['beginner', 'casual', 'club'];
export const GAME_MODES: GameMode[] = ['pvc', 'pvp'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner (~800)',
  casual: 'Casual (~1000)',
  club: 'Club (~1400)',
};

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  pvc: 'User vs Computer',
  pvp: 'Local Two Player',
};

/** Rating-approximate helper text shown in the UI. */
export const RATING_DISCLAIMER = 'Approximate skill bands, not official Elo ratings.';
