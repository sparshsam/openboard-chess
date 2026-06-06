# Roadmap

This document describes the planned direction for Chess by Sparsh. Roadmap items are directional — no item is promised until it is implemented, tested, and released.

---

## Version History

| Version | Tag | Status |
|---|---|---|
| v0.1.0 | Local chess MVP | Released |
| v0.1.1 | Repository professionalization | Released |
| v0.2.0 | Computer opponent + settings | Released |
| v0.2.1 | Presentation polish | Released |
| v0.3.x | Engine Strength Release | Released |
| v0.4.x | Chess clocks | Backlog |
| v0.5.x | Engine-assisted analysis | Future |
| v0.6.x | Online play | Future |

---

## v0.1.x — Local Play Foundation

**Released:** v0.1.0, v0.1.1

- Custom 8x8 chess board with Unicode pieces
- Click-to-select movement with legal move highlighting
- Legal move validation through `chess.js`
- Full rules support: castling, en passant, check, checkmate, stalemate, draw
- Pawn promotion dialog
- Algebraic move history
- FEN export and import
- Browser-local game persistence (`localStorage`)
- Responsive layout
- Vercel deployment configuration
- MIT license, CI pipeline, issue/PR templates

---

## v0.2.x — Computer Opponent + Settings

**Released:** v0.2.0, v0.2.1

- Computer opponent with three difficulty bands:
  - Beginner (~800): weighted random with blunders
  - Casual (~1000): 1-ply minimax
  - Club (~1400): 2-ply alpha-beta
- Settings panel (slide-over drawer)
- Game mode switching (Computer / Local Two Player)
- Board orientation setting
- Settings persistence
- Source reorganization
- Full documentation suite (ARCHITECTURE.md, ROADMAP.md, polished README)

---

## v0.3.x — Engine Strength Release

**Released**

- Expert difficulty (~1700) with 5-ply iterative deepening, transposition cache, quiescence
- Club difficulty upgraded to 3-ply + quiescence search
- MVV-LVA move ordering for better alpha-beta pruning
- Full evaluation with mobility, pawn structure, development, space
- Quiescence search for tactical stability at search horizons
- Transposition table (262K entries) for Expert caching
- Nightmare difficulty placeholder (requires Stockfish WASM)
- Version bumped to v0.3.0

### Design goals
- No backend, no Stockfish, no external dependencies
- Local-first, all search runs in-browser
- Transparent per-difficulty features (eval flags, search options)
- Engines feel stronger but remain honest about being heuristic

---

## v0.4.x — Chess Clocks

**Backlog**

- Optional countdown clocks per player
- Time increment and delay settings
- Clock display in board UI
- Time forfeit handling
- Clock pause between moves

### Design goals
- Clocks are optional; local play without clocks continues to work
- Clock state persisted in localStorage
- No server-side time verification

---

## v0.5.x — Engine-Assisted Analysis

**Future**

- In-browser heuristic analysis (no Stockfish, no external engine)
- Position evaluation bar
- Best move suggestion (computer's own evaluator)
- Clearly labeled as "heuristic analysis, not engine analysis"

### Boundaries
- No Stockfish or external engine integration without a separate design review
- Analysis must be clearly labeled as heuristic / approximate
- Analysis must never interfere with game play

---

## v0.6.x — Online Play

**Future — exact scope TBD**

- Optional online multiplayer
- Room-based or friend-invite model
- No user accounts (or minimal identity)
- No ratings, matchmaking, or tournaments

### Prerequisites
A separate design document must be written and reviewed before any online feature is implemented. The document should address:

1. **Scope boundaries** — what online play means and doesn't mean
2. **Infrastructure** — minimal server requirements
3. **Privacy** — what data leaves the browser
4. **Cost** — hosting, bandwidth
5. **Maintenance** — ongoing operational burden

---

## Roadmap Principles

1. **Features are not promises.** Every item on this roadmap is directional and subject to change.

2. **Small releases.** Prefer smaller, frequent releases over large feature drops.

3. **Local-first always.** Features must never degrade the local play experience.

4. **No vendor lock-in.** Avoid dependencies that would make the app hard to maintain or self-host.

5. **Scope boundaries before implementation.** Any feature that touches online play, accounts, or external services needs written scope boundaries before code is written.

6. **Testing before merging.** Every functional change must include or update tests.
