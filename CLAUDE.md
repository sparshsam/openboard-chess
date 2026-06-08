# chess-by-sparsh — Claude Code Instructions

## Project Overview

A web chess game with a computer opponent at three difficulty levels (Beginner, Casual, Club). Built with React 19 + Vite + TypeScript, using chess.js for game logic and Stockfish WASM for AI evaluation.

## Tech Stack

- **Framework:** React 19 + Vite 6
- **Language:** TypeScript (strict mode)
- **Game logic:** chess.js v1.4
- **AI engine:** Stockfish WASM v0.10 (runs in-browser via Web Workers)
- **Testing:** Vitest + @testing-library/react
- **Linting:** ESLint (flat config)
- **Deployment:** Vercel (automatic from `main`)
- **Runtime:** Node.js >= 22

## Commands

```bash
npm run dev         # Vite dev server
npm run build       # TypeScript check + Vite build
npm run preview     # Preview production build
npm run test        # Run tests
npm run test:watch  # Watch mode tests
npm run lint        # ESLint check
npm run typecheck   # TypeScript type checking (no emit)
```

## Architecture Constraints

1. **Client-side only.** All game logic runs in the browser. No backend.
2. **Stockfish via WASM.** The AI engine runs entirely client-side via Web Workers. Do not change the engine interface.
3. **Three difficulty levels.** Implemented by adjusting Stockfish depth and evaluation limits. Keep the abstraction clean.
4. **Desktop-first.** The UI is designed for desktop play. Mobile is a secondary concern.
5. **Chess.js is the source of truth.** All game state lives in chess.js. The UI renders from it.

## Branch Naming

- `feat/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes
- `refactor/*` — Code restructuring
- `chore/*` — Maintenance tasks

## Workflow

1. Always branch from `main`: `feat/description`, `fix/description`, etc.
2. Run `npm run lint && npm run typecheck && npm run build && npm run test` before every PR.
3. Open a pull request for every merge into `main`.
4. No direct pushes to `main`.
5. CI must pass before merge.

## Security

- Never commit `.env*` files (already has `.env.local` sensitive data — ensure it is gitignored).
- No API keys or secrets are needed for this client-side-only application.
