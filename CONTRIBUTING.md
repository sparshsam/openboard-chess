# Contributing to Chess by Sparsh

Chess by Sparsh is intentionally small and local-first. Contributions should preserve that character.

## Contribution Priorities

Useful contributions include:

- chess rule edge-case tests;
- accessibility improvements;
- small UI clarity improvements;
- FEN handling improvements;
- documentation improvements;
- performance or maintainability improvements;
- bug fixes with clear reproduction steps.

## Scope Boundaries

Do not add the following without an explicit project decision:

- online multiplayer;
- user accounts;
- backend services;
- AI opponent or engine analysis;
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
fix: handle invalid FEN input gracefully
test: add promotion edge cases
docs: clarify localStorage behavior
```

## Naming Rule

The visible product name is always:

```text
Chess by Sparsh
```

Use `openboard-chess` only as the technical repository slug or internal key where necessary.
