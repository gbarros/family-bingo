# Christmas Bingo (Family Game) — Project Plan

This file is meant to keep the **project goals and current assumptions** clear while we iterate together.

## Goals (what this repo is trying to do)

- **Self-hosted family bingo** playable from phones/laptops on the same network.
- **Language policy**: we develop/discuss implementation in **English**, but the **app UI/copy stays PT-BR**.
- **Two roles**
  - **Players** join from `/`, get a unique 5x5 card (American 75-ball format) and mark cells.
  - **Coordinator/Manager** controls the game from `/manager`: create session, choose mode, start, draw numbers, validate bingo.
- **Real-time updates** via **Server-Sent Events (SSE)** so players see drawn numbers immediately.
- **Persistence** via **SQLite** so the game is resilient to server restarts.
- **Easy deployment** via Docker + `docker-compose`, with `data/` as a persistent volume.

## Current architecture (as implemented)

- **Frontend**: Next.js App Router, TypeScript, Tailwind.
- **Backend**: Next.js route handlers under `src/app/api/*`.
- **Real-time**: `/api/events` streams SSE; server broadcasts events to all connected clients.
- **Database**: `better-sqlite3` with tables:
  - `sessions`, `players`, `drawn_numbers`, `player_markings`, `manager_auth`

## Known assumptions (please confirm/correct)

- **One active session at a time**: “active” means `waiting` or `active` (not `finished`).
- **Reconnect scope**: reconnect works while a session is `waiting` or `active`; after the game is `finished`, reconnect currently fails (because there is no “active session” anymore).
- **Security model is intentionally light**: it’s a family game, not production auth.

## Things that look risky / likely issues

- **Manager API protection**: the UI has a manager password flow, but most manager-only endpoints do not appear to verify a manager token/password server-side (anyone on the network could call them directly).
- **SSE is process-local**: broadcasts only reach clients connected to the same Node process (fine for single-instance; not horizontally scalable without extra infra).
- **Session event payloads**: some broadcasts send empty strings for `status`/`mode` (clients handle this via truthy checks, but it’s easy to regress).

## Next fixes to prioritize (proposed)

- Enforce **manager authorization** on manager-only endpoints:
  - `/api/session` (POST), `/api/session/[id]` (PATCH), `/api/draw` (POST), `/api/validate` (POST)
- Decide desired behavior for **reconnect after game finished**:
  - keep “last session” readable for reconnect, or clear local player state on finish, etc.


