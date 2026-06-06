import { Chess } from 'chess.js';
import { evaluateForTurn, PIECE_VALUES } from './evaluate';
import { orderMoves } from './moveOrdering';
import type { ChessMoveVerbose } from './moveOrdering';

/**
 * Quiescence search: at leaf nodes of the main search,
 * search all capture moves (and promotions) until a quiet position.
 *
 * This solves the "horizon effect" — tactics (captures, promotions)
 * that would change the evaluation just beyond the search depth.
 *
 * @param game - current position
 * @param alpha - alpha bound
 * @param beta - beta bound
 * @param maximizingColor - the color we're maximizing for
 * @param maxDepth - maximum quiescence depth to prevent infinite loops
 * @returns score from maximizingColor's perspective
 */
export function quiescenceSearch(
  game: Chess,
  alpha: number,
  beta: number,
  maximizingColor: 'w' | 'b',
  maxDepth: number = 6
): number {
  // Stand-pat evaluation: evaluate the current position
  const standPat = evaluateForTurn(game, maximizingColor);

  if (maxDepth <= 0) return standPat;

  // If stand-pat already exceeds beta, prune
  if (standPat >= beta) return beta;

  // Update alpha if stand-pat is better
  if (standPat > alpha) {
    alpha = standPat;
  }

  // Get only capture moves (and promotions)
  const allMoves = game.moves({ verbose: true }) as unknown as ChessMoveVerbose[];

  // Filter to captures and promotions
  const tacticalMoves = allMoves.filter(
    (m) => m.captured || m.promotion
  );

  // No tactical moves — position is quiet
  if (tacticalMoves.length === 0) return standPat;

  // Order tactical moves by MVV-LVA for better pruning
  const ordered = orderMoves(tacticalMoves);

  const isMaximizing = game.turn() === maximizingColor;

  for (const move of ordered) {
    // Delta pruning: skip captures that can't possibly improve the score
    if (move.captured) {
      const capturedValue = PIECE_VALUES[move.captured] ?? 0;
      // If the maximum possible gain from this capture (captured value + some margin)
      // can't raise alpha, skip it (only for non-checking moves, approximated)
      // Margin of 200 to account for potential positional gains
      if (isMaximizing && standPat + capturedValue + 200 < alpha) {
        continue; // delta prune
      }
      if (!isMaximizing && standPat - capturedValue - 200 > beta) {
        continue; // delta prune
      }
    }

    const g = new Chess(game.fen());
    g.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

    if (g.isGameOver()) {
      // Terminal evaluation
      if (g.isCheckmate()) {
        // The side that just moved won
        return game.turn() === maximizingColor
          ? -99999 + (10 - maxDepth) * 100
          : 99999 - (10 - maxDepth) * 100;
      }
      // Draw
      continue;
    }

    // Check for check — be more careful if giving check (don't delta prune)
    const givesCheck = g.isCheck();

    const score = givesCheck
      ? quiescenceSearch(g, alpha, beta, maximizingColor, maxDepth - 1)
      : qsearchMinimal(g, alpha, beta, maximizingColor, maxDepth - 1);

    if (isMaximizing) {
      if (score > alpha) {
        alpha = score;
      }
    } else {
      if (score < beta) {
        beta = score;
      }
    }

    if (alpha >= beta) break; // alpha-beta cutoff
  }

  return isMaximizing ? alpha : beta;
}

/**
 * Faster quiescence search for non-checking captures — doesn't filter by captures
 * but passes through to the main quiescence which does.
 */
function qsearchMinimal(
  game: Chess,
  alpha: number,
  beta: number,
  maximizingColor: 'w' | 'b',
  maxDepth: number
): number {
  return quiescenceSearch(game, alpha, beta, maximizingColor, maxDepth);
}
