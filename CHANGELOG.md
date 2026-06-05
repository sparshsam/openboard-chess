# Changelog

All notable public changes to Chess by Sparsh are recorded here.

This project follows practical versioned release notes rather than claiming strict semantic versioning before the project matures.

---

## v0.2.0 — Computer Opponent

**Status:** Released

### Added

- **Computer opponent** with three rating-inspired difficulty levels:
  - **Beginner (~800)**: prefers obvious captures and recaptures, avoids simplest one‑move blunders, still plays with significant randomness
  - **Casual (~1000)**: stronger material awareness, MVV‑LVA capture scoring, check preference, development toward center, castling awareness
  - **Club (~1400)**: piece‑square table evaluation, high‑confidence mate/capture detection, king safety, open‑file rook play, central pawn control
- **Game mode selector**: toggle between User vs Computer (default) and Local Two Player
- **Difficulty selector**: Beginner (~800) / Casual (~1000) / Club (~1400)
- Rating disclaimer: **"Approximate skill bands, not official Elo ratings."**
- Computer "thinking" indicator with animated dot
- Settings persistence (mode + difficulty saved to localStorage)
- Board lock during computer turn to prevent double moves
- **GitHub Actions CI** — test, build, and lint on push/PR
- Comprehensive test suite (37 passing tests)

### Changed

- Default mode is now User vs Computer (was Local Two Player)
- User plays White, Computer plays Black by default in PVC mode
- Computer responds automatically after user's legal move with a brief delay

### Deferred (unchanged from v0.1.0)

- Online multiplayer.
- User accounts.
- Stockfish or external engine integration.
- PGN support.
- Undo or takeback.
- Board orientation controls.
- Clocks or timed play.
- Sound effects and animations.

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
