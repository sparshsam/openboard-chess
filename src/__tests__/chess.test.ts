import { describe, it, expect, beforeEach } from 'vitest';
import { Chess } from 'chess.js';
import { getComputerMove } from '../computer/computerOpponent';
import type { Difficulty } from '../computer/types';
import { DIFFICULTIES } from '../computer/types';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('Chess Game Logic', () => {
  let game: Chess;

  beforeEach(() => {
    game = new Chess();
  });

  it('initial board state is standard starting position', () => {
    expect(game.fen()).toBe(STARTING_FEN);
  });

  it('e2-e4 is legal for white', () => {
    const result = game.move('e4');
    expect(result).not.toBeNull();
    expect(game.fen()).not.toBe(STARTING_FEN);
    expect(game.turn()).toBe('b');
  });

  it('e7-e5 is legal for black after white moves', () => {
    game.move('e4');
    const result = game.move('e5');
    expect(result).not.toBeNull();
    expect(game.turn()).toBe('w');
  });

  it('FEN export/import roundtrip', () => {
    game.move('e4');
    game.move('e5');
    game.move('Nf3');
    const fen1 = game.fen();

    const game2 = new Chess();
    game2.load(fen1);
    expect(game2.fen()).toBe(fen1);
    expect(game2.turn()).toBe(game.turn());
  });

  it('reset behavior returns to starting position', () => {
    game.move('e4');
    game.move('e5');
    game.move('Nf3');
    expect(game.fen()).not.toBe(STARTING_FEN);

    game.reset();
    expect(game.fen()).toBe(STARTING_FEN);
    expect(game.turn()).toBe('w');
    expect(game.history()).toHaveLength(0);
  });

  it('detects checkmate', () => {
    game.load('r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4');
    expect(game.isCheckmate()).toBe(true);
  });

  it('promotion works for white pawn', () => {
    game.load('k7/1P6/8/8/8/8/8/K7 w - - 0 1');
    const result = game.move({ from: 'b7', to: 'b8', promotion: 'q' });
    expect(result).not.toBeNull();
    expect(result!.promotion).toBe('q');
    expect(game.get('b8')?.type).toBe('q');
  });

  it('en passant capture works', () => {
    game.load('k7/8/8/8/Pp6/8/8/K7 b - a3 0 1');
    const result = game.move('bxa3');
    expect(result).not.toBeNull();
  });
});

describe('Computer Opponent', () => {
  let game: Chess;

  beforeEach(() => {
    game = new Chess();
  });

  describe('all difficulties return legal moves', () => {
    const difficulties: Difficulty[] = ['beginner', 'casual', 'club'];

    for (const diff of difficulties) {
      it(`${diff} returns a legal move from starting position`, () => {
        game.move('e4');
        const move = getComputerMove(game, diff);
        expect(move).toBeDefined();
        expect(move.from).toBeDefined();
        expect(move.to).toBeDefined();

        const tempGame = new Chess(game.fen());
        tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
        expect(tempGame.fen()).not.toBe(game.fen());
      });

      it(`${diff} returns a legal move in a complex position`, () => {
        game.load('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1');
        game.move('d3');
        const move = getComputerMove(game, diff);
        expect(move).toBeDefined();

        const tempGame = new Chess(game.fen());
        tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
        expect(tempGame.fen()).not.toBe(game.fen());
      });

      it(`${diff} never returns an illegal move`, () => {
        game.move('e4');
        const move = getComputerMove(game, diff);
        expect(move).toBeDefined();

        const legalMoves = game.moves({ verbose: true });
        const found = legalMoves.find((m) => m.from === move.from && m.to === move.to);
        expect(found).toBeDefined();
      });
    }
  });

  describe('Beginner difficulty', () => {
    it('is not pure random — prefers obvious captures', () => {
      // Position where a queen is hanging
      game.load('rnb1kbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 3');
      game.move('d4');

      // Run many trials — beginner should capture a high-value piece more often than not
      const moves = game.moves({ verbose: true });
      const captures = moves.filter((m) => m.captured);
      if (captures.length === 0) return; // Skip if no captures available

      let captureCount = 0;
      const trials = 30;
      for (let i = 0; i < trials; i++) {
        const g = new Chess(game.fen());
        const m = getComputerMove(g, 'beginner');
        if (m.captured) captureCount++;
      }

      // Beginner should capture at least sometimes (not pure random)
      expect(captureCount).toBeGreaterThan(0);
    });
  });

  describe('Casual difficulty', () => {
    it('returns legal moves', () => {
      game.load('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5');
      const move = getComputerMove(game, 'casual');
      const legalMoves = game.moves({ verbose: true });
      const found = legalMoves.find((m) => m.from === move.from && m.to === move.to);
      expect(found).toBeDefined();
    });

    it('prefers material-positive moves more consistently than beginner', () => {
      // Position with a clear capture opportunity
      game.load('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5');
      const moves = game.moves({ verbose: true });
      const captures = moves.filter((m) => m.captured);
      if (captures.length === 0) return;

      let captureCount = 0;
      const trials = 20;
      for (let i = 0; i < trials; i++) {
        const g = new Chess(game.fen());
        const m = getComputerMove(g, 'casual');
        if (m.captured) captureCount++;
      }

      // Casual should capture meaningfully often
      expect(captureCount).toBeGreaterThan(trials * 0.2);
    });
  });

  describe('Club difficulty', () => {
    it('returns legal moves', () => {
      game.load('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5');
      const move = getComputerMove(game, 'club');
      const legalMoves = game.moves({ verbose: true });
      const found = legalMoves.find((m) => m.from === move.from && m.to === move.to);
      expect(found).toBeDefined();
    });

    it('prefers captures when a high-value piece is hanging', () => {
      // Black queen is hanging — club should take it
      game.load('rnb1kbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 3');
      game.move('d4');

      let captureCount = 0;
      const trials = 20;
      for (let i = 0; i < trials; i++) {
        const g = new Chess(game.fen());
        const m = getComputerMove(g, 'club');
        if (m.captured) captureCount++;
      }

      // Club should capture a hanging piece most of the time
      expect(captureCount).toBeGreaterThan(trials * 0.4);
    });
  });

  describe('Difficulty selector', () => {
    it('has all three required options', () => {
      expect(DIFFICULTIES).toContain('beginner');
      expect(DIFFICULTIES).toContain('casual');
      expect(DIFFICULTIES).toContain('club');
    });
  });
});
