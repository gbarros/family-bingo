'use client';

import { getColumnLetter } from '@/lib/utils/helpers';
import { COLUMN_LETTERS } from '@/lib/utils/constants';

interface DrawnHistoryProps {
  numbers: number[];
}

export default function DrawnHistory({ numbers }: DrawnHistoryProps) {
  if (numbers.length === 0) {
    return (
      <div className="card-elevated bg-cocoa-light rounded-xl p-6 text-center">
        <p className="text-ivory font-sans text-lg">
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
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-8 md:p-12 w-full">
      <h2 className="text-3xl font-display font-bold text-gold-light mb-8 text-center uppercase tracking-widest border-b border-ivory/10 pb-6">
        Números Sorteados ({numbers.length}/75)
      </h2>

      {/* By column view */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
        {COLUMN_LETTERS.map((letter) => (
          <div key={letter}>
            <div
              className={`text-center font-display font-bold text-4xl mb-4 ${
                columnColors[letter]
              } rounded-xl py-4 shadow-xl`}
            >
              {letter}
            </div>
            <div className="space-y-2">
              {byColumn[letter].map((num, i) => {
                const isRecent = recentSet.has(num);
                const isVeryLatest = numbers[numbers.length - 1] === num;
                
                return (
                  <div
                    key={`${letter}-${num}-${i}`}
                    className={`
                      text-center py-3 rounded-xl font-mono font-bold text-2xl
                      transition-all duration-300
                      ${
                        isVeryLatest
                          ? `${columnColors[letter]} ring-4 ring-gold glow-pulse`
                          : isRecent
                            ? `${columnColors[letter]} ring-2 ring-gold/30 opacity-90`
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

      {/* Latest numbers */}
      <div className="mt-12 pt-8 border-t border-ivory/10">
        <p className="text-gold-light text-lg font-display font-bold mb-4 uppercase tracking-wider">
          Ordem do Sorteio (Últimos 10)
        </p>
        <div className="flex flex-wrap gap-3">
          {numbers.slice(-10).reverse().map((num, i) => {
            const letter = getColumnLetter(num);
            const isFirst = i === 0;
            return (
              <div
                key={`recent-${num}-${i}`}
                className={`
                  ${columnColors[letter]} px-5 py-3 rounded-xl font-mono font-bold text-xl shadow-lg
                  ${isFirst ? 'ring-4 ring-gold scale-110 mx-2 animate-bounce-subtle' : ''}
                `}
              >
                {letter}-{num}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
