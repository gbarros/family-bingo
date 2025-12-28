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

    async registerPlayer(name: string, peerId: string, userAgent?: string): Promise<Player> {
        // Create a stable ID from the player's name
        const stableId = `player-${name.toLowerCase().replace(/\s+/g, '-')}`;

        const players = await this.storage.getAllPlayers();
        const existingPlayer = players.find(p => p.id === stableId);

        if (existingPlayer) {
            console.log(`[Engine] Reconnecting player ${name} (Peer ID: ${existingPlayer.peerId} -> ${peerId})`);

            // Update peerId but keep everything else (card, markings, stable ID)
            const reconnectedPlayer: Player = {
                ...existingPlayer,
                peerId: peerId,
                lastActive: Date.now(),
                userAgent: userAgent || existingPlayer.userAgent
            };

            // Just update in place - no removal needed since ID stays the same
            await this.storage.addPlayer(reconnectedPlayer);

            this.emit('playerJoined', { id: reconnectedPlayer.id, name: reconnectedPlayer.name });
            return reconnectedPlayer;
        }

        const card = generateCard();
        const player: Player = {
            id: stableId,
            peerId: peerId,
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

    async updatePlayerMarking(playerId: string, position: number, marked: boolean): Promise<void> {
        const player = await this.storage.getPlayer(playerId);
        if (player) {
            const markings = [...player.markings];
            markings[position] = marked;

            const updatedPlayer = { ...player, markings, lastActive: Date.now() };
            await this.storage.addPlayer(updatedPlayer);

            // We don't broadcast this to everyone to avoid noise, 
            // but the host UI will correct itself on next sync/poll
        }
    }

    async validateBingo(playerId: string): Promise<{ isValid: boolean; winnerName?: string; pattern?: string }> {
        const player = await this.storage.getPlayer(playerId);
        const session = await this.storage.getSession();

        if (!player || !session) return { isValid: false };

        // Server-Authoritative Validation:
        // Instead of believing the player's markings, we verify if the numbers on their card
        // have actually been drawn.
        const drawnSet = new Set(await this.storage.getDrawnNumbers());

        // Construct the "true" markings based on drawn numbers
        // Position 12 (center) is always marked (FREE)
        const validatedMarkings = player.cardData.map((num, index) => {
            if (index === 12) return true; // FREE space
            return drawnSet.has(num);
        });

        // Use the validated markings for checking bingo
        const isValid = validateBingo(player.cardData, validatedMarkings, session.gameMode);

        if (isValid) {
            const pattern = getWinningPattern(player.cardData, validatedMarkings, session.gameMode);
            this.emit('bingo', {
                playerName: player.name,
                pattern: pattern || 'BINGO'
            });
            return { isValid: true, winnerName: player.name, pattern: pattern || 'BINGO' };
        }

        return { isValid: false };
    }
}
