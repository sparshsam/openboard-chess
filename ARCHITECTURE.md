# Architecture

## Overview

Chess by Sparsh is a **single-page React application** with no backend dependencies. All game logic — move validation, AI evaluation, state management, and persistence — runs entirely client-side in the browser. The app is deployed as a static site on Vercel.

### Core design choices

| Decision | Rationale |
|---|---|
| SPA, no framework routing | Single screen, no navigation. No router needed. |
| `chess.js` for rules | Mature, tested validation library. No need to reimplement chess rules. |
| Custom-rendered board | Full control over layout, styling, and interaction model. |
| React hooks for state | Clean separation of game logic from UI. |
| localStorage persistence | Zero infrastructure; game state survives page reloads. |
| Heuristic minimax AI | No external engine dependency; predictable difficulty bands. |

---

## Component Tree

```
App
├── Board
│   └── Square (×64) ── Piece
├── StatusBar
├── GameControls
├── MoveHistory
├── PromotionDialog
└── SettingsPanel
    ├── ModeSelector
    └── DifficultySelector
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| `App` | Top-level layout. Composes all UI sections. Connects hooks to components. |
| `Board` | Renders 8×8 grid of `Square` components. Accepts click handler. |
| `Square` | Renders a single board square. Shows highlight if legal move target. Contains optional `Piece`. |
| `Piece` | Renders a Unicode chess piece character with appropriate styling. |
| `StatusBar` | Displays game status text, current FEN, and game mode indicator. Shows "Computer thinking…" during AI turn. |
| `GameControls` | New Game, Export FEN, Import FEN action buttons. |
| `MoveHistory` | Scrollable algebraic notation list of all moves played. |
| `PromotionDialog` | Modal overlay for pawn promotion piece selection. |
| `SettingsPanel` | Slide-over drawer containing game mode, difficulty, and orientation controls. |
| `ModeSelector` | Dropdown: User vs Computer or Local Two Player. |
| `DifficultySelector` | Dropdown: Beginner / Casual / Club. Visible only in Computer mode. |

---

## Data Flow

```
User clicks square
        │
        ▼
Board.onSquareClick(square)
        │
        ▼
useChessGame.selectSquare(square)
        │
        ├── First click (no selection) → sets selectedSquare, shows legal moves
        │
        └── Second click (target square)
                │
                ├── Promotion needed? → set pendingPromotion → PromotionDialog
                │
                └── Normal move → chess.js game.move()
                        │
                        ▼
                updateState()
                        │
                        ├── game.fen() → setFen()
                        ├── game.history() → setHistory()
                        ├── saveGame(fen, history)
                        └── game status → setStatus()
                        │
                        ▼
                afterUserMove()
                        │
                        └── Computer's turn? → scheduleComputerMove()
                                │
                                ├── setTimeout(400–700ms delay)
                                │
                                ▼
                                getComputerMove(game, difficulty)
                                │
                                ├── Beginner → beginnerMove()
                                │   ├── 20% random blunder elsewhere
                                │   └── 80% weighted random: captures + center + PST
                                │
                                ├── Casual → casualMove()
                                │   ├── Clone position, try each move
                                │   └── 1-ply: evaluateForTurn()
                                │
                                └── Club → clubMove()
                                    ├── Clone position, try each move
                                    ├── 2-ply minimax with alpha-beta pruning
                                    ├── Move ordering: captures first
                                    └── evaluate: material + PST + king safety + mobility
                                │
                                ▼
                        game.move(computer's choice)
                                │
                                ▼
                        updateState()
```

### State management detail

State lives in two custom hooks, consumed by `App` and passed down as props:

**`useChessGame({ settings })`**
- Owns: `game` (Chess instance), `fen`, `history`, `selectedSquare`, `legalMoves`, `pendingPromotion`, `status`, `isComputerThinking`
- Methods: `selectSquare`, `promote`, `cancelPromotion`, `newGame`, `exportFen`, `importFen`
- Manages computer move scheduling via `setTimeout` + refs
- Reacts to `settings.gameMode` and `settings.difficulty` changes (resets board)

**`useSettings()`**
- Owns: `settings` (AppSettings), `settingsOpen`
- Methods: `setGameMode`, `setDifficulty`, `setBoardOrientation`, `toggleSettings`, `closeSettings`
- Persists settings to `localStorage` on every change via `useEffect`

---

## AI Opponent Architecture

### Directory: `src/chess/`

| File | Responsibility |
|---|---|
| `difficulty.ts` | Type definitions, config records, UI options, disclaimer text |
| `computer.ts` | `getComputerMove()` — async entry point with delay. Dispatches to per-difficulty functions. |
| `evaluate.ts` | Board evaluation: `evaluate()` (full), `evaluateForTurn()` (minimax-ready), `materialCount()` (quick), `kingSafetyScore()` |
| `pieceSquareTables.ts` | Standard PST arrays for all piece types, `getTable()`, `mirrorRows()` |

### Search depth by difficulty

| Difficulty | Depth | Algorithm | Features |
|---|---|---|---|
| Beginner | 0 (random) | Weighted random | Capture bonus, center preference, PST hints, 20% blunder rate |
| Casual | 1 ply | Minimax | Material + PST evaluation |
| Club | 2 ply | Alpha-beta pruning | Material + PST + king safety + move ordering |

### Evaluation heuristics (Club)

- **Material:** Standard centipawn values (p=100, n=320, b=330, r=500, q=900)
- **Piece-Square Tables:** Standardized positional bonus arrays for each piece type
- **King safety:** Pawn shield near king (+15 per pawn), open-file penalty near king (−10 per enemy rook/queen on adjacent files)
- **Move ordering:** Captures sorted by captured piece value (improves alpha-beta pruning efficiency)

### Design decisions

- **No opening book:** The computer plays from any position without memorized lines. This keeps the AI footprint small and ensures predictable behavior at each difficulty level.
- **No endgame tablebase:** Positions are evaluated heuristically. This is fine for the target difficulty bands.
- **Async with delay:** `COMPUTER_DELAY_MS` (500ms) plus random offset gives a natural "thinking" feel. The delay runs as an async `Promise` + `setTimeout` to avoid blocking the UI.
- **Clone-based search:** Each minimax ply clones the chess.js instance. This is simple and correct; performance is acceptable for 2-ply search.

---

## Storage Layer

### `src/lib/storage.ts`

Two storage keys in `localStorage`:

| Key | Content | Format |
|---|---|---|
| `chess-by-sparsh-save` | Current game | `{ fen, history, savedAt }` |
| `chess-by-sparsh-settings` | User preferences | `{ gameMode, difficulty, boardOrientation }` |

All access is wrapped in try/catch to handle `localStorage` being unavailable (private browsing, quota exceeded).

---

## Key Design Decisions

1. **No drag-and-drop.** Click-to-select is simpler, more accessible, and easier to implement correctly for all edge cases (promotion, en passant, castling).

2. **Chess.js for rules only.** The AI does not use chess.js for evaluation — it reads the board state and runs its own heuristic evaluation.

3. **Clone + evaluate in AI.** Each candidate move clones the chess.js instance. This avoids mutating the game state during search and is correct by construction.

4. **Settings trigger board reset.** Changing game mode or difficulty resets the game. This prevents invalid state (e.g., computer game continuing in two-player mode with half-made moves).

5. **Persistence is append-only.** Saved game state is overwritten on each move. There is no undo history beyond the current game.
