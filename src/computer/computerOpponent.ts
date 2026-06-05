import type { Chess, Square } from 'chess.js';
import type { Difficulty } from './types';

/** Piece value mapping for material evaluation. */
const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

/** Get all legal moves as verbose move objects. */
function allMoves(game: Chess) {
  return game.moves({ verbose: true });
}

/** Pick a random element from an array. */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Easy: random legal moves ───────────────────────────────────────

function pickEasy(game: Chess) {
  const moves = allMoves(game);
  return randomPick(moves);
}

// ─── Medium: material-aware moves ───────────────────────────────────

function pickMedium(game: Chess) {
  const moves = allMoves(game);

  // Score each move
  const scored = moves.map((m) => {
    let score = 0;

    // Captures: weight by captured piece value
    if (m.captured) {
      score += PIECE_VALUE[m.captured] ?? 0;
    }

    // Promotions are good
    if (m.promotion) {
      score += PIECE_VALUE[m.promotion] ?? 0;
    }

    // Checks get a bonus
    const san = m.san;
    if (san.includes('+') || san.includes('#')) {
      score += 50;
    }

    // Add small random factor (up to 30) so it's not purely deterministic
    score += Math.random() * 30;

    return { move: m, score };
  });

  // Sort descending by score and pick from top candidates
  scored.sort((a, b) => b.score - a.score);

  // Pick from top 3 (or fewer if less than 3 moves)
  const topN = Math.min(3, scored.length);
  const candidates = scored.slice(0, topN);
  return randomPick(candidates).move;
}

// ─── Hard: stronger heuristic ───────────────────────────────────────

// Piece-square tables for positional play (simplified, from white's perspective)
// Higher values = good squares for that piece
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

const PIECE_TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

/** Get the index into a piece-square table (0-63) for a square and color. */
function pstIndex(square: Square, color: 'w' | 'b'): number {
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(square[1], 10) - 1; // 1=0, 8=7
  // Tables are stored from white's perspective (rank 8 at index 0)
  if (color === 'w') {
    return (7 - rank) * 8 + file;
  }
  // Flip for black
  return rank * 8 + (7 - file);
}

/** Score a single move for the Hard level. */
function scoreHardMove(
  move: ReturnType<typeof allMoves>[number],
  game: Chess,
  maxCapturableValue: number,
): number {
  let score = 0;

  // ── Capture scoring (MVV-LVA) ──
  if (move.captured) {
    // Value of captured piece
    const victimValue = PIECE_VALUE[move.captured] ?? 0;
    // Value of our piece (low is good — prefer capturing with pawns)
    const attackerValue = PIECE_VALUE[move.piece] ?? 0;
    // MVV-LVA: victim value * 10 - attacker value
    score += victimValue * 10 - attackerValue;

    // Bonus for capturing the highest-value piece available
    if (victimValue >= maxCapturableValue * 0.8) {
      score += 200;
    }
  }

  // ── Promotion ──
  if (move.promotion) {
    score += PIECE_VALUE[move.promotion] ?? 0;
    score += 500; // Major promotion bonus
  }

  // ── Check / checkmate ──
  const san = move.san;
  if (san.includes('#')) {
    score += 100000; // Immediate checkmate
  } else if (san.includes('+')) {
    score += 150;
  }

  // ── Piece-square position ──
  const table = PIECE_TABLES[move.piece];
  if (table) {
    // Bonus for moving TO a good square (positional)
    const toIdx = pstIndex(move.to as Square, game.turn());
    score += table[toIdx] * 0.5;

    // Penalty for moving FROM a good square (unless capturing)
    if (!move.captured) {
      const fromIdx = pstIndex(move.from as Square, game.turn());
      score -= table[fromIdx] * 0.3;
    }
  }

  // ── Basic blunder avoidance ──
  // Moving a high-value piece to a square attacked by a low-value piece
  if (move.piece !== 'p' && !move.captured) {
    // Check if destination is attacked by opponent pawns (simple heuristic)
    const file = move.to.charCodeAt(0) - 97;
    const rank = parseInt(move.to[1], 10);
    const opponent = game.turn() === 'w' ? 'b' : 'w';

    // Approximate pawn attack check
    const pawnAttacked =
      (opponent === 'w' && rank < 8) || (opponent === 'b' && rank > 1);

    if (pawnAttacked) {
      // Check neighboring pawn attacks (simplified)
      for (const df of [-1, 1]) {
        const pf = file + df;
        if (pf >= 0 && pf < 8) {
          const pr = opponent === 'w' ? rank + 1 : rank - 1;
          if (pr >= 1 && pr <= 8) {
            const pawnSquare = (String.fromCharCode(pf + 97) + pr) as Square;
            const pawn = game.get(pawnSquare);
            if (pawn && pawn.type === 'p' && pawn.color === opponent) {
              score -= (PIECE_VALUE[move.piece] ?? 0) * 0.5;
            }
          }
        }
      }
    }
  }

  // Small random factor for variety (up to 10)
  score += Math.random() * 10;

  return score;
}

function pickHard(game: Chess) {
  const moves = allMoves(game);

  // Find the maximum capturable value to prioritize high-value captures
  let maxCapturableValue = 0;
  for (const m of moves) {
    if (m.captured) {
      const v = PIECE_VALUE[m.captured] ?? 0;
      if (v > maxCapturableValue) maxCapturableValue = v;
    }
  }

  const scored = moves.map((m) => ({
    move: m,
    score: scoreHardMove(m, game, maxCapturableValue),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Check for a checkmate — take it immediately
  const mateMove = scored.find((s) => s.move.san.includes('#'));
  if (mateMove) return mateMove.move;

  // Pick from top 3 candidates with weighted random
  const topN = Math.min(3, scored.length);
  const candidates = scored.slice(0, topN);

  // Weight by score difference from best
  const bestScore = candidates[0].score;
  const weights = candidates.map((c) => Math.max(1, c.score - bestScore + 1000));

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].move;
  }

  return candidates[0].move;
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Returns a legal move selected by the computer at the given difficulty.
 * The game should be in a state where it's the computer's turn to move.
 */
export function getComputerMove(game: Chess, difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return pickEasy(game);
    case 'medium':
      return pickMedium(game);
    case 'hard':
      return pickHard(game);
  }
}
