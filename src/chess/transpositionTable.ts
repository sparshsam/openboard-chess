/**
 * Simple fixed-size transposition table.
 * Uses a basic hash (FEN-based) since we don't have Zobrist in this codebase.
 * Size: ~64KB with default settings (1M entries × ~64 bytes each ≈ 64MB is too large;
 * we use a smaller table: 262144 entries (~2MB) which is reasonable for browser use).
 * Production chess engines use Zobrist hashing, but this gives us the main benefit:
 * avoiding re-searching the same position at similar depths.
 */

// Use a prime-ish size for good distribution
const TT_SIZE = 1 << 18; // 262144 entries

/** Node type for TT entry */
export const NodeType = {
  /** Exact score (from PV node or terminal) */
  Exact: 0,
  /** Lower bound (fail-high / beta cutoff) */
  LowerBound: 1,
  /** Upper bound (fail-low / alpha cutoff) */
  UpperBound: 2,
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export interface TTEntry {
  /** Zobrist-like hash from FEN (simple hash) */
  key: number;
  /** Depth searched */
  depth: number;
  /** Score from search (from perspective of the position's player) */
  score: number;
  /** Node type */
  nodeType: NodeType;
  /** Best move found (from/to squares) */
  bestFrom?: string;
  bestTo?: string;
  bestPromotion?: string;
  /** Age stamp for replacement */
  age: number;
}

export class TranspositionTable {
  private entries: (TTEntry | null)[];
  private age: number = 0;

  constructor() {
    this.entries = new Array(TT_SIZE).fill(null);
  }

  /**
   * Simple hash from FEN string — fast and good enough for our purposes.
   * We ignore the move counters (last two fields) so positions are matched
   * regardless of 50-move rule / fullmove number.
   */
  hashFen(fen: string): number {
    // Strip move counters: only hash the position + castling + en passant
    const parts = fen.split(' ');
    const relevant = parts.slice(0, 4).join(' ');

    let hash = 5381;
    for (let i = 0; i < relevant.length; i++) {
      hash = ((hash << 5) + hash) ^ relevant.charCodeAt(i);
    }
    return hash;
  }

  /** Get the index for a given hash */
  private index(key: number): number {
    return key & (TT_SIZE - 1);
  }

  /** Store an entry */
  store(
    fen: string,
    depth: number,
    score: number,
    nodeType: NodeType,
    bestMove?: { from: string; to: string; promotion?: string }
  ): void {
    const key = this.hashFen(fen);
    const idx = this.index(key);

    // Replacement strategy: always replace if depth >= existing, or if older
    const existing = this.entries[idx];
    if (existing && existing.depth > depth && existing.age >= this.age - 1) {
      // Keep the deeper entry if it's recent enough
      return;
    }

    this.entries[idx] = {
      key,
      depth,
      score,
      nodeType,
      age: this.age,
      bestFrom: bestMove?.from,
      bestTo: bestMove?.to,
      bestPromotion: bestMove?.promotion,
    };
  }

  /** Probe the table — returns entry if found and depth >= requiredDepth */
  probe(fen: string, requiredDepth: number): TTEntry | null {
    const key = this.hashFen(fen);
    const idx = this.index(key);
    const entry = this.entries[idx];

    if (!entry || entry.key !== key) return null;
    if (entry.depth < requiredDepth) return null;

    return entry;
  }

  /** Get the best move from TT (for move ordering), without depth check */
  getBestMove(fen: string): { from: string; to: string; promotion?: string } | null {
    const key = this.hashFen(fen);
    const idx = this.index(key);
    const entry = this.entries[idx];

    if (!entry || entry.key !== key) return null;
    if (!entry.bestFrom || !entry.bestTo) return null;

    return {
      from: entry.bestFrom,
      to: entry.bestTo,
      promotion: entry.bestPromotion,
    };
  }

  /** Increment age (called per iteration in iterative deepening) */
  newIteration(): void {
    this.age++;
  }

  /** Clear the table entirely */
  clear(): void {
    this.entries.fill(null);
    this.age = 0;
  }

  /** Number of entries currently stored */
  get size(): number {
    let count = 0;
    for (const e of this.entries) {
      if (e) count++;
    }
    return count;
  }
}
