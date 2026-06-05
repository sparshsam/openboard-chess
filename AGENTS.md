# Agent Operating Notes

This file gives AI coding agents a compact operating brief for Chess by Sparsh.

## Product Identity

- Visible name: **Chess by Sparsh**
- Repository slug: `chess-by-sparsh`
- Current release: `v0.1.0`
- Product type: local-first chess board

Use **Chess by Sparsh** in visible product copy. Use `chess-by-sparsh` only when referring to the repository slug, package name, URLs, or internal storage keys.

## Current Scope

The current app supports:

- local two-player chess;
- accurate move validation through `chess.js`;
- legal move highlighting;
- move history;
- FEN import and export;
- local browser persistence;
- pawn promotion;
- game status display.

## Do Not Add Without a Decision

- Online multiplayer.
- User accounts.
- Backend services.
- AI opponent.
- Stockfish or other engine analysis.
- Ratings, ladders, or matchmaking.
- Payments.
- Telemetry.

## Required Checks

Before finishing a code change, run:

```bash
npm test
npm run build
npm run lint
```

Documentation-only changes may skip runtime checks if no code, package, config, or test files are touched.

## Development Preference

- Keep changes small.
- Prefer tests for rule behavior.
- Keep UI calm and readable.
- Preserve local-first behavior.
- Avoid broad rewrites unless there is a clear maintenance reason.
