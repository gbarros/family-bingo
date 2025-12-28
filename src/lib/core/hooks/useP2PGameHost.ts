import { useState, useEffect, useRef, useCallback } from 'react';
import { GameHost, GameHostState } from '../hostTypes';
import { GameEngine } from '../GameEngine';
import { LocalStorageStorage } from '../adapters/LocalStorageStorage';
import { GameMode, PlayerWithCard } from '@/types/game';
import { Peer, DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

export function useP2PGameHost(enabled: boolean = true): GameHost {
    const [state, setState] = useState<GameHostState>({
        sessionId: null,
        status: null,
        mode: 'horizontal',
        players: [],
        drawnNumbers: [],
        currentNumber: null,
        isConnected: false,
        isBusy: false,
        joinSecret: undefined,
    });

    const [persistedIds, setPersistedIds] = useState<{ id: string, secret: string } | null>(null);

    const engineRef = useRef<GameEngine | null>(null);
    const storageRef = useRef<LocalStorageStorage | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
    const lastPingRef = useRef<Map<string, number>>(new Map());
    const secretRef = useRef<string>(uuidv4().slice(0, 8));

    // Load persisted IDs on mount
    useEffect(() => {
        if (!enabled) return;
        const storedId = localStorage.getItem('bingoP2PHostId');
        const storedSecret = localStorage.getItem('bingoP2PJoinSecret');

        if (storedId && storedSecret) {
            console.log('[P2P Host] Restoring persisted IDs:', storedId);
            secretRef.current = storedSecret;
            setPersistedIds({ id: storedId, secret: storedSecret });
            setState(prev => ({ ...prev, sessionId: storedId, joinSecret: storedSecret }));
        } else {
            const newId = `bingo-host-${uuidv4().slice(0, 8)}`;
            const newSecret = uuidv4().slice(0, 8);
            localStorage.setItem('bingoP2PHostId', newId);
            localStorage.setItem('bingoP2PJoinSecret', newSecret);
            secretRef.current = newSecret;
            setPersistedIds({ id: newId, secret: newSecret });
            setState(prev => ({ ...prev, sessionId: newId, joinSecret: newSecret }));
        }
    }, [enabled]);

    const broadcast = useCallback((type: string, data: any) => {
        if (!enabled) return;
        connectionsRef.current.forEach(conn => {
            if (conn.open) {
                conn.send({ type, ...data });
            }
        });
    }, [enabled]);

    const initialize = useCallback(async () => {
        if (!enabled || !persistedIds) return;

        const storage = new LocalStorageStorage(persistedIds.id);
        storageRef.current = storage;

        const hydratePlayers = (list: any[]) => {
            return list.map((p: any) => ({
                id: p.id,
                name: p.name,
                client_id: p.id,
                session_id: 1,
                card_data: JSON.stringify(p.cardData),
                card: p.cardData,
                connected: connectionsRef.current.get(p.id)?.open ?? false
            }));
        };

        // Pre-hydrate state from storage immediately
        const initialPlayers = await storage.getAllPlayers();
        const initialSession = await storage.getSession();

        setState(prev => ({
            ...prev,
            status: initialSession?.status ?? null,
            mode: initialSession?.gameMode ?? 'horizontal',
            drawnNumbers: initialSession?.drawnNumbers ?? [],
            currentNumber: initialSession?.drawnNumbers.length ? initialSession.drawnNumbers[initialSession.drawnNumbers.length - 1] : null,
            players: hydratePlayers(initialPlayers) as any
        }));

        const syncPlayers = async () => {
            const players = await storage.getAllPlayers();
            const now = Date.now();

            setState(prev => {
                const newPlayerList = players.map((p: any) => {
                    const conn = connectionsRef.current.get(p.id);
                    const lastPing = lastPingRef.current.get(p.id) || 0;
                    const isSilent = now - lastPing > 25000; // 25 seconds mark as offline

                    return {
                        id: p.id,
                        name: p.name,
                        client_id: p.id,
                        session_id: 1,
                        card_data: JSON.stringify(p.cardData),
                        card: p.cardData,
                        connected: (conn?.open ?? false) && !isSilent
                    };
                });

                // Only update if something actually changed to avoid render loops
                if (JSON.stringify(newPlayerList) === JSON.stringify(prev.players)) {
                    return prev;
                }
                return { ...prev, players: newPlayerList as any };
            });
        };

        const engine = new GameEngine(storage, (event) => {
            broadcast(event.type, event.data);
            if (event.type === 'numberDrawn') {
                setState(prev => ({
                    ...prev,
                    drawnNumbers: [...prev.drawnNumbers, event.data.number],
                    currentNumber: event.data.number,
                    isBusy: false
                }));
            }
            if (event.type === 'gameStateChanged') {
                setState(prev => ({ ...prev, status: event.data.status, mode: event.data.gameMode }));
            }
            if (event.type === 'playerJoined') {
                syncPlayers();
            }
        });
        engineRef.current = engine;

        const { Peer } = await import('peerjs');
        const peer = new Peer(persistedIds.id);
        peerRef.current = peer;

        peer.on('open', (id) => {
            setState(prev => ({ ...prev, isConnected: true }));
            syncPlayers();
        });

        peer.on('connection', (conn) => {
            const clientSecret = conn.metadata?.secret;
            if (clientSecret !== secretRef.current) {
                conn.close();
                return;
            }

            conn.on('open', () => {
                console.log(`[P2P Host] New connection from ${conn.peer}`);
                connectionsRef.current.set(conn.peer, conn);
                lastPingRef.current.set(conn.peer, Date.now());
                syncPlayers();
            });

            conn.on('data', async (data: any) => {
                if (data.type === 'join') {
                    const name = data.name?.trim();
                    if (!name) return;

                    const players = await storage.getAllPlayers();
                    const existingPlayer = players.find(p => p.name.toLowerCase() === name.toLowerCase());

                    if (existingPlayer) {
                        const conn = connectionsRef.current.get(existingPlayer.id);
                        const isConnected = conn?.open ?? false;
                        if (isConnected && existingPlayer.id !== conn?.peer) {
                            conn?.send({
                                type: 'error',
                                message: 'Este nome já está sendo usado e o jogador está online.',
                                conflict: true
                            });
                            return;
                        }
                    }

                    const player = await engine.registerPlayer(name, conn.peer);
                    const session = await storage.getSession();
                    const drawnNumbers = await storage.getDrawnNumbers();

                    conn.send({
                        type: 'welcome',
                        playerId: player.id,
                        card: player.cardData,
                        clientId: player.id,
                        gameStatus: session?.status || 'waiting',
                        drawnNumbers: drawnNumbers || []
                    });
                    syncPlayers();
                }
                if (data.type === 'ping') {
                    lastPingRef.current.set(conn.peer, Date.now());
                    // Frequent short pings from client trigger a sync to keep UI fresh
                    syncPlayers();
                }
            });

            conn.on('close', () => {
                console.log(`[P2P Host] Connection closed: ${conn.peer}`);
                connectionsRef.current.delete(conn.peer);
                lastPingRef.current.delete(conn.peer);
                syncPlayers();
            });

            conn.on('error', (err) => {
                connectionsRef.current.delete(conn.peer);
                lastPingRef.current.delete(conn.peer);
                syncPlayers();
            });
        });

        // Fast prune interval for responsive UI
        const pruneInterval = setInterval(() => {
            let changed = false;
            const now = Date.now();
            connectionsRef.current.forEach((conn, peerId) => {
                const lastPing = lastPingRef.current.get(peerId) || 0;
                const isSilent = now - lastPing > 25000;

                if (!conn.open || isSilent) {
                    if (conn.open) conn.close();
                    connectionsRef.current.delete(peerId);
                    lastPingRef.current.delete(peerId);
                    changed = true;
                }
            });
            // Regular sync even if not pruned to update presence dots (since syncPlayers checks silence)
            syncPlayers();
        }, 5000);

        return () => {
            clearInterval(pruneInterval);
        };
    }, [broadcast, enabled, persistedIds]);

    useEffect(() => {
        if (enabled) {
            initialize();
        }
        return () => {
            peerRef.current?.destroy();
        };
    }, [initialize, enabled]);

    const createSession = async (mode: GameMode) => {
        if (engineRef.current) {
            await engineRef.current.initializeGame(state.sessionId || 'local', mode);

            // Regenerate cards for all connected players
            const updatedPlayers = await engineRef.current.resetAllPlayers();

            // Broadcast new cards to each player
            updatedPlayers.forEach(player => {
                const conn = connectionsRef.current.get(player.id);
                if (conn && conn.open) {
                    conn.send({
                        type: 'welcome',
                        playerId: player.id,
                        card: player.cardData,
                        clientId: player.id
                    });
                }
            });

            // Refresh UI
            const players = await storageRef.current?.getAllPlayers() || [];
            setState(prev => ({
                ...prev,
                players: players.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    client_id: p.id,
                    session_id: 1,
                    card_data: JSON.stringify(p.cardData),
                    card: p.cardData,
                    connected: connectionsRef.current.get(p.id)?.open ?? false
                } as any))
            }));
        }
    };

    const startGame = async () => {
        setState(prev => ({ ...prev, status: 'active' }));
        broadcast('gameStateChanged', { status: 'active' });
    };

    const drawNumber = async () => {
        setState(prev => ({ ...prev, isBusy: true }));
        if (engineRef.current) {
            await engineRef.current.drawNextNumber();
        }
    };

    const changeMode = async (mode: GameMode) => {
        setState(prev => ({ ...prev, mode }));
        broadcast('gameStateChanged', { mode });
    };

    const validateBingo = async (playerId: string) => {
        if (engineRef.current) {
            const result = await engineRef.current.validateBingo(playerId);
            if (result.isValid) {
                alert(`✅ BINGO VÁLIDO!\n\n${result.winnerName}`);
            } else {
                alert(`❌ INVÁLIDO`);
            }
        }
    };

    const newGame = async () => {
        if (!engineRef.current || !state.sessionId) return;

        // Reset session (clears drawn numbers)
        await engineRef.current.initializeGame(state.sessionId, state.mode);

        // Regenerate cards for all players
        const updatedPlayers = await engineRef.current.resetAllPlayers();

        // Send each player their new card
        updatedPlayers.forEach(player => {
            const conn = connectionsRef.current.get(player.id);
            if (conn && conn.open) {
                conn.send({
                    type: 'gameReset',
                    card: player.cardData,
                    playerId: player.id
                });
            }
        });

        // Also broadcast gameEnded for any clients that might not receive gameReset
        broadcast('gameEnded', { reset: true });

        // Update host UI
        setState(prev => ({ ...prev, status: 'waiting', drawnNumbers: [], currentNumber: null }));

        // Refresh player list in UI
        const players = await storageRef.current?.getAllPlayers() || [];
        setState(prev => ({
            ...prev,
            players: players.map((p: any) => ({
                id: p.id,
                name: p.name,
                client_id: p.id,
                session_id: 1,
                card_data: JSON.stringify(p.cardData),
                card: p.cardData,
                connected: connectionsRef.current.get(p.id)?.open ?? false
            } as any))
        }));
    };

    return {
        ...state,
        createSession,
        startGame,
        drawNumber,
        changeMode,
        validateBingo,
        newGame,
        resetPlayer: async () => { },
        wipePlayers: async () => {
            if (storageRef.current) {
                await storageRef.current.clearAll();
                setState(prev => ({ ...prev, players: [], drawnNumbers: [], currentNumber: null, status: null }));
            }
        },
    };
}
