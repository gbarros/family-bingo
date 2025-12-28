import { GameStorage, GameState, Player } from "../types";
import { GameMode } from "@/types/game";

export class MemoryStorage implements GameStorage {
    private session: GameState | null = null;
    private players: Map<string, Player> = new Map();
    private drawnNumbers: number[] = [];

    async getSession(): Promise<GameState | null> {
        return this.session;
    }

    async createSession(id: string, mode: GameMode): Promise<GameState> {
        this.drawnNumbers = [];
        this.session = {
            sessionId: id,
            gameMode: mode,
            status: 'active',
            drawnNumbers: [],
            startTime: Date.now()
        };
        return this.session;
    }

    async updateSessionStatus(status: 'active' | 'finished'): Promise<void> {
        if (this.session) {
            this.session.status = status;
        }
    }

    async addDrawnNumber(number: number): Promise<void> {
        this.drawnNumbers.push(number);
        if (this.session) {
            this.session.drawnNumbers = [...this.drawnNumbers];
        }
    }

    async getDrawnNumbers(): Promise<number[]> {
        return this.drawnNumbers;
    }

    async addPlayer(player: Player): Promise<void> {
        this.players.set(player.id, player);
    }

    async getPlayer(id: string): Promise<Player | null> {
        return this.players.get(id) || null;
    }

    async getAllPlayers(): Promise<Player[]> {
        return Array.from(this.players.values());
    }

    async updatePlayerActivity(id: string): Promise<void> {
        const player = this.players.get(id);
        if (player) {
            player.lastActive = Date.now();
        }
    }

    async removePlayer(id: string): Promise<void> {
        this.players.delete(id);
    }

    async clearAll(): Promise<void> {
        this.session = null;
        this.players.clear();
        this.drawnNumbers = [];
    }
}
