# Chess by Sparsh — Agent Notes

## Product Identity

- **Visible name:** Chess by Sparsh
- **Repository slug:** `chess-by-sparsh`
- **Former slug:** `openboard-chess` (redirects via 301)
- **Current release:** v0.2.0
- **Product type:** local-first chess app with computer opponent

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 8
- **Chess Engine:** chess.js 1.4
- **Testing:** Vitest + @testing-library/react
- **CI:** GitHub Actions (`.github/workflows/ci.yml` — `check` job)
- **Deployment:** Vercel — `--prod` from root
- **Storage:** localStorage (game state + settings)

## Game Modes

- **User vs Computer** (default) — user plays White, computer plays Black
- **Local Two Player** (optional, via mode selector)

## Difficulty Levels (rating-inspired, not official Elo)

| Level | Strategy |
|-------|----------|
| **Beginner (~800)** | Obvious captures/recaptures, avoids simplest one-move blunders, significant randomness |
| **Casual (~1000)** | MVV-LVA capture scoring, check preference, development, castling, better blunder avoidance |
| **Club (~1400)** | Piece-square tables, confident mate/capture detection, king safety, open-file rooks, center control |

Computer opponent lives in `src/computer/computerOpponent.ts`. The disclaimer text "Approximate skill bands, not official Elo ratings." appears below the difficulty buttons.

## Key Architecture

- `src/hooks/useChessGame.ts` — All game state via `useChessGame()` hook (lazy `useState` init, no `useEffect` for loading state)
- `src/computer/computerOpponent.ts` — `getComputerMove(game, difficulty)` returns a legal move
- `src/computer/types.ts` — `Difficulty` and `GameMode` type definitions + labels + disclaimer
- `src/utils/storage.ts` — Game save/load + settings persistence with legacy key migration
- `src/components/ModeSelector.tsx` — Mode + difficulty toggle UI

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm test             # Run tests (Vitest)
npm run build        # TypeScript check + production build
npm run lint         # ESLint
```

## Deployment

```bash
vercel --prod --scope "sparsh-sams-projects"
```

Production URL: https://chess-by-sparsh.vercel.app/
Old URL (secondary): https://openboard-chess.vercel.app/

## Constraints (Do Not Add Without Decision)

- Online multiplayer
- User accounts or authentication
- Backend services
- Stockfish or external engine integration
- Ratings, ladders, or matchmaking
- Payments
- Telemetry, analytics, or tracking
- Drag-and-drop piece movement
- PGN export/import
- Takeback / undo move
- Board flip / perspective toggle
- Sound effects or animations
- Clock / timed play

## Required Checks Before Finishing

```bash
npm test
npm run build
npm run lint
```

## Repository History

The repo was renamed from `sparshsam/openboard-chess` to `sparshsam/chess-by-sparsh` on 2026-06-05.
GitHub returns a 301 redirect from the old URL.
