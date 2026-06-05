# Contributing to Chess by Sparsh

Chess by Sparsh is intentionally small, local-first, and focused. Contributions should preserve that character.

---

## Contribution Priorities

The most useful contributions are:

- Chess rule edge-case tests
- Accessibility improvements (keyboard navigation, screen reader support, contrast)
- Small UI clarity or readability improvements
- FEN handling edge cases
- Documentation improvements
- Performance or maintainability improvements
- Bug fixes with clear reproduction steps
- Computer opponent evaluation improvements (include before/after benchmarks)

---

## Scope Boundaries

The following must **not** be added without an explicit project decision recorded in a decision document:

- Online multiplayer
- User accounts or authentication
- Backend services or server-side computation
- Stockfish or other external chess engine
- Ratings, ladders, or matchmaking
- Payments, subscriptions, or donations handling
- Telemetry, analytics, or data collection
- Social features (chat, profiles, friends)

---

## Development Checklist

Before opening a pull request or merging a change, run:

```bash
npm test
npm run build
npm run lint
```

All three must pass. Documentation-only changes (`.md` files only, no code or config) may skip runtime checks.

---

## Commit Guidance

Prefer small, descriptive commits with conventional commit prefixes.

**Good examples:**

```text
feat: add computer opponent with three difficulty bands
feat(chess): improve king safety evaluation at club level
fix: handle invalid FEN input gracefully
test: add promotion edge cases
docs: clarify localStorage behavior
refactor(settings): extract ModeSelector as standalone component
```

**Prefixes:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `style:`.

When a change touches specific source files, add a scope: `feat(chess):`, `fix(board):`, `test(settings):`, etc.

---

## Project Structure

```text
.
├── .github/
│   ├── workflows/ci.yml
│   ├── FUNDING.yml
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── assets/
│   └── screenshots/
│       └── chess-main.png
├── src/
│   ├── app/              — App entry, CSS
│   ├── chess/            — AI engine (computer, evaluate, PST, difficulty)
│   ├── components/       — UI by area (Board, Game, GameControls, Settings, etc.)
│   ├── hooks/            — React hooks (useChessGame, useSettings)
│   ├── lib/              — utility modules (storage)
│   ├── types/            — shared TypeScript types
│   └── __tests__/        — test files
├── ARCHITECTURE.md
├── ROADMAP.md
├── CHANGELOG.md
├── AGENTS.md
├── CONTRIBUTING.md
├── SECURITY.md
└── package.json
```

## Naming Rule

The visible product name is always:

```text
Chess by Sparsh
```

Use `chess-by-sparsh` as the technical repository slug, package name, URL paths, and storage keys.
