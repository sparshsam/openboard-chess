import { Chess } from 'chess.js';
import { PIECE_VALUES } from './evaluate';

/** A verbose move as returned by chess.js */
export interface ChessMoveVerbose {
  from: string;
  to: string;
  promotion?: string;
  captured?: string;
  piece: string;
  color: string;
  san: string;
}

/**
 * MVV-LVA (Most Valuable Victim - Least Valuable Attacker) scoring.
 * Higher score = better move to search first.
 *
 * Base score = captured_piece_value * 10 - attacker_piece_value
 * Promotions get an additional bonus based on promotion piece value.
 */
export function mvvLvaScore(move: ChessMoveVerbose): number {
  let score = 0;

  if (move.captured) {
    const capturedValue = PIECE_VALUES[move.captured] ?? 0;
    const attackerValue = PIECE_VALUES[move.piece] ?? 0;
    score = capturedValue * 10 - attackerValue;
  }

  // Promotion bonus
  if (move.promotion) {
    const promoValue = PIECE_VALUES[move.promotion] ?? 0;
    score += promoValue;
  }

  return score;
}

/**
 * Sort moves by MVV-LVA score (descending) for better alpha-beta pruning.
 * The best captures are searched first.
 */
export function orderMoves(
  moves: ChessMoveVerbose[],
  bestMove?: ChessMoveVerbose | null
): ChessMoveVerbose[] {
  return [...moves].sort((a, b) => {
    // If we have a best move from the transposition table, search it first
    if (bestMove) {
      if (a.from === bestMove.from && a.to === bestMove.to && a.promotion === bestMove.promotion)
        return -1;
      if (b.from === bestMove.from && b.to === bestMove.to && b.promotion === bestMove.promotion)
        return 1;
    }

    // Check if move gives check (simple heuristic: see if the target piece is king)
    // Full check detection is expensive, so we approximate with king capture detection
    const aKingCapture = a.captured === 'k' ? 10000 : 0;
    const bKingCapture = b.captured === 'k' ? 10000 : 0;

    const aScore = mvvLvaScore(a) + aKingCapture;
    const bScore = mvvLvaScore(b) + bKingCapture;

    return bScore - aScore;
  });
}

/**
 * Get ordered verbose moves from a chess.js game.
 * For Expert, optionally pass a best move from the transposition table.
 */
export function getOrderedMoves(
  game: Chess,
  bestMove?: { from: string; to: string; promotion?: string } | null
): ChessMoveVerbose[] {
  const rawMoves = game.moves({ verbose: true }) as unknown as ChessMoveVerbose[];

  let ttBest: ChessMoveVerbose | null = null;
  if (bestMove) {
    ttBest = rawMoves.find(
      (m) =>
        m.from === bestMove.from &&
        m.to === bestMove.to &&
        (m.promotion ?? null) === (bestMove.promotion ?? null)
    ) ?? null;
  }

  return orderMoves(rawMoves, ttBest);
}
