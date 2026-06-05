# Changelog

All notable public changes to Chess by Sparsh are recorded here.

This project follows practical versioned release notes rather than claiming strict semantic versioning before the project matures.

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
- `.editorconfig` with sensible defaults (2-space indent, UTF-8, LF line endings).
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
