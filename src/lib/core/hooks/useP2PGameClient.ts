import { useState, useEffect, useCallback, useRef } from 'react';
import { GameClient, GameClientState } from '../clientTypes';
import { Peer, DataConnection } from 'peerjs';

export function useP2PGameClient(hostId?: string, secret?: string): GameClient {
    const [state, setState] = useState<GameClientState>({
        isConnected: false,
        gameStatus: 'none',
        drawnNumbers: [],
        currentNumber: null,
        card: [],
        markings: Array(25).fill(false),
        playerName: null,
        playerId: null,
        clientId: null,
        isBusy: false,
        error: undefined,
    });

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const requestedNameRef = useRef<string | null>(null);
    const connectionAttemptRef = useRef<number>(0);

    const setupConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            console.log('[P2P Client] Connection to host established');
            setState(prev => ({ ...prev, isConnected: true, error: undefined }));
            connRef.current = conn;

            // If the user already clicked "Join" or we are reconnecting
            const nameToJoin = requestedNameRef.current || localStorage.getItem('bingoLastPlayerName');
            if (nameToJoin) {
                console.log('[P2P Client] Automatically joining/reconnecting as:', nameToJoin);
                conn.send({ type: 'join', name: nameToJoin });
            }
        });

        conn.on('data', (data: any) => {
            console.log('[P2P Client] Data received:', data.type);
            handleIncomingData(data);
        });

        conn.on('error', (err) => {
            console.error('[P2P Client] Connection error:', err);
            setState(prev => ({ ...prev, isConnected: false }));
        });

        conn.on('close', () => {
            console.warn('[P2P Client] Connection closed');
            setState(prev => ({ ...prev, isConnected: false }));
            connRef.current = null;
        });
    }, []);

    const connect = useCallback(async (targetId: string, joinSecret?: string) => {
        if (connRef.current?.open) return;

        const { Peer } = await import('peerjs');

        // Ensure we have a peer object
        if (!peerRef.current || peerRef.current.destroyed) {
            console.log('[P2P Client] Creating new Peer instance');
            const peer = new Peer();
            peerRef.current = peer;

            peer.on('open', (id) => {
                console.log('[P2P Client] Peer opened with ID:', id);
                setState(prev => ({ ...prev, clientId: id }));

                const conn = peer.connect(targetId, {
                    metadata: { secret: joinSecret, timestamp: Date.now() }
                });
                setupConnection(conn);
            });

            peer.on('error', (err) => {
                console.error('[P2P Client] Peer error:', err.type);
                if (err.type === 'peer-unavailable') {
                    // Host not found, will retry via effect
                }
                setState(prev => ({ ...prev, isConnected: false }));
            });
        } else if (peerRef.current.open) {
            console.log('[P2P Client] Reconnecting to host...');
            const conn = peerRef.current.connect(targetId, {
                metadata: { secret: joinSecret, timestamp: Date.now() }
            });
            setupConnection(conn);
        }
    }, [setupConnection]);

    const handleIncomingData = (data: any) => {
        if (!data) return;

        switch (data.type) {
            case 'welcome':
                requestedNameRef.current = null;
                setState(prev => ({
                    ...prev,
                    playerId: String(data.playerId),
                    card: data.card,
                    markings: new Array(25).fill(false).map((_, i) => i === 12),
                    isBusy: false,
                    playerName: prev.playerName || localStorage.getItem('bingoLastPlayerName'),
                    // Sync with current game state from host
                    drawnNumbers: data.drawnNumbers || [],
                    currentNumber: data.drawnNumbers?.length > 0
                        ? data.drawnNumbers[data.drawnNumbers.length - 1]
                        : null,
                    gameStatus: data.gameStatus || 'waiting'
                }));
                break;
            case 'numberDrawn':
                setState(prev => {
                    // Prevent duplicates (race condition fix)
                    if (prev.drawnNumbers.includes(data.number)) {
                        return prev;
                    }
                    return {
                        ...prev,
                        drawnNumbers: [...prev.drawnNumbers, data.number],
                        currentNumber: data.number
                    };
                });
                break;
            case 'gameStateChanged':
                setState(prev => ({
                    ...prev,
                    gameStatus: data.status || prev.gameStatus,
                    drawnNumbers: data.drawnNumbers !== undefined ? data.drawnNumbers : prev.drawnNumbers,
                    currentNumber: data.drawnNumbers && data.drawnNumbers.length > 0
                        ? data.drawnNumbers[data.drawnNumbers.length - 1]
                        : (data.drawnNumbers?.length === 0 ? null : prev.currentNumber)
                }));
                break;
            case 'gameEnded':
                // Game ended - show waiting state, clear numbers but keep card
                setState(prev => ({
                    ...prev,
                    gameStatus: 'waiting',
                    drawnNumbers: [],
                    currentNumber: null,
                    markings: new Array(25).fill(false).map((_, i) => i === 12),
                    winner: undefined
                }));
                break;
            case 'gameReset':
                // Full reset with new card
                setState(prev => ({
                    ...prev,
                    card: data.card || prev.card,
                    markings: new Array(25).fill(false).map((_, i) => i === 12),
                    drawnNumbers: [],
                    currentNumber: null,
                    gameStatus: 'waiting',
                    winner: undefined
                }));
                break;
            case 'bingo':
                setState(prev => ({ ...prev, winner: { name: data.playerName, pattern: data.pattern } }));
                break;
            case 'error':
                setState(prev => ({ ...prev, error: data.message, isBusy: false }));
                break;
        }

    };

    // Heartbeat
    useEffect(() => {
        if (!state.isConnected) return;

        const interval = setInterval(() => {
            if (connRef.current && connRef.current.open) {
                connRef.current.send({ type: 'ping', timestamp: Date.now() });
            }
        }, 10000); // Heartbeat every 10 seconds for more responsive "online" status

        return () => clearInterval(interval);
    }, [state.isConnected]);

    // Reconnection Monitor
    useEffect(() => {
        if (!hostId) return;

        const monitor = setInterval(() => {
            if (!state.isConnected) {
                console.log('[P2P Client] Not connected. Attempting reconnection...');
                connect(hostId, secret);
            }
        }, 3000); // Check and retry every 3 seconds

        return () => clearInterval(monitor);
    }, [hostId, secret, state.isConnected, connect]);

    const join = async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setState(prev => ({ ...prev, isBusy: true, playerName: trimmedName, error: undefined }));
        requestedNameRef.current = trimmedName;
        localStorage.setItem('bingoLastPlayerName', trimmedName);

        if (connRef.current && connRef.current.open) {
            connRef.current.send({ type: 'join', name: trimmedName });
        }
    };

    const mark = async (position: number, marked: boolean) => {
        setState(prev => {
            const next = [...prev.markings];
            next[position] = marked;
            return { ...prev, markings: next };
        });
        if (connRef.current) {
            connRef.current.send({ type: 'mark', position, marked });
        }
    };

    return {
        ...state,
        join,
        mark,
        claim: async () => { },
        reconnect: async () => {
            if (hostId) connect(hostId, secret);
        },
        leave: () => {
            peerRef.current?.destroy();
            localStorage.removeItem('bingoLastPlayerName');
            window.location.href = '/';
        }
    };
}
