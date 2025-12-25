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
      <div className="card-elevated-lg bg-ivory rounded-2xl p-3 sm:p-4 md:p-6">
        {/* Header with column letters */}
        <div className="grid grid-cols-5 gap-1 md:gap-2 mb-2">
          {COLUMN_LETTERS.map((letter) => (
            <div
              key={letter}
              className="text-center text-xl sm:text-2xl md:text-3xl font-display font-bold text-crimson"
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
                        ? 'bg-gold text-cocoa shine cursor-default'
                        : isMarked
                        ? 'bg-gold text-cocoa border-2 border-gold-dark shadow-lg'
                        : 'bg-ivory-warm text-cocoa border-2 border-forest-light hover:border-gold hover:ring-2 hover:ring-gold/25 active:brightness-95'
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
                    {isFree ? 'FREE' : number}
                  </span>

                </button>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-sm font-sans">
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

      {/* Tap instruction */}
      <div className="mt-4 text-center text-sm text-ivory font-sans font-semibold">
        <p>Toque nos números para marcar sua cartela</p>
      </div>
    </div>
  );
}
