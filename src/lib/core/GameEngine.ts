import { GameStorage, GameState, Player, GameEvent } from "./types";
import { drawRandomNumber } from "../game/numberDrawer";
import { validateBingo, getWinningPattern } from "../game/validator";
import { generateCard } from "../game/cardGenerator";

export class GameEngine {
    private storage: GameStorage;
    private onEvent?: (event: GameEvent) => void;

    constructor(storage: GameStorage, onEvent?: (event: GameEvent) => void) {
        this.storage = storage;
        this.onEvent = onEvent;
    }

    private emit(type: GameEvent['type'], data: any) {
        if (this.onEvent) {
            this.onEvent({
                type,
                data,
                timestamp: Date.now(),
            });
        }
    }

    async initializeGame(id: string, mode: string): Promise<GameState> {
        const session = await this.storage.createSession(id, mode as any);
        this.emit('gameStateChanged', session);
        return session;
    }

    async drawNextNumber(): Promise<number | null> {
        const session = await this.storage.getSession();
        if (!session || session.status !== 'active') return null;

        const drawnSet = new Set(await this.storage.getDrawnNumbers());
        const newNumber = drawRandomNumber(drawnSet);

        if (newNumber !== null) {
            await this.storage.addDrawnNumber(newNumber);
            this.emit('numberDrawn', { number: newNumber, timestamp: Date.now() });
        }

        return newNumber;
    }

    async registerPlayer(name: string, playerId: string, userAgent?: string): Promise<Player> {
        const players = await this.storage.getAllPlayers();
        const existingPlayer = players.find(p => p.name.toLowerCase() === name.toLowerCase());

        if (existingPlayer) {
            console.log(`[Engine] Reconnecting player ${name} (Previous ID: ${existingPlayer.id}, New ID: ${playerId})`);

            // Update with new ID but keep card and markings
            const reconnectedPlayer: Player = {
                ...existingPlayer,
                id: playerId,
                lastActive: Date.now(),
                userAgent: userAgent || existingPlayer.userAgent
            };

            // Add new ID first so they don't disappear from list during transition
            await this.storage.addPlayer(reconnectedPlayer);

            if (existingPlayer.id !== playerId) {
                await this.storage.removePlayer(existingPlayer.id);
            }

            this.emit('playerJoined', { id: reconnectedPlayer.id, name: reconnectedPlayer.name });
            return reconnectedPlayer;
        }

        const card = generateCard();
        const player: Player = {
            id: playerId,
            name,
            cardData: card,
            markings: new Array(25).fill(false),
            userAgent,
            lastActive: Date.now()
        };

        await this.storage.addPlayer(player);
        this.emit('playerJoined', { id: player.id, name: player.name });
        return player;
    }

    async resetAllPlayers(): Promise<Player[]> {
        const players = await this.storage.getAllPlayers();
        const updatedPlayers: Player[] = [];

        for (const player of players) {
            const newCard = generateCard();
            const updatedPlayer: Player = {
                ...player,
                cardData: newCard,
                markings: new Array(25).fill(false),
                lastActive: Date.now()
            };
            await this.storage.addPlayer(updatedPlayer);
            updatedPlayers.push(updatedPlayer);
        }
        return updatedPlayers;
    }

    async validateBingo(playerId: string): Promise<{ isValid: boolean; winnerName?: string; pattern?: string }> {
        const player = await this.storage.getPlayer(playerId);
        const session = await this.storage.getSession();

        if (!player || !session) return { isValid: false };

        const isValid = validateBingo(player.cardData, player.markings, session.gameMode);

        if (isValid) {
            const pattern = getWinningPattern(player.cardData, player.markings, session.gameMode);
            this.emit('bingo', {
                playerName: player.name,
                pattern: pattern || 'BINGO'
            });
            return { isValid: true, winnerName: player.name, pattern: pattern || 'BINGO' };
        }

        return { isValid: false };
    }
}
