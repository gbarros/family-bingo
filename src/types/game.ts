// Game types for Christmas Bingo

export type GameStatus = 'waiting' | 'active' | 'finished';
// Can be a single mode or comma-separated list (e.g. 'horizontal,vertical')
export type GameMode = string;

export interface Session {
  id: number;
  status: GameStatus;
  game_mode: GameMode;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  winner_player_id: number | null;
}

export interface Player {
  id: number | string;
  session_id: number;
  name: string;
  client_id: string;
  card_data: string; // JSON string of number[]
  connected: boolean;
  user_agent?: string;
  last_active?: number;
  joined_at: number;
}

export interface DrawnNumber {
  id: number;
  session_id: number;
  number: number;
  drawn_at: number;
}

export interface PlayerMarking {
  id: number;
  player_id: number;
  position: number; // 0-24
  marked: boolean;
  marked_at: number;
}

// Helper types for client-side use
export interface PlayerWithCard extends Omit<Player, 'card_data'> {
  card: number[]; // Parsed card_data
  deviceCount?: number;
}

export interface GameState {
  session: Session;
  players: PlayerWithCard[];
  drawnNumbers: number[];
  currentNumber: number | null;
}
