'use client';

import { useState } from 'react';
import type { PlayerWithCard } from '@/types/game';

interface PlayerListProps {
  players: PlayerWithCard[];
  onValidate: (playerId: string | number) => void;
}

export default function PlayerList({ players, onValidate }: PlayerListProps) {
  const [validating, setValidating] = useState<string | number | null>(null);

  const handleValidateClick = async (playerId: string | number, playerName: string) => {
    setValidating(playerId);
    await onValidate(playerId);
    setValidating(null);
  };

  if (players.length === 0) {
    return (
      <div className="card-elevated bg-cocoa-light rounded-xl p-6 text-center">
        <p className="text-ivory font-sans text-lg">
          Nenhum jogador conectado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-8 md:p-12 w-full">
      <h2 className="text-3xl font-display font-bold text-gold-light mb-8 text-center uppercase tracking-widest border-b border-ivory/10 pb-6">
        Jogadores Conectados ({players.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6">
        {players.map((player, idx) => (
          <button
            key={`${player.id}-${idx}`}
            onClick={() => handleValidateClick(player.id, player.name)}
            disabled={validating === player.id}
            className={`card-elevated-lg bg-cocoa rounded-xl p-6 text-left transition-all hover:ring-2 hover:ring-gold/50 active:brightness-95 group relative ${
              !player.connected ? 'opacity-50 grayscale' : 'hover:bg-cocoa-dark shadow-xl'
            }`}
            title={`ID: ${player.id}\nDispositivo: ${player.user_agent || 'Desconhecido'}${player.deviceCount && player.deviceCount > 1 ? `\nConexões: ${player.deviceCount}` : ''}`}
          >
            {/* Connection status indicator */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-4 h-4 rounded-full mt-1.5 shrink-0 ${
                  player.connected
                    ? 'bg-forest-light animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.6)]'
                    : 'bg-gray-600'
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors truncate block">
                    {player.name}
                  </span>
                  {player.deviceCount && player.deviceCount > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-gold text-cocoa text-xs font-bold shadow-sm">
                      {player.deviceCount} Telas
                    </span>
                  )}
                </div>
                {!player.connected && (
                  <span className="text-sm text-crimson font-sans font-bold block mb-1">
                    (OFFLINE)
                  </span>
                )}
                {player.user_agent && (
                   <span className="text-xs text-ivory/40 font-mono truncate block max-w-full italic">
                     {player.user_agent.includes('iPhone') ? '📱 iPhone' :
                      player.user_agent.includes('Android') ? '📱 Android' :
                      player.user_agent.includes('Macintosh') ? '💻 Mac' :
                      player.user_agent.includes('Windows') ? '💻 PC' : 'Unknown Device'}
                   </span>
                )}
              </div>
            </div>

            {/* Card preview (more numbers now) */}
            <div className="bg-cocoa-dark/50 rounded-lg p-3">
              <p className="text-[10px] text-ivory/30 uppercase tracking-widest mb-1.5 font-bold">Início da Cartela</p>
              <div className="flex gap-1.5 flex-wrap">
                {player.card?.slice(0, 10).map((num, i) => (
                  <span
                    key={i}
                    className="text-sm font-mono bg-ivory/10 text-ivory/90 px-2 py-0.5 rounded font-bold border border-ivory/5"
                  >
                    {num}
                  </span>
                ))}
                <span className="text-sm text-ivory/30 self-end mb-0.5">...</span>
              </div>
            </div>

            {/* Validation action */}
            <div className="mt-4 pt-4 border-t border-ivory/5 flex items-center justify-between">
              <span className="text-xs text-gold-light font-bold uppercase tracking-wider group-hover:text-gold">
                {validating === player.id ? 'Processando...' : 'Validar BINGO'}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gold">
                👆
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
