# Changelog

All notable public changes to Chess by Sparsh are recorded here.

This project follows practical versioned release notes rather than claiming strict semantic versioning before the project matures.

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
- Support for castling, en passant, promotion, check, checkmate, stalemate, and draw states through the rules layer.
- Pawn promotion dialog.
- Move history display.
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
