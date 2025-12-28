'use client';

import type { PlayerWithCard } from '@/types/game';

interface PlayerStatusPanelProps {
  players: PlayerWithCard[];
  onExpand?: () => void;
}

export default function PlayerStatusPanel({ players, onExpand }: PlayerStatusPanelProps) {
  // Logic: Fill column 1 (up to 10), then column 2, then column 3.
  // We use grid-flow-col with specific row count to force this behavior.
  
  const ROW_LIMIT = 10;
  
  // Adjust font size only if we are likely spilling into a 3rd column (> 20 players)
  let textSizeClass = 'text-base';
  let iconSizeClass = 'text-base';
  
  if (players.length > 20) {
    textSizeClass = 'text-sm';
    iconSizeClass = 'text-sm';
  }

  // Sort: Alphabetical order (stable) to prevent jumping
  const sortedPlayers = [...players].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full card-elevated-lg bg-cocoa-light rounded-xl p-4 flex flex-col overflow-hidden border border-ivory/5">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-lg font-display font-bold text-gold-light flex items-center gap-2">
          <span>👥</span> Jogadores ({players.length})
        </h3>
        {onExpand && (
          <button 
            onClick={onExpand}
            className="text-xs font-sans font-bold text-ivory/40 hover:text-gold-light transition-colors flex items-center gap-1"
          >
            GERENCIAR ↗
          </button>
        )}
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        {players.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ivory/30 italic text-sm">
            Nenhum jogador na sala
          </div>
        ) : (
          <div 
            className="grid grid-flow-col gap-x-3 h-full"
            style={{ gridTemplateRows: `repeat(${ROW_LIMIT}, 1fr)` }}
          >
            {sortedPlayers.map((player) => (
              <div 
                key={player.id} 
                className={`flex items-center gap-1.5 truncate px-2 rounded hover:bg-ivory/5 transition-colors ${textSizeClass}`}
                title={player.name}
              >
                <span className={`${iconSizeClass} shrink-0`}>
                  {player.connected ? '🟢' : '🔴'}
                </span>
                <span 
                  className={`font-sans font-medium truncate ${
                    player.connected ? 'text-forest-light' : 'text-ivory/40'
                  }`}
                >
                  {player.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
