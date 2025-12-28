'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NewYearBackground from '@/components/shared/NewYearBackground';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PlayerJoin from '@/components/player/PlayerJoin';
import BingoCard from '@/components/player/BingoCard';
import CurrentNumber from '@/components/player/CurrentNumber';
import { useGameClient } from '@/lib/core/useGameClient';

function PlayerContent() {
  const game = useGameClient();
  const searchParams = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // P2P Validation State
  const isP2P = process.env.NEXT_PUBLIC_GAME_MODE === 'p2p';
  const hostId = searchParams.get('host');
  const [isHashChecked, setIsHashChecked] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);
  const [dismissedWinner, setDismissedWinner] = useState<string | null>(null);

  // Reset dismissed state if winner disappears (new game) or changes
  useEffect(() => {
    if (!game.winner) {
      setDismissedWinner(null);
    }
  }, [game.winner]);

  useEffect(() => {
    if (isP2P) {
      // Check both query param (searchParams handles host) and hash (for secret)
      // We do this in effect to ensure client-side access to window
      const checkParams = () => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const secret = hashParams.get('s');
        setHasSecret(!!secret);
        setIsHashChecked(true);
      };

      checkParams();
      window.addEventListener('hashchange', checkParams);
      return () => window.removeEventListener('hashchange', checkParams);
    } else {
      setIsHashChecked(true);
      setHasSecret(true);
    }
  }, [isP2P, searchParams]);

  // Show loading while we verify P2P params on client
  if (isP2P && hostId && !isHashChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isP2P && (!hostId || (isHashChecked && !hasSecret))) {
    return (
      <>
        <NewYearBackground />
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="max-w-md w-full bg-ivory/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center border border-cocoa/10 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-cocoa/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-cocoa mb-4">Link Incompleto</h2>
            <p className="text-cocoa/70 mb-8 leading-relaxed">
              Para entrar em uma partida P2P, você precisa utilizar o link específico compartilhado pelo anfitrião ou escanear o QR Code.
            </p>
            <Link href="/" className="block w-full py-4 rounded-xl font-bold text-lg bg-cocoa text-ivory hover:bg-cocoa-light transition-colors shadow-lg">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </>
    );
  }

  // If we haven't identified who we are, show the join screen
  if (!game.clientId || !game.playerId) {
    return (
      <>
        <NewYearBackground />
        <PlayerJoin
          onJoin={game.join}
          onClaim={game.claim}
          loading={!game.error && (game.isBusy || (!game.isConnected && !!game.playerName))}
          error={game.error}
          sessionStatus={game.gameStatus}
          canJoin={true}
          pendingJoin={false}
          conflictData={game.conflictData}
          onCancelConflict={() => {}}
        />
      </>
    );
  }

  // Once joined, show the game board
  return (
    <>
      <NewYearBackground />

      <div className="min-h-screen p-2 md:p-6 relative z-10">
        {/* Settings gear */}
        <div className="fixed top-4 right-4 z-20">
          <button
            className="card-elevated bg-ivory/90 backdrop-blur rounded-full w-11 h-11 flex items-center justify-center text-cocoa hover:brightness-95 transition-all hover:scale-105 active:scale-95"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configurações"
            title="Configurações"
          >
            ⚙️
          </button>
        </div>

        {/* Settings modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-cocoa-dark/80 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setSettingsOpen(false)}
            />
            <div className="relative w-full max-w-md card-elevated-lg bg-ivory-warm/95 rounded-2xl p-8 animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden sheen">
               <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl pointer-events-none select-none">2026</div>
               
              <h2 className="text-3xl font-display font-bold text-cocoa mb-4">
                Configurações
              </h2>
              <p className="text-cocoa-light/80 mb-8 leading-relaxed">
                Você está jogando como <span className="font-bold text-cocoa italic">{game.playerName}</span>.
              </p>

              <div className="space-y-4">
                <button
                  className="w-full py-4 rounded-xl border border-cocoa-light/20 text-cocoa font-semibold hover:bg-cocoa-light/5 transition-colors flex items-center justify-center gap-3"
                  onClick={game.leave}
                >
                  <span className="text-xl">🚪</span> Sair da Partida
                </button>
                <button
                  className="w-full btn btn-primary py-4 rounded-xl font-bold shadow-lg shadow-crimson/20"
                  onClick={() => setSettingsOpen(false)}
                >
                  Continuar Jogando
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Winner Notification Overlay */}
        {game.winner && dismissedWinner !== (game.winner.name + game.winner.pattern) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-cocoa-dark/60 backdrop-blur-sm animate-in fade-in duration-300" 
                  onClick={() => setDismissedWinner(game.winner!.name + game.winner!.pattern)} />
             <div className="relative w-full max-w-sm card-elevated-lg bg-ivory-warm/95 rounded-2xl p-8 animate-in zoom-in-95 duration-500 shadow-2xl text-center overflow-hidden sheen">
                {/* Close X */}
                <button 
                  onClick={() => setDismissedWinner(game.winner!.name + game.winner!.pattern)}
                  className="absolute top-4 right-4 text-cocoa-light/50 hover:text-cocoa transition-colors p-2"
                >
                  ✕
                </button>

                {/* Winner Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-gold/10 animate-pulse pointer-events-none" />
                
                <div className="text-6xl mb-4 animate-bounce">🏆</div>
                <h2 className="text-3xl font-display font-bold text-gold-solid mb-2 leading-tight">
                  BINGO!
                </h2>
                <div className="py-4">
                  <p className="text-lg text-cocoa-light font-sans mb-1">Vencedor</p>
                  <p className="text-2xl font-bold text-cocoa mb-3">{game.winner.name}</p>
                  <div className="inline-block px-4 py-1 rounded-full bg-gold/20 border border-gold/40 text-cocoa-dark font-medium text-sm">
                    {game.winner.pattern}
                  </div>
                </div>
                
                <p className="text-sm text-cocoa-light/60 mt-4 mb-6 italic">
                  O jogo continua... Boa sorte!
                </p>

                <button
                  onClick={() => setDismissedWinner(game.winner!.name + game.winner!.pattern)}
                  className="w-full btn btn-primary py-3 rounded-xl font-bold text-lg shadow-lg"
                >
                  Continuar Jogando
                </button>
             </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-2 md:space-y-6 py-1 md:py-8">
          {/* Header - compact on mobile */}
          <div className="text-center space-y-0.5 md:space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl md:text-7xl font-display font-bold text-shimmer drop-shadow-sm">
              Bingo de Réveillon
            </h1>
            <p className="text-base md:text-2xl font-light text-ivory/90 tracking-wide">
              Boa sorte, <span className="font-bold text-gold-light underline decoration-gold-light/30 underline-offset-4">{game.playerName}</span>! ✨
            </p>
            {!game.isConnected && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-crimson/20 border border-crimson/30 text-crimson-light text-sm font-medium animate-pulse mt-4">
                <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                Sincronizando...
              </div>
            )}
            {game.error && (
              <div className="max-w-md mx-auto mt-4 px-4 py-3 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson-light text-center animate-in fade-in zoom-in-95 duration-300">
                <span className="mr-2">⚠️</span> {game.error}
              </div>
            )}
          </div>

          {/* Game status announcements - compact */}
          <div className="max-w-sm mx-auto">
            {game.gameStatus === 'finished' && (
              <div className="card-elevated-lg bg-gradient-to-br from-crimson to-crimson-dark rounded-2xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-2xl font-display font-bold text-ivory">
                  Rodada Finalizada!
                </p>
                <p className="text-ivory/70 mt-2">O coordenador encerrou esta partida.</p>
              </div>
            )}

            {game.gameStatus === 'active' && (
              <div className="animate-in fade-in zoom-in-95 duration-500 delay-200">
                <CurrentNumber number={game.currentNumber} />
              </div>
            )}

            {game.gameStatus === 'waiting' && !game.currentNumber && (
              <div className="card-elevated bg-ivory-warm/95 backdrop-blur rounded-2xl p-6 text-center border border-ivory/20 shadow-xl">
                 <div className="text-4xl mb-3 animate-bounce">⏳</div>
                 <p className="text-cocoa font-medium text-lg italic">
                   Aguardando o sorteio começar...
                 </p>
              </div>
            )}
          </div>

          {/* The main event: Bingo card */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="relative">
               {/* Decorative glow behind card */}
               <div className="absolute inset-0 bg-gold-light/10 blur-[100px] -z-1 opacity-50" />
               
               <BingoCard
                 card={game.card}
                 markings={game.markings}
                 onToggleMark={game.mark}
               />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
}
