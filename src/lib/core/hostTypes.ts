import { GameMode, GameStatus, PlayerWithCard } from "@/types/game";

export interface GameHostState {
    sessionId: string | null;
    status: GameStatus | null;
    mode: GameMode;
    players: PlayerWithCard[];
    drawnNumbers: number[];
    currentNumber: number | null;
    isConnected: boolean;
    isBusy: boolean;
    joinSecret?: string;
}

export interface GameHostActions {
    createSession: (mode: GameMode) => Promise<void>;
    startGame: () => Promise<void>;
    drawNumber: () => Promise<void>;
    changeMode: (mode: GameMode) => Promise<void>;
    validateBingo: (playerId: string) => Promise<void>;
    newGame: () => Promise<void>;
    resetPlayer: (playerId: string) => Promise<void>;
    wipePlayers: () => Promise<void>;
}

export type GameHost = GameHostState & GameHostActions;
