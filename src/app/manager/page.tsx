'use client';

import { useState, useEffect, Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ManagerAuth from '@/components/manager/ManagerAuth';
import GameControls from '@/components/manager/GameControls';
import PlayerList from '@/components/manager/PlayerList';
import DrawnHistory from '@/components/manager/DrawnHistory';
import RecentNumbers from '@/components/manager/RecentNumbers';
import PlayerStatusPanel from '@/components/manager/PlayerStatusPanel';
import ViewOverlay from '@/components/manager/ViewOverlay';
import CurrentNumber from '@/components/player/CurrentNumber';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import NewYearBackground from '@/components/shared/NewYearBackground';
import { useGameHost } from '@/lib/core/useGameHost';

function ManagerContent() {
  const host = useGameHost();
  const [token, setToken] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'none' | 'number-focus' | 'history' | 'players' | 'qr'>('none');
  const isOverlayOpen = settingsOpen || activeView !== 'none';

  // Check for existing token (Only relevant for Server Mode)
  useEffect(() => {
    const stored = sessionStorage.getItem('managerToken');
    if (stored) setToken(stored);
  }, []);

  // P2P mode doesn't need token-based auth for now
  const isP2P = process.env.NEXT_PUBLIC_GAME_MODE === 'p2p';

  if (!token && !isP2P) {
    return (
      <div className="min-h-screen bg-gradient-cocoa flex items-center justify-center">
        <ManagerAuth onAuth={setToken} />
      </div>
    );
  }

  const joinUrl = typeof window !== 'undefined' 
    ? (isP2P ? `${window.location.origin}/play?host=${host.sessionId}${host.joinSecret ? `#s=${host.joinSecret}` : ''}` : `${window.location.origin}/play`)
    : '';

  return (
    <>
      <NewYearBackground paused={isOverlayOpen} />
      <div className="h-screen p-2 sm:p-4 md:p-6 flex flex-col overflow-hidden relative z-10">
      {/* settings and header ... */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-20 flex gap-1 sm:gap-2">
        <button
          className="card-elevated bg-ivory/90 backdrop-blur rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-cocoa hover:brightness-95 transition-all hover:scale-105 text-sm sm:text-base"
          onClick={() => setActiveView('qr')}
          title="QR Code de Entrada"
        >
          📱
        </button>
        <button
          className="card-elevated bg-ivory/90 backdrop-blur rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-cocoa hover:brightness-95 transition-all hover:scale-105 text-sm sm:text-base"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙️
        </button>
      </div>

      <ViewOverlay
        title="Código QR de Entrada"
        isOpen={activeView === 'qr'}
        onClose={() => setActiveView('none')}
      >
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-ivory-warm/95 rounded-2xl sm:rounded-3xl shadow-xl max-w-sm mx-auto mt-4 sm:mt-8 sheen">
          <p className="text-cocoa font-display font-semibold mb-4 sm:mb-8 text-center text-base sm:text-xl">
            Aponte a câmera para participar:
          </p>
          <div className="p-3 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-inner border-2 sm:border-4 border-gold-light/20">
             {/* @ts-ignore */}
            <QRCodeSVG value={joinUrl} size={200} className="w-[180px] h-[180px] sm:w-[256px] sm:h-[256px]" />
          </div>
          <p className="mt-4 sm:mt-8 text-xs sm:text-sm text-cocoa-light break-all text-center max-w-xs font-mono bg-white/50 p-2 sm:p-3 rounded-lg border border-cocoa-light/10">
            {joinUrl}
          </p>
          <button 
            className="mt-4 sm:mt-8 btn btn-primary px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
            onClick={() => setActiveView('none')}
          >
            Fechar
          </button>
        </div>
      </ViewOverlay>

      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0">
        {/* Header - compact on mobile */}
        <div className="text-center fade-in-up py-1 sm:py-4">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-display font-bold text-shimmer mb-1 drop-shadow-sm">
            Painel do Coordenador
          </h1>
          <div className="flex items-center justify-center gap-2">
             <span className={`w-2 h-2 rounded-full ${host.isConnected ? 'bg-emerald-400' : 'bg-crimson animate-pulse'}`} />
             <p className="text-xs sm:text-sm font-medium text-ivory/60 tracking-widest uppercase">
               {host.isConnected ? 'Online' : 'Sincronizando...'}
             </p>
          </div>
        </div>

        {/* Main content - mobile-first stacked layout */}
        {/* When game is active, stretch to fill; otherwise natural height */}
        <div className={`flex-1 flex flex-col gap-2 sm:gap-4 lg:flex-row lg:gap-6 min-h-0 ${
          host.status === 'active' && host.currentNumber ? '' : 'lg:items-start'
        }`}>
          {/* Left column: Current number + Controls */}
          <div className={`w-full lg:w-3/4 flex flex-col gap-2 sm:gap-4 ${
            host.status === 'active' && host.currentNumber ? 'min-h-0' : ''
          }`}>
            {/* Current Number - prominent on mobile */}
            {host.status === 'active' && host.currentNumber && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
                <CurrentNumber 
                  number={host.currentNumber} 
                  onExpand={() => setActiveView('number-focus')}
                />
              </div>
            )}

            {/* Controls row - side by side on mobile landscape, stacked on portrait */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 ${
              host.status === 'active' && host.currentNumber ? 'flex-1 min-h-0' : ''
            }`}>
              <div className="min-h-[200px] sm:min-h-0 sm:h-full">
                <GameControls
                  sessionStatus={host.status}
                  currentMode={host.mode}
                  sessionId={host.sessionId}
                  onCreateSession={host.createSession}
                  onStartGame={host.startGame}
                  onDrawNumber={host.drawNumber}
                  onChangeMode={host.changeMode}
                  onNewGame={host.newGame}
                  drawnCount={host.drawnNumbers.length}
                  totalNumbers={75}
                  drawing={host.isBusy}
                  className="h-full"
                />
              </div>
              {/* Player panel - hidden on very small screens, shown on sm+ */}
              <div className="hidden sm:block h-full">
                <PlayerStatusPanel 
                  players={host.players} 
                  onExpand={() => setActiveView('players')}
                />
              </div>
            </div>
          </div>
          
          {/* Right column: Recent numbers */}
          <div className={`w-full lg:w-1/4 ${
            host.status === 'active' && host.currentNumber ? 'min-h-0 lg:flex lg:flex-col' : ''
          }`}>
            <RecentNumbers 
              numbers={host.drawnNumbers} 
              onExpand={() => setActiveView('history')}
            />
          </div>
        </div>

        {/* Mobile-only: Quick player count badge */}
        <div className="sm:hidden flex justify-center">
          <button
            onClick={() => setActiveView('players')}
            className="px-4 py-2 bg-cocoa-light rounded-full text-ivory text-sm font-sans flex items-center gap-2"
          >
            <span>👥</span> {host.players.length} jogadores
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-cocoa-dark/70 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-xl card-elevated-lg bg-ivory-warm/95 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 sheen">
            <h2 className="text-3xl font-display font-bold text-cocoa mb-6">
              Coordenador
            </h2>
            <div className="space-y-6">
               <div className="p-4 bg-cocoa-light/5 rounded-xl border border-cocoa-light/10">
                  <p className="text-cocoa/60 text-sm mb-4">Ações administrativas avançadas estarão disponíveis aqui.</p>
                  <button
                    className="w-full btn btn-secondary py-4 mb-3"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja apagar todos os jogadores registrados?')) {
                        host.wipePlayers();
                      }
                    }}
                  >
                    Limpar Lista de Jogadores
                  </button>
                  <button
                    className="w-full btn btn-secondary py-4"
                    onClick={() => {
                      sessionStorage.removeItem('managerToken');
                      window.location.reload();
                    }}
                  >
                    Encerrar Sessão do Painel
                  </button>
               </div>
              <button
                className="w-full btn btn-primary py-4 font-bold"
                onClick={() => setSettingsOpen(false)}
              >
                Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      <ViewOverlay
        title="Status dos Jogadores"
        isOpen={activeView === 'players'}
        onClose={() => setActiveView('none')}
        minimal={true}
      >
        <PlayerList players={host.players} onValidate={(id) => host.validateBingo(String(id))} />
      </ViewOverlay>

      <ViewOverlay
        title="Histórico de Números"
        isOpen={activeView === 'history'}
        onClose={() => setActiveView('none')}
        minimal={true}
      >
        <DrawnHistory numbers={host.drawnNumbers} />
      </ViewOverlay>

      <ViewOverlay
        title="Foco no Número"
        isOpen={activeView === 'number-focus'}
        onClose={() => setActiveView('none')}
        minimal={true}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-12">
          {host.currentNumber && (
            <div className="transform scale-[1.75] origin-center transition-transform hover:scale-[1.85] duration-500">
              <CurrentNumber 
                number={host.currentNumber} 
                onAction={host.drawNumber}
                disabled={host.isBusy}
              />
            </div>
          )}
        </div>
      </ViewOverlay>
    </div>
    </>
  );
}

export default function ManagerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-cocoa">
        <LoadingSpinner />
      </div>
    }>
      <ManagerContent />
    </Suspense>
  );
}
