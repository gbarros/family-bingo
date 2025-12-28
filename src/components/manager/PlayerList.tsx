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
      <div className="card-elevated bg-cocoa-light rounded-xl p-4 sm:p-6 text-center">
        <p className="text-ivory font-sans text-base sm:text-lg">
          Nenhum jogador conectado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-4 sm:p-6 md:p-8 w-full">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gold-light mb-4 sm:mb-6 text-center uppercase tracking-widest border-b border-ivory/10 pb-3 sm:pb-6">
        Jogadores ({players.length})
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
        {players.map((player, idx) => (
          <button
            key={`${player.id}-${idx}`}
            onClick={() => handleValidateClick(player.id, player.name)}
            disabled={validating === player.id}
            className={`card-elevated bg-cocoa rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-left transition-all hover:ring-2 hover:ring-gold/50 active:brightness-95 group relative ${
              !player.connected ? 'opacity-50 grayscale' : 'hover:bg-cocoa-dark shadow-xl'
            }`}
            title={`ID: ${player.id}`}
          >
            {/* Connection status indicator */}
            <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-4">
              <div
                className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full mt-1 shrink-0 ${
                  player.connected
                    ? 'bg-forest-light animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                    : 'bg-gray-600'
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                  <span className="text-base sm:text-lg md:text-2xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors truncate block">
                    {player.name}
                  </span>
                  {player.deviceCount && player.deviceCount > 1 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gold text-cocoa text-[10px] sm:text-xs font-bold shadow-sm">
                      {player.deviceCount}
                    </span>
                  )}
                </div>
                {!player.connected && (
                  <span className="text-xs sm:text-sm text-crimson font-sans font-bold block">
                    OFFLINE
                  </span>
                )}
              </div>
            </div>

            {/* Card preview - hidden on very small screens */}
            <div className="hidden sm:block bg-cocoa-dark/50 rounded-lg p-2 sm:p-3">
              <p className="text-[8px] sm:text-[10px] text-ivory/30 uppercase tracking-widest mb-1 font-bold">Cartela</p>
              <div className="flex gap-1 flex-wrap">
                {player.card?.slice(0, 5).map((num, i) => (
                  <span
                    key={i}
                    className="text-xs sm:text-sm font-mono bg-ivory/10 text-ivory/90 px-1.5 py-0.5 rounded font-bold"
                  >
                    {num}
                  </span>
                ))}
                <span className="text-xs text-ivory/30">...</span>
              </div>
            </div>

            {/* Validation action */}
            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-ivory/5 flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gold-light font-bold uppercase tracking-wider group-hover:text-gold">
                {validating === player.id ? '...' : 'Validar'}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gold text-sm">
                👆
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
