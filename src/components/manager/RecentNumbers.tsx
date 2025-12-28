'use client';

import { useEffect, useState } from 'react';

interface RecentNumbersProps {
  numbers: number[]; // All drawn numbers in order [1st, 2nd, ..., current]
  onExpand?: () => void;
}

export default function RecentNumbers({ numbers, onExpand }: RecentNumbersProps) {
  // We want to show the history of recent numbers, excluding the very current one (which is huge on the screen),
  // or maybe effectively just the reverse list.
  // "pile list that goes erasing the older number when full... rolling them down"
  // implies Newest at Top.
  
  // Implementation:
  // We take the list, reverse it.
  // If we have [1, 5, 22] (22 is current).
  // CurrentNumber shows 22.
  // This list should probably show 5, 1.
  // Or maybe 22, 5, 1 if we want to reinforce the current one?
  // Let's assume we exclude the current one if it's prominently displayed elsewhere.
  // User said "Last selected numbers" (plural).
  // "new vertical column... take some of the width of the space of the drawn number".
  // Let's show the *previous* numbers.
  
  // Actually, to make it look cool "rolling down", we can animate the entering.
  // For now, standard React list with key-based animation if possible, or just standard render.
  
  const history = numbers.slice(0, -1).reverse(); // Exclude current, reverse
  const maxItems = 20; // Increased to ensure it fills taller screens
  const visible = history.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <div className="h-full card-elevated-lg bg-cocoa-light/20 border-2 border-dashed border-ivory/10 rounded-xl flex items-center justify-center p-4 sm:p-6 text-center">
         <p className="text-ivory/20 font-sans font-semibold text-sm sm:text-base">Histórico de<br/>Sorteio</p>
      </div>
    );
  }

  return (
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-3 sm:p-4 overflow-hidden flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-2 sm:mb-3 shrink-0">
        <h3 className="text-base sm:text-lg font-display font-bold text-gold-light uppercase tracking-wider">
          Últimos
        </h3>
        {onExpand && (
          <button 
            onClick={onExpand}
            className="text-xs font-sans font-bold text-ivory/40 hover:text-gold-light transition-colors"
            title="Ver Histórico Completo"
          >
            VER ↗
          </button>
        )}
      </div>
      
      {/* Mobile: horizontal scroll */}
      <div className="lg:hidden overflow-x-auto pb-2">
        <div className="flex gap-2">
          {visible.map((num, i) => (
            <div 
              key={`${num}-${i}`}
              className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-ivory via-gold-light/80 to-gold text-cocoa font-display font-bold text-xl flex items-center justify-center shadow-lg shadow-[0_0_18px_rgba(253,230,138,0.45)] ring-1 ring-gold/40 sheen"
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: vertical scroll with fixed height */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col min-h-0">
        {/* Gradient mask for fading out at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-cocoa-light to-transparent z-10 pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 relative z-0 pb-8">
          {visible.map((num, i) => (
            <div 
              key={`${num}-${i}`}
              className="flex items-center justify-center animate-in slide-in-from-top-4 fade-in duration-500 fill-mode-backwards"
              style={{ animationDelay: `${i * 100}ms` }}
            >
               <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ivory via-gold-light/80 to-gold text-cocoa font-display font-bold text-3xl flex items-center justify-center shadow-lg shadow-[0_0_20px_rgba(253,230,138,0.5)] ring-1 ring-gold/40 transform transition-transform hover:scale-105 sheen">
                 {num}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
