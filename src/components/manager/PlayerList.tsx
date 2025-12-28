'use client';

import { useState } from 'react';
import type { PlayerWithCard } from '@/types/game';

interface PlayerListProps {
  players: PlayerWithCard[];
  onValidate: (playerId: number, playerName: string) => void;
}

export default function PlayerList({ players, onValidate }: PlayerListProps) {
  const [validating, setValidating] = useState<number | null>(null);

  const handleValidateClick = async (playerId: number, playerName: string) => {
    setValidating(playerId);
    await onValidate(playerId, playerName);
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
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-6">
      <h2 className="text-2xl font-display font-bold text-gold-light mb-4">
        Jogadores Conectados ({players.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => handleValidateClick(player.id, player.name)}
            disabled={validating === player.id}
            className={`card-elevated bg-cocoa rounded-lg p-4 text-left transition-all hover:ring-2 hover:ring-gold/25 active:brightness-95 group relative ${
              !player.connected ? 'opacity-60 grayscale' : 'hover:bg-cocoa-dark'
            }`}
            title={`ID: ${player.id}\nDispositivo: ${player.user_agent || 'Desconhecido'}${player.deviceCount && player.deviceCount > 1 ? `\nConexões: ${player.deviceCount} (múltiplas abas/aparelhos)` : ''}`}
          >
            {/* Connection status indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  player.connected
                    ? 'bg-forest-light animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                    : 'bg-gray-500'
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-display font-semibold text-ivory group-hover:text-gold-light transition-colors truncate block">
                    {player.name}
                  </span>
                  {player.deviceCount && player.deviceCount > 1 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gold text-cocoa text-[10px] font-bold shadow-sm" title={`${player.deviceCount} dispositivos conectados`}>
                      {player.deviceCount}
                    </span>
                  )}
                </div>
                {!player.connected && (
                  <span className="text-xs text-ivory/50 font-sans block -mt-1">
                    (Offline)
                  </span>
                )}
                {player.user_agent && (
                   <span className="text-[10px] text-ivory/30 font-mono truncate block max-w-full">
                     {/* Simplified UA: extract OS/Browser roughly if possible, else full string in tooltip */}
                     {player.user_agent.includes('iPhone') ? '📱 iPhone' :
                      player.user_agent.includes('Android') ? '📱 Android' :
                      player.user_agent.includes('Macintosh') ? '💻 Mac' :
                      player.user_agent.includes('Windows') ? '💻 PC' : 'Unknown Device'}
                   </span>
                )}
              </div>
            </div>

            {/* Card preview (first 5 numbers) */}
            <div className="flex gap-1 flex-wrap">
              {player.card.slice(0, 5).map((num, i) => (
                <span
                  key={i}
                  className="text-xs font-mono bg-ivory/20 text-ivory px-1.5 py-0.5 rounded font-bold"
                >
                  {num}
                </span>
              ))}
              <span className="text-xs text-ivory/70">...</span>
            </div>

            {/* Validation hint */}
            <div className="mt-2 text-xs text-gold-light group-hover:text-gold-light font-semibold">
              {validating === player.id
                ? '⏳ Validando...'
                : '👆 Clique para validar BINGO'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
