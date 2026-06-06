# Changelog

All notable public changes to Chess by Sparsh are recorded here.

This project follows practical versioned release notes rather than claiming strict semantic versioning before the project matures.

---

## v0.5.0 — Stockfish Nightmare Release

**Status:** Released

### Added

- **Nightmare difficulty (~2000):** Powered by Stockfish WASM — a real chess engine running in your browser via WebAssembly. Uses the `stockfish.wasm@0.10.0` package (the same one Lichess uses).
- **Lazy loading:** Stockfish WASM (~150KB gzipped, ~400KB total with worker) is dynamically imported *only* when the user selects Nightmare difficulty. Not loaded on app startup.
- **StockfishEngine wrapper** (`src/chess/stockfish.ts`): UCI protocol integration with state management, progress reporting (depth/score), error handling, and proper resource cleanup.
- **Progress display:** Status bar shows "Nightmare dX | ±Y.ZZ" while Stockfish is thinking, with real-time depth and evaluation updates.
- **Loading states:** UI shows "Loading Stockfish engine…" while the WASM binary is downloading and initializing.
- **Error handling:** If Stockfish fails to load (e.g., missing SharedArrayBuffer support), the error is displayed in the UI.
- **Browser compatibility check:** `isWasmThreadsSupported()` utility function in the Stockfish wrapper.
- **Vercel deployment headers:** `vercel.json` with `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` required for SharedArrayBuffer.
- **Dev server headers:** Vite config configured with COOP/COEP headers for local development.
- **Nightmare warning in UI:** Difficulty selector shows a warning note about SharedArrayBuffer requirements when Nightmare is selected.

### Changed

- **Difficulty type** — `'nightmare'` added to the `Difficulty` union type.
- **DIFFICULTIES config** — Nightmare entry now active with `usesStockfish: true` and a descriptive description.
- **DIFFICULTY_OPTIONS** — Nightmare added to the selector dropdown.
- **useChessGame hook** — Supports Stockfish lifecycle (init/terminate/search), Stockfish move integration, and progress tracking.
- **StatusBar component** — New props for Stockfish status, error, progress, and Nightmare indicator.
- **App component** — Passes Stockfish state through to StatusBar.
- **DifficultySelector** — Shows SharedArrayBuffer warning when Nightmare is selected.
- **package.json** — Version bumped to 0.5.0.
- **vite.config.ts** — Added COOP/COEP headers and excluded `stockfish.wasm` from optimizeDeps.
- **SECURITY.md** — Updated to note Stockfish is a local engine with no network calls.

### Integration Details

- Stockfish WASM uses SharedArrayBuffer + Web Workers for threading (single thread configured for compatibility).
- Engine configured with 16MB hash and 1 thread.
- ~2.5 seconds think time per move for Nightmare difficulty.
- Engine is terminated when switching away from Nightmare or unmounting the app.

### Browser Compatibility

Nightmare difficulty requires a modern browser with:
- WebAssembly threading support
- `SharedArrayBuffer`
- `Atomics` API
- Proper COOP/COEP HTTP headers

Supported browsers: Chrome 79+, Edge 79+, Firefox 79+. Not supported on Safari or mobile browsers.

---

## v0.4.0 — Gameplay Product Polish Release

**Status:** Released

### Added

- **Background texture:** Warm carpet texture background with semi-transparent warm beige/cream overlays for a cozy, premium feel.
- **Warm UI theme:** Updated CSS variables with warmer tones, backdrop-filter blur effects on cards, and box shadows to make UI elements pop against the texture.
- **Undo Move:** Undo the last move (or last 2 moves in computer mode). Game state, history, and FEN are properly restored.
- **Restart Game:** Restart button with confirmation dialog. Resets all game state.
- **Resign Game:** Resign button with confirmation dialog. Shows "White/Black resigned — Black/White wins!" message.
- **PGN Export:** Export game as PGN. Copy to clipboard and download as `.pgn` file.
- **Captured Pieces Display:** Two-row display showing captured white pieces (by black) and captured black pieces (by white), sorted by value.
- **Move Review / Step-Through Mode:** Browse move history after or during a game. Previous/next navigation, clickable move rows, highlights current move, and a "Exit Review" button. Review mode is display-only and does not corrupt game state.
- **Board Theme Selector:** Five board color themes — Classic, Marine, Ember, Forest, Midnight. Persisted to localStorage.
- **Multiple Piece Sets:** Three piece rendering styles — Unicode (default), Symbols (warm golden/amber), Outlined (transparent with stroke). Persisted to localStorage.
- **Sound Effects (Web Audio API):** Programmatic sounds for moves, captures, checks, checkmate, promotions, and illegal moves. No audio files needed. Sound on/off toggle in Settings.
- **Better Mobile Layout:** Controls below board on mobile (<640px), 44px minimum touch targets, board width `min(92vw, 400px)`, full-width settings overlay on mobile, collapsible move history.

### Changed

- **AppSettings** — Added `boardTheme`, `pieceSet`, `soundEnabled` fields. Updated defaults and persistence.
- **Settings panel** — Added board theme selector, piece set selector, sound on/off toggle.
- **Layout** — Captured pieces bar above board. Review controls in move history.
- **CSS overhaul** — Warmer color palette, backdrop-filter blur, texture background, board theme variables, piece set CSS classes, mobile improvements.
- **README.md** — Updated feature table, added sound/theme/piece set/mobile sections.
- **CHANGELOG updated** with v0.4.0 entry.

---

## v0.3.1 — Engine Validation & Optimization Release

**Status:** Released

### Fixed

- **Quiescence search:** Removed redundant `qsearchMinimal` wrapper, combined into single `quiescenceSearch`. Explicit promotions handling in tactical move list. Fixed delta pruning margin to use piece-value-based threshold instead of arbitrary 200cp.
- **Mobility evaluation:** Replaced `approximateMobility()` (crude piece-counting that ignored pins/checks) with `countAttackedSquares()` — iterates the board and counts squares attacked by each piece. Simpler and significantly more accurate for the non-turning side.
- **King safety:** Rewrote `kingSafetyScore`. Fixed center distance formula (now `|kf - 3.5| + |kr - 3.5|` regardless of color). Removed stale `pawnDir` comments and dead code. Castling detection now checks corner position + front pawns.
- **Move ordering:** Replaced fake check detection (`captured === 'k'`) with real `givesCheck()` using clone-and-move. Applied to top 8 moves only to control cost.
- **Transposition table:** Upgraded from djb2 to FNV-1a hashing for better distribution. Added FEN verification field in TTEntry to detect/reject hash collisions. Increased table size from 262144 to 524288 entries.

### Added

- **Opening book:** ~35 common opening lines (Italian, Ruy Lopez, Scotch, Sicilian, French, Caro-Kann, Queen's Gambit, Indian Defenses, English) stored as UCI move sequences. Used by Club (up to 6 plies) and Expert (up to 10 plies).
- **Endgame evaluation:** When total non-king material drops below 1800cp — king centralization bonus, rook open-file bonus (+15 open, +10 semi-open), opposite-colored bishops drawishness adjustment (−50cp when few other pieces remain), extra passed pawn bonus.
- **Node budget:** CLUB_MAX_NODES=30000, EXPERT_NODES_PER_ITERATION=80000 to cap search effort.
- **Browser yielding:** Every 500 nodes, yields to the event loop via `setTimeout(0)` to prevent browser freezing during Expert search.
- **Engine benchmark utility:** `src/chess/bench.ts` — tests 6 positions across difficulty levels with timing, timeout protection, and formatted output. Run with `npx tsx src/chess/bench.ts [casual|club|expert]`.

### Changed

- **Search optimization:** Switched from `new Chess(game.fen())` clones to `game.move()`/`game.undo()` pattern for search traversal. Avoids creating thousands of new Chess objects per search.
- **Evaluation weight tuning:**
  - Mobility weight: 5 → 3 (10 extra moves = 30cp instead of 50cp)
  - Doubled pawn penalty: −15 → −20
  - Isolated pawn penalty: −20 → −25
  - Passed pawn base: +10 → +20, per-rank increment: +20 → +15
  - Castled bonus: 20 → 30
  - Pawn shield max: 12 → 15
  - Close file penalty: 15 → 20
  - Center control: 10 → 8 per square
  - Development: centralized bonus 15 → 20, back-rank penalty 15 → 20

### Performance

- Expert search now yields every 500 nodes with a global node budget, preventing browser freezes
- Club search capped at 30K nodes total
- Move/undo pattern reduces Chess object allocations by ~90%+ compared to per-node cloning
- FNV-1a hash reduces TT collision rate vs. djb2

### Documentation

- CHANGELOG updated with v0.3.1 entry
- README updated with v0.3.1 details

---

## v0.3.0 — Engine Strength Release

**Status:** Released

### Added

- **Expert difficulty (~1700)** with 5-ply iterative deepening search, transposition caching (262K-entry table), and quiescence search
- **Quiescence search** for tactical stability at search horizons (captures + promotions searched until quiet positions)
- **Transposition table cache** for Expert difficulty — avoids re-searching positions and provides best-move hints for ordering
- **MVV-LVA move ordering** (Most Valuable Victim - Least Valuable Attacker) for better alpha-beta pruning efficiency
- **Improved evaluation:**
  - **Mobility counting** — approximate legal move counts for each piece type (Club+)
  - **Pawn structure** — doubled pawn penalty (−15), isolated pawn penalty (−20), passed pawn bonus (+10–70)
  - **Piece development** — bonuses for developed knights/bishops, penalties for undeveloped back-rank pieces (Club+)
  - **Space advantage** — center and extended-center square control (Club+)
  - **Improved king safety** — pawn shield at two depths, castled king bonus, open file penalty, center-penalty in middlegame

### Changed

- **Club difficulty upgraded:** now 3-ply + quiescence search with MVV-LVA ordering and full evaluation (was 2-ply without quiescence)
- **Casual evaluation** now passes proper evaluation features config instead of always using defaults
- Evaluation function now takes a configurable `EvalFeatures` parameter per difficulty level
- Engine architecture refactored for cleaner separation — quiescence, move ordering, and transposition logic extracted to dedicated modules

### Disabled

- **Nightmare difficulty** placeholder added but hidden from the UI — requires Stockfish WASM integration

### Documentation

- Version badges updated to 0.3.0
- Computer opponent tables updated with new search depths and features
- Roadmap updated to reflect shipped v0.3.0
- AGENTS.md updated with new difficulty descriptions

---

## v0.2.1 — Presentation Polish

**Status:** Released

### Added

- Centered hero README with application screenshot, badges, and navigation links.
- `ARCHITECTURE.md` — full architecture documentation with component tree, data flow diagram, AI opponent design, and key design decisions.
- `ROADMAP.md` — dedicated roadmap document separate from the README, with versioned progression and roadmap principles.
- `.github/FUNDING.yml` — placeholder for future funding configuration.

### Changed

- Rewrote `README.md` with Elora Vault–inspired structure: what-it-IS/IS-NOT sections, centered hero with screenshot, technology badges, architecture overview, and streamlined navigation.
- Polished `AGENTS.md` with product identity details, commit message conventions, settings persistence schema, and computer opponent testing notes.
- Polished `CONTRIBUTING.md` with updated project structure, scope boundaries, and conventional commit guidance.
- Polished `SECURITY.md` with clearer language on data boundaries and security claims.
- Updated `CHANGELOG.md` with this version entry.
- Updated package version to `0.2.1`.

---

## v0.2.0 — Computer Opponent + Settings

**Status:** Released

### Added

- Computer opponent with three difficulty bands:
  - **Beginner (~800):** Random legal moves with center/piece-value weighting. Occasional blunders.
  - **Casual (~1000):** 1-ply minimax with piece-square evaluation. Captures hanging pieces, avoids hanging own pieces.
  - **Club (~1400):** 2-ply alpha-beta search. Material evaluation, piece-square tables, mobility, king safety.
- Settings panel (slide-over drawer):
  - Game mode selector: User vs Computer or Local Two Player.
  - Difficulty selector (visible only in Computer mode).
  - Board orientation: White always at bottom or flip to match current turn.
  - Disclaimer text near difficulty selector.
- Settings persisted to `localStorage`.
- Game mode indicator in the status bar.
- Computer move delay for natural feel (400–700ms).
- Source reorganization for clarity (`src/chess/`, `src/app/`, `src/components/Board/`, `src/components/Game/`, `src/components/Settings/`, `src/lib/`).
- GitHub pull request template.
- GitHub issue templates (bug report, feature request).

### Changed

- Updated README for v0.2.0 features.
- Updated AGENTS.md and CONTRIBUTING.md to reflect new capabilities and boundaries.
- Updated storage key and settings key to `chess-by-sparsh-*` convention.
- Updated `src/hooks/useChessGame.ts` to support game mode integration.
- Updated `src/App.tsx` with Settings button and panel.
- Updated `src/App.css` with header layout, status mode label, and settings styles.

### Removed

- Old `src/types/` directory (consolidated into `src/types.ts`).
- Remaining references to `openboard-chess` (zero tolerance sweep complete).

---

## v0.1.1 — Repository Professionalization

**Status:** Released

### Changed

- Updated all repository slug references from `openboard-chess` to `chess-by-sparsh` to match the GitHub rename.
- Updated package name from `openboard-chess` to `chess-by-sparsh`.
- Updated storage key from `openboard-chess-save` to `chess-by-sparsh-save`.
- Updated README with accurate repository structure, corrected URLs, and current naming conventions.
- Updated AGENTS.md and CONTRIBUTING.md to reflect the new repository slug.

### Added

- MIT `LICENSE` file.
- `.editorconfig` with sensible defaults (2-space indent, UTF-8, UTF-8, LF line endings).
- CI workflow (`.github/workflows/ci.yml`) running install, lint, test, and build on Node.js 20.

---

## v0.1.0 — Local Chess MVP

**Status:** Released

### Added

- Custom 8x8 chess board.
- Unicode chess piece rendering.
- Click-to-select interaction model.
- Legal move highlighting.
- Legal move validation through `chess.js`.
- Support for castling, en passant, check, checkmate, stalemate, and draw states through the rules layer.
- Pawn promotion dialog.
- Algebraic move history.
- FEN export.
- FEN import.
- Browser-local save and restore through `localStorage`.
- Game status display.
- Responsive layout.
- Rule-focused test suite.
- Vercel deployment instructions.

### Deferred

- Online multiplayer.
- User accounts.
- PGN support.
- Undo or takeback.
- Clocks or timed play.
- Sound effects and animations.
