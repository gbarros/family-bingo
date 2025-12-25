'use client';

import { useEffect, useState } from 'react';

interface PlayerJoinProps {
  onJoin: (name: string) => void;
  loading?: boolean;
  canJoin?: boolean;
  sessionStatus?: 'none' | 'waiting' | 'active' | 'finished';
}

export default function PlayerJoin({
  onJoin,
  loading = false,
  canJoin = true,
  sessionStatus = 'none',
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
                  disabled={loading || !canJoin}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!canJoin || !name.trim() || loading}
                className="w-full btn btn-primary text-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!canJoin
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
            {sessionStatus === 'none' && (
              <p className="text-base sm:text-lg text-cocoa-light font-sans">
                🧑‍🎄 Nenhuma sessão ativa ainda. Aguarde o coordenador criar uma nova sessão.
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
                🎉 Jogo finalizado. Aguarde o próximo jogo.
              </p>
            )}
          </div>
        </div>

        {/* Decorative element */}
        <div className="mt-10 text-center text-6xl fade-in-up stagger-4">
          🎅
        </div>
      </div>
    </div>
  );
}
