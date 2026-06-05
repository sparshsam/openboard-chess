# Contributing to Chess by Sparsh

Chess by Sparsh is intentionally small, local-first, and focused. Contributions should preserve that character.

## Contribution Priorities

Useful contributions include:

- chess rule edge-case tests;
- accessibility improvements;
- small UI clarity improvements;
- FEN handling improvements;
- documentation improvements;
- performance or maintainability improvements;
- bug fixes with clear reproduction steps;
- computer opponent evaluation improvements (with before/after benchmarks).

## Scope Boundaries

Do not add the following without an explicit project decision:

- online multiplayer;
- user accounts;
- backend services;
- Stockfish or other strong engine integration without clear labeling;
- ratings or matchmaking;
- payments;
- broad platform features.

## Development Checklist

Before opening or merging a change, run:

```bash
npm test
npm run build
npm run lint
```

## Commit Guidance

Prefer small, descriptive commits.

Good examples:

```text
feat: add computer opponent with three difficulty bands
fix: handle invalid FEN input gracefully
test: add promotion edge cases
docs: clarify localStorage behavior
```

## Project Structure

```text
src/
  app/              — App entry, CSS
  chess/            — AI engine (computer, evaluate, PST, difficulty)
  components/       — UI by area (Board, Game, GameControls, Settings, etc.)
  hooks/            — React hooks (useChessGame, useSettings)
  lib/              — utility modules (storage)
  types/            — shared TypeScript types
  __tests__/        — test files
```

## Naming Rule

The visible product name is always:

```text
Chess by Sparsh
```

Use `chess-by-sparsh` as the technical repository slug, package name, and storage keys.
