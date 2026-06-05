import type { Square as ChessSquare } from 'chess.js';

export type { ChessSquare };

export interface PromotionChoice {
  from: ChessSquare;
  to: ChessSquare;
}

export interface GameState {
  fen: string;
  history: string[];
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
}
