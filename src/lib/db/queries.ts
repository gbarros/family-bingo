// All database queries for Christmas Bingo
// Using better-sqlite3 synchronous API

import { getDatabase } from './index';
import type { Session, Player, DrawnNumber, PlayerMarking } from '@/types/game';

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Get active session (status: waiting or active)
 */
export function getActiveSession(): Session | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM sessions
    WHERE status IN ('waiting', 'active')
    ORDER BY created_at DESC
    LIMIT 1
  `).get();

  return row as Session | null;
}

/**
 * Create new session
 */
export function createSession(gameMode: 'horizontal' | 'vertical' | 'diagonal' | 'blackout'): Session {
  const db = getDatabase();
  const now = Date.now();

  const result = db.prepare(`
    INSERT INTO sessions (status, game_mode, created_at)
    VALUES ('waiting', ?, ?)
  `).run(gameMode, now);

  return {
    id: result.lastInsertRowid as number,
    status: 'waiting',
    game_mode: gameMode,
    created_at: now,
    started_at: null,
    finished_at: null,
    winner_player_id: null,
  };
}

/**
 * Update session status
 */
export function updateSessionStatus(
  sessionId: number,
  status: 'waiting' | 'active' | 'finished',
  winnerId?: number
): void {
  const db = getDatabase();
  const now = Date.now();

  if (status === 'active') {
    db.prepare(`
      UPDATE sessions
      SET status = ?, started_at = ?
      WHERE id = ?
    `).run(status, now, sessionId);
  } else if (status === 'finished') {
    db.prepare(`
      UPDATE sessions
      SET status = ?, finished_at = ?, winner_player_id = ?
      WHERE id = ?
    `).run(status, now, winnerId || null, sessionId);
  } else {
    db.prepare(`
      UPDATE sessions
      SET status = ?
      WHERE id = ?
    `).run(status, sessionId);
  }
}

/**
 * Update session game mode (can be changed mid-game)
 */
export function updateSessionGameMode(
  sessionId: number,
  gameMode: 'horizontal' | 'vertical' | 'diagonal' | 'blackout'
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE sessions
    SET game_mode = ?
    WHERE id = ?
  `).run(gameMode, sessionId);
}

// ============================================================================
// PLAYER QUERIES
// ============================================================================

/**
 * Create new player
 */
export function createPlayer(
  sessionId: number,
  name: string,
  clientId: string,
  cardData: number[]
): Player {
  const db = getDatabase();
  const now = Date.now();

  const result = db.prepare(`
    INSERT INTO players (session_id, name, client_id, card_data, connected, joined_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `).run(sessionId, name, clientId, JSON.stringify(cardData), now);

  return {
    id: result.lastInsertRowid as number,
    session_id: sessionId,
    name,
    client_id: clientId,
    card_data: JSON.stringify(cardData),
    connected: true,
    joined_at: now,
  };
}

/**
 * Get player by client ID
 */
export function getPlayerByClientId(clientId: string): Player | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM players WHERE client_id = ?').get(clientId);
  return row as Player | null;
}

/**
 * Get player by ID
 */
export function getPlayerById(playerId: number): Player | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  return row as Player | null;
}

/**
 * Get all players in session
 */
export function getPlayersBySession(sessionId: number): Player[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM players WHERE session_id = ? ORDER BY joined_at').all(sessionId);
  return rows as Player[];
}

/**
 * Update player connection status
 */
export function updatePlayerConnection(playerId: number, connected: boolean): void {
  const db = getDatabase();
  db.prepare('UPDATE players SET connected = ? WHERE id = ?').run(connected ? 1 : 0, playerId);
}

/**
 * Delete a player and their markings (used for "reset user" flows)
 */
export function deletePlayerById(playerId: number): void {
  const db = getDatabase();

  const tx = db.transaction(() => {
    // If this player is referenced as a winner, clear it.
    db.prepare('UPDATE sessions SET winner_player_id = NULL WHERE winner_player_id = ?').run(playerId);
    // Remove markings first
    db.prepare('DELETE FROM player_markings WHERE player_id = ?').run(playerId);
    // Remove player
    db.prepare('DELETE FROM players WHERE id = ?').run(playerId);
  });

  tx();
}

/**
 * Delete a player by clientId (used from the player device)
 */
export function deletePlayerByClientId(clientId: string): void {
  const db = getDatabase();
  const player = db.prepare('SELECT id FROM players WHERE client_id = ?').get(clientId) as { id: number } | undefined;
  if (!player) return;
  deletePlayerById(player.id);
}

/**
 * Wipe all players and their markings (admin operation)
 */
export function wipeAllPlayers(): void {
  const db = getDatabase();

  const tx = db.transaction(() => {
    db.prepare('UPDATE sessions SET winner_player_id = NULL WHERE winner_player_id IS NOT NULL').run();
    db.prepare('DELETE FROM player_markings').run();
    db.prepare('DELETE FROM players').run();
  });

  tx();
}

// ============================================================================
// DRAWN NUMBERS QUERIES
// ============================================================================

/**
 * Add drawn number to session
 */
export function addDrawnNumber(sessionId: number, number: number): DrawnNumber {
  const db = getDatabase();
  const now = Date.now();

  const result = db.prepare(`
    INSERT OR IGNORE INTO drawn_numbers (session_id, number, drawn_at)
    VALUES (?, ?, ?)
  `).run(sessionId, number, now);

  return {
    id: (result.lastInsertRowid as number) || 0,
    session_id: sessionId,
    number,
    drawn_at: now,
  };
}

/**
 * Get all drawn numbers for session
 */
export function getDrawnNumbers(sessionId: number): DrawnNumber[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM drawn_numbers
    WHERE session_id = ?
    ORDER BY drawn_at
  `).all(sessionId);
  return rows as DrawnNumber[];
}

/**
 * Get already drawn numbers (just the numbers, not full records)
 */
export function getDrawnNumbersSet(sessionId: number): Set<number> {
  const numbers = getDrawnNumbers(sessionId);
  return new Set(numbers.map(n => n.number));
}

// ============================================================================
// PLAYER MARKINGS QUERIES
// ============================================================================

/**
 * Mark or unmark a number on player's card
 */
export function togglePlayerMarking(playerId: number, position: number, marked: boolean): void {
  const db = getDatabase();
  const now = Date.now();

  // Use INSERT OR REPLACE to handle both insert and update
  db.prepare(`
    INSERT OR REPLACE INTO player_markings (player_id, position, marked, marked_at)
    VALUES (?, ?, ?, ?)
  `).run(playerId, position, marked ? 1 : 0, now);
}

/**
 * Get all markings for a player
 */
export function getPlayerMarkings(playerId: number): PlayerMarking[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM player_markings
    WHERE player_id = ? AND marked = 1
    ORDER BY position
  `).all(playerId);
  return rows as PlayerMarking[];
}

/**
 * Get player markings as boolean array (25 positions)
 */
export function getPlayerMarkingsArray(playerId: number): boolean[] {
  const markings = getPlayerMarkings(playerId);
  const markingsSet = new Set(markings.map(m => m.position));

  // Create array of 25 booleans
  const result: boolean[] = Array(25).fill(false);

  // Mark positions 12 (FREE center) as always true
  result[12] = true;

  // Mark user's selections
  for (let i = 0; i < 25; i++) {
    if (markingsSet.has(i)) {
      result[i] = true;
    }
  }

  return result;
}

// ============================================================================
// MANAGER AUTH QUERIES
// ============================================================================

/**
 * Get manager password hash
 */
export function getManagerPasswordHash(): string {
  const db = getDatabase();
  const row = db.prepare('SELECT password_hash FROM manager_auth WHERE id = 1').get() as { password_hash: string };
  return row.password_hash;
}

/**
 * Update manager password hash
 */
export function updateManagerPasswordHash(newHash: string): void {
  const db = getDatabase();
  db.prepare('UPDATE manager_auth SET password_hash = ? WHERE id = 1').run(newHash);
}
