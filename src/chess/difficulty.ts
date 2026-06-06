/** Difficulty levels for the computer opponent */
export type Difficulty = 'beginner' | 'casual' | 'club' | 'expert' | 'nightmare';

export interface DifficultyConfig {
  /** Human-readable label */
  label: string;
  /** Approximate rating */
  rating: number;
  /** Search depth in half-moves (plies) — 0 means depth is not applicable (uses external engine) */
  depth: number;
  /** Whether random blunders occur */
  randomBlunders: boolean;
  /** Whether to use quiescence search */
  quiescence: boolean;
  /** Whether to use transposition table */
  useTranspositionTable: boolean;
  /** Whether to use iterative deepening with time management */
  iterativeDeepening: boolean;
  /** Whether this difficulty uses external engine integration (e.g. Stockfish WASM) */
  usesStockfish?: boolean;
  /** Description for the UI */
  description: string;
  /** Whether this difficulty is hidden from the UI */
  hidden?: boolean;
  /** If true, this difficulty cannot be selected yet */
  disabled?: boolean;
}

/** Maximum think time for iterative deepening (Expert) in ms */
export const EXPERT_THINK_TIME_MS = 2500;
/** Default search depth for Expert per ply (before qs) */
export const EXPERT_DEPTH = 5;

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    label: 'Beginner',
    rating: 800,
    depth: 0,
    randomBlunders: true,
    quiescence: false,
    useTranspositionTable: false,
    iterativeDeepening: false,
    description: 'Picks random legal moves with slight center preference. Occasionally blunders.',
  },
  casual: {
    label: 'Casual',
    rating: 1000,
    depth: 1,
    randomBlunders: false,
    quiescence: false,
    useTranspositionTable: false,
    iterativeDeepening: false,
    description: '1-ply search with piece-square evaluation. Captures hanging pieces.',
  },
  club: {
    label: 'Club',
    rating: 1400,
    depth: 3,
    randomBlunders: false,
    quiescence: true,
    useTranspositionTable: false,
    iterativeDeepening: false,
    description: '3-ply alpha-beta search with quiescence. MVV-LVA move ordering. Full evaluation with mobility and pawn structure.',
  },
  expert: {
    label: 'Expert',
    rating: 1700,
    depth: 5,
    randomBlunders: false,
    quiescence: true,
    useTranspositionTable: true,
    iterativeDeepening: true,
    description: '5-ply iterative deepening with transposition cache and quiescence. Full evaluation. Tactical stability.',
  },
  nightmare: {
    label: 'Nightmare',
    rating: 2000,
    depth: 0,
    randomBlunders: false,
    quiescence: false,
    useTranspositionTable: false,
    iterativeDeepening: false,
    usesStockfish: true,
    description:
      'Powered by Stockfish WASM (introduced in v0.5.0). Extremely strong. Requires SharedArrayBuffer support in your browser. ~150KB gzipped, loaded on-demand when this difficulty is selected.',
  },
};

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner (~800)' },
  { value: 'casual', label: 'Casual (~1000)' },
  { value: 'club', label: 'Club (~1400)' },
  { value: 'expert', label: 'Expert (~1700)' },
  { value: 'nightmare', label: 'Nightmare (~2000)' },
];

/** Disclaimer text shown near difficulty selector */
export const DISCLAIMER_TEXT =
  'Rating-inspired skill bands, not official Elo ratings.';

/** Evaluation features enabled by difficulty level */
export type EvalFeatures = {
  mobility: boolean;
  pawnStructure: boolean;
  development: boolean;
  space: boolean;
  kingSafety: boolean;
};

/** Which evaluation features to use per difficulty */
export const EVAL_FEATURES: Record<Difficulty, EvalFeatures> = {
  beginner: { mobility: false, pawnStructure: false, development: false, space: false, kingSafety: false },
  casual: { mobility: false, pawnStructure: false, development: false, space: false, kingSafety: false },
  club: { mobility: true, pawnStructure: true, development: true, space: true, kingSafety: true },
  expert: { mobility: true, pawnStructure: true, development: true, space: true, kingSafety: true },
  nightmare: { mobility: false, pawnStructure: false, development: false, space: false, kingSafety: false },
};
