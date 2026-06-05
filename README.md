# Chess by Sparsh

**Chess by Sparsh** is a local-first chess board with an optional computer opponent, accurate rule validation, move history, and portable game records.

[Live demo](https://chess-by-sparsh.vercel.app/) · [Repository](https://github.com/sparshsam/chess-by-sparsh)

---

## Status

| Field | Value |
|---|---|
| Version | `v0.2.0` |
| Status | Live |
| Repository slug | `chess-by-sparsh` |
| Deployment | Vercel |
| Runtime model | Client-side web app |
| Primary modes | Local two-player and user vs computer |
| Computer levels | Beginner (~800), Casual (~1000), Club (~1400) |
| Storage | Browser localStorage (game state + settings) |

---

## Purpose

Chess by Sparsh provides a readable and maintainable local chess experience with:

- accurate legal move handling;
- a computer opponent with three difficulty bands;
- a clean settings panel for game mode, difficulty, and board orientation;
- portable game state through FEN;
- durable browser-local persistence for game state and preferences;
- a clear foundation for future improvements.

---

## v0.2.0 Features

| Capability | Status |
|---|---:|
| Custom 8x8 chess board | Complete |
| Unicode chess pieces | Complete |
| Click-to-select movement | Complete |
| Legal move highlighting | Complete |
| Legal move validation through `chess.js` | Complete |
| Castling, en passant, check, checkmate, stalemate, and draw handling | Complete |
| Pawn promotion dialog | Complete |
| Algebraic move history | Complete |
| FEN export / import | Complete |
| Browser-local game persistence | Complete |
| Responsive layout | Complete |
| Rule-focused test coverage | Complete |
| **Computer opponent (3 levels)** | **Complete** |
| **Settings panel** | **Complete** |
| **Game mode switching** | **Complete** |
| **Board orientation setting** | **Complete** |
| **Settings persistence** | **Complete** |

### Computer Opponent

| Difficulty | Rating | Behavior |
|---|---|---|
| Beginner | ~800 | Random legal moves with center/piece-value weighting. Makes occasional blunders. |
| Casual | ~1000 | 1-ply minimax with piece-square evaluation. Captures hanging pieces, avoids hanging own pieces. |
| Club | ~1400 | 2-ply alpha-beta search with material evaluation, piece-square tables, mobility, and king safety. |

> Rating-inspired skill bands, not official Elo ratings.

---

## Deliberately Out of Scope

The following are intentionally deferred:

- online multiplayer;
- user accounts;
- Stockfish or other external engine integration;
- engine analysis;
- ratings, matchmaking, ladders, or tournaments;
- server-side database storage;
- drag-and-drop movement;
- PGN import/export;
- undo or takeback;
- board flip (beyond orientation setting);
- clocks or timed play;
- sound effects or animations.

---

## Technology

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript |
| Build tool | Vite |
| Chess rules | `chess.js` |
| Board UI | Custom-rendered board |
| AI | Heuristic minimax (no external engines) |
| Testing | Vitest + Testing Library |
| Persistence | localStorage |
| Deployment | Vercel |

---

## Repository Structure

```text
.
├── .github/
│   ├── workflows/ci.yml
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── src/
│   ├── app/               — App.tsx, App.css, main.tsx, main.css
│   ├── chess/             — AI engine (computer, evaluate, PST, difficulty)
│   ├── components/
│   │   ├── Board/         — Board.tsx, Square.tsx
│   │   ├── Game/          — MoveHistory.tsx, StatusBar.tsx
│   │   ├── GameControls/  — GameControls.tsx
│   │   ├── Piece/         — Piece.tsx
│   │   ├── PromotionDialog/ — PromotionDialog.tsx
│   │   └── Settings/      — SettingsPanel, ModeSelector, DifficultySelector
│   ├── hooks/             — useChessGame.ts, useSettings.ts
│   ├── lib/               — storage.ts
│   └── types/             — types.ts
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

---

## Local Development

### Requirements

- Node.js 20 or newer recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

---

## Game State

Chess by Sparsh stores the current local game and user settings in the browser using `localStorage`.

Saved data includes:

- current FEN;
- move history;
- save timestamp;
- user preferences (game mode, difficulty, board orientation).

Clearing browser site data will remove saved state and settings.

---

## Project Principles

1. **Correctness before novelty** — rules and state handling matter more than feature volume.
2. **Small surface area** — the app should remain easy to inspect, test, and maintain.
3. **Local-first by default** — local play should not require a backend service.
4. **Portable records** — FEN support should make game state easy to move and inspect.
5. **Restrained claims** — this is a chess board, not a chess engine or rating system.

---

## Roadmap

| Version | Direction |
|---|---|
| `v0.1.x` | Stabilize local play, tests, accessibility, and small UX refinements |
| `v0.2.x` | PGN support, saved game list, board orientation controls |
| `v0.3.x` | Optional clocks and timed local games |
| `v0.4.x` | Optional engine-assisted analysis with clear labeling |
| `v0.5.x` | Optional online play after design boundaries are documented |

No roadmap item should be treated as promised until it is implemented, tested, and released.

---

## Agent Notes

Agents working on this repository should follow these rules:

- Keep the visible product name as **Chess by Sparsh**.
- Use `chess-by-sparsh` as the technical repository slug and package name.
- Do not add online multiplayer, accounts, engine analysis, payments, or backend services without an explicit decision record.
- Keep chess rules delegated to a mature rules library rather than reimplementing rules casually.
- Preserve local-first behavior unless a future release deliberately changes scope.
- Prefer small commits with clear tests.
- Run `npm test`, `npm run build`, and `npm run lint` before merging functional changes.

---

## Deployment

The public demo is deployed on Vercel:

https://chess-by-sparsh.vercel.app/

For manual deployment through the Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel --prod
```

The production build is generated by Vite.

---

## License

MIT License. See `LICENSE`.

---

## Maintainer

Created and maintained by [Sparsh Sam](https://github.com/sparshsam).
