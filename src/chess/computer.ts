import { Chess } from 'chess.js';
import type { Square as ChessSquare } from 'chess.js';
import type { Difficulty } from './difficulty';
import { evaluateForTurn, PIECE_VALUES } from './evaluate';
import { getTable, mirrorRows } from './pieceSquareTables';

/** A move result with source and destination squares */
export interface SquareMove {
  from: ChessSquare;
  to: ChessSquare;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/** Delay before computer moves (in ms) — gives natural feel */
export const COMPUTER_DELAY_MS = 500;

/**
 * Get a computer move for the given difficulty.
 * Returns a promise with delay for natural feel.
 */
export async function getComputerMove(
  game: Chess,
  difficulty: Difficulty
): Promise<SquareMove> {
  // Add a small delay to feel natural
  await delay(300 + Math.random() * 500);

  const moves = game.moves({ verbose: true });
  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }

  let selected: SquareMove;

  switch (difficulty) {
    case 'beginner':
      selected = beginnerMove(game, moves);
      break;
    case 'casual':
      selected = casualMove(game, moves);
      break;
    case 'club':
      selected = clubMove(game, moves);
      break;
    default:
      selected = beginnerMove(game, moves);
  }

  return selected;
}

// ── Beginner: random with slight weighting ──────────────────────────

function beginnerMove(game: Chess, moves: ChessMove[]): SquareMove {
  // 20% chance of a random blunder (just pick any move with no weighting)
  if (Math.random() < 0.2) {
    return pickRandom(moves);
  }

  // Weighted scoring: prefer captures of high-value pieces, center control, piece-square tables
  const scored = moves.map((m) => {
    let score = 0;

    // Bonus for capturing high-value pieces
    if (m.captured) {
      const capturedValue = PIECE_VALUES[m.captured] ?? 0;
      score += capturedValue * 0.5;
    }

    // Slight center preference
    const centerFiles = ['d', 'e'];
    const centerRanks = ['4', '5'];
    if (centerFiles.includes(m.to[0]) && centerRanks.includes(m.to[1])) {
      score += 15;
    }

    // PST bonus
    const piece = game.get(m.from);
    if (piece) {
      const pst = getTable(piece.type);
      const rank = 8 - parseInt(m.to[1]);
      const file = m.to.charCodeAt(0) - 97;
      if (piece.color === 'w') {
        score += pst[rank]?.[file] ?? 0;
      } else {
        const mirrored = mirrorRows(pst);
        score += mirrored[rank]?.[file] ?? 0;
      }
    }

    // Promotion bonus
    if (m.promotion === 'q') score += 800;

    return { move: m, score: Math.max(0, score + 50) };
  });

  // Weighted random selection
  return weightedRandom(scored);
}

// ── Casual: 1-ply minimax with material + PST ──────────────────────

function casualMove(game: Chess, moves: ChessMove[]): SquareMove {
  let bestMove: ChessMove | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const g = new Chess(game.fen());
    g.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });
    const score = evaluateForTurn(g, game.turn() as 'w' | 'b');

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) return pickRandom(moves);
  return moveToSquareMove(bestMove);
}

// ── Club: 2-ply minimax with alpha-beta ────────────────────────────

function clubMove(game: Chess, moves: ChessMove[]): SquareMove {
  let bestMove: ChessMove | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const g = new Chess(game.fen());
    g.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

    const score = minimax(g, 2, -Infinity, Infinity, game.turn() as 'w' | 'b');

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) return pickRandom(moves);
  return moveToSquareMove(bestMove);
}

/**
 * Minimax with alpha-beta pruning.
 * @param game - current position
 * @param depth - remaining depth
 * @param alpha - alpha value for pruning
 * @param beta - beta value for pruning
 * @param maximizingColor - the color we're maximizing for
 */
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingColor: 'w' | 'b'
): number {
  if (depth === 0 || game.isGameOver()) {
    // Terminal evaluation
    if (game.isCheckmate()) {
      return game.turn() === maximizingColor ? -99999 + (3 - depth) * 100 : 99999 - (3 - depth) * 100;
    }
    if (game.isDraw()) return 0;
    return evaluateForTurn(game, maximizingColor);
  }

  const moves = game.moves({ verbose: true });

  // Move ordering: captures first, checks, then rest
  moves.sort((a, b) => {
    const aVal = a.captured ? (PIECE_VALUES[a.captured] ?? 0) : 0;
    const bVal = b.captured ? (PIECE_VALUES[b.captured] ?? 0) : 0;
    return bVal - aVal;
  });

  if (game.turn() === maximizingColor) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const g = new Chess(game.fen());
      g.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });
      const score = minimax(g, depth - 1, alpha, beta, maximizingColor);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const g = new Chess(game.fen());
      g.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });
      const score = minimax(g, depth - 1, alpha, beta, maximizingColor);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // prune
    }
    return minEval;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

interface ChessMove {
  from: ChessSquare;
  to: ChessSquare;
  promotion?: string;
  captured?: string;
  color: string;
  piece: string;
  flags: string;
  san: string;
  lan: string;
  before: string;
  after: string;
}

function pickRandom(moves: ChessMove[]): SquareMove {
  const m = moves[Math.floor(Math.random() * moves.length)];
  return moveToSquareMove(m);
}

function weightedRandom(scored: { move: ChessMove; score: number }[]): SquareMove {
  const total = scored.reduce((s, x) => s + x.score, 0);
  let r = Math.random() * total;
  for (const item of scored) {
    r -= item.score;
    if (r <= 0) return moveToSquareMove(item.move);
  }
  return moveToSquareMove(scored[scored.length - 1].move);
}

function moveToSquareMove(m: ChessMove): SquareMove {
  return {
    from: m.from,
    to: m.to,
    promotion: m.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
