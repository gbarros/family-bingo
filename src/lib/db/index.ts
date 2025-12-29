// Database singleton connection
// Using better-sqlite3 for synchronous SQLite access

import Database from 'better-sqlite3';
import { createTablesSQL } from './schema';
import { hashSync } from 'bcrypt';
import path from 'path';

// Migration helper
function ensureColumns(db: Database.Database) {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(players)").all() as any[];
    const columns = new Set(tableInfo.map(c => c.name));

    if (!columns.has('user_agent')) {
      console.log('[DB] Migrating: Adding user_agent to players');
      db.prepare("ALTER TABLE players ADD COLUMN user_agent TEXT").run();
    }
    if (!columns.has('last_active')) {
      console.log('[DB] Migrating: Adding last_active to players');
      db.prepare("ALTER TABLE players ADD COLUMN last_active INTEGER").run();
    }
  } catch (err) {
    console.error('[DB] Migration failed:', err);
  }
}

function ensureSessionsSchema(db: Database.Database) {
  try {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions'").get() as {
      sql?: string;
    } | undefined;

    if (!row?.sql) return;
    if (!row.sql.includes('CHECK(game_mode')) return;

    console.log('[DB] Migrating: Updating sessions.game_mode constraint');

    db.exec('PRAGMA foreign_keys = OFF;');
    const migrate = db.transaction(() => {
      db.exec(`
        ALTER TABLE sessions RENAME TO sessions_old;
        CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL CHECK(status IN ('waiting', 'active', 'finished')),
            game_mode TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            started_at INTEGER,
            finished_at INTEGER,
            winner_player_id INTEGER,
            FOREIGN KEY (winner_player_id) REFERENCES players(id)
        );
        INSERT INTO sessions (id, status, game_mode, created_at, started_at, finished_at, winner_player_id)
        SELECT id, status, game_mode, created_at, started_at, finished_at, winner_player_id FROM sessions_old;
        DROP TABLE sessions_old;
      `);
    });
    migrate();
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.error('[DB] Sessions migration failed:', err);
    try {
      db.exec('PRAGMA foreign_keys = ON;');
    } catch {}
  }
}

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'bingo.db');

let db: Database.Database | null = null;

/**
 * Get or create database connection (singleton pattern)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dirname = path.dirname(DB_PATH);
    const fs = require('fs');
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Initialize schema
    db.exec(createTablesSQL);

    // Run migrations
    ensureColumns(db);
    ensureSessionsSchema(db);

    // Initialize manager password if not exists
    initializeManagerPassword(db);

    console.log(`[DB] Database initialized at ${DB_PATH}`);
  }

  return db;
}

/**
 * Initialize manager password hash if it doesn't exist
 */
function initializeManagerPassword(database: Database.Database) {
  const managerPassword = process.env.MANAGER_PASSWORD || 'changeme';

  const existing = database.prepare('SELECT id FROM manager_auth WHERE id = 1').get();

  if (!existing) {
    const passwordHash = hashSync(managerPassword, 10);
    database.prepare('INSERT INTO manager_auth (id, password_hash) VALUES (1, ?)').run(passwordHash);
    console.log('[DB] Manager password initialized');
  }
}

/**
 * Close database connection (for cleanup)
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Run integrity check on database
 */
export function checkIntegrity(): boolean {
  const database = getDatabase();
  const result = database.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
  return result.integrity_check === 'ok';
}
