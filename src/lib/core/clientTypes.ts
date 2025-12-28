export interface GameClientState {
    isConnected: boolean;
    gameStatus: 'none' | 'waiting' | 'active' | 'finished';
    drawnNumbers: number[];
    currentNumber: number | null;
    card: number[];
    markings: boolean[];
    playerName: string | null;
    playerId: string | null;
    clientId: string | null;
    winner?: { name: string; pattern: string };
    error?: string;
    conflictData?: {
        existingDevice: string;
        alreadyConnected: boolean;
    } | null;
    isBusy?: boolean;
}

export interface GameClientActions {
    join: (name: string) => Promise<void>;
    claim: (name: string) => Promise<void>;
    mark: (position: number, marked: boolean) => Promise<void>;
    reconnect: (clientId: string) => Promise<void>;
    leave: () => void;
}

export type GameClient = GameClientState & GameClientActions;
