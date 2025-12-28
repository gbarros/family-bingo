'use client';

import { useEffect, useState } from 'react';

interface PlayerJoinProps {
  onJoin: (name: string) => void;
  onClaim?: (name: string) => void;
  loading?: boolean;
  canJoin?: boolean;
  sessionStatus?: 'none' | 'waiting' | 'active' | 'finished';
  pendingJoin?: boolean;
  conflictData?: {
    existingDevice: string;
    alreadyConnected: boolean;
  } | null;
  onCancelConflict?: () => void;
  error?: string;
}

export default function PlayerJoin({
  onJoin,
  onClaim,
  loading = false,
  canJoin = true,
  sessionStatus = 'none',
  pendingJoin = false,
  conflictData = null,
  onCancelConflict,
  error,
}: PlayerJoinProps) {
  const [name, setName] = useState('');

  // Prefill last used name immediately (but don't override user input)
  useEffect(() => {
    if (name.trim().length > 0) return;
    const stored = localStorage.getItem('bingoLastPlayerName');
    if (stored && stored.trim().length > 0) {
      setName(stored.trim());
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  // Helper to parse UA
  const getDeviceName = (ua: string) => {
    if (!ua) return 'Desconhecido';
    if (ua === 'Unknown Device') return ua;
    
    let os = 'Desconhecido';
    if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Macintosh')) os = 'Mac';
    else if (ua.includes('Windows')) os = 'PC';
    else if (ua.includes('Linux')) os = 'Linux';

    let browser = '';
    if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
    else if (ua.includes('Edg/')) browser = 'Edge';

    return browser ? `${os} (${browser})` : os;
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-16 sm:py-20 relative z-10 overflow-x-hidden">
      <div className="w-full max-w-[44rem]">
        {/* Unified hero card (title + form + footer) */}
        <div className="card-elevated-lg bg-ivory-warm rounded-3xl overflow-hidden fade-in-up texture-overlay">
          {/* Header */}
          <div className="px-8 pt-10 pb-7 sm:px-12 sm:pt-12 sm:pb-8 text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-none mb-2">
              <span className="text-gradient-gold">Bingo</span>
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold text-gold-solid leading-tight">
              de Natal 2025
            </h2>
          </div>

          {/* Form */}
          <div className="px-8 pb-10 sm:px-12 sm:pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xl font-display font-semibold text-cocoa mb-4 leading-tight"
                >
                  Seu Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome"
                  maxLength={30}
                  className="w-full px-5 py-4.5 rounded-xl border-2 border-forest-light bg-ivory text-cocoa text-xl font-sans focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  disabled={loading || !canJoin || pendingJoin}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson-light text-center animate-in fade-in zoom-in-95 duration-300">
                  <p className="font-semibold text-sm sm:text-base">
                    <span className="mr-2">⚠️</span> {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!canJoin || !name.trim() || loading || pendingJoin}
                className="w-full btn btn-primary text-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingJoin
                  ? 'Aguardando o organizador...'
                  : !canJoin
                  ? sessionStatus === 'finished'
                    ? 'Aguardando novo jogo...'
                    : 'Aguardando sessão...'
                  : loading
                  ? 'Entrando...'
                  : 'Entrar no Jogo'}
              </button>
            </form>
          </div>

          {/* Footer band */}
          <div className="px-8 py-6 sm:px-12 bg-ivory border-t border-cocoa/10 text-center">
            {pendingJoin ? (
              <p className="text-base sm:text-lg text-cocoa-light font-sans animate-pulse">
                ⏳ Tudo pronto! Assim que o organizador iniciar um novo jogo, você entrará automaticamente.
              </p>
            ) : (
              <>
                {sessionStatus === 'none' && (
                  <p className="text-base sm:text-lg text-cocoa-light font-sans">
                     Entre com seu nome para aguardar o início do jogo.
                  </p>
                )}
                {sessionStatus === 'waiting' && (
                  <p className="text-base sm:text-lg text-cocoa-light font-sans">
                    🎄 Sessão aberta! Entre com seu nome para receber sua cartela.
                  </p>
                )}
                {sessionStatus === 'active' && (
                  <p className="text-base sm:text-lg text-cocoa-light font-sans">
                    🎮 Jogo em andamento. Entre agora para participar!
                  </p>
                )}
                {sessionStatus === 'finished' && (
                  <p className="text-base sm:text-lg text-cocoa-light font-sans">
                    🎉 Jogo finalizado. Entre para aguardar o próximo.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

      {/* Conflict Resolution Modal */}
      {conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-cocoa-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md card-elevated-lg bg-ivory-warm rounded-2xl p-6 fade-in-up">
            <h3 className="text-xl font-display font-bold text-cocoa mb-3">
               🤔 Nome já em uso
            </h3>
            <p className="text-cocoa font-sans mb-4">
              Já existe alguém chamado <span className="font-semibold text-cocoa-dark">{name}</span> jogando.
            </p>
            <div className="bg-ivory rounded-lg p-3 border border-cocoa/10 mb-6">
              <p className="text-sm text-cocoa-light mb-1">Última conexão:</p>
              <p className="text-sm font-semibold text-cocoa flex items-center gap-2">
                <span>📱</span>
                <span title={conflictData.existingDevice} className="truncate max-w-[250px]">
                  {getDeviceName(conflictData.existingDevice)}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${conflictData.alreadyConnected ? 'bg-forest' : 'bg-gray-400'}`} />
                <span className="text-xs text-cocoa-light">
                  {conflictData.alreadyConnected ? 'Online agora' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onClaim && onClaim(name)}
                className="w-full btn btn-primary py-3 text-lg"
              >
                Sim, sou eu! (Conectar)
              </button>
              <button
                onClick={() => onCancelConflict && onCancelConflict()}
                className="w-full btn btn-secondary py-3"
              >
                 Não, sou outra pessoa
              </button>
            </div>
            <p className="mt-4 text-xs text-center text-cocoa-light">
               Se você é outra pessoa, por favor escolha outro nome.
            </p>
          </div>
        </div>
      )}

        {/* Decorative element */}
        <div className="mt-10 text-center text-6xl fade-in-up stagger-4">
          🎅
        </div>
      </div>
    </div>
  );
}
