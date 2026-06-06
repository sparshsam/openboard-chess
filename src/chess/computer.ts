import { Chess } from 'chess.js';
import type { Square as ChessSquare } from 'chess.js';
import type { Difficulty } from './difficulty';
import {
  DIFFICULTIES,
  EVAL_FEATURES,
  EXPERT_DEPTH,
  EXPERT_THINK_TIME_MS,
} from './difficulty';
import { evaluateForTurn } from './evaluate';
import { getTable, mirrorRows } from './pieceSquareTables';
import { quiescenceSearch } from './quiescence';
import { getOrderedMoves } from './moveOrdering';
import { TranspositionTable, NodeType } from './transpositionTable';
import { openingBook } from './openingBook';
import {
  recordDebug,
  clearDebug,
  isDebugEnabled,
} from './engineDebug';

/** A move result with source and destination squares */
export interface SquareMove {
  from: ChessSquare;
  to: ChessSquare;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/** Delay before computer moves (in ms) — gives natural feel */
export const COMPUTER_DELAY_MS = 500;

/** Node budget for Club difficulty (prevents infinite/long searches) */
const CLUB_MAX_NODES = 150000;

/** Node budget for Expert difficulty per depth iteration */
const EXPERT_NODES_PER_ITERATION = 200000;

// ── Node counter (shared across search) ─────────────────────────

let nodeCount = 0;

function resetNodeCount(): void {
  nodeCount = 0;
}

/**
 * Increment node counter and check budget.
 * Returns false if the search should stop (exceeded node budget).
 * No async yielding — search runs inside setTimeout so browser stays responsive.
 */
function checkNodeBudget(maxNodes: number): boolean {
  nodeCount++;
  return nodeCount <= maxNodes;
}

// ── Opening Book Integration ────────────────────────────────────

/**
 * Check if we can play an opening book move.
 * Returns the book move as a SquareMove, or null if out of book.
 */
function getBookMove(game: Chess, difficulty: Difficulty): SquareMove | null {
  const history = game.history({ verbose: true });
  const uciHistory = history.map(m => m.from + m.to);

  let bookPlyLimit: number;
  switch (difficulty) {
    case 'casual': bookPlyLimit = 4; break;  // First 2 moves
    case 'club': bookPlyLimit = 6; break;     // First 3 moves
    case 'expert': bookPlyLimit = 10; break;  // First 5 moves
    default: return null;
  }

  if (uciHistory.length >= bookPlyLimit) return null;

  const move = openingBook.getBookMove(uciHistory);
  if (!move) return null;

  // Parse UCI move
  const from = move.slice(0, 2) as ChessSquare;
  const to = move.slice(2, 4) as ChessSquare;
  const promotion = move.length === 5 ? move[4] as 'q' | 'r' | 'b' | 'n' : undefined;

  return { from, to, promotion };
}

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

  // Reset debug info for this move
  if (isDebugEnabled()) {
    clearDebug();
  }

  // Opening book for all difficulties except Beginner and Nightmare
  if (difficulty === 'casual' || difficulty === 'club' || difficulty === 'expert') {
    const bookMove = getBookMove(game, difficulty);
    if (bookMove) {
      if (isDebugEnabled()) {
        recordDebug({
          difficulty,
          fen: game.fen(),
          openingBookHit: true,
        });
      }
      return bookMove;
    }
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
      selected = clubMove(game);
      break;
    case 'expert':
      selected = expertMove(game);
      break;
    default:
      selected = beginnerMove(game, moves);
  }

  return selected;
}

// ── Beginner: random with slight weighting ──────────────────────────

const PIECE_VALUES_BEGINNER: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

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
      const capturedValue = PIECE_VALUES_BEGINNER[m.captured] ?? 0;
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

// ── Casual: 1-ply minimax with material + PST + positional features ──

function casualMove(game: Chess, moves: ChessMove[]): SquareMove {
  const ef = EVAL_FEATURES.casual;
  let bestMove: ChessMove | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const g = new Chess(game.fen());
    g.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });
    const score = evaluateForTurn(g, game.turn() as 'w' | 'b', ef);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) return pickRandom(moves);
  return moveToSquareMove(bestMove);
}

// ── Club: 3-ply + quiescence with alpha-beta, node budget ─────────

function clubMove(game: Chess): SquareMove {
  const config = DIFFICULTIES.club;
  const depth = config.depth;
  const maximizingColor = game.turn() as 'w' | 'b';
  const startTime = Date.now();

  resetNodeCount();

  // Use orderMoves for ordering
  const orderedMoves = getOrderedMoves(game);

  let bestMove: { from: string; to: string; promotion?: string } | null = null;
  let bestScore = -Infinity;

  for (const move of orderedMoves) {
    // Use move+undo pattern for efficiency
    game.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

    const score = minimaxWithQs(
      game,
      depth - 1,
      -Infinity,
      Infinity,
      maximizingColor,
      depth - 1,
      CLUB_MAX_NODES
    );

    game.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = { from: move.from, to: move.to, promotion: move.promotion };
    }
  }

  if (!bestMove) {
    const fallback = game.moves({ verbose: true });
    return pickRandom(fallback);
  }

  // Record debug info
  if (isDebugEnabled()) {
    recordDebug({
      difficulty: 'club',
      fen: game.fen(),
      depthReached: depth,
      maxDepth: depth,
      nodesSearched: nodeCount,
      nodeBudget: CLUB_MAX_NODES,
      bestScore,
      bestMove: bestMove.from + bestMove.to,
      searchTimeMs: Date.now() - startTime,
      openingBookHit: false,
      quiescenceUsed: true,
      transpositionTableUsed: false,
      evaluationFeatures: ['mobility', 'pawnStructure', 'development', 'space', 'kingSafety'],
    });
  }

  return {
    from: bestMove.from as ChessSquare,
    to: bestMove.to as ChessSquare,
    promotion: bestMove.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
  };
}

// ── Expert: iterative deepening + TT, node budget ─────────────────

const expertTT = new TranspositionTable();

function expertMove(game: Chess): SquareMove {
  const maximizingColor = game.turn() as 'w' | 'b';

  // Clear TT on each new root search
  expertTT.clear();
  resetNodeCount();

  const startTime = Date.now();
  const maxTime = EXPERT_THINK_TIME_MS;
  const maxDepth = EXPERT_DEPTH;

  let bestMove: { from: string; to: string; promotion?: string } | null = null;
  let finalScore = -Infinity;
  let reachedDepth = 0;

  // Iterative deepening: search depth 1, 2, 3, ... up to maxDepth or time
  for (let currentDepth = 1; currentDepth <= maxDepth; currentDepth++) {
    expertTT.newIteration();
    resetNodeCount();

    const result = searchRoot(
      game,
      currentDepth,
      maximizingColor,
      startTime,
      maxTime,
      EXPERT_NODES_PER_ITERATION
    );

    if (result.timedOut || result.nodeBudgetExceeded) {
      break;
    }

    bestMove = result.bestMove;
    finalScore = result.score;
    reachedDepth = currentDepth;

    // Check time after each depth
    if (Date.now() - startTime > maxTime * 0.8) {
      break;
    }
  }

  if (!bestMove) {
    const fallback = game.moves({ verbose: true });
    return pickRandom(fallback);
  }

  // Record debug info
  if (isDebugEnabled()) {
    recordDebug({
      difficulty: 'expert',
      fen: game.fen(),
      depthReached: reachedDepth,
      maxDepth,
      nodesSearched: nodeCount,
      nodeBudget: EXPERT_NODES_PER_ITERATION,
      bestScore: finalScore,
      bestMove: bestMove.from + bestMove.to,
      searchTimeMs: Date.now() - startTime,
      openingBookHit: false,
      quiescenceUsed: true,
      transpositionTableUsed: true,
      evaluationFeatures: ['mobility', 'pawnStructure', 'development', 'space', 'kingSafety'],
    });
  }

  return {
    from: bestMove.from as ChessSquare,
    to: bestMove.to as ChessSquare,
    promotion: bestMove.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
  };
}

interface RootSearchResult {
  bestMove: { from: string; to: string; promotion?: string } | null;
  score: number;
  timedOut: boolean;
  nodeBudgetExceeded: boolean;
}

function searchRoot(
  game: Chess,
  depth: number,
  maximizingColor: 'w' | 'b',
  startTime: number,
  maxTime: number,
  maxNodes: number
): RootSearchResult {
  const ttBest = expertTT.getBestMove(game.fen());
  const orderedMoves = getOrderedMoves(game, ttBest);

  let bestMove: { from: string; to: string; promotion?: string } | null = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of orderedMoves) {
    if (Date.now() - startTime > maxTime) {
      return { bestMove, score: bestScore, timedOut: true, nodeBudgetExceeded: false };
    }

    // Use move+undo pattern
    game.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

    const score = alphaBetaWithTT(
      game,
      depth - 1,
      alpha,
      beta,
      maximizingColor,
      depth - 1,
      expertTT,
      startTime,
      maxTime,
      maxNodes
    );

    game.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = { from: move.from, to: move.to, promotion: move.promotion };
    }

    alpha = Math.max(alpha, score);
  }

  // Store root move in TT
  if (bestMove) {
    expertTT.store(
      game.fen(),
      depth,
      bestScore,
      NodeType.Exact,
      bestMove
    );
  }

  return { bestMove, score: bestScore, timedOut: false, nodeBudgetExceeded: false };
}

// ── Core Search Functions ──────────────────────────────────────────

/**
 * Minimax with alpha-beta and quiescence search at leaf nodes.
 * Used by Club difficulty. Supports node budget.
 */
function minimaxWithQs(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingColor: 'w' | 'b',
  qsDepth: number,
  maxNodes: number
): number {
  // Node budget check
  if (!checkNodeBudget(maxNodes)) {
    // Budget exceeded — return static evaluation
    return evaluateForTurn(game, maximizingColor);
  }

  const isMaximizing = game.turn() === maximizingColor;

  // Terminal check
  if (game.isCheckmate()) {
    return isMaximizing ? -99999 + (10 - depth) * 100 : 99999 - (10 - depth) * 100;
  }
  if (game.isDraw()) return 0;

  // Quiescence at leaf nodes
  if (depth <= 0) {
    return quiescenceSearch(game, alpha, beta, maximizingColor);
  }

  const moves = getOrderedMoves(game);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      // Use move+undo pattern
      game.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

      const score = minimaxWithQs(game, depth - 1, alpha, beta, maximizingColor, qsDepth, maxNodes);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);

      game.undo();

      if (beta <= alpha) break;
    }
    return maxEval === -Infinity ? quiescenceSearch(game, alpha, beta, maximizingColor) : maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

      const score = minimaxWithQs(game, depth - 1, alpha, beta, maximizingColor, qsDepth, maxNodes);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);

      game.undo();

      if (beta <= alpha) break;
    }
    return minEval === Infinity ? quiescenceSearch(game, alpha, beta, maximizingColor) : minEval;
  }
}

/**
 * Alpha-beta search with transposition table support.
 * Used by Expert difficulty. Supports node budget and move+undo.
 */
function alphaBetaWithTT(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingColor: 'w' | 'b',
  maxDepth: number,
  tt: TranspositionTable,
  startTime: number,
  maxTime: number,
  maxNodes: number
): number {
  // Node budget check
  if (!checkNodeBudget(maxNodes)) {
    return evaluateForTurn(game, maximizingColor);
  }

  const isMaximizing = game.turn() === maximizingColor;

  // Check terminal
  if (game.isCheckmate()) {
    return isMaximizing ? -99999 + (10 - maxDepth + depth) * 100 : 99999 - (10 - maxDepth + depth) * 100;
  }
  if (game.isDraw()) return 0;

  // Quiescence at leaf
  if (depth <= 0) {
    return quiescenceSearch(game, alpha, beta, maximizingColor);
  }

  // Transposition table probe
  const ttEntry = tt.probe(game.fen(), depth);
  if (ttEntry) {
    const ttScore = ttEntry.score;
    switch (ttEntry.nodeType) {
      case NodeType.Exact:
        return ttScore;
      case NodeType.LowerBound:
        alpha = Math.max(alpha, ttScore);
        break;
      case NodeType.UpperBound:
        beta = Math.min(beta, ttScore);
        break;
    }
    if (alpha >= beta) return ttScore;
  }

  // Get moves with TT best move for ordering
  const ttBest = tt.getBestMove(game.fen());
  const moves = getOrderedMoves(game, ttBest);

  let bestScore = isMaximizing ? -Infinity : Infinity;
  let nodeType: NodeType = NodeType.UpperBound;
  let bestMove: { from: string; to: string; promotion?: string } | null = null;

  if (isMaximizing) {
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

      const score = alphaBetaWithTT(game, depth - 1, alpha, beta, maximizingColor, maxDepth, tt, startTime, maxTime, maxNodes);

      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to, promotion: move.promotion };
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        nodeType = NodeType.LowerBound;
        break;
      }
    }
  } else {
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });

      const score = alphaBetaWithTT(game, depth - 1, alpha, beta, maximizingColor, maxDepth, tt, startTime, maxTime, maxNodes);

      game.undo();

      if (score < bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to, promotion: move.promotion };
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) {
        nodeType = NodeType.LowerBound;
        break;
      }
    }
  }

  // If we didn't get a cutoff, it's an exact node
  if (nodeType === NodeType.UpperBound && bestScore !== (isMaximizing ? -Infinity : Infinity)) {
    nodeType = NodeType.Exact;
  }

  // Store in TT
  if (bestScore !== (isMaximizing ? -Infinity : Infinity)) {
    tt.store(game.fen(), depth, bestScore, nodeType, bestMove ?? undefined);
  }

  return bestScore;
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
