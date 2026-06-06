# Agent Operating Notes

This file gives AI coding agents a compact operating brief for **Chess by Sparsh**.

---

## Product Identity

- **Visible name:** Chess by Sparsh
- **Repository slug:** `chess-by-sparsh`
- **Package name:** `chess-by-sparsh` (in `package.json`)
- **Current release:** `v0.3.0`
- **Product type:** Local-first chess board with computer opponent
- **License:** MIT
- **Deployment:** Vercel (static SPA)

Use **Chess by Sparsh** in all visible product copy. Use `chess-by-sparsh` as the technical repository slug, package name, URLs, and internal storage keys.

---

## Current Scope

The current app supports:

- Local two-player chess on the same device
- User vs Computer chess with four difficulty bands:
  - **Beginner (~800):** Weighted random moves with occasional blunders
  - **Casual (~1000):** 1-ply minimax with material + PST evaluation
  - **Club (~1400):** 3-ply alpha-beta + quiescence, MVV-LVA ordering, full eval (mobility, pawn structure, development, space)
  - **Expert (~1700):** 5-ply iterative deepening + transposition cache + quiescence, full eval
- Accurate move validation through `chess.js`
- Legal move highlighting
- Algebraic move history
- FEN import and export
- Browser-local persistence (game state via `chess-by-sparsh-save`, settings via `chess-by-sparsh-settings`)
- Pawn promotion dialog
- Game status display (check, checkmate, stalemate, draw)
- Settings panel (game mode, difficulty, board orientation)
- Board orientation setting (White always bottom or flip to current turn)

---

## Architecture

```
src/
  app/              — App.tsx, App.css, main.tsx, main.css
  chess/            — AI engine (computer.ts, evaluate.ts, pieceSquareTables.ts, difficulty.ts, moveOrdering.ts, transpositionTable.ts, quiescence.ts)
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

See [ARCHITECTURE.md](ARCHITECTURE.md) for full architecture documentation including the component tree, data flow diagram, and AI opponent design.

---

## Computer Opponent Details

- `src/chess/computer.ts` — exports `getComputerMove(game, difficulty): Promise<SquareMove>`
- `src/chess/evaluate.ts` — position evaluation (material + PST + king safety + mobility + pawn structure + development + space)
- `src/chess/pieceSquareTables.ts` — standard PST arrays for all pieces
- `src/chess/difficulty.ts` — types, config, labels, descriptions, disclaimer, eval feature flags
- `src/chess/moveOrdering.ts` — MVV-LVA scoring and sorting
- `src/chess/transpositionTable.ts` — fixed-size (262K entry) transposition cache
- `src/chess/quiescence.ts` — capture-only quiescence search for tactical stability
- The computer plays Black; human plays White in Computer mode
- A 500ms base delay (plus random offset up to 300ms) gives a natural "thinking" feel

### Testing computer opponent

When modifying the AI:

1. Run `npm test` — existing tests exercise rule validation and basic game flow
2. Run a manual game at each difficulty level and verify the computer makes legal moves
3. For evaluation changes, document before/after scores for a sample of positions
4. Ensure the computer never hangs (no infinite loops, no uncaught promise rejections)

---

## Do Not Add Without a Decision

The following require an explicit project decision before implementation:

- Online multiplayer
- User accounts or authentication
- Backend services or server-side computation
- Stockfish or other external chess engine
- Ratings, ladders, or matchmaking
- Payments, subscriptions, or donations handling
- Telemetry, analytics, or data collection
- Social features (chat, profiles, friends)

---

## Commit Message Rules

All commit messages must reference the project slug or product name when describing project-wide changes.

**Good examples:**

```
feat: add computer opponent with three difficulty bands
feat(chess): improve king safety evaluation in club level
fix(chess): handle invalid FEN string gracefully
docs: add ARCHITECTURE.md with component tree and data flow
test: add edge cases for en passant and castling through check
refactor(settings): extract ModeSelector as standalone component
```

**Use conventional commit prefixes:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `style:`.

When a change touches files in `src/`, add a scope annotation for clarity: `feat(chess):`, `feat(settings):`, `fix(board):`, etc.

---

## Required Checks Before Merge

Before merging any functional change, run:

```bash
npm test
npm run build
npm run lint
```

Documentation-only changes (`.md` files only, no code/config/tests) may skip runtime checks.

---

## Settings Persistence Details

Settings are stored in `localStorage` under the key `chess-by-sparsh-settings`.

**Schema:**

```json
{
  "gameMode": "computer" | "local",
  "difficulty": "beginner" | "casual" | "club" | "expert",
  "boardOrientation": "white-bottom" | "flip-turn"
}
```

The `useSettings` hook persists changes automatically via `useEffect`. Loading happens in the initializer function of `useState`.

Changing game mode or difficulty triggers a board reset (via `useEffect` in `useChessGame`).

---

## Development Preference

- Keep changes small and focused
- Prefer tests for rule behavior
- Keep UI calm, readable, and accessible
- Preserve local-first behavior
- Avoid broad rewrites unless there is a clear maintenance reason
- Write descriptive commit messages
