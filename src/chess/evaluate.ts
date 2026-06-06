import { Chess } from 'chess.js';
import { getTable, mirrorRows } from './pieceSquareTables';
import type { EvalFeatures } from './difficulty';

/** Standard piece values (centipawns) */
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

/** Promotion piece value mapping for valuation */
export const PROMO_VALUE: Record<string, number> = {
  q: 900,
  r: 500,
  b: 330,
  n: 320,
};

/**
 * Evaluate the board from white's perspective.
 * Supports configurable evaluation features per difficulty level.
 */
export function evaluate(game: Chess, features: EvalFeatures): number {
  const board = game.board();
  let score = 0;

  // 1. Material + PST (always on for all levels)
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

  // 2. King safety
  if (features.kingSafety) {
    const totalNonKingMaterial = countNonKingMaterial(board);
    if (totalNonKingMaterial > 1400) {
      // Middlegame — apply king safety
      score += kingSafetyScore(game, 'w');
      score -= kingSafetyScore(game, 'b');
    }
  }

  // 3. Mobility (Club+): count legal moves
  if (features.mobility) {
    const whiteMobility = countLegalMoves(game, 'w');
    const blackMobility = countLegalMoves(game, 'b');
    // Reward mobility difference; weight by ~5 centipawns per move
    score += (whiteMobility - blackMobility) * 5;
  }

  // 4. Pawn structure (Club+)
  if (features.pawnStructure) {
    score += pawnStructureScore(game, 'w');
    score -= pawnStructureScore(game, 'b');
  }

  // 5. Development bonus (Club+ in opening)
  if (features.development) {
    const totalMat = countNonKingMaterial(board);
    if (totalMat > 2000) {
      // Opening phase
      score += developmentScore(game, 'w');
      score -= developmentScore(game, 'b');
    }
  }

  // 6. Space advantage (Club+)
  if (features.space) {
    score += spaceScore(game, 'w');
    score -= spaceScore(game, 'b');
  }

  return score;
}

/**
 * Evaluate from the perspective of the side to move, used for minimax.
 */
export function evaluateForTurn(
  game: Chess,
  forColor: 'w' | 'b',
  features?: EvalFeatures
): number {
  const ef = features ?? { mobility: false, pawnStructure: false, development: false, space: false, kingSafety: false };
  const score = evaluate(game, ef);
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

// ── King Safety ────────────────────────────────

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
        const kr = r;
        const kf = f;

        // Pawn shield near king
        const pawnDir = color === 'w' ? -1 : 1;
        for (let df = -2; df <= 2; df++) {
          const pf = f + df;
          const pr1 = r + pawnDir;
          const pr2 = r + pawnDir * 2;
          if (pf >= 0 && pf < 8 && pr1 >= 0 && pr1 < 8) {
            const pawn1 = board[pr1]?.[pf];
            if (pawn1 && pawn1.type === 'p' && pawn1.color === color) {
              score += 12 - Math.abs(df) * 2; // Closer to king = more valuable
            }
          }
          if (pf >= 0 && pf < 8 && pr2 >= 0 && pr2 < 8) {
            const pawn2 = board[pr2]?.[pf];
            if (pawn2 && pawn2.type === 'p' && pawn2.color === color) {
              score += 8 - Math.abs(df);
            }
          }
        }

        // Castled king bonus
        // Castled king bonus
        // pawnDir is always ±1 (never 0), but the check is always true for any position
        // that has a king on the board — just check isCastled
        const isCastled = (color === 'w' && kf >= 6) || (color === 'b' && kf <= 1);
        if (isCastled) {
          score += 20;
        }

        // Open files near king penalty
        for (let df = -1; df <= 1; df++) {
          const checkF = kf + df;
          if (checkF >= 0 && checkF < 8) {
            for (let rr = 0; rr < 8; rr++) {
              const p2 = board[rr]?.[checkF];
              if (p2 && (p2.type === 'r' || p2.type === 'q') && p2.color !== color) {
                score -= 15;
                // Only penalize once per file
                break;
              }
              if (p2 && p2.type === 'k' && p2.color === color) {
                break;
              }
            }
          }
        }

        // King in center penalty
        const centerDist = Math.abs(kf - 3.5) + Math.abs(kr - (color === 'w' ? 7 : 0) - 3.5);
        if (countNonKingMaterial(board) > 2000) {
          // In middlegame, centralized king = dangerous
          score -= centerDist * 5;
        }
        break;
      }
    }
  }

  return score;
}

// ── Mobility ────────────────────────────────────

function countLegalMoves(game: Chess, color: 'w' | 'b'): number {
  // Count legal moves for the given color
  // We check if it's the right side's turn; if not, we switch
  if (game.turn() === color) {
    return game.moves().length;
  }

  // Otherwise, we need to generate moves for the other side
  // We can't easily switch turn in chess.js, so approximate by counting
  // piece-specific move counts from the board layout
  return approximateMobility(boardFromGame(game), color);
}

function boardFromGame(game: Chess): ReturnType<Chess['board']> {
  return game.board();
}

function approximateMobility(board: ReturnType<Chess['board']>, color: 'w' | 'b'): number {
  let count = 0;

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r]?.[f];
      if (!piece || piece.color !== color) continue;

      switch (piece.type) {
        case 'n':
          // Knight: up to 8 moves
          count += countKnightMoves(r, f, board);
          break;
        case 'b':
          // Bishop: up to 13 moves
          count += countSlidingMoves(r, f, board, [[1,1],[1,-1],[-1,1],[-1,-1]]);
          break;
        case 'r':
          // Rook: up to 14 moves
          count += countSlidingMoves(r, f, board, [[1,0],[-1,0],[0,1],[0,-1]]);
          break;
        case 'q':
          // Queen: bishop + rook
          count += countSlidingMoves(r, f, board, [[1,1],[1,-1],[-1,1],[-1,-1]]);
          count += countSlidingMoves(r, f, board, [[1,0],[-1,0],[0,1],[0,-1]]);
          break;
        case 'k':
          // King adjacent squares
          for (let dr = -1; dr <= 1; dr++) {
            for (let df = -1; df <= 1; df++) {
              if (dr === 0 && df === 0) continue;
              const nr = r + dr;
              const nf = f + df;
              if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
                const target = board[nr]?.[nf];
                if (!target || target.color !== color) count++;
              }
            }
          }
          break;
        // Pawns approximated separately
        case 'p':
          if (color === 'w') {
            if (r > 0) {
              if (!board[r-1]?.[f]) count++; // forward
              if (r === 6 && !board[r-2]?.[f] && !board[r-1]?.[f]) count++; // double
              if (f > 0) {
                const cap = board[r-1]?.[f-1];
                if (cap && cap.color !== color) count++;
              }
              if (f < 7) {
                const cap = board[r-1]?.[f+1];
                if (cap && cap.color !== color) count++;
              }
            }
          } else {
            if (r < 7) {
              if (!board[r+1]?.[f]) count++;
              if (r === 1 && !board[r+2]?.[f] && !board[r+1]?.[f]) count++;
              if (f > 0) {
                const cap = board[r+1]?.[f-1];
                if (cap && cap.color !== color) count++;
              }
              if (f < 7) {
                const cap = board[r+1]?.[f+1];
                if (cap && cap.color !== color) count++;
              }
            }
          }
          break;
      }
    }
  }

  return count;
}

function countKnightMoves(r: number, f: number, board: ReturnType<Chess['board']>): number {
  const moves = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  let count = 0;
  for (const [dr, df] of moves) {
    const nr = r + dr;
    const nf = f + df;
    if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
      const target = board[nr]?.[nf];
      if (!target || target.color !== board[r]?.[f]?.color) count++;
    }
  }
  return count;
}

function countSlidingMoves(
  r: number,
  f: number,
  board: ReturnType<Chess['board']>,
  directions: number[][]
): number {
  const color = board[r]?.[f]?.color;
  let count = 0;
  for (const [dr, df] of directions) {
    let nr = r + dr;
    let nf = f + df;
    while (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
      const target = board[nr]?.[nf];
      if (!target) {
        count++;
      } else {
        if (target.color !== color) count++;
        break;
      }
      nr += dr;
      nf += df;
    }
  }
  return count;
}

// ── Pawn Structure ──────────────────────────────

function pawnStructureScore(game: Chess, color: 'w' | 'b'): number {
  const board = game.board();
  let score = 0;
  const pawnFiles: number[] = [];
  const pawnRanks: number[] = [];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r]?.[f];
      if (p && p.type === 'p' && p.color === color) {
        pawnFiles.push(f);
        pawnRanks.push(color === 'w' ? r : 7 - r); // invert rank for black
      }
    }
  }

  // Doubled pawn penalty
  const fileCounts = new Map<number, number>();
  for (const f of pawnFiles) {
    fileCounts.set(f, (fileCounts.get(f) ?? 0) + 1);
  }
  for (const count of fileCounts.values()) {
    if (count > 1) {
      score -= 15 * (count - 1);
    }
  }

  // Isolated pawn penalty (no friendly pawn on adjacent files)
  for (const f of pawnFiles) {
    const hasAdjacent = fileCounts.has(f - 1) || fileCounts.has(f + 1);
    if (!hasAdjacent) {
      score -= 20;
    }
  }

  // Passed pawn bonus
  for (let i = 0; i < pawnFiles.length; i++) {
    const f = pawnFiles[i];
    const rank = pawnRanks[i];

    // Check if no enemy pawn on the same or adjacent files ahead
    const hasEnemyPawn = hasEnemyPawnOnFiles(board, color, f, rank);

    if (!hasEnemyPawn) {
      // Bonus increases as pawn advances
      if (rank >= 3) {
        // From the 4th rank (rank 3 in 0-indexed)
        score += 10 + (rank - 3) * 20;
      }
    }
  }

  return score;
}

function hasEnemyPawnOnFiles(
  board: ReturnType<Chess['board']>,
  color: 'w' | 'b',
  file: number,
  rank: number
): boolean {
  const enemyColor = color === 'w' ? 'b' : 'w';
  const startRank = color === 'w' ? 0 : rank + 1;
  const endRank = color === 'w' ? rank : 7;

  for (let f = file - 1; f <= file + 1; f++) {
    if (f < 0 || f >= 8) continue;
    for (let r = startRank; r <= endRank; r++) {
      const p = board[r]?.[f];
      if (p && p.type === 'p' && p.color === enemyColor) {
        return true;
      }
    }
  }
  return false;
}

// ── Development ────────────────────────────────

function developmentScore(game: Chess, color: 'w' | 'b'): number {
  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r]?.[f];
      if (!p || p.color !== color) continue;

      if (p.type === 'n' || p.type === 'b') {
        // Knights and bishops are developed if on certain good squares
        // Centralized minor pieces get bonus
        const isCentralized = f >= 2 && f <= 5 && r >= (color === 'w' ? 2 : 4) && r <= (color === 'w' ? 5 : 2);
        if (isCentralized) {
          score += 15;
        }

        // Penalty for undeveloped pieces (still on back rank)
        const backRank = color === 'w' ? 7 : 0;
        if (r === backRank) {
          score -= 15;
        }
      }
    }
  }

  // Bonus for developed queen (moved from starting square)
  // Count how many pieces have moved off back rank
  const backRank = color === 'w' ? 7 : 0;
  let piecesOnBackRank = 0;
  let totalPieces = 0;
  for (let f = 0; f < 8; f++) {
    const p = board[backRank]?.[f];
    if (p && p.color === color && (p.type === 'n' || p.type === 'b' || p.type === 'r' || p.type === 'q')) {
      totalPieces++;
      piecesOnBackRank++;
    }
  }

  // Reward having developed pieces (not on back rank)
  const developed = totalPieces - piecesOnBackRank;
  score += developed * 10;

  return score;
}

// ── Space Advantage ─────────────────────────────

function spaceScore(game: Chess, color: 'w' | 'b'): number {
  const board = game.board();
  let score = 0;

  // Count controlled center 4 squares (d4, d5, e4, e5)
  const centerSquares: [number, number][] = [
    [3, 4], [4, 4], [3, 3], [4, 3],
    [2, 4], [5, 4], [2, 3], [5, 3], // extended center
  ];

  for (const [r, f] of centerSquares) {
    const p = board[r]?.[f];
    if (p) {
      if (p.color === color) {
        // Own piece occupies center
        score += 10;
      } else {
        // Enemy piece occupies center
        score -= 10;
      }
    } else {
      // Empty center square — bonus if we can attack it
      // Check if any of our pieces control adjacent squares
    }
  }

  return score;
}

// ── Helpers ────────────────────────────────────

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
