# Deployment Guide — Chess by Sparsh

> **Last updated:** 2026-06-06  
> **Live URL:** https://chess-by-sparsh.vercel.app  
> **Repository:** sparshsam/chess-by-sparsh

---

## 1. Overview

Chess by Sparsh is deployed on Vercel with automatic git-based deployments.

| Property | Value |
|----------|-------|
| Vercel Project | chess-by-sparsh |
| Production Domain | chess-by-sparsh.vercel.app |
| Production Branch | main |
| Git Integration | Connected to sparshsam/chess-by-sparsh |
| Auto-deploy on push | Enabled |
| PR Previews | Enabled |

---

## 2. Git Integration

The Vercel project is linked to sparshsam/chess-by-sparsh via the Vercel GitHub App.

### Auto-Deploy Rules

| Event | What Happens |
|-------|-------------|
| Push/merge to main | Triggers a production deployment |
| PR opened/updated | Creates a preview deployment |
| PR closed/merged | Preview deployment removed |

### What to Avoid

| Action | Problem |
|--------|---------|
| vercel deploy --prod from a non-main branch | Overrides production with wrong code |
| Manually deploying from feature/PR branches | Bypasses review and main-branch guarantees |

> Only main should hit production. Use PRs for all changes.

---

## 3. Deployment Protection

Vercel Authentication (SSO) is enabled on this project:

| Setting | Value |
|---------|-------|
| SSO Protection | all_except_custom_domains |
| Git Fork Protection | Enabled |
| Custom Domains | None configured |

### What This Means

- Visiting chess-by-sparsh.vercel.app requires a Vercel login
- The site is not publicly accessible without auth
- Authorized team members can view via SSO
- Disable protection in: Vercel Dashboard > Project > Settings > Protection

---

## 4. Local Development

```
npm install
npm run dev
npm test
npm run test:watch
npm run typecheck
npm run build
npm run preview
```

---

## 5. Manual Production Deploy

Only when needed outside of a git push:

```
git checkout main
git pull
vercel deploy --prod --yes
```

Wrong-branch guard: verify git branch --show-current returns main.

---

## 6. Checking What Is Deployed

```
vercel inspect chess-by-sparsh.vercel.app
vercel list chess-by-sparsh
gh api repos/sparshsam/chess-by-sparsh/branches/main --jq .commit.sha
```

---

## 7. Rollback

Vercel Dashboard > chess-by-sparsh > Deployments > Promote to Production

```
vercel rollback chess-by-sparsh.vercel.app --yes
```

---

## 8. Quick Reference

```
Repository:    sparshsam/chess-by-sparsh
Live URL:      https://chess-by-sparsh.vercel.app
Vercel Team:   sparsh-sams-projects
Vercel Dash:   https://vercel.com/sparsh-sams-projects/chess-by-sparsh
Build:         npm run build (tsc -b && vite build)
Output:        dist/
Node Version:  24.x
Config:        vercel.json (COOP/COEP headers for Stockfish)
```
