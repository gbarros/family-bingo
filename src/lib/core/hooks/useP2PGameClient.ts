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
    const deviceIdRef = useRef<string | null>(null);

    const retryCountRef = useRef(0);
    const MAX_RETRIES = 5;

    // Use a ref to always access the latest handler (fixes stale closure issue)
    const handleIncomingDataRef = useRef<(data: any) => void>(() => { });

    const getDeviceId = () => {
        if (deviceIdRef.current) return deviceIdRef.current;
        if (typeof window === 'undefined') return null;
        let stored = localStorage.getItem('bingoP2PDeviceId');
        if (!stored) {
            if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
                stored = crypto.randomUUID();
            } else {
                stored = `p2p-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
            }
            localStorage.setItem('bingoP2PDeviceId', stored);
        }
        deviceIdRef.current = stored;
        return stored;
    };

    // Define the handler and keep the ref updated
    handleIncomingDataRef.current = (data: any) => {
        if (!data) return;

        console.log('[P2P Client] Processing:', data.type, data);

        switch (data.type) {
            case 'welcome':
                requestedNameRef.current = null;
                const baseMarkings = Array.isArray(data.markings)
                    ? data.markings
                    : new Array(25).fill(false);
                if (baseMarkings.length === 25) {
                    baseMarkings[12] = true;
                }
                setState(prev => ({
                    ...prev,
                    playerId: String(data.playerId),
                    card: data.card,
                    markings: baseMarkings.length === 25
                        ? baseMarkings
                        : new Array(25).fill(false).map((_, i) => i === 12),
                    isBusy: false,
                    conflictData: null,
                    error: undefined,
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
                console.log('[P2P Client] Number drawn:', data.number);
                setState(prev => {
                    // Prevent duplicates (race condition fix)
                    if (prev.drawnNumbers.includes(data.number)) {
                        console.log('[P2P Client] Duplicate number, skipping');
                        return prev;
                    }
                    console.log('[P2P Client] Adding number to list:', data.number);
                    return {
                        ...prev,
                        drawnNumbers: [...prev.drawnNumbers, data.number],
                        currentNumber: data.number
                    };
                });
                break;
            case 'gameStateChanged':
                console.log('[P2P Client] Game state changed:', data.status);
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
                // Card reset only - don't change gameStatus (let gameStateChanged handle that)
                console.log('[P2P Client] Game reset - new card received');
                setState(prev => ({
                    ...prev,
                    card: data.card || prev.card,
                    markings: new Array(25).fill(false).map((_, i) => i === 12),
                    drawnNumbers: [],
                    currentNumber: null,
                    winner: undefined
                    // Note: NOT changing gameStatus - that's controlled by gameStateChanged
                }));
                break;
            case 'bingo':
                setState(prev => ({ ...prev, winner: { name: data.playerName, pattern: data.pattern } }));
                break;
            case 'conflict':
                setState(prev => ({
                    ...prev,
                    conflictData: {
                        existingDevice: data.existingDevice || 'Dispositivo desconhecido',
                        alreadyConnected: !!data.alreadyConnected
                    },
                    error: undefined,
                    isBusy: false
                }));
                break;
            case 'error':
                setState(prev => ({ ...prev, error: data.message, isBusy: false }));
                break;
        }
    };

    const setupConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            console.log('[P2P Client] Connection to host established');
            retryCountRef.current = 0; // Reset retries on success
            setState(prev => ({ ...prev, isConnected: true, error: undefined }));
            connRef.current = conn;

            // If the user already clicked "Join" or we are reconnecting
            const nameToJoin = requestedNameRef.current || localStorage.getItem('bingoLastPlayerName');
            if (nameToJoin) {
                console.log('[P2P Client] Automatically joining/reconnecting as:', nameToJoin);
                conn.send({
                    type: 'join',
                    name: nameToJoin,
                    deviceId: getDeviceId(),
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
                });
            }
        });

        conn.on('data', (data: any) => {
            console.log('[P2P Client] Data received:', data.type);
            // Call via ref to always use the latest handler
            handleIncomingDataRef.current(data);
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
                if (err.type === 'peer-unavailable') {
                    retryCountRef.current += 1;
                    console.warn(`[P2P Client] Peer unavailable (Attempt ${retryCountRef.current}/${MAX_RETRIES})`);

                    if (retryCountRef.current >= MAX_RETRIES) {
                        setState(prev => ({
                            ...prev,
                            isConnected: false,
                            error: "Não foi possível encontrar a sala após várias tentativas. Verifique o link ou se o anfitrião está online."
                        }));
                    } else {
                        // Keep error undefined so the interval keeps retrying
                        setState(prev => ({ ...prev, isConnected: false }));
                    }
                } else {
                    console.error('[P2P Client] Peer error:', err.type);
                    setState(prev => ({ ...prev, isConnected: false }));
                }
            });
        } else if (peerRef.current.open) {
            console.log('[P2P Client] Reconnecting to host...');
            const conn = peerRef.current.connect(targetId, {
                metadata: { secret: joinSecret, timestamp: Date.now() }
            });
            setupConnection(conn);
        }
    }, [setupConnection]);

    // Heartbeat
    useEffect(() => {
        if (!state.isConnected) return;

        const interval = setInterval(() => {
            if (connRef.current && connRef.current.open) {
                connRef.current.send({ type: 'ping', timestamp: Date.now() });
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [state.isConnected]);

    // Reconnection Monitor
    useEffect(() => {
        if (!hostId) return;

        const monitor = setInterval(() => {
            if (!state.isConnected && !state.error) {
                console.log('[P2P Client] Not connected. Attempting reconnection...');
                connect(hostId, secret);
            }
        }, 3000);

        return () => clearInterval(monitor);
    }, [hostId, secret, state.isConnected, state.error, connect]);

    // Reconnect when tab becomes visible (mobile app switch fix)
    useEffect(() => {
        if (!hostId) return;

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                retryCountRef.current = 0;
                setState(prev => ({ ...prev, error: undefined }));
                connect(hostId, secret);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleVisibility);
        };
    }, [hostId, secret, connect]);

    // Initial connection
    useEffect(() => {
        if (hostId && !connRef.current) {
            connect(hostId, secret);
        }
    }, [hostId, secret, connect]);

    const join = async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setState(prev => ({
            ...prev,
            isBusy: true,
            playerName: trimmedName,
            error: undefined,
            conflictData: null
        }));
        requestedNameRef.current = trimmedName;
        localStorage.setItem('bingoLastPlayerName', trimmedName);

        if (connRef.current && connRef.current.open) {
            connRef.current.send({
                type: 'join',
                name: trimmedName,
                deviceId: getDeviceId(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
            });
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
        claim: async (name: string) => {
            const trimmedName = name.trim();
            if (!trimmedName) return;

            setState(prev => ({ ...prev, isBusy: true, error: undefined }));
            if (connRef.current && connRef.current.open) {
                connRef.current.send({
                    type: 'claim',
                    name: trimmedName,
                    deviceId: getDeviceId(),
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
                });
            }
        },
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
