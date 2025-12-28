# Family Bingo: Design & Features

## Core Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (via `better-sqlite3`) for local persistence.
- **Real-time Updates**: Server-Sent Events (SSE).
- **Styling**: Tailwind CSS with a custom Christmas theme design system.

## Key Features

### 1. Player Identification & Connection Tracking

**Problem**: 
- Players losing their session when the browser tab closes or refreshes.
- "Dangling" users remaining in the game when they are actually disconnected.
- Name collisions when a user tries to rejoin or a new user picks a taken name.

**Solution**:
- **Client ID**: A UUID is generated for each player and stored in `localStorage` (`bingoClientId`). This allows the browser to "remember" the user.
- **Device Fingerprinting**: The `User-Agent` is captured upon join to help identify devices (e.g., "Chrome on iPhone").
- **Presence System**: 
  - The SSE manager tracks active connections by `clientId`.
  - When a connection drops, the system updates the player's status to "Offline".
  - When a connection is re-established, status becomes "Online".

### 2. Join & Reconnect Flow

**Join Flow**:
1. User enters name.
2. Server checks if name is taken in valid active session.
   - **If taken**: Returns `409 Conflict` with details about the existing session (device type, online status).
   - **User Decision**:
     - *Claim*: "Sim, sou eu!" -> Calls `/api/player/claim` to take over the session (or add a device).
     - *Reject*: "Não, sou outra pessoa" -> User must pick a different name.
   - **If new**: Creates new player record with `card_data`, `clientId`, and `user_agent`.

**Reconnect Flow**:
1. App loads -> Checks `localStorage` for `bingoClientId`.
2. Calls `/api/player/reconnect`.
3. If valid, server returns player state (card, markings, session ID).
4. App restores state and reconnects SSE with `?clientId=...` to mark presence.

### 3. Manager Dashboard

- **Real-time Connectivity**: 
  - Player list updates instantly via SSE `playerPresence` events.
  - **Online**: Green pulsing indicator.
  - **Offline**: Grayed out with "(Offline)" label.
- **Device Tracking**: Tooltips show the device type for each player.
- **Game Controls**: Create session, Start game, Draw numbers (manual/auto), Validate Bingo.

### 4. Game Logic (Backend-Authoritative)

- **Bingo Card Generation**: 
  - 5x5 grid (Standard 75-ball US Bingo).
  - Columns: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75).
  - Center is FREE.
- **Validation**:
  - `/api/game/validate` checks if a player has a winning pattern (Horizontal, Vertical, Diagonal, or Blackout depending on mode).
  - Server verifies based on `drawn_numbers` in the database, preventing client-side cheating.

## Database Schema

**`sessions`**
- `id`, `status` (waiting/active/finished), `game_mode`, `timestamps`

**`players`**
- `id`, `session_id`, `name`, `client_id` (UUID), `card_data` (JSON), `connected` (BOOL), `user_agent` (TEXT), `last_active` (INT)

**`drawn_numbers`**
- `session_id`, `number`, `drawn_at`

**`player_markings`**
- `player_id`, `position`, `marked`

## API Endpoints

- `GET /api/session`: Current game state.
- `POST /api/player/join`: Join new game.
- `POST /api/player/claim`: Recover session by name (conflict resolution).
- `POST /api/player/reconnect`: Restore session by `clientId`.
- `POST /api/player/mark`: Toggle mark on card.
- `GET /api/events`: SSE stream (supports `?clientId=...`).
