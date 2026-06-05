import { Chess } from 'chess.js';
import { getTable, mirrorRows } from './pieceSquareTables';

/** Standard piece values (centipawns) */
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

/**
 * Evaluate the board from the perspective of the current player to move.
 * Positive = good for current player, negative = bad.
 */
export function evaluate(game: Chess): number {
  const board = game.board();
  let score = 0;

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank]?.[file];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] ?? 0;
      const pst = getTable(piece.type);
      const isWhite = piece.color === 'w';
      const pstScore = isWhite
        ? pst[rank][file]
        : mirrorRows(pst)[rank][file];

      if (piece.color === 'w') {
        score += value + pstScore;
      } else {
        score -= value + pstScore;
      }
    }
  }

  // King safety: bonus for pawn shield near king in the opening/middlegame
  // Count material on the board to detect endgame
  const totalNonKingMaterial = countNonKingMaterial(board);
  if (totalNonKingMaterial > 1400) {
    // Middlegame — apply king safety
    score += kingSafetyScore(game, 'w');
    score -= kingSafetyScore(game, 'b');
  }

  // Mobility bonus (Club level): count legal moves
  // We skip mobility for performance at lower levels

  return score;
}

/**
 * Evaluate from the perspective of the side to move, used for minimax.
 */
export function evaluateForTurn(game: Chess, forColor: 'w' | 'b'): number {
  const score = evaluate(game);
  return forColor === 'w' ? score : -score;
}

/**
 * Quick material-only evaluation (for beginner).
 */
export function materialCount(game: Chess): { w: number; b: number } {
  const board = game.board();
  let w = 0;
  let b = 0;

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank]?.[file];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type] ?? 0;
      if (piece.color === 'w') w += val;
      else b += val;
    }
  }

  return { w, b };
}

/**
 * Simple king safety heuristic: evaluates pawn shield near the king.
 * Returns a positive score (higher = safer) for the given color.
 */
function kingSafetyScore(game: Chess, color: 'w' | 'b'): number {
  const board = game.board();
  let score = 0;

  // Find the king's position
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r]?.[f];
      if (p && p.type === 'k' && p.color === color) {
        // Reward pawns near the king
        const pawnDir = color === 'w' ? -1 : 1;
        for (let df = -1; df <= 1; df++) {
          const pf = f + df;
          const pr1 = r + pawnDir;
          if (pf >= 0 && pf < 8 && pr1 >= 0 && pr1 < 8) {
            const pawn = board[pr1]?.[pf];
            if (pawn && pawn.type === 'p' && pawn.color === color) {
              score += 15;
            }
          }
        }
        // Penalize open files near king
        const kf = f;
        for (let df = -1; df <= 1; df++) {
          const checkF = kf + df;
          if (checkF >= 0 && checkF < 8) {
            // Check if file has enemy rook/queen
            for (let rr = 0; rr < 8; rr++) {
              const p2 = board[rr]?.[checkF];
              if (p2 && (p2.type === 'r' || p2.type === 'q') && p2.color !== color) {
                score -= 10;
                break;
              }
            }
          }
        }
        break;
      }
    }
  }

  return score;
}

function countNonKingMaterial(board: ReturnType<Chess['board']>): number {
  let total = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r]?.[f];
      if (p && p.type !== 'k') {
        total += PIECE_VALUES[p.type] ?? 0;
      }
    }
  }
  return total;
}
