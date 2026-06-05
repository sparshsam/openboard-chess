# Changelog

## v0.2.0 — 2026-06-05

### Added
- **Computer opponent** with three difficulty levels:
  - **Easy**: picks random legal moves
  - **Medium**: material-aware selection preferring captures and checks
  - **Hard**: stronger heuristic with piece-square tables, MVV-LVA scoring,
    check/checkmate detection, promotion evaluation, and blunder avoidance
- **Game mode selector**: toggle between **User vs Computer** (default) and
  **Local Two Player**
- **Difficulty selector**: Easy / Medium / Hard (only relevant in PVC mode)
- **Computer "thinking" indicator**: animated dot + text shown while the
  computer calculates its move
- **Settings persistence**: game mode and difficulty choice are saved to
  localStorage and restored on reload

### Changed
- **Default mode** is now User vs Computer (was Local Two Player)
- User plays White, Computer plays Black by default in PVC mode
- After the user makes a legal move, the computer responds automatically
  after a brief delay

### Fixed
- Board is locked during computer's turn to prevent double moves

### Tests
- 47 tests across 2 test files (all passing)
- Covers: computer opponent at all difficulty levels, game mode selection,
  difficulty selection, FEN roundtrip, reset, promotion, illegal move rejection,
  app component rendering

## v0.1.0 — 2026-06-05

### Added
- 8×8 board with Unicode pieces
- Click-to-select and legal move highlighting
- Full chess rules (en passant, castling, promotion)
- Move history in algebraic notation
- FEN export/import
- Pawn promotion dialog
- localStorage persistence
- Responsive layout
- Custom-rendered board UI with React 19 + TypeScript
- Vite 8 build configuration
- Vitest + @testing-library/react test setup
