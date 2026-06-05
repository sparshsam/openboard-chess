# Chess by Sparsh

**Repository:** openboard-chess

> Open-source chess board focused on clean local play, accurate rules, move history, and portable game records.

## About

Chess by Sparsh is a lightweight, local-first chess application built for two human players on the same device. It provides a clean, distraction-free interface with full chess rules validation via [chess.js](https://github.com/jhlywa/chess.js).

### v0.1.0 — Local-Only MVP

| Feature | Status |
|---------|--------|
| 8×8 board with Unicode pieces | ✅ |
| Click-to-select and legal move highlighting | ✅ |
| Full chess rules (en passant, castling, promotion) | ✅ |
| Move history in algebraic notation | ✅ |
| FEN export/import | ✅ |
| Game status (turn, check, checkmate, stalemate, draw) | ✅ |
| Pawn promotion dialog | ✅ |
| localStorage persistence | ✅ |
| Responsive layout | ✅ |

### What's intentionally deferred from v0.1.0

- ❌ No online multiplayer
- ❌ No AI engine / computer opponent
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
