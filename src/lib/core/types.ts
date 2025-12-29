import { GameMode } from "@/types/game";

export interface GameState {
    sessionId: string;
    gameMode: GameMode;
    status: 'active' | 'finished';
    drawnNumbers: number[];
    startTime: number;
}

export interface Player {
    id: string;           // Stable ID (derived from name)
    peerId: string;       // Current WebRTC peer ID (changes on reconnection)
    name: string;
    cardData: number[];   // 25 numbers
    markings: boolean[];  // 25 booleans
    deviceId?: string;
    userAgent?: string;
    lastActive?: number;
}

export interface GameEvent {
    type: 'numberDrawn' | 'playerJoined' | 'playerDisconnected' | 'bingo' | 'gameStateChanged' | 'chat';
    data: any;
    timestamp: number;
}

/**
 * Interface for storage adapters (SQLite or In-Memory)
 */
export interface GameStorage {
    // Session
    getSession(): Promise<GameState | null>;
    createSession(id: string, mode: GameMode): Promise<GameState>;
    updateSessionStatus(status: 'active' | 'finished'): Promise<void>;
    updateSessionMode(mode: GameMode): Promise<void>;

    // Numbers
    addDrawnNumber(number: number): Promise<void>;
    getDrawnNumbers(): Promise<number[]>;

    // Players
    addPlayer(player: Player): Promise<void>;
    getPlayer(id: string): Promise<Player | null>;
    getAllPlayers(): Promise<Player[]>;
    updatePlayerActivity(id: string): Promise<void>;
    removePlayer(id: string): Promise<void>;
    clearAll(): Promise<void>;
}
