// Database schema for Christmas Bingo
// All tables and indexes for SQLite database

export const createTablesSQL = `
-- sessions: one active session at a time
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL CHECK(status IN ('waiting', 'active', 'finished')),
    game_mode TEXT NOT NULL CHECK(game_mode IN ('horizontal', 'vertical', 'diagonal', 'blackout')),
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    finished_at INTEGER,
    winner_player_id INTEGER,
    FOREIGN KEY (winner_player_id) REFERENCES players(id)
);

-- players: players with clientId for reconnection
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    client_id TEXT NOT NULL UNIQUE,
    card_data TEXT NOT NULL,
    connected BOOLEAN DEFAULT 1,
    user_agent TEXT,
    last_active INTEGER,
    joined_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- drawn_numbers: numbers already drawn in current session
CREATE TABLE IF NOT EXISTS drawn_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    number INTEGER NOT NULL CHECK(number >= 1 AND number <= 75),
    drawn_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- player_markings: numbers marked by each player
CREATE TABLE IF NOT EXISTS player_markings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    position INTEGER NOT NULL CHECK(position >= 0 AND position <= 24),
    marked BOOLEAN NOT NULL DEFAULT 1,
    marked_at INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(player_id, position)
);

-- manager_auth: password hash for manager/coordinator
CREATE TABLE IF NOT EXISTS manager_auth (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    password_hash TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_client ON players(client_id);
CREATE INDEX IF NOT EXISTS idx_drawn_session ON drawn_numbers(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_drawn_unique ON drawn_numbers(session_id, number);
CREATE INDEX IF NOT EXISTS idx_markings_player ON player_markings(player_id);
`;
