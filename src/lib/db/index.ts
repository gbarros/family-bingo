// Database singleton connection
// Using better-sqlite3 for synchronous SQLite access

import Database from 'better-sqlite3';
import { createTablesSQL } from './schema';
import { hashSync } from 'bcrypt';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'bingo.db');

let db: Database.Database | null = null;

/**
 * Get or create database connection (singleton pattern)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Initialize schema
    db.exec(createTablesSQL);

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
