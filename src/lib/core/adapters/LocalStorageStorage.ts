import { GameStorage, GameState, Player } from "../types";
import { GameMode } from "@/types/game";

export class LocalStorageStorage implements GameStorage {
    private key: string;
    private data: {
        session: GameState | null;
        players: Player[];
        drawnNumbers: number[];
    };

    constructor(sessionId: string) {
        this.key = `bingo_p2p_host_${sessionId}`;
        const saved = typeof window !== 'undefined' ? localStorage.getItem(this.key) : null;
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (e) {
                this.data = this.getDefaults();
            }
        } else {
            this.data = this.getDefaults();
        }
    }

    private getDefaults() {
        return {
            session: null,
            players: [],
            drawnNumbers: [],
        };
    }

    private save() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.key, JSON.stringify(this.data));
        }
    }

    async getSession(): Promise<GameState | null> {
        return this.data.session;
    }

    async createSession(id: string, mode: GameMode): Promise<GameState> {
        this.data.drawnNumbers = [];
        this.data.session = {
            sessionId: id,
            gameMode: mode,
            status: 'active',  // Note: Host will set to 'waiting' in UI until game starts
            drawnNumbers: [],
            startTime: Date.now()
        };
        this.save();
        return this.data.session;
    }

    async updateSessionStatus(status: 'active' | 'finished'): Promise<void> {
        if (this.data.session) {
            this.data.session.status = status;
            this.save();
        }
    }

    async addDrawnNumber(number: number): Promise<void> {
        if (!this.data.drawnNumbers.includes(number)) {
            this.data.drawnNumbers.push(number);
            if (this.data.session) {
                this.data.session.drawnNumbers = [...this.data.drawnNumbers];
            }
            this.save();
        }
    }

    async getDrawnNumbers(): Promise<number[]> {
        return this.data.drawnNumbers;
    }

    async addPlayer(player: Player): Promise<void> {
        const index = this.data.players.findIndex(p => p.id === player.id);
        if (index >= 0) {
            this.data.players[index] = player;
        } else {
            this.data.players.push(player);
        }
        this.save();
    }

    async getPlayer(id: string): Promise<Player | null> {
        return this.data.players.find(p => p.id === id) || null;
    }

    async getAllPlayers(): Promise<Player[]> {
        return this.data.players;
    }

    async updatePlayerActivity(id: string): Promise<void> {
        const player = this.data.players.find(p => p.id === id);
        if (player) {
            player.lastActive = Date.now();
            this.save();
        }
    }

    async removePlayer(id: string): Promise<void> {
        this.data.players = this.data.players.filter(p => p.id !== id);
        this.save();
    }

    async clearAll(): Promise<void> {
        this.data = this.getDefaults();
        this.save();
    }
}
