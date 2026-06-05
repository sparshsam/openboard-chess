/** Difficulty levels for the computer opponent */
export type Difficulty = 'beginner' | 'casual' | 'club';

export interface DifficultyConfig {
  /** Human-readable label */
  label: string;
  /** Approximate rating */
  rating: number;
  /** Search depth in half-moves (plies) */
  depth: number;
  /** Whether random blunders occur */
  randomBlunders: boolean;
  /** Description for the UI */
  description: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    label: 'Beginner',
    rating: 800,
    depth: 0,
    randomBlunders: true,
    description: 'Picks random legal moves with slight center preference. Occasionally blunders.',
  },
  casual: {
    label: 'Casual',
    rating: 1000,
    depth: 1,
    randomBlunders: false,
    description: '1-ply search with piece-square evaluation. Captures hanging pieces.',
  },
  club: {
    label: 'Club',
    rating: 1400,
    depth: 2,
    randomBlunders: false,
    description: '2-ply alpha-beta search. Material, positional, and king safety evaluation.',
  },
};

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner (~800)' },
  { value: 'casual', label: 'Casual (~1000)' },
  { value: 'club', label: 'Club (~1400)' },
];

/** Disclaimer text shown near difficulty selector */
export const DISCLAIMER_TEXT =
  'Rating-inspired skill bands, not official Elo ratings.';
