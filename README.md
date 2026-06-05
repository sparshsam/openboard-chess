# Chess by Sparsh

**Chess by Sparsh** is a local-first chess board for two-player play, accurate rule validation, move history, and portable game records.

[Live demo](https://openboard-chess.vercel.app/) · [Repository](https://github.com/sparshsam/openboard-chess)

---

## Status

| Field | Value |
|---|---|
| Version | `v0.1.0` |
| Status | Live MVP |
| Repository slug | `openboard-chess` |
| Deployment | Vercel |
| Runtime model | Client-side web app |
| Primary mode | Local two-player chess |
| Storage | Browser localStorage |

This repository is intentionally focused. The first release prioritizes correctness, clarity, and a stable local play loop over platform-scale features.

---

## Purpose

Chess by Sparsh is a restrained, open-source chess board implementation. It is built to provide a readable and maintainable local chess experience with:

- accurate legal move handling;
- a simple custom board interface;
- portable game state through FEN;
- durable browser-local persistence;
- a clear foundation for future improvements.

---

## v0.1.0 Features

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
| FEN export | Complete |
| FEN import | Complete |
| Browser-local game persistence | Complete |
| Responsive layout | Complete |
| Rule-focused test coverage | Complete |

---

## Deliberately Out of Scope for v0.1.0

The following are intentionally deferred:

- online multiplayer;
- user accounts;
- AI opponent or Stockfish integration;
- engine analysis;
- ratings, matchmaking, ladders, or tournaments;
- server-side database storage;
- drag-and-drop movement;
- PGN import/export;
- undo or takeback;
- board flip;
- clocks or timed play;
- sound effects or animations.

These are deferred to keep the MVP stable and understandable.

---

## Technology

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript |
| Build tool | Vite |
| Chess rules | `chess.js` |
| Board UI | Custom-rendered board |
| Testing | Vitest + Testing Library |
| Persistence | localStorage |
| Deployment | Vercel |

---

## Repository Structure

```text
.
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── test/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
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

Chess by Sparsh stores the current local game in the browser using `localStorage`.

The saved state includes:

- current FEN;
- move history;
- save timestamp.

Clearing browser site data will remove the saved game.

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
| `v0.2.0` | PGN support, saved game list, board orientation controls |
| `v0.3.0` | Optional clocks and timed local games |
| `v0.4.0` | Optional engine-assisted analysis with clear labeling |
| `v0.5.0` | Optional online play after design boundaries are documented |

No roadmap item should be treated as promised until it is implemented, tested, and released.

---

## Agent Notes

Agents working on this repository should follow these rules:

- Keep the visible product name as **Chess by Sparsh**.
- Use `openboard-chess` only as the technical repository slug or internal key where necessary.
- Do not add online multiplayer, accounts, engine analysis, payments, or backend services without an explicit decision record.
- Keep chess rules delegated to a mature rules library rather than reimplementing rules casually.
- Preserve local-first behavior unless a future release deliberately changes scope.
- Prefer small commits with clear tests.
- Run `npm test`, `npm run build`, and `npm run lint` before merging functional changes.

---

## Deployment

The public demo is deployed on Vercel:

https://openboard-chess.vercel.app/

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
