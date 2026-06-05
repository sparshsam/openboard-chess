import type { Chess, Square } from 'chess.js';
import type { Difficulty } from './types';

// ─── Piece values ───────────────────────────────────────────────────

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// ─── Helpers ────────────────────────────────────────────────────────

function allMoves(game: Chess) {
  return game.moves({ verbose: true });
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** True if `square` is attacked by an opponent pawn. */
function isPawnAttacked(game: Chess, square: Square, byColor: 'w' | 'b'): boolean {
  const file = square.charCodeAt(0) - 97; // 0–7
  const rank = parseInt(square[1], 10);   // 1–8

  const pawnRankOffset = byColor === 'w' ? 1 : -1;
  const checkRank = rank + pawnRankOffset;
  if (checkRank < 1 || checkRank > 8) return false;

  for (const df of [-1, 1]) {
    const pf = file + df;
    if (pf >= 0 && pf < 8) {
      const ps = (String.fromCharCode(pf + 97) + checkRank) as Square;
      const p = game.get(ps);
      if (p && p.type === 'p' && p.color === byColor) return true;
    }
  }
  return false;
}

// ─── Piece-square tables (from white's perspective) ─────────────────

const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

const PIECE_TABLES: Record<string, number[]> = {
  p: PAWN_TABLE, n: KNIGHT_TABLE, b: BISHOP_TABLE,
  r: ROOK_TABLE, q: QUEEN_TABLE, k: KING_TABLE,
};

function pstIndex(square: Square, color: 'w' | 'b'): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  if (color === 'w') return (7 - rank) * 8 + file;
  return rank * 8 + (7 - file);
}

// ─── Beginner (~800) ───────────────────────────────────────────────

function pickBeginner(game: Chess) {
  const moves = allMoves(game);
  const turn = game.turn();

  const scored = moves.map((m) => {
    let score = Math.random() * 200; // Significant randomness so beginner is beatable

    // Capture bonus — obvious recaptures
    if (m.captured) {
      score += PIECE_VALUE[m.captured] ?? 0;
    }

    // Promotion bonus
    if (m.promotion) {
      score += PIECE_VALUE[m.promotion] ?? 0;
    }

    // Check bonus (small - beginner notices checks but doesn't always play them)
    if (m.san.includes('+') || m.san.includes('#')) {
      score += 60;
    }

    // Development bonus: move knights and bishops toward center
    if (m.piece === 'n' || m.piece === 'b') {
      const toIdx = pstIndex(m.to as Square, turn);
      const knightCenter = [18, 19, 20, 21, 26, 27, 28, 29]; // d4-e4-d5-e5 area
      if (m.piece === 'n' && knightCenter.includes(toIdx)) score += 25;
      if (m.piece === 'b') {
        const bishopGood = [18, 19, 20, 21, 26, 27, 28, 29, 34, 35, 36, 37];
        if (bishopGood.includes(toIdx)) score += 15;
      }
    }

    // One-move blunder avoidance: don't move a defended piece to a square
    // attacked by an opponent pawn unless we're capturing something valuable
    if (!m.captured) {
      const opponent = turn === 'w' ? 'b' : 'w';
      if (isPawnAttacked(game, m.to as Square, opponent)) {
        const pieceVal = PIECE_VALUE[m.piece] ?? 0;
        score -= pieceVal * 0.6;
      }
    }

    // Penalize moving the same piece twice in opening (simplified)
    // Already penalized by the pawn-attack check above for development

    return { move: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topN = Math.min(Math.max(2, Math.floor(scored.length / 3)), 5);
  const candidates = scored.slice(0, topN);
  return randomPick(candidates).move;
}

// ─── Casual (~1000) ────────────────────────────────────────────────

function pickCasual(game: Chess) {
  const moves = allMoves(game);
  const turn = game.turn();

  const scored = moves.map((m) => {
    let score = Math.random() * 80; // Less randomness than beginner

    // MVV-LVA capture scoring
    if (m.captured) {
      const victimValue = PIECE_VALUE[m.captured] ?? 0;
      const attackerValue = PIECE_VALUE[m.piece] ?? 100;
      score += victimValue * 10 - attackerValue;
    }

    // Promotion
    if (m.promotion) {
      score += PIECE_VALUE[m.promotion] ?? 0;
      score += 600;
    }

    // Checks and checkmate
    if (m.san.includes('#')) score += 100000;
    else if (m.san.includes('+')) score += 120;

    // Development: move pieces toward center
    if (m.piece === 'n' || m.piece === 'b') {
      const toIdx = pstIndex(m.to as Square, turn);
      const goodSquares = [18, 19, 20, 21, 26, 27, 28, 29, 34, 35, 36, 37];
      if (m.piece === 'n' && [18, 19, 20, 21, 26, 27, 28, 29].includes(toIdx)) score += 30;
      if (m.piece === 'b' && goodSquares.includes(toIdx)) score += 20;
    }

    // Avoid bishops and knights on edge
    if ((m.piece === 'n' || m.piece === 'b') && !m.captured) {
      const file = m.to.charCodeAt(0) - 97;
      if (file === 0 || file === 7) score -= 25;
    }

    // Blunder avoidance
    if (!m.captured) {
      const opponent = turn === 'w' ? 'b' : 'w';
      if (isPawnAttacked(game, m.to as Square, opponent)) {
        const pieceVal = PIECE_VALUE[m.piece] ?? 0;
        score -= pieceVal * 0.7;
      }
    }

    // Central pawn push bonus
    if (m.piece === 'p') {
      const file = m.to.charCodeAt(0) - 97;
      if (file >= 3 && file <= 4) score += 15; // d or e file
    }

    // King safety: prefer castling
    if (m.piece === 'k' && (m.san === 'O-O' || m.san === 'O-O-O')) {
      score += 80;
    }

    return { move: m, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Checkmate or high-value capture — take it
  const best = scored[0];
  if (best.move.san.includes('#') || (best.move.captured && (PIECE_VALUE[best.move.captured] ?? 0) >= 500)) {
    return best.move;
  }

  // Pick from top 3 with weighted randomness
  const topN = Math.min(3, scored.length);
  const candidates = scored.slice(0, topN);
  const minScore = candidates[candidates.length - 1].score;
  const weights = candidates.map((c) => Math.max(1, c.score - minScore + 50));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].move;
  }

  return candidates[0].move;
}

// ─── Club (~1400) ───────────────────────────────────────────────────

function scoreClubMove(
  move: ReturnType<typeof allMoves>[number],
  game: Chess,
  targetValue: number,
): number {
  const turn = game.turn();
  let score = 0;

  // Capture scoring (MVV-LVA with strong weight)
  if (move.captured) {
    const victimValue = PIECE_VALUE[move.captured] ?? 0;
    const attackerValue = PIECE_VALUE[move.piece] ?? 100;
    score += victimValue * 10 - attackerValue + victimValue;

    // Bonus for capturing the highest-value piece available
    if (victimValue >= targetValue * 0.8) score += 300;
  }

  // Promotion
  if (move.promotion) {
    score += PIECE_VALUE[move.promotion] ?? 0;
    score += 800;
  }

  // Check / checkmate
  if (move.san.includes('#')) score += 200000;
  else if (move.san.includes('+')) score += 120;

  // Positional piece-square evaluation
  const table = PIECE_TABLES[move.piece];
  if (table) {
    const toIdx = pstIndex(move.to as Square, turn);
    const fromIdx = pstIndex(move.from as Square, turn);
    score += table[toIdx] - table[fromIdx] * 0.3;
  }

  // King safety in middlegame/endgame
  if (move.piece === 'k') {
    if (move.san === 'O-O' || move.san === 'O-O-O') score += 100;
    // Otherwise penalize early king walks
    const totalPieces = game.board().flat().filter(Boolean).length;
    if (totalPieces > 20) score -= 40; // Early game — keep king safe
  }

  // Development bonus for knights and bishops (early game)
  const totalPieces = game.board().flat().filter(Boolean).length;
  if (totalPieces > 24 && (move.piece === 'n' || move.piece === 'b')) {
    const isDeveloped = (p: string) => {
      if (turn === 'w') return !['b1', 'g1', 'c1', 'f1'].includes(p);
      return !['b8', 'g8', 'c8', 'f8'].includes(p);
    };
    if (!isDeveloped(move.from)) score += 30;
  }

  // Blunder avoidance — strong
  if (!move.captured) {
    const opponent = turn === 'w' ? 'b' : 'w';
    if (isPawnAttacked(game, move.to as Square, opponent)) {
      const pieceVal = PIECE_VALUE[move.piece] ?? 0;
      score -= pieceVal * 0.8;
    }
  }

  // Center control bonus
  if (move.piece === 'p') {
    const file = move.to.charCodeAt(0) - 97;
    if (file >= 3 && file <= 4) score += 20; // d or e pawn
  }

  // Rook on open file (simplified: prefer moving rook to semi-open files)
  if (move.piece === 'r') {
    const file = move.to.charCodeAt(0) - 97;
    // Check if the file has no pawns of our color (simplified open file detection)
    const board = game.board();
    let ourPawnsOnFile = 0;
    for (let r = 0; r < 8; r++) {
      const p = board[r][file];
      if (p && p.type === 'p' && p.color === turn) ourPawnsOnFile++;
    }
    if (ourPawnsOnFile === 0) score += 40;
  }

  // Small random factor for variety
  score += Math.random() * 15;

  return score;
}

function pickClub(game: Chess) {
  const moves = allMoves(game);

  // Find max capturable value
  let targetValue = 0;
  for (const m of moves) {
    if (m.captured) {
      const v = PIECE_VALUE[m.captured] ?? 0;
      if (v > targetValue) targetValue = v;
    }
  }

  const scored = moves.map((m) => ({
    move: m,
    score: scoreClubMove(m, game, targetValue),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Checkmate — take it immediately
  if (scored[0].move.san.includes('#')) return scored[0].move;

  // If a very high-value capture exists (queen or rook), take it
  if (scored[0].move.captured && (PIECE_VALUE[scored[0].move.captured] ?? 0) >= 500) {
    return scored[0].move;
  }

  // Weighted pick from top 3
  const topN = Math.min(3, scored.length);
  const candidates = scored.slice(0, topN);
  const minScore = candidates[candidates.length - 1].score;
  const weights = candidates.map((c) => Math.max(1, c.score - minScore + 100));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].move;
  }

  return candidates[0].move;
}

// ─── Public API ────────────────────────────────────────────────────

export function getComputerMove(game: Chess, difficulty: Difficulty) {
  switch (difficulty) {
    case 'beginner':
      return pickBeginner(game);
    case 'casual':
      return pickCasual(game);
    case 'club':
      return pickClub(game);
  }
}
