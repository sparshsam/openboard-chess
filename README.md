# Chess by Sparsh

**Repository:** openboard-chess

> Open-source chess board focused on clean local play, accurate rules, move history, and portable game records.

## About

Chess by Sparsh is a lightweight, local-first chess application. It now defaults to **User vs Computer** mode, with **Local Two Player** still available as an option. Full chess rules validation is handled by [chess.js](https://github.com/jhlywa/chess.js).

### v0.2.0 — Computer Opponent

| Feature | Status |
|---------|--------|
| User vs Computer (default mode) | ✅ |
| Local Two Player (optional mode) | ✅ |
| Easy difficulty (random legal moves) | ✅ |
| Medium difficulty (material-aware) | ✅ |
| Hard difficulty (strong heuristic) | ✅ |
| 8×8 board with Unicode pieces | ✅ |
| Click-to-select and legal move highlighting | ✅ |
| Full chess rules (en passant, castling, promotion) | ✅ |
| Move history in algebraic notation | ✅ |
| FEN export/import | ✅ |
| Pawn promotion dialog | ✅ |
| localStorage persistence | ✅ |
| Responsive layout | ✅ |
| Computer "thinking" indicator | ✅ |

### Difficulty Modes

- **Easy** — Picks random legal moves. Good for absolute beginners.
- **Medium** — Material-aware selection. Prefers captures, checks, and reasonable material gain. Adds a small random factor for variety.
- **Hard** — Stronger heuristic with piece-square tables, MVV-LVA capture scoring, check/checkmate detection, promotion bonuses, and basic blunder avoidance. Picks the best move from top candidates with weighted randomness.

### What's intentionally deferred

- ❌ No online multiplayer
- ❌ No AI engine / Stockfish integration
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
- **Deployment:** Vercel

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

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
