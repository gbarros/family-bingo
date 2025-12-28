'use client';

import { useState } from 'react';
import { COLUMN_LETTERS, FREE_SPACE_INDEX } from '@/lib/utils/constants';
import { getColumnLetter } from '@/lib/utils/helpers';

interface BingoCardProps {
  card: number[];
  markings: boolean[];
  // Players can still receive drawn numbers (for future features), but we don't show them.
  // Keep this optional so the UI can be "no-assist" by default.
  drawnNumbers?: Set<number>;
  onToggleMark: (position: number, marked: boolean) => void;
}

export default function BingoCard({
  card,
  markings,
  drawnNumbers,
  onToggleMark,
}: BingoCardProps) {
  const [animatingPosition, setAnimatingPosition] = useState<number | null>(null);
  const drawn = drawnNumbers ?? new Set<number>();

  const handleCellClick = (position: number) => {
    // Can't unmark FREE space
    if (position === FREE_SPACE_INDEX) return;

    const newMarked = !markings[position];
    onToggleMark(position, newMarked);

    // Trigger bounce animation
    setAnimatingPosition(position);
    setTimeout(() => setAnimatingPosition(null), 300);
  };

  // Convert column-major card to row-major for display
  const getNumberAt = (row: number, col: number): number => {
    return card[col * 5 + row];
  };

  const getPositionAt = (row: number, col: number): number => {
    return col * 5 + row;
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card container with elevated style */}
      <div className="card-elevated-lg bg-ivory/95 rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-6 sheen">
        {/* Header with column letters - ensure visibility */}
        <div className="grid grid-cols-5 gap-1 md:gap-2 mb-1 sm:mb-2">
          {COLUMN_LETTERS.map((letter) => (
            <div
              key={letter}
              className="text-center text-2xl sm:text-2xl md:text-3xl font-display font-bold text-gold-dark drop-shadow-sm"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Bingo grid */}
        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {[...Array(5)].map((_, row) =>
            [...Array(5)].map((_, col) => {
              const number = getNumberAt(row, col);
              const position = getPositionAt(row, col);
              const isMarked = markings[position];
              const isDrawn = drawn.has(number);
              const isFree = position === FREE_SPACE_INDEX;
              const isAnimating = animatingPosition === position;

              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => handleCellClick(position)}
                  disabled={isFree}
                  className={`
                    aspect-square rounded-lg font-mono font-extrabold leading-none
                    text-base sm:text-xl md:text-2xl
                    transition-all duration-200 relative overflow-hidden
                    select-none touch-manipulation
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40
                    ${
                      isFree
                        ? 'bg-gradient-to-br from-gold-light via-gold to-gold-dark text-cocoa shine cursor-default border-2 border-gold-dark/70 shadow-lg'
                        : isMarked
                        ? 'bg-gradient-to-br from-gold-light to-gold text-cocoa border-2 border-gold-dark shadow-lg ring-2 ring-gold-light/30'
                        : 'bg-ivory/90 text-cocoa border-2 border-forest-light/60 shadow-sm hover:border-gold hover:bg-ivory hover:ring-2 hover:ring-gold/25 active:brightness-95'
                    }
                    ${isAnimating ? 'mark-bounce' : ''}
                    ${!isFree && 'cursor-pointer'}
                  `}
                >
                  {/* Marked overlay */}
                  {isMarked && !isFree && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-4 border-cocoa rounded-full opacity-30"></div>
                    </div>
                  )}

                  {/* Number or FREE */}
                  <span
                    className={`relative z-10 ${
                      isFree ? 'font-sans font-extrabold text-[0.70rem] sm:text-sm md:text-base tracking-[0.18em]' : ''
                    }`}
                  >
                    {isFree ? '2026' : number}
                  </span>

                </button>
              );
            })
          )}
        </div>

        {/* Legend - hidden on mobile to maximize card space */}
        <div className="hidden sm:flex mt-3 flex-wrap gap-3 text-xs md:text-sm font-sans">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gold border-2 border-gold-dark rounded"></div>
            <span className="text-cocoa">Marcado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-ivory-warm border-2 border-forest-light rounded"></div>
            <span className="text-cocoa">Não marcado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
