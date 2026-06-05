# Security and Data Boundary

Chess by Sparsh is a local-first chess board. The app is a static client-side web app that does not communicate with a server.

## Current Data Model

The app stores local game state and user settings in the user's browser through `localStorage`.

Saved data may include:

- current FEN and move history;
- timestamp of the saved state;
- user preferences (game mode, difficulty, board orientation).

The current app does not require:

- user accounts;
- passwords;
- server-side game storage;
- payment information;
- private keys;
- personal profile data.

## Reporting Issues

For public bugs, open a GitHub issue with:

- what happened;
- expected behavior;
- reproduction steps;
- browser and operating system if relevant.

Do not include secrets, credentials, personal documents, or private information in public issues.

## Security Scope

The following would require a separate design review before implementation:

- online multiplayer;
- authentication;
- server-side storage;
- social features;
- payments;
- third-party analytics;
- engine services running outside the browser.

## Claims Boundary

This project does not claim to be audited, enterprise-secure, tournament-certified, or suitable for regulated competitive play.
