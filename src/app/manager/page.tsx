'use client';

import { useState, useEffect } from 'react';
import ManagerAuth from '@/components/manager/ManagerAuth';
import GameControls from '@/components/manager/GameControls';
import PlayerList from '@/components/manager/PlayerList';
import DrawnHistory from '@/components/manager/DrawnHistory';
import RecentNumbers from '@/components/manager/RecentNumbers';
import PlayerStatusPanel from '@/components/manager/PlayerStatusPanel';
import CurrentNumber from '@/components/player/CurrentNumber';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useSSE } from '@/lib/hooks/useSSE';
import type { GameMode, GameStatus, PlayerWithCard } from '@/types/game';

export default function ManagerPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState<GameStatus | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('horizontal');
  const [players, setPlayers] = useState<PlayerWithCard[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [drawing, setDrawing] = useState(false);

  // SSE connection
  const { events, isConnected } = useSSE('/api/events');

  // Check for existing token
  useEffect(() => {
    const stored = sessionStorage.getItem('managerToken');
    if (stored) {
      setToken(stored);
      fetchGameState();
    } else {
      setLoading(false);
    }
  }, []);

  // Handle SSE events
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[events.length - 1];

    switch (latestEvent.type) {
      case 'numberDrawn':
        setDrawnNumbers((prev) => {
          const n = latestEvent.data.number as number;
          return prev.includes(n) ? prev : [...prev, n];
        });
        setCurrentNumber(latestEvent.data.number);
        setDrawing(false);
        break;

      case 'gameStateChanged':
        if (latestEvent.data.status) {
          setSessionStatus(latestEvent.data.status as GameStatus);
        }
        if (latestEvent.data.mode) {
          setGameMode(latestEvent.data.mode as GameMode);
        }
        break;

      case 'playerJoined':
      case 'playerDisconnected':
        // Refetch players
        fetchGameState();
        break;

      // Handle presence updates (online/offline and device count)
      case 'playerPresence':
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.client_id === latestEvent.data.clientId) {
              return {
                ...p,
                connected: latestEvent.data.online,
                deviceCount: latestEvent.data.deviceCount,
              };
            }
            return p;
          })
        );
        break;

      case 'gameEnded':
        setSessionStatus('finished');
        alert(`🎉 ${latestEvent.data.winner} venceu! BINGO!`);
        break;
    }
  }, [events]);

  const fetchGameState = async () => {
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      const data = await response.json();

      if (data.success && data.session) {
        setSessionId(data.session.id);
        setSessionStatus(data.session.status);
        setGameMode(data.session.gameMode);
        setPlayers(data.players);
        setDrawnNumbers(data.drawnNumbers);
        setCurrentNumber(data.currentNumber);
      } else {
        // No active session
        setSessionId(null);
        setSessionStatus(null);
        setPlayers([]);
        setDrawnNumbers([]);
        setCurrentNumber(null);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (newToken: string) => {
    setToken(newToken);
    fetchGameState();
  };

  const handleCreateSession = async (mode: GameMode) => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameMode: mode }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setGameMode(mode);
        setSessionStatus('waiting');
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Erro ao criar sessão');
    }
  };

  const handleStartGame = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        setSessionStatus('active');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Erro ao iniciar jogo');
    }
  };

  const handleDrawNumber = async () => {
    try {
      if (drawing) return;
      setDrawing(true);
      const response = await fetch('/api/draw', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Dedupe defensively (can be hit by API response + SSE).
        const unique = Array.from(new Set<number>(data.drawnNumbers));
        setDrawnNumbers(unique);
        setCurrentNumber(data.number);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao sortear número');
      }
    } catch (error) {
      console.error('Error drawing number:', error);
      alert('Erro ao sortear número');
    } finally {
      // If SSE doesn't arrive (e.g., disconnected), unlock.
      setTimeout(() => setDrawing(false), 1500);
    }
  };

  const handleChangeMode = async (newMode: GameMode) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameMode: newMode }),
      });

      if (response.ok) {
        setGameMode(newMode);
      }
    } catch (error) {
      console.error('Error changing mode:', error);
    }
  };

  const handleValidate = async (playerId: number, playerName: string) => {
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.isValid) {
          alert(
            `✅ BINGO VÁLIDO!\n\nJogador: ${playerName}\nPadrão: ${data.winningPattern}\n\n🎉 ${playerName} venceu!`
          );
          setSessionStatus('finished');
        } else {
          alert(`❌ BINGO INVÁLIDO\n\n${playerName} ainda não completou o padrão.`);
        }
      }
    } catch (error) {
      console.error('Error validating:', error);
      alert('Erro ao validar bingo');
    }
  };

  const handleNewGame = () => {
    // End the current session for all clients, then reset local UI.
    // (Players keep their card visible, but will be prompted to join the new game.)
    (async () => {
      try {
        if (sessionId) {
          await fetch(`/api/session/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'finished' }),
          });
        }
      } catch (error) {
        console.error('Error ending session:', error);
      } finally {
        // Reset state
        setSessionId(null);
        setSessionStatus(null);
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setPlayers([]);
      }
    })();
  };

  const adminResetPlayer = async (playerId: number) => {
    if (!token) return;
    setAdminBusy(true);
    try {
      await fetch('/api/admin/players/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ playerId }),
      });
    } catch (error) {
      console.error('Error admin resetting player:', error);
      alert('Erro ao remover jogador');
    } finally {
      setAdminBusy(false);
      fetchGameState();
    }
  };

  const adminWipeAllPlayers = async () => {
    if (!token) return;
    const ok = confirm('Tem certeza? Isso vai remover TODOS os jogadores e suas marcações.');
    if (!ok) return;

    setAdminBusy(true);
    try {
      await fetch('/api/admin/players/wipe', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error wiping players:', error);
      alert('Erro ao limpar jogadores');
    } finally {
      setAdminBusy(false);
      fetchGameState();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-cocoa">
        <LoadingSpinner />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-cocoa">
        <ManagerAuth onAuth={handleAuth} />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-cocoa p-4 md:p-6">
      {/* Settings gear */}
      <div className="fixed top-4 right-4 z-20">
        <button
          className="card-elevated bg-ivory/90 backdrop-blur rounded-full w-11 h-11 flex items-center justify-center text-cocoa hover:brightness-95"
          onClick={() => setSettingsOpen(true)}
          aria-label="Configurações"
          title="Configurações"
        >
          ⚙️
        </button>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-cocoa-dark/70" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-xl card-elevated-lg bg-ivory-warm rounded-2xl p-6">
            <h2 className="text-2xl font-display font-bold text-cocoa mb-2">
              Configurações (Coordenador)
            </h2>
            <p className="text-sm text-cocoa-light mb-5">
              Remover jogadores individuais ou limpar todos.
            </p>

            <div className="space-y-3">
              <div className="card-elevated bg-ivory rounded-xl p-4">
                <p className="text-sm font-sans font-semibold text-cocoa mb-3">
                  Remover jogador (do banco de dados)
                </p>
                {players.length === 0 ? (
                  <p className="text-sm text-cocoa-light">Nenhum jogador para remover.</p>
                ) : (
                  <div className="space-y-2">
                    {players.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-cocoa truncate">{p.name}</p>
                          <p className="text-xs text-cocoa-light">
                            ID {p.id} • {p.connected ? 'conectado' : 'desconectado'}
                          </p>
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => adminResetPlayer(p.id)}
                          disabled={adminBusy}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="w-full btn btn-secondary"
                onClick={adminWipeAllPlayers}
                disabled={adminBusy}
              >
                Limpar todos os jogadores
              </button>

              <button
                className="w-full btn btn-primary"
                onClick={() => setSettingsOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center fade-in-up">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-light mb-2">
            Painel do Coordenador
          </h1>

          {!isConnected && (
            <p className="text-sm text-crimson-light mt-2">
              ⚠ Reconectando...
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Column */}
          <div className="w-full lg:w-3/4 space-y-6">
            {/* Current number (if active) */}
            {sessionStatus === 'active' && currentNumber && (
              <div className="fade-in-up stagger-1">
                <CurrentNumber number={currentNumber} />
              </div>
            )}

            {/* Game controls & Stats */}
            <div className="flex flex-col lg:flex-row gap-6 fade-in-up stagger-2">
              {/* Left col: Controls */}
              <div className="w-full lg:w-1/2">
                <GameControls
                  className="h-full"
                  sessionStatus={sessionStatus}
                  currentMode={gameMode}
                  sessionId={sessionId}
                  onCreateSession={handleCreateSession}
                  onStartGame={handleStartGame}
                  onDrawNumber={handleDrawNumber}
                  onChangeMode={handleChangeMode}
                  onNewGame={handleNewGame}
                  drawnCount={drawnNumbers.length}
                  totalNumbers={75}
                  drawing={drawing}
                />
              </div>
              
              <div className="w-full lg:w-1/2 lg:relative">
                 <div className="lg:absolute lg:inset-0 h-full">
                    <PlayerStatusPanel players={players} />
                 </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column: Recent History */}
          <div className="w-full lg:w-1/4 fade-in-up stagger-2 lg:relative">
             <div className="lg:absolute lg:inset-0 h-full">
               <RecentNumbers numbers={drawnNumbers} />
             </div>
          </div>
        </div>

        {/* Players */}
        {sessionId && (
          <div className="fade-in-up stagger-3">
            <PlayerList players={players} onValidate={handleValidate} />
          </div>
        )}

        {/* Drawn history */}
        {drawnNumbers.length > 0 && (
          <div className="fade-in-up stagger-4">
            <DrawnHistory numbers={drawnNumbers} />
          </div>
        )}
      </div>
    </div>
  );
}
