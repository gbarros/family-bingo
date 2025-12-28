'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChristmasBackground from '@/components/shared/ChristmasBackground';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PlayerJoin from '@/components/player/PlayerJoin';
import BingoCard from '@/components/player/BingoCard';
import CurrentNumber from '@/components/player/CurrentNumber';
import { useSSE } from '@/lib/hooks/useSSE';
import type { JoinSessionResponse, ReconnectResponse } from '@/types/api';

export default function PlayerPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [mySessionId, setMySessionId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [card, setCard] = useState<number[]>([]);
  const [markings, setMarkings] = useState<boolean[]>(Array(25).fill(false));
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [gameStatus, setGameStatus] = useState<'none' | 'waiting' | 'active' | 'finished'>('none');
  const [newSessionAvailable, setNewSessionAvailable] = useState(false);
  const [previousCard, setPreviousCard] = useState<number[] | null>(null);
  const [previousMarkings, setPreviousMarkings] = useState<boolean[] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resettingMe, setResettingMe] = useState(false);
  // SSE connection - pass clientId if we have one to track presence
  const sseUrl = clientId ? `/api/events?clientId=${clientId}` : '/api/events';
  const { events, isConnected } = useSSE(sseUrl);

  const [pendingName, setPendingName] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{ existingDevice: string; alreadyConnected: boolean } | null>(null);
  const [kicked, setKicked] = useState(false);

  // Define critical callbacks first to be used in effects

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      const data = await response.json();

      if (data.success && data.session) {
        setActiveSessionId(data.session.id);
        setDrawnNumbers(data.drawnNumbers);
        setCurrentNumber(data.currentNumber);
        setGameStatus(data.session.status);
      } else {
        setActiveSessionId(null);
        // If we aren't in a finished game view, show "no session" state.
        setGameStatus((prev) => (prev === 'finished' ? prev : 'none'));
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  }, []); // Stable dependency

  const handleJoin = useCallback(async (name: string, force = false) => {
    setJoining(true);
    setConflictData(null); // Clear any previous conflict

    // If no session is active, just store the name and wait
    // BUT if 'force' is true (called from SSE event), we proceed regardless of current state
    if (!force && (gameStatus === 'none' || gameStatus === 'finished')) {
       // Only if we are not already pending with this name
       if (pendingName !== name) {
          setPendingName(name);
       }
       setJoining(false); 
       return;
    }

    try {
      const response = await fetch('/api/player/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data: JoinSessionResponse = await response.json();

        setClientId(data.clientId);
        setPlayerId(data.playerId);
        setPlayerName(name);
        setPendingName(null);
        localStorage.setItem('bingoLastPlayerName', name);
        setCard(data.card);
        setMySessionId(data.sessionId);
        setNewSessionAvailable(false);

        // Initialize markings with FREE space marked
        const initialMarkings = Array(25).fill(false);
        initialMarkings[12] = true; // FREE space
        setMarkings(initialMarkings);

        // Save clientId to localStorage
        localStorage.setItem('bingoClientId', data.clientId);

        // Fetch current game state
        fetchGameState();
      } else if (response.status === 409) {
          // Name conflict
          const errorData = await response.json();
          setConflictData({
            existingDevice: errorData.existingDevice,
            alreadyConnected: errorData.alreadyConnected,
          });
      } else {
        const error = await response.json();
        if (response.status === 404) {
           // Session might have ended just now?
           alert('Não foi possível entrar. A sessão pode ter encerrado.');
        } else {
           alert(error.error || 'Erro ao entrar no jogo');
        }
      }
    } catch (error) {
      console.error('Join error:', error);
      alert('Erro ao conectar. Tente novamente.');
    } finally {
      setJoining(false);
    }
  }, [gameStatus, pendingName, fetchGameState]);

  const handleClaim = async (name: string) => {
    setJoining(true);
    try {
      const response = await fetch('/api/player/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data: ReconnectResponse = await response.json();
        setClientId(data.clientId);
        setPlayerId(data.playerId);
        setPlayerName(data.name);
        setPendingName(null);
        setConflictData(null);
        localStorage.setItem('bingoLastPlayerName', data.name);
        setCard(data.card);
        setMarkings(data.markings);
        setMySessionId(data.sessionId);
        setGameStatus(data.sessionStatus);
        
        // Save clientId to localStorage
        localStorage.setItem('bingoClientId', data.clientId);

        // Fetch current game state
        fetchGameState();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao recuperar sessão.');
      }
    } catch (error) {
      console.error('Claim error:', error);
      alert('Erro ao conectar.');
    } finally {
      setJoining(false);
    }
  };

  const attemptReconnect = useCallback(async (storedClientId: string) => {
    try {
      const response = await fetch('/api/player/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: storedClientId }),
      });

      if (response.ok) {
        const data: ReconnectResponse = await response.json();
        setClientId(storedClientId);
        setPlayerId(data.playerId);
        setPlayerName(data.name);
        localStorage.setItem('bingoLastPlayerName', data.name);
        setCard(data.card);
        setMarkings(data.markings);
        setMySessionId(data.sessionId);
        setGameStatus(data.sessionStatus);

        // Fetch current game state
        fetchGameState();
      } else {
        // Reconnect failed, clear localStorage
        localStorage.removeItem('bingoClientId');
      }
    } catch (error) {
      console.error('Reconnect error:', error);
      localStorage.removeItem('bingoClientId');
    } finally {
      setLoading(false);
    }
  }, [fetchGameState]);

  const resetMe = async () => {
    if (!confirm('Tem certeza que deseja sair deste dispositivo? Seu jogo será mantido e você poderá reconectar depois.')) return;

    setResettingMe(true);
    try {
      // local storage cleanup
      localStorage.removeItem('bingoClientId');
      // We keep 'bingoLastPlayerName' to make it easier to rejoin if it's the same person
      
      // Reload the page to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      setResettingMe(false);
    }
  };

  const joinNewGame = async () => {
    if (!playerName?.trim()) return;

    // Save the old card for manual conference after re-joining.
    setPreviousCard(card);
    setPreviousMarkings(markings);
    setNewSessionAvailable(false);

    // Join as a new player in the current active session.
    await handleJoin(playerName);
  };

  // Effects

  // Initialize: check localStorage for existing clientId
  useEffect(() => {
    const stored = localStorage.getItem('bingoClientId');
    if (stored) {
      // Try to reconnect
      attemptReconnect(stored);
    } else {
      setLoading(false);
    }
  }, [attemptReconnect]);

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
        break;

      case 'gameStateChanged':
        // Keep UI reactive to session lifecycle changes (create/start/mode changes).
        if (latestEvent.data.status) {
          const newStatus = latestEvent.data.status as any;
          setGameStatus(newStatus);
          
          // If we were waiting for a session to start, auto-join now?
          // Only if status became 'waiting' (session created)
          if (newStatus === 'waiting' && pendingName) {
            handleJoin(pendingName, true); // Force join immediately
          }
        }
        // Resync from source of truth
        fetchGameState();
        break;

      case 'playerDisconnected':
        // Check if *I* was the one disconnected (by admin)
        if (latestEvent.data.playerId === playerId) {
          localStorage.removeItem('bingoClientId');
          setKicked(true);
        }
        fetchGameState();
        break;

      case 'gameEnded':
        setGameStatus('finished');
        // Resync to reflect end-of-game state.
        fetchGameState();
        break;

      case 'bingo':
        // Someone won a prize, but the game continues!
        if (latestEvent.data.playerName !== playerName) {
           alert(`🎉 ${latestEvent.data.winner} fez BINGO (${latestEvent.data.pattern})!\nO jogo continua...`);
        } else {
           alert(`🎊 PARABÉNS! Seu BINGO foi validado!\nO jogo continua para os próximos prêmios...`);
        }
        break;
    }
  }, [events, playerName, pendingName, handleJoin, fetchGameState]);

  // When SSE connects/reconnects, resync state to avoid stale UI.
  useEffect(() => {
    if (isConnected) {
      fetchGameState();
    }
  }, [isConnected, fetchGameState]);

  // If a new session replaces the one this player belongs to, force re-join.
  useEffect(() => {
    if (!activeSessionId || !mySessionId) return;
    if (activeSessionId === mySessionId) return;

    // New session detected: keep old card visible for manual conference,
    // but prevent confusion by surfacing a clear "join new game" CTA.
    setNewSessionAvailable(true);
    setGameStatus('finished');
    alert('✨ Uma nova sessão começou. Quando quiser, toque em "Participar do novo jogo" para receber uma nova cartela.');
  }, [activeSessionId, mySessionId]);

  const handleToggleMark = async (position: number, marked: boolean) => {
    if (!playerId) return;

    // Optimistic update
    setMarkings((prev) => {
      const updated = [...prev];
      updated[position] = marked;
      return updated;
    });

    // Send to server
    try {
      await fetch('/api/player/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, position, marked }),
      });
    } catch (error) {
      console.error('Error marking number:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ChristmasBackground />
        <LoadingSpinner />
      </div>
    );
  }

  if (kicked) {
    return (
      <div className="min-h-screen bg-cocoa-dark flex items-center justify-center p-4">
        <div className="card-elevated-lg bg-ivory-warm p-8 text-center max-w-md w-full fade-in-up">
           <div className="text-6xl mb-4">🚫</div>
           <h2 className="text-2xl font-display font-bold text-cocoa mb-2">Você foi removido</h2>
           <p className="text-cocoa-light mb-6">
             O organizador removeu você da partida.
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="w-full btn btn-primary"
           >
             Voltar ao Início
           </button>
        </div>
      </div>
    );
  }

  // Not joined yet
  if (!clientId || !playerId) {
    return (
      <>
        <ChristmasBackground />
        <PlayerJoin
          onJoin={handleJoin}
          onClaim={handleClaim}
          loading={joining}
          sessionStatus={gameStatus}
          canJoin={true}
          pendingJoin={!!pendingName}
          conflictData={conflictData}
          onCancelConflict={() => setConflictData(null)}
        />
      </>
    );
  }

  // Joined - show game
  return (
    <>
      <ChristmasBackground />

      <div className="min-h-screen p-4 md:p-6 relative z-10">
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
            <div
              className="absolute inset-0 bg-cocoa-dark/70"
              onClick={() => setSettingsOpen(false)}
            />
            <div className="relative w-full max-w-md card-elevated-lg bg-ivory-warm rounded-2xl p-6">
              <h2 className="text-2xl font-display font-bold text-cocoa mb-2">
                Configurações
              </h2>
              <p className="text-sm text-cocoa-light mb-5">
                Opções do seu dispositivo/jogador.
              </p>

              <div className="space-y-3">
                <button
                  className="w-full btn btn-secondary"
                  onClick={resetMe}
                  disabled={resettingMe}
                >
                  {resettingMe ? 'Saindo...' : 'Sair deste dispositivo'}
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

        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center fade-in-up">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-2">
              Bingo de Natal
            </h1>
            <p className="text-xl md:text-2xl font-sans text-ivory">
              Olá, <span className="font-semibold text-gold-light">{playerName}</span>! 🎄
            </p>
            {!isConnected && (
              <p className="text-sm text-crimson-light mt-2">
                ⚠ Reconectando...
              </p>
            )}
          </div>

          {/* Game status */}
          {gameStatus === 'finished' && (
            <div className="card-elevated-lg bg-crimson rounded-xl p-6 text-center fade-in-up stagger-1">
              <p className="text-2xl font-display font-bold text-ivory">
                🎉 Jogo Finalizado! 🎉
              </p>
              <p className="text-lg text-ivory mt-2">
                Aguarde o próximo jogo
              </p>
            </div>
          )}

          {newSessionAvailable && (
            <div className="card-elevated-lg bg-ivory-warm rounded-xl p-6 text-center fade-in-up stagger-1">
              <p className="text-xl font-display font-bold text-cocoa">
                ✨ Novo jogo disponível
              </p>
              <p className="text-sm text-cocoa-light mt-2">
                Sua cartela anterior continua visível para conferência. Quando quiser, entre no novo jogo para receber uma nova cartela.
              </p>
              <div className="mt-4">
                <button
                  className="btn btn-primary w-full sm:w-auto"
                  onClick={joinNewGame}
                  disabled={joining}
                >
                  {joining ? 'Entrando...' : 'Participar do novo jogo'}
                </button>
              </div>
            </div>
          )}

          {gameStatus === 'waiting' && (
            <div className="card-elevated bg-ivory-warm rounded-xl p-4 text-center fade-in-up stagger-1">
              <p className="text-lg font-sans text-cocoa">
                ⏳ Aguardando coordenador iniciar o jogo...
              </p>
            </div>
          )}

          {/* Current number (shown to players; drawn history stays hidden) */}
          {gameStatus === 'active' && (
            <div className="fade-in-up stagger-2">
              <CurrentNumber number={currentNumber} />
            </div>
          )}

          {/* Bingo card */}
          <div className="fade-in-up stagger-3">
            <BingoCard
              card={card}
              markings={markings}
              // No-assist mode: do not highlight drawn numbers for players.
              drawnNumbers={undefined}
              onToggleMark={handleToggleMark}
            />
          </div>

          {/* Previous card (kept for manual conference after re-joining) */}
          {previousCard && previousMarkings && (
            <div className="fade-in-up stagger-4">
              <div className="card-elevated bg-ivory-warm rounded-xl p-4">
                <h3 className="text-lg font-display font-semibold text-cocoa mb-3">
                  Cartela anterior (para conferência)
                </h3>
                <BingoCard
                  card={previousCard}
                  markings={previousMarkings}
                  drawnNumbers={undefined}
                  onToggleMark={() => {}}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
