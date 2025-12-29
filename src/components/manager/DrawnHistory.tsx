'use client';

import { getColumnLetter } from '@/lib/utils/helpers';
import { COLUMN_LETTERS } from '@/lib/utils/constants';

interface DrawnHistoryProps {
  numbers: number[];
  variant?: 'default' | 'overlay';
}

export default function DrawnHistory({ numbers, variant = 'default' }: DrawnHistoryProps) {
  const isOverlay = variant === 'overlay';
  if (numbers.length === 0) {
    return (
      <div className="card-elevated bg-cocoa-light rounded-xl p-4 sm:p-6 text-center">
        <p className="text-ivory font-sans text-base sm:text-lg">
          Nenhum número sorteado ainda
        </p>
      </div>
    );
  }

  // Group numbers by column
  const byColumn: Record<string, number[]> = {
    B: [],
    I: [],
    N: [],
    G: [],
    O: [],
  };

  numbers.forEach((num) => {
    const column = getColumnLetter(num);
    if (byColumn[column]) {
      byColumn[column].push(num);
    }
  });

  const columnColors: Record<string, string> = {
    B: 'bg-forest text-ivory',
    I: 'bg-crimson text-ivory',
    N: 'bg-gold text-cocoa',
    G: 'bg-forest-light text-ivory',
    O: 'bg-crimson-light text-ivory',
  };

  const recentSet = new Set(numbers.slice(-5));

  return (
    <div className={`card-elevated-lg bg-cocoa-light rounded-xl w-full ${isOverlay ? 'p-3 sm:p-4 md:p-5 h-full flex flex-col' : 'p-4 sm:p-6 md:p-8'}`}>
      <h2 className={`text-xl sm:text-2xl md:text-3xl font-display font-bold text-gold-light text-center uppercase tracking-widest border-b border-ivory/10 ${isOverlay ? 'mb-3 sm:mb-4 pb-2 sm:pb-3' : 'mb-4 sm:mb-6 pb-3 sm:pb-6'}`}>
        Sorteados ({numbers.length}/75)
      </h2>

      {/* By column view */}
      <div className={`${isOverlay ? 'flex-1 min-h-0' : ''}`}>
        <div className={`grid grid-cols-5 ${isOverlay ? 'gap-2 sm:gap-3 md:gap-4' : 'gap-2 sm:gap-4 md:gap-6'}`}>
        {COLUMN_LETTERS.map((letter) => (
          <div key={letter}>
            <div
              className={`text-center font-display font-bold ${isOverlay ? 'text-xl sm:text-2xl md:text-3xl mb-2' : 'text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-4'} ${
                columnColors[letter]
              } rounded-lg sm:rounded-xl ${isOverlay ? 'py-1.5 sm:py-2 md:py-2.5' : 'py-2 sm:py-4'} shadow-xl`}
            >
              {letter}
            </div>
            <div className={`${isOverlay ? 'space-y-0.5 sm:space-y-1' : 'space-y-1 sm:space-y-2'}`}>
              {byColumn[letter].map((num, i) => {
                const isRecent = recentSet.has(num);
                const isVeryLatest = numbers[numbers.length - 1] === num;
                
                return (
                  <div
                    key={`${letter}-${num}-${i}`}
                    className={`
                      text-center ${isOverlay ? 'py-1 sm:py-1.5 md:py-2 text-xs sm:text-base md:text-xl' : 'py-1.5 sm:py-2 md:py-3 text-sm sm:text-lg md:text-2xl'} rounded-lg sm:rounded-xl font-mono font-bold
                      transition-all duration-300
                      ${
                        isVeryLatest
                          ? `${columnColors[letter]} ring-2 sm:ring-4 ring-gold glow-pulse`
                          : isRecent
                            ? `${columnColors[letter]} ring-1 sm:ring-2 ring-gold/30 opacity-90`
                            : 'bg-cocoa text-ivory/80 hover:bg-cocoa-dark hover:text-ivory'
                      }
                    `}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Latest numbers - compact on mobile */}
      {!isOverlay && (
      <div className="mt-6 sm:mt-8 md:mt-12 pt-4 sm:pt-6 md:pt-8 border-t border-ivory/10">
        <p className="text-gold-light text-sm sm:text-base md:text-lg font-display font-bold mb-2 sm:mb-4 uppercase tracking-wider">
          Últimos Sorteados
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
          {numbers.slice(-10).reverse().map((num, i) => {
            const letter = getColumnLetter(num);
            const isFirst = i === 0;
            return (
              <div
                key={`recent-${num}-${i}`}
                className={`
                  ${columnColors[letter]} px-2 sm:px-3 md:px-5 py-1 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-mono font-bold text-sm sm:text-base md:text-xl shadow-lg
                  ${isFirst ? 'ring-2 sm:ring-4 ring-gold scale-105 sm:scale-110' : ''}
                `}
              >
                {letter}-{num}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
