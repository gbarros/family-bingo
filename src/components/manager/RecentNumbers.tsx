'use client';

import { useEffect, useState } from 'react';

interface RecentNumbersProps {
  numbers: number[]; // All drawn numbers in order [1st, 2nd, ..., current]
}

export default function RecentNumbers({ numbers }: RecentNumbersProps) {
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
  const maxItems = 12; // Increase to fill the vertical space (fade out handles the bottom)
  const visible = history.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <div className="h-full card-elevated-lg bg-cocoa-light/20 border-2 border-dashed border-ivory/10 rounded-xl flex items-center justify-center p-6 text-center">
         <p className="text-ivory/20 font-sans font-semibold">Histórico de<br/>Sorteio</p>
      </div>
    );
  }

  return (
    <div className="h-full card-elevated-lg bg-cocoa-light rounded-xl p-4 overflow-hidden flex flex-col relative">
      <h3 className="text-lg font-display font-bold text-gold-light mb-3 text-center uppercase tracking-wider">
        Últimos
      </h3>
      
      <div className="flex-1 relative overflow-hidden">
        {/* Gradient mask for fading out at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-cocoa-light to-transparent z-10 pointer-events-none"></div>

        <div className="space-y-3 relative z-0">
          {visible.map((num, i) => (
            <div 
              key={`${num}-${i}`}
              className="flex items-center justify-center animate-in slide-in-from-top-4 fade-in duration-500 fill-mode-backwards"
              style={{ animationDelay: `${i * 100}ms` }}
            >
               <div className="w-16 h-16 rounded-full bg-ivory text-cocoa font-display font-bold text-3xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                 {num}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
