# Chess by Sparsh

**Repository:** chess-by-sparsh

> Open-source chess board focused on clean local play, accurate rules, move history, and portable game records.

## About

Chess by Sparsh is a lightweight, local-first chess application. It defaults to **User vs Computer** mode with rating-inspired difficulty levels, while **Local Two Player** is still available as an option. Full chess rules validation is handled by [chess.js](https://github.com/jhlywa/chess.js).

### v0.2.0 — Computer Opponent

| Feature | Status |
|---------|--------|
| User vs Computer (default mode) | ✅ |
| Local Two Player (optional mode) | ✅ |
| Beginner (~800) difficulty | ✅ |
| Casual (~1000) difficulty | ✅ |
| Club (~1400) difficulty | ✅ |
| 8×8 board with Unicode pieces | ✅ |
| Click-to-select and legal move highlighting | ✅ |
| Full chess rules (en passant, castling, promotion) | ✅ |
| Move history in algebraic notation | ✅ |
| FEN export/import | ✅ |
| Pawn promotion dialog | ✅ |
| localStorage persistence | ✅ |
| Responsive layout | ✅ |
| Computer "thinking" indicator | ✅ |

> **Note:** Difficulty labels are **approximate skill bands**, not official Elo ratings. The computer opponent has not been benchmarked against any rating system — these labels are simply inspired by common chess rating tiers.

### Difficulty Levels

- **Beginner (~800)** — PREFERS obvious captures and recaptures over random play. Avoids the most obvious one‑move blunders when simple to detect. Still plays with significant randomness and will miss tactics. Suited for new players still learning how pieces move.

- **Casual (~1000)** — Stronger material awareness. Deliberately prefers captures and checks, develops knights and bishops toward the center, avoids obvious blunders more consistently, and handles simple threats better. Castles when practical. Suited for casual players who know basic strategy.

- **Club (~1400)** — More disciplined heuristic play. Uses piece‑square tables for positional evaluation, MVV‑LVA capture scoring, check/checkmate detection with high confidence, king safety and castling awareness, open‑file preference for rooks, and central pawn control. Suited for club‑level players who want a competent practice partner.

### What's intentionally deferred

- ❌ No online multiplayer
- ❌ No Stockfish or external engine integration
- ❌ No user accounts or authentication
- ❌ No telemetry, analytics, or tracking
- ❌ No drag-and-drop piece movement (click-to-select only)
- ❌ No PGN export/import
- ❌ No takeback / undo move
- ❌ No board flip / perspective toggle
- ❌ No sound effects or animations
- ❌ No clock / timed play

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 8
- **Chess Engine:** chess.js 1.4
- **Board UI:** Custom-rendered (no wrapper library)
- **Testing:** Vitest + @testing-library/react
- **Persistence:** localStorage
- **CI:** GitHub Actions (test, build, lint)
- **Deployment:** Vercel

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Build for production
npm run build
```

## Deployment (Vercel)

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

The Vite build output is automatically configured for Vercel — no additional configuration needed.

## License

MIT
