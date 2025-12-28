import { useState, useEffect, useCallback } from 'react';
import { GameHost, GameHostState } from '../hostTypes';
import { useSSE } from '@/lib/hooks/useSSE';
import { GameMode, GameStatus } from '@/types/game';

export function useHttpGameHost(enabled: boolean = true): GameHost {
    const [state, setState] = useState<GameHostState>({
        sessionId: null,
        status: null,
        mode: 'horizontal',
        players: [],
        drawnNumbers: [],
        currentNumber: null,
        isConnected: false,
        isBusy: false,
    });

    const { events, isConnected } = useSSE(enabled ? '/api/events' : null);

    const fetchGameState = useCallback(async () => {
        if (!enabled) return;
        try {
            const response = await fetch('/api/session', { cache: 'no-store' });
            const data = await response.json();
            if (data.success && data.session) {
                setState(prev => ({
                    ...prev,
                    sessionId: String(data.session.id),
                    status: data.session.status,
                    mode: data.session.gameMode,
                    players: data.players,
                    drawnNumbers: data.drawnNumbers,
                    currentNumber: data.currentNumber,
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

    useEffect(() => {
        if (events.length === 0) return;
        const latestEvent = events[events.length - 1];

        switch (latestEvent.type) {
            case 'numberDrawn':
                setState(prev => ({
                    ...prev,
                    drawnNumbers: [...new Set([...prev.drawnNumbers, latestEvent.data.number])],
                    currentNumber: latestEvent.data.number,
                    isBusy: false
                }));
                break;
            case 'gameStateChanged':
                if (latestEvent.data.status) setState(prev => ({ ...prev, status: latestEvent.data.status as any }));
                if (latestEvent.data.mode) setState(prev => ({ ...prev, mode: latestEvent.data.mode as any }));
                break;
            case 'playerJoined':
            case 'playerDisconnected':
                fetchGameState();
                break;
            case 'playerPresence':
                setState(prev => ({
                    ...prev,
                    players: prev.players.map(p => p.client_id === latestEvent.data.clientId ? {
                        ...p,
                        connected: latestEvent.data.online,
                        device_count: latestEvent.data.deviceCount
                    } : p)
                }));
                break;
        }
    }, [events, fetchGameState]);

    const createSession = async (mode: GameMode) => {
        const response = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameMode: mode }),
        });
        if (response.ok) fetchGameState();
    };

    const startGame = async () => {
        if (!state.sessionId) return;
        await fetch(`/api/session/${state.sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' }),
        });
    };

    const drawNumber = async () => {
        setState(prev => ({ ...prev, isBusy: true }));
        await fetch('/api/draw', { method: 'POST' });
    };

    const changeMode = async (mode: GameMode) => {
        if (!state.sessionId) return;
        await fetch(`/api/session/${state.sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameMode: mode }),
        });
    };

    const validateBingo = async (playerId: string) => {
        const response = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: playerId }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.isValid) {
                alert(`✅ BINGO VÁLIDO!\n\nJogador: ${data.playerName}\n${data.winningPattern}`);
            } else {
                alert(`❌ BINGO INVÁLIDO`);
            }
        }
    };

    const newGame = async () => {
        if (state.sessionId) {
            await fetch(`/api/session/${state.sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'finished' }),
            });
            setState(prev => ({
                ...prev,
                sessionId: null,
                status: null,
                drawnNumbers: [],
                currentNumber: null,
                players: []
            }));
        }
    };

    // Skip resetPlayer/wipePlayers for now, can be added later

    return {
        ...state,
        createSession,
        startGame,
        drawNumber,
        changeMode,
        validateBingo,
        newGame,
        resetPlayer: async () => { },
        wipePlayers: async () => { },
    };
}
