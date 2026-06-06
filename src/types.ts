import type { Square as ChessSquare } from 'chess.js';
import type { Difficulty } from './chess/difficulty';

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

/** Game mode: vs computer or local two-player */
export type GameMode = 'computer' | 'local';

/** Board orientation setting */
export type BoardOrientation = 'white-bottom' | 'flip-turn';

/** Board theme */
export type BoardTheme = 'classic' | 'marine' | 'ember' | 'forest' | 'midnight';

/** Piece set */
export type PieceSet = 'unicode' | 'symbols' | 'outlined';

/** Stockfish WASM loading state */
export type StockfishStatus = 'unloaded' | 'loading' | 'ready' | 'error';

/** All user preferences */
export interface AppSettings {
  gameMode: GameMode;
  difficulty: Difficulty;
  boardOrientation: BoardOrientation;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  soundEnabled: boolean;
}
