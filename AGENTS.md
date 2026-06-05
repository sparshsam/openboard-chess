# Agent Operating Notes

This file gives AI coding agents a compact operating brief for Chess by Sparsh.

## Product Identity

- Visible name: **Chess by Sparsh**
- Repository slug: `chess-by-sparsh`
- Current release: `v0.2.0`
- Product type: local-first chess board with computer opponent

Use **Chess by Sparsh** in visible product copy. Use `chess-by-sparsh` as the repository slug, package name, URLs, and internal storage keys.

## Current Scope

The current app supports:

- local two-player chess;
- user vs computer chess with three difficulty bands (Beginner ~800, Casual ~1000, Club ~1400);
- accurate move validation through `chess.js`;
- legal move highlighting;
- move history;
- FEN import and export;
- local browser persistence (game state + settings);
- pawn promotion;
- game status display;
- settings panel (game mode, difficulty, board orientation).

## Architecture

```
src/
  app/              — App.tsx, App.css, main.tsx, main.css
  chess/            — AI engine (computer.ts, evaluate.ts, pieceSquareTables.ts, difficulty.ts)
  components/       — UI components organized by area
    Board/          — Board.tsx, Square.tsx
    Game/           — MoveHistory.tsx, StatusBar.tsx
    GameControls/   — GameControls.tsx
    Piece/          — Piece.tsx
    PromotionDialog/— PromotionDialog.tsx
    Settings/       — SettingsPanel.tsx, ModeSelector.tsx, DifficultySelector.tsx, styles
  hooks/            — useChessGame.ts, useSettings.ts
  lib/              — storage.ts (localStorage helpers)
  types/            — types.ts (consolidated)
  __tests__/        — test files
```

## Computer Opponent

- `src/chess/computer.ts` — exports `getComputerMove(game, difficulty): Promise<SquareMove>`
- `src/chess/evaluate.ts` — position evaluation (material + PST + king safety)
- `src/chess/pieceSquareTables.ts` — standard PST arrays for all pieces
- `src/chess/difficulty.ts` — types, labels, descriptions, disclaimer
- The computer plays Black; human plays White in Computer mode

### Difficulty Bands

| Level | Rating | Depth | Behavior |
|---|---|---|---|
| Beginner | ~800 | 0 | Random legal moves with weighting + random blunders |
| Casual | ~1000 | 1 | 1-ply minimax with material + PST evaluation |
| Club | ~1400 | 2 | 2-ply alpha-beta with material, PST, king safety, move ordering |

## Do Not Add Without a Decision

- Online multiplayer
- User accounts
- Backend services
- Stockfish or other strong engine
- Ratings, ladders, or matchmaking
- Payments
- Telemetry

## Required Checks

Before finishing a code change, run:

```bash
npm test
npm run build
npm run lint
```

Documentation-only changes may skip runtime checks if no code, package, config, or test files are touched.

## Development Preference

- Keep changes small.
- Prefer tests for rule behavior.
- Keep UI calm and readable.
- Preserve local-first behavior.
- Avoid broad rewrites unless there is a clear maintenance reason.
