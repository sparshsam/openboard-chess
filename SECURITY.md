# Security and Data Boundary

Chess by Sparsh is a **local-first chess board**. The app is a static client-side web application that operates entirely in the browser and does not communicate with any server.

---

## Current Data Model

The app stores local game state and user settings in the user's browser through `localStorage`.

**Stored data may include:**

- Current FEN and move history
- Timestamp of the saved state
- User preferences (game mode, difficulty, board orientation)

**The current app does not require or process:**

- User accounts or passwords
- Server-side game storage
- Payment information
- Private keys or credentials
- Personal profile data
- Email addresses
- Any identifiers

---

## What This Means

- No data is transmitted over the network
- No cookies are set by the application
- No third-party scripts, analytics, or tracking are loaded
- No data is shared with any service
- No data leaves the browser

The app contains no external network requests beyond the initial page load from Vercel's static hosting.

---

## Reporting Issues

For public bugs, open a GitHub issue at https://github.com/sparshsam/chess-by-sparsh/issues with:

- A clear description of the issue
- Expected vs actual behavior
- Reproduction steps
- Browser and operating system (if relevant)

Do **not** include secrets, credentials, personal documents, or private information in public issues.

---

## Security Scope

The following features would require a separate design and security review before implementation:

- Online multiplayer
- Authentication or user identity
- Server-side storage
- Social features (chat, profiles, friend lists)
- Payments or donations
- Third-party analytics or telemetry
- Engine services running outside the browser
- Any feature that transmits data from the browser

---

## Claims Boundary

This project does **not** claim to be:

- Audited by a security professional
- Enterprise-secure or SOC2-compliant
- Tournament-certified or FIDE-approved
- Suitable for regulated competitive play
- End-to-end encrypted
- Suitable for storing sensitive information
