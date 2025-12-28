// API request/response types

import type { GameMode, GameStatus, PlayerWithCard } from './game';

// ============================================================================
// SESSION API TYPES
// ============================================================================

export interface CreateSessionRequest {
  gameMode: GameMode;
}

export interface CreateSessionResponse {
  success: boolean;
  sessionId: number;
  gameMode: GameMode;
}

export interface UpdateSessionRequest {
  status?: GameStatus;
  gameMode?: GameMode;
  winnerId?: number;
}

export interface GetSessionResponse {
  success: boolean;
  session: {
    id: number;
    status: GameStatus;
    gameMode: GameMode;
    createdAt: number;
    startedAt: number | null;
    finishedAt: number | null;
    winnerPlayerId: number | null;
  } | null;
  players: PlayerWithCard[];
  drawnNumbers: number[];
  currentNumber: number | null;
}

// ============================================================================
// PLAYER API TYPES
// ============================================================================

export interface JoinSessionRequest {
  name: string;
}

export interface JoinSessionResponse {
  success: boolean;
  playerId: number;
  clientId: string;
  card: number[];
  sessionId: number;
}

export interface ReconnectRequest {
  clientId: string;
}

export interface ReconnectResponse {
  success: boolean;
  name: string;
  playerId: number;
  clientId: string; // Added field
  card: number[]; // 25 numbers
  markings: boolean[]; // 25 booleans
  sessionId: number;
  sessionStatus: 'active' | 'waiting' | 'finished';
}

export interface MarkNumberRequest {
  playerId: number;
  position: number; // 0-24
  marked: boolean;
}

export interface MarkNumberResponse {
  success: boolean;
}

// ============================================================================
// GAME ACTION API TYPES
// ============================================================================

export interface DrawNumberResponse {
  success: boolean;
  number: number;
  drawnNumbers: number[];
}

export interface ValidateBingoRequest {
  playerId: number;
}

export interface ValidateBingoResponse {
  success: boolean;
  isValid: boolean;
  playerName?: string;
  card?: number[];
  markings?: boolean[];
  winningPattern?: string;
}

// ============================================================================
// MANAGER AUTH API TYPES
// ============================================================================

export interface ManagerAuthRequest {
  password: string;
}

export interface ManagerAuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// ============================================================================
// ERROR RESPONSE
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}
