# Sprout — family money, together

One widget for the whole circle.

Kids earn through chores, lessons and savings goals. Parents watch the family ledger. Friends split life’s little bills. The two pots never mix.

This repo is the interactive concept for **Sprout**: a family banking OS with a dark, cinematic widget UI.

## What’s in the demo

**Family ledger** (kids only)

- Parent view: kid balances, chore approvals, weekly earnings, learning progress
- Kid view: open chores, money-school chapters, savings-goal ring
- Switch persona between Maya (parent), Leo (12) and Zoe (9)

**Circle ledger** (friends only)

- Split a dinner, movie night or road-trip fuel
- Nudge who still owes, settle shares, see a per-friend net position

Demo household: Maya Chen, Leo, Zoe, plus four friends (Dev, Arjun, Nina, Sofia).

## Run it

```bash
npm install
npm run dev
```

Opens on [http://localhost:3000](http://localhost:3000).

No Postgres required. The app uses [PGlite](https://pglite.dev/) (Postgres-in-WASM) and seeds demo data on first load. Data lives in `./data/sprout`.

## Stack

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS 4 · Framer Motion · Lucide
- Drizzle ORM + PGlite

## Layout

```
src/app/          pages + API routes (tasks, goals, lessons, splits)
src/components/   WidgetApp, parent / kid / circle views, orbit, modals
src/db/           schema, seed household, PGlite bootstrap
src/lib/          state builder + money helpers
```
