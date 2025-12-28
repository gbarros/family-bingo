import { useState, useEffect, useCallback } from 'react';
import { GameClient, GameClientState } from '../clientTypes';
import { useSSE } from '@/lib/hooks/useSSE';
import type { JoinSessionResponse, ReconnectResponse } from '@/types/api';

export function useHttpGameClient(enabled: boolean = true): GameClient {
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
    });

    const sseUrl = enabled
        ? (state.clientId ? `/api/events?clientId=${state.clientId}` : '/api/events')
        : null;
    const { events, isConnected } = useSSE(sseUrl);

    const fetchGameState = useCallback(async () => {
        if (!enabled) return;
        try {
            const response = await fetch('/api/session', { cache: 'no-store' });
            const data = await response.json();

            if (data.success && data.session) {
                setState(prev => ({
                    ...prev,
                    gameStatus: data.session.status,
                    drawnNumbers: data.drawnNumbers,
                    currentNumber: data.currentNumber
                }));
            }
        } catch (error) {
            console.error('Error fetching game state:', error);
        }
    }, []);

    useEffect(() => {
        setState(prev => ({ ...prev, isConnected }));
        if (isConnected) fetchGameState();
    }, [isConnected, fetchGameState]);

    // Auto-reconnect on mount
    useEffect(() => {
        if (!enabled) return;
        const storedClientId = localStorage.getItem('bingoClientId');
        if (storedClientId) {
            reconnect(storedClientId).catch(console.error);
        }
    }, [enabled]);

    useEffect(() => {
        if (events.length === 0) return;
        const latestEvent = events[events.length - 1];

        switch (latestEvent.type) {
            case 'numberDrawn':
                setState(prev => ({
                    ...prev,
                    drawnNumbers: prev.drawnNumbers.includes(latestEvent.data.number)
                        ? prev.drawnNumbers
                        : [...prev.drawnNumbers, latestEvent.data.number],
                    currentNumber: latestEvent.data.number
                }));
                break;
            case 'gameStateChanged':
                if (latestEvent.data.status) {
                    setState(prev => ({ ...prev, gameStatus: latestEvent.data.status as any }));
                }
                fetchGameState();
                break;
            // ... extend for other events
        }
    }, [events, fetchGameState]);

    const join = async (name: string) => {
        setState(prev => ({ ...prev, isBusy: true, error: undefined }));
        try {
            const response = await fetch('/api/player/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await response.json();

            if (response.ok) {
                setState(prev => ({
                    ...prev,
                    clientId: data.clientId,
                    playerId: String(data.playerId),
                    playerName: name,
                    card: data.card,
                    markings: new Array(25).fill(false).map((_, i) => i === 12),
                    conflictData: null,
                    isBusy: false
                }));
                localStorage.setItem('bingoClientId', data.clientId);
                localStorage.setItem('bingoLastPlayerName', name);
            } else if (response.status === 409) {
                setState(prev => ({ ...prev, conflictData: data, isBusy: false }));
            } else {
                setState(prev => ({ ...prev, error: data.error || 'Failed to join', isBusy: false }));
            }
        } catch (error) {
            setState(prev => ({ ...prev, error: 'Network error', isBusy: false }));
        }
    };

    const reconnect = async (clientId: string) => {
        try {
            const response = await fetch('/api/player/reconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId }),
            });
            const data: ReconnectResponse = await response.json();

            if (response.ok) {
                setState(prev => ({
                    ...prev,
                    clientId: data.clientId,
                    playerId: String(data.playerId),
                    playerName: data.name,
                    card: data.card,
                    markings: data.markings,
                }));
            } else {
                localStorage.removeItem('bingoClientId');
            }
        } catch (error) {
            console.error('Reconnect failed:', error);
        }
    };

    const claim = async (name: string) => {
        try {
            const response = await fetch('/api/player/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data: JoinSessionResponse = await response.json();

            if (response.ok) {
                setState(prev => ({
                    ...prev,
                    clientId: data.clientId,
                    playerId: String(data.playerId),
                    playerName: name,
                    card: data.card,
                    markings: new Array(25).fill(false).map((_, i) => i === 12),
                    conflictData: null
                }));
                localStorage.setItem('bingoClientId', data.clientId);
                localStorage.setItem('bingoLastPlayerName', name);
            }
        } catch (error) {
            console.error('Claim failed:', error);
        }
    };

    const mark = async (position: number, marked: boolean) => {
        if (!state.playerId) return;
        // Optimistic
        setState(prev => {
            const nextMarkings = [...prev.markings];
            nextMarkings[position] = marked;
            return { ...prev, markings: nextMarkings };
        });

        await fetch('/api/player/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: state.playerId, position, marked }),
        });
    };

    // Add more implementations (reconnect, claim, leave)

    return {
        ...state,
        join,
        mark,
        claim,
        reconnect,
        leave: () => {
            localStorage.removeItem('bingoClientId');
            window.location.reload();
        }
    };
}
